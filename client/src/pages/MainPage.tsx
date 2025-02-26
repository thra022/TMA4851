import { Navbar } from "./Navbar"

import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

// A type for the painters (which drive the ribbon effect)
interface Painter {
  dx: number;
  dy: number;
  ax: number;
  ay: number;
  ease: number;
}

// A type for each drawn segment; these will be stored in order.
interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  strokeColor: string;
}

interface Coordinate {
  x: number,
  y: number,
}

/**
 * Temporary box
 */
function Box() {
  // Refs for video and two canvases:
  // - drawingCanvas: where the ribbon strokes are permanently drawn
  // - overlayCanvas: where the bounding box/guidelines are drawn (cleared each frame)
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // State for calibration and UI
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; size: number } | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);

  // Pinch detection settings (using a ref for the frame count)
  const pinchThreshold = 0.05;
  const debounceFrames = 5;
  const pinchFramesRef = useRef(0);

  // For the ribbon painters and the current target point (from the pinch)
  const paintersRef = useRef<Painter[]>([]);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const normalizedTargetRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // New: A ref to store drawn segments (in order).
  const segmentsRef = useRef<Segment[]>([]);

  // Normalized coordinates of the current signature.
  const coordinatesRef = useRef<Coordinate[]>([]);

  // The update loop for the painters, using requestAnimationFrame.
  const updatePainters = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext("2d");
    if (!ctx) return;

    // If there is no target (i.e. pinch released), stop the update loop.
    if (!targetRef.current || !normalizedTargetRef.current) {
      animationFrameRef.current = null;
      paintersRef.current = [];
      return;
    }

    const target = targetRef.current;
    const normalizedTarget = normalizedTargetRef.current;
    const div = 0.1; // damping factor

    // Save current target coordinates.
    if (coordinatesRef.current) {
      coordinatesRef.current.push({x: normalizedTarget.x, y: normalizedTarget.y});
    }

    // For each painter, update its position toward the target.
    paintersRef.current.forEach((painter) => {
      const prevX = painter.dx;
      const prevY = painter.dy;
      // Update X component
      painter.ax = (painter.ax + (painter.dx - target.x) * div) * painter.ease;
      painter.dx -= painter.ax;
      // Update Y component
      painter.ay = (painter.ay + (painter.dy - target.y) * div) * painter.ease;
      painter.dy -= painter.ay;

      // Record this segment (preserving drawing order)
      segmentsRef.current.push({
        x1: prevX,
        y1: prevY,
        x2: painter.dx,
        y2: painter.dy,
        strokeWidth: 1,
        strokeColor: "black",
      });

      // Draw the segment on the drawing canvas.
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(painter.dx, painter.dy);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Request the next frame.
    animationFrameRef.current = requestAnimationFrame(updatePainters);
  };

  // Start the update loop if not already started.
  const startAnimation = () => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updatePainters);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!videoElement || !overlayCanvas || !drawingCanvas) return;

    // Set canvas dimensions.
    overlayCanvas.width = 640;
    overlayCanvas.height = 480;
    drawingCanvas.width = 640;
    drawingCanvas.height = 480;

    const overlayCtx = overlayCanvas.getContext("2d");
    if (!overlayCtx) return;

    // Set up Mediapipe Hands.
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      // Clear the overlay canvas (but not the drawing canvas).
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // If calibrated, draw the bounding box and a horizontal guideline.
      if (boundingBox) {
        overlayCtx.strokeStyle = "blue";
        overlayCtx.lineWidth = 2;
        overlayCtx.strokeRect(
          boundingBox.x - boundingBox.size,
          boundingBox.y - boundingBox.size / 2,
          boundingBox.size*2,
          boundingBox.size
        );
        //overlayCtx.beginPath();
        //overlayCtx.moveTo(0, boundingBox.y);
        //overlayCtx.lineTo(overlayCanvas.width, boundingBox.y);
        //overlayCtx.stroke();
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

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
            setBoundingBox({ x, y, size: 200 });
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
                const numPainters = 10;
                const baseEase = 0.69;
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
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    });

    // Set up the camera.
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      hands.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
    coordinatesRef.current = [];
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
  const saveSVG = () => {
    // Save coordinates to a text file
    saveCoordinates();

    // this saves it to a png instead
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    // Create an offscreen canvas to correct the mirrored image
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = drawingCanvas.width;
    offscreenCanvas.height = drawingCanvas.height;
    const ctx = offscreenCanvas.getContext("2d");

    if (!ctx) return;

    // Flip the context back before drawing the image
    ctx.translate(drawingCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(drawingCanvas, 0, 0);

    // Convert the corrected canvas to a PNG
    const dataUrl = offscreenCanvas.toDataURL("image/png");

    // Create a download link
    const link = document.createElement("a");
    link.download = "signature.png";
    link.href = dataUrl;
    link.click();

        // ----- 2) SAVE AN SVG -----

    const width = drawingCanvas.width;
    const height = drawingCanvas.height;

    // Build the SVG string
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`;
    // Apply the same mirror transform as the canvas
    svgString += `  <g transform="translate(${width},0) scale(-1,1)">\n`;
    svgString += `      <path
        d="`

    segmentsRef.current.forEach((segment) => {
      svgString += `M${segment.x1} ${segment.y1} L${segment.x2} ${segment.y2} `


      // svgString += `    <line
      //   x1="${segment.x1}"
      //   y1="${segment.y1}"
      //   x2="${segment.x2}"
      //   y2="${segment.y2}"
      //   stroke="${segment.strokeColor}"
      //   stroke-width="${segment.strokeWidth}"
      // />\n`;
    });
    svgString += `"  style="fill:none;stroke:black;stroke-width:2" />`

    svgString += `  </g>\n`;
    svgString += `</svg>`;

    // Convert the SVG string to a Blob
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Create a download link for the SVG
    const linkSvg = document.createElement("a");
    linkSvg.download = "signature.svg";
    linkSvg.href = url;
    linkSvg.click();

    setShowSaveButton(false);
    /*
    const width = 640;
    const height = 480;
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`;
    // Apply a mirror transform (like the canvas) so that the SVG appears the same.
    svgString += `<g transform="translate(${width},0) scale(-1,1)">\n`;
    segmentsRef.current.forEach((segment) => {
      svgString += `<line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="${segment.strokeColor}" stroke-width="${segment.strokeWidth}" />\n`;
    });
    svgString += `</g>\n</svg>`;

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "signature.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowSaveButton(false);*/
  };

  // FIXME: "Flip" the coordinates (and mirror them?).
  const saveCoordinates = () => {
    let coordinatesString = "";
    coordinatesRef.current.forEach((coord) => {
      coordinatesString += `(${coord.x},${coord.y}), `
    });

    const blob = new Blob([coordinatesString], { type: "txt"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "coordinates.txt";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        onClick={saveSVG}
        className="inline-block bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg"
        >
          Save
        </button>

      )}
    </>
  );
}

