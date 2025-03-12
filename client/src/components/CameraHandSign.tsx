import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

// Constants
const pinchThreshold = 0.05;
const debounceFrames = 5;
const numPainters = 10;
const baseEase = 0.69;
const standardWidth = 640;
const standardHeight = 480;
const boundingBoxSize = 200;
const div = 0.1;
const stdMinDetectionConfidence = 0.9;
const stdMinTrackingConfidence = 0.9;

// Define Props (Optional)
//interface SignatureCanvasProps {
//  onSave?: (svgData: string, pngBlob: Blob) => void; // Callback for saving files
//}

// Define Types
interface Painter {
  dx: number;
  dy: number;
  ax: number;
  ay: number;
  ease: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  strokeColor: string;
}

const SignatureCanvas = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isCalibrated, setIsCalibrated] = useState(false);
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; size: number } | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);

  const pinchFramesRef = useRef(0);
  let firstPainter = 0;

  const paintersRef = useRef<Painter[]>([]);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const normalizedTargetRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const segmentsRef = useRef<Segment[]>([]);

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: stdMinDetectionConfidence,
    minTrackingConfidence: stdMinTrackingConfidence,
  });

  const updatePainters = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext("2d");
    if (!ctx) return;

    if (!targetRef.current || !normalizedTargetRef.current) {
      animationFrameRef.current = null;
      paintersRef.current = [];
      return;
    }

    const target = targetRef.current;

    paintersRef.current.forEach((painter) => {
      const prevX = painter.dx;
      const prevY = painter.dy;
      painter.ax = (painter.ax + (painter.dx - target.x) * div) * painter.ease;
      painter.dx -= painter.ax;
      painter.ay = (painter.ay + (painter.dy - target.y) * div) * painter.ease;
      painter.dy -= painter.ay;

      if (firstPainter == 0) {
        firstPainter++;
        segmentsRef.current.push({
          x1: prevX,
          y1: prevY,
          x2: painter.dx,
          y2: painter.dy,
          strokeWidth: 1,
          strokeColor: "black",
        });
      }

      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(painter.dx, painter.dy);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    firstPainter--;
    animationFrameRef.current = requestAnimationFrame(updatePainters);
  };

  const startAnimation = () => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updatePainters);
    }
  };
  const drawConn = (ctx: CanvasRenderingContext2D, finger: any) => {
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.arc(finger.x*standardWidth,finger.y*standardHeight,5,0,2*Math.PI)
    ctx.stroke()
  }

  useEffect(() => {
    const videoElement = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!videoElement || !overlayCanvas || !drawingCanvas) return;

    overlayCanvas.width = standardWidth;
    overlayCanvas.height = standardHeight;
    drawingCanvas.width = standardWidth;
    drawingCanvas.height = standardHeight;

    const overlayCtx = overlayCanvas.getContext("2d");
    if (!overlayCtx) return;


    hands.onResults((results) => {
      // Clear the overlay canvas (but not the drawing canvas).
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // If calibrated, draw the bounding box and a horizontal guideline.
      if (boundingBox) {
        overlayCtx.strokeStyle = "blue";
        overlayCtx.lineWidth = 2;
        overlayCtx.fillStyle = "white";
        overlayCtx.strokeRect(
          boundingBox.x - boundingBox.size,
          boundingBox.y - boundingBox.size / 2,
          boundingBox.size*2,
          boundingBox.size
        );
        overlayCtx.globalAlpha = 0.36;
        overlayCtx.fillRect(
          boundingBox.x - boundingBox.size,
          boundingBox.y - boundingBox.size / 2,
          boundingBox.size*2,
          boundingBox.size
        );
        overlayCtx.globalAlpha = 1;
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        drawConn(overlayCtx, thumbTip)
        drawConn(overlayCtx, indexTip)


        // Compute the Euclidean distance between thumb and index.
        const distance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
          Math.pow(thumbTip.y - indexTip.y, 2)
        );

        const normalizedX = indexTip.x;
        const normalizedY = indexTip.y;
        // Convert normalized coordinates to pixel coordinates.
        const x = normalizedX * overlayCanvas.width;
        const y = normalizedY * overlayCanvas.height;

        if (distance < pinchThreshold) {
          // Pinching is detected.
          pinchFramesRef.current++;
          if (!isCalibrated && pinchFramesRef.current >= debounceFrames) {
            // Calibrate by setting the bounding box.
            setBoundingBox({ x, y, size: boundingBoxSize });
            setIsCalibrated(true);
          } else if (isCalibrated && boundingBox) {
            // Only update if the point is within the bounding box.
            const withinBounds =
              x >= boundingBox.x - boundingBox.size &&
              x <= boundingBox.x + boundingBox.size &&
              y >= boundingBox.y - boundingBox.size / 2 &&
              y <= boundingBox.y + boundingBox.size / 2;
            if (withinBounds) {
              // Set the target for the painters.
              targetRef.current = { x, y };
              normalizedTargetRef.current = { x: normalizedX, y: normalizedY };
              // If painters are not yet initialized, do so.
              if (paintersRef.current.length === 0) {
                for (let i = 0; i < numPainters; i++) {
                  const ease = baseEase + Math.random() * 0.025;
                  paintersRef.current.push({
                    dx: x,
                    dy: y,
                    ax: 0,
                    ay: 0,
                    ease: ease,
                  });
                }
                startAnimation();
              }
            }
          }
        } else {
          // Pinch released.
          pinchFramesRef.current = 0;
          targetRef.current = null;
          normalizedTargetRef.current = null;

          if (paintersRef.current.length > 0) {
            // Stop the animation loop.
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            paintersRef.current = [];
            // Show the Save button.
            setShowSaveButton(true);
          }
        }
      } else {
        // No hand detected; clear the overlay.
        //overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => await hands.send({ image: videoElement }),
      width: standardWidth,
      height: standardHeight,
    });
    camera.start();

    return () => {
      hands.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCalibrated, boundingBox]);

    // Clear the drawing canvas and reset the segments.
    const clearCanvas = () => {
      const drawingCanvas = drawingCanvasRef.current;
      if (!drawingCanvas) return;
      const ctx = drawingCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      }
      segmentsRef.current = [];
      //coordinatesRef.current = [];
      setBoundingBox(null);
      setIsCalibrated(false);
      setShowSaveButton(false);
    };
    const clearPartly = () => {
      const drawingCanvas = drawingCanvasRef.current;
      if (!drawingCanvas) return;
      const ctx = drawingCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      }
      segmentsRef.current = [];
      setShowSaveButton(false);
    };
  
    // Save the drawing as an SVG file, preserving the order of segments.
    const saveSVGandPNG = () => {
      // Save coordinates to a text file
      //saveCoordinates();
  
      // this saves it to a png instead
      const drawingCanvas = drawingCanvasRef.current;
      if (!drawingCanvas) return;
      const canvasWidth = drawingCanvas.width;
      const canvasHeight = drawingCanvas.height;
    
      // Create an offscreen canvas to correct the mirrored image
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = canvasWidth;
      offscreenCanvas.height = canvasHeight;
      const ctx = offscreenCanvas.getContext("2d");
    
      if (!ctx) return;
    
      // Flip the context back before drawing the image
      ctx.translate(drawingCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(drawingCanvas, 0, 0);
    
      // ----- 1) SAVE PNG -----
  
      offscreenCanvas.toBlob((blob) => {
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob!);
        link.download = "signature.png";
        link.href = url;
        link.click();
        console.log(`${url}`);
        URL.revokeObjectURL(url);
      }, "image/png");
      
    
      // ----- 2) SAVE SVG -----
  
      // Build the SVG string
      // Apply the same mirror transform as the canvas
      let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">\n
        <g transform="translate(${canvasWidth},0) scale(-1,1)">\n      <path
          d="`;
  
      segmentsRef.current.forEach((segment) => {
        svgString += `M${segment.x1} ${segment.y1} L${segment.x2} ${segment.y2} `
      });
      svgString += `"  style="fill:none;stroke:black;stroke-width:2" />\n </g></svg>`;
  
      // Convert the SVG string to a Blob
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
  
      // Create a download link for the SVG
      const linkSvg = document.createElement("a");
      linkSvg.download = "signature.svg";
      linkSvg.href = url;
      linkSvg.click();
      URL.revokeObjectURL(url);
  
      setShowSaveButton(false);
    };

    if (document.location.pathname == "/tempMain") {
      return (
        //<div className='inline-block w-full h-auto max-w-[680px] h-[250px] max-h-[400px] aspect-16/9 bg-[red] text-[white] outline-[grey] outline-[5px] rounded-[20px] outline-style: outset mt-3 justify-center'>
    
        //<div style={{ position: "relative", width: "640px", height: "480px" }}>
        <>
        <div className='relative w-[640px] h-[480px] outline-[grey] outline-[5px] rounded-[5px] outline-style: outset mt-3'>
          {/* Video element (mirrored for a natural feel) */}
          <video
            ref={videoRef}
            className='absolute w-[640px] h-[480px] top-[0px] left-[0px] -scale-x-100 '
            autoPlay
            playsInline
            muted
          />
          {/* Drawing canvas (persistent ribbon strokes) */}
          <canvas
            ref={drawingCanvasRef}
            className="absolute w-[640px] h-[480px] top-[0px] left-[0px] -scale-x-100 "
            
          />
          {/* Overlay canvas (for bounding box and guidelines) */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute w-[640px] h-[480px] top-[0px] left-[0px] -scale-x-100"
          />
          
          
          {!isCalibrated && (
            <div className='absolute
            top-50 
            w-full
            bg-[black]/80 text-[white] 
            px-2 py-2 border-radius-2
            rounded-[10px]'
              
            >
              Please make a pinch to calibrate.
            </div>
          )}
        </div>
        <button
            onClick={clearCanvas}
            className="inline-block bg-[red] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
          >
            Reset
          </button>
          <button
           onClick={clearPartly}
           className="inline-block bg-[orange] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
           
         >
          Clear
         </button>
         {showSaveButton && (
            <button
            onClick={saveSVGandPNG}
            className="inline-block bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
            >
              Save
            </button>
    
          )}
        </>
      );
    } else if (document.location.pathname == "/register") {
      return (
        //<div className='inline-block w-full h-auto max-w-[680px] h-[250px] max-h-[400px] aspect-16/9 bg-[red] text-[white] outline-[grey] outline-[5px] rounded-[20px] outline-style: outset mt-3 justify-center'>
    
        //<div style={{ position: "relative", width: "640px", height: "480px" }}>
        <>
        <div className='relative w-[640px] h-[480px] outline-[grey] outline-[5px] rounded-[5px] outline-style: outset mt-3'>
          {/* Video element (mirrored for a natural feel) */}
          <video
            ref={videoRef}
            className='absolute w-[640px] h-[480px] top-[0px] left-[0px] -scale-x-100 '
            autoPlay
            playsInline
            muted
          />
          {/* Drawing canvas (persistent ribbon strokes) */}
          <canvas
            ref={drawingCanvasRef}
            className="absolute w-[640px] h-[480px] top-[0px] left-[0px] -scale-x-100 "
            
          />
          {/* Overlay canvas (for bounding box and guidelines) */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute w-[640px] h-[480px] top-[0px] left-[0px] -scale-x-100"
          />
          
          
          {!isCalibrated && (
            <div className='absolute
            top-50 
            w-full
            bg-[black]/80 text-[white] 
            px-2 py-2 border-radius-2
            rounded-[10px]'
              
            >
              Please make a pinch to calibrate.
            </div>
          )}
        </div>
        <button
            onClick={clearCanvas}
            className="inline-block bg-[red] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
          >
            Reset
          </button>
          <button
           onClick={clearPartly}
           className="inline-block bg-[orange] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
           
         >
          Clear
         </button>
         {showSaveButton && (
            <button
            onClick={saveSVGandPNG}
            className="inline-block bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
            >
              Save
            </button>
    
          )}
        </>
      );
    } else {return;}
};

export default SignatureCanvas;