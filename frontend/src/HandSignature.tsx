import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

// Constants

// Pinch detection settings (using a ref for the frame count)
const pinchThreshold = 0.05;
const debounceFrames = 5;

const numPainters = 10;
const baseEase = 0.69;

const standardWidth = 640;
const standardHeight = 480;

// bounding box size 
const boundingBoxSize = 200;

const div = 0.1; // damping factor

// minimum detection confidence and tracking confidence 
const stdMinDetectionConfidence = 0.7;
const stdMinTrackingConfidence = 0.7;


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

// interface Coordinate {
//   x: number,
//   y: number,
// }

const HandSignature: React.FC = () => {
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

  const pinchFramesRef = useRef(0);

  // Integer to track first painter for the purpose of saving a single drawing to svg instead of all the painters that add detail.
  // The purpose of the svg is mainly to track the order of painting, while the png is for the visualization.
  let firstPainter = 0;

  // For the ribbon painters and the current target point (from the pinch)
  const paintersRef = useRef<Painter[]>([]);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const normalizedTargetRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // New: A ref to store drawn segments (in order).
  const segmentsRef = useRef<Segment[]>([]);

  // Normalized coordinates of the current signature.
  //const coordinatesRef = useRef<Coordinate[]>([]);

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

      // Draw the segment on the drawing canvas.
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(painter.dx, painter.dy);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    firstPainter--;
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
    overlayCanvas.width = standardWidth;
    overlayCanvas.height = standardHeight;
    drawingCanvas.width = standardWidth;
    drawingCanvas.height = standardHeight;

    const overlayCtx = overlayCanvas.getContext("2d");
    if (!overlayCtx) return;

    // Set up Mediapipe Hands.
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: stdMinDetectionConfidence,
      minTrackingConfidence: stdMinTrackingConfidence,
    });

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

    // Set up the camera.
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: standardWidth,
      height: standardHeight,
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

  return (
    <div style={{ position: "relative", width: `${standardWidth}px`, height: `${standardHeight}px` }}>
      {/* Video element (mirrored for a natural feel) */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: `${standardWidth}px`,
          height: `${standardHeight}px`,
          transform: "scaleX(-1)",
          objectFit: "cover",
        }}
        autoPlay
        playsInline
        muted
      />
      {/* Drawing canvas (persistent ribbon strokes) */}
      <canvas
        ref={drawingCanvasRef}
        style={{
          position: "absolute",
          width: `${standardWidth}px`,
          height: `${standardHeight}px`,
          zIndex: 4,
          pointerEvents: "none",
          transform: "scaleX(-1)",
        }}
      />
      {/* Overlay canvas (for bounding box and guidelines) */}
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: "absolute",
          width: `${standardWidth}px`,
          height: `${standardHeight}px`,
          zIndex : 1,
          pointerEvents: "none",
          transform: "scaleX(-1)",

        }}
      />
      <button
        onClick={clearCanvas}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          padding: "10px 20px",
          background: "red",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Reset
      </button>
      <button
       onClick={clearPartly}
       style={{
         position: "absolute",
         top: "10px",
         right: "100px",
         zIndex: 10,
         padding: "10px 20px",
         background: "orange",
         color: "white",
         border: "none",
         borderRadius: "5px",
         cursor: "pointer",
       }}
     >
      Clear
     </button>
      {showSaveButton && (
        <button
        onClick={saveSVGandPNG}
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          zIndex: 10,
          padding: "10px 20px",
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          }}
        >
          Save
        </button>
      )}
      {!isCalibrated && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "5px",
          }}
        >
          Please make a pinch to calibrate.
        </div>
      )}
    </div>
  );
};

export default HandSignature;