function Welcome() {
    return(
        <div className='bg-[#b0caff] max-w-[300px] text-[white] rounded-[10px] mt-3'>
            <h1><b><i>Welcome</i></b></h1>
            <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
                <p>
                    <i>
                        Hello, welcome to Airsign inc.<br/>
                        In order to use our services, please grant permission to the browser to use your webcam.<br/>
                    </i>
                </p>
                <br/>
                <b>Now, all you need to do is:</b>
                <ul className='text-left'>
                    <li>1. Press "Start capture"</li>
                    <li>2. Pinch your fingers to calibrate and wait 5 seconds</li>
                    <li>3. Start writing</li>
                    <li>4. After you stop writing wait a few seconds and decide whether or not to save your signature!</li>
                    </ul> 
            </div>
        </div>
    )
}
function Upload() {
    return(
        <div className='bg-[#b0caff] max-w-[300px] text-[white] rounded-[10px] mt-3'>
            <h1><b><i>Upload files</i></b></h1>
            <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
                <p>
                    <i>
                        If you would like to sign a .pdf file, please upload the desired file here:
                    </i>
                </p>
                <br/>
                <div>Choose which files to upload</div>
                <button className={`bg-[blue] hover:cursor-pointer hover:brightness-[85%] hover:transition-[0.3s] mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer text-lg`}>
                  Select Files
                </button>
            </div>
        </div>
    )
}

export function MainPage() {
    return (
        <>
        <div className="min-w-[1280px] h-full max-width: 1280px mx-[auto] my-[auto] p-2rem text-center">
            <Navbar />
                <div className='flex-[content] mt-[80px] bg-[#d7f8ff] rounded-md px-5'>
                    <section className="">
                        <div className="grid grid-cols-5 content-center py-5">
                                <div className='px-10 col-span-3'>
                                    <Box />
                                    <div className='py-2'>
                                    </div>
                                </div>
                                <div className='px-10 col-span-2 text-lg'>
                                    <Welcome />
                                    <div className='py-2'/>
                                    <Upload/>
                                    <div className='py-2'/>
                                </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}

