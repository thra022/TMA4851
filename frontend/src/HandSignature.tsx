import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const HandSignature: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // Calibration state
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; size: number } | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);

  // Threshold settings
  const pinchThreshold = 0.05;
  const debounceFrames = 5;
  // This variable (in closure) counts how many consecutive frames are “pinching.”
  let pinchFrames = 0;

  // Refs to store stroke data.
  // Completed strokes (each stroke is an array of {x,y} points).
  const strokesRef = useRef<{ x: number; y: number }[][]>([]);
  // Points for the stroke currently being drawn.
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  // Keep a ref to the latest value of showSaveButton (used in the onResults callback).
  const showSaveButtonRef = useRef(showSaveButton);
  useEffect(() => {
    showSaveButtonRef.current = showSaveButton;
  }, [showSaveButton]);

  // --- Helper function to draw a smooth stroke on the canvas using quadratic curves ---
  const drawSmoothStroke = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[]
  ) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      // Compute the midpoint between the current point and the next point.
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    // Ensure the curve finishes exactly at the last point.
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  };

  // --- Helper function to get a smooth SVG path (using quadratic curves) from points ---
  const getSmoothPathD = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y}, ${midX} ${midY}`;
    }
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return d;
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;
    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    // --- Helper function to clear & re‑draw the canvas (with smoothed strokes) ---
    const redrawCanvas = () => {
      // Clear the entire canvas.
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // (Optional) Draw a light fill inside the bounding box (so you can see its region).
      if (boundingBox) {
        canvasCtx.fillStyle = "rgba(128, 128, 128, 0.2)";
        canvasCtx.fillRect(
          boundingBox.x - boundingBox.size,
          boundingBox.y - boundingBox.size / 2,
          boundingBox.size*2,
          boundingBox.size
        );
      }

      // Draw all completed strokes using the smooth drawing helper.
      strokesRef.current.forEach((stroke) => {
        if (stroke.length === 0) return;
        canvasCtx.strokeStyle = "black";
        canvasCtx.lineWidth = 2;
        drawSmoothStroke(canvasCtx, stroke);
      });

      // Draw the current stroke in progress.
      if (currentStrokeRef.current.length > 0) {
        canvasCtx.strokeStyle = "black";
        canvasCtx.lineWidth = 2;
        drawSmoothStroke(canvasCtx, currentStrokeRef.current);
      }

      // Finally, draw the overlay (the bounding box border and horizontal line).
      if (boundingBox) {
        // Draw a blue border around the bounding box.
        canvasCtx.strokeStyle = "blue";
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(
          boundingBox.x - boundingBox.size,
          boundingBox.y - boundingBox.size / 2,
          boundingBox.size*2,
          boundingBox.size
        );
        // Draw a horizontal guideline.
        //canvasCtx.beginPath();
        //canvasCtx.moveTo(0, boundingBox.y);
        //canvasCtx.lineTo(canvasElement.width, boundingBox.y);
        //canvasCtx.stroke();
      }
    };

    // --- Set up Mediapipe Hands ---
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (!canvasCtx) return;
      // Process results only if hand(s) are detected.
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        // Compute the Euclidean distance between thumb tip and index tip.
        const distance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // Convert normalized coordinates to canvas pixel coordinates.
        // (These are in the natural, non‑mirrored coordinate system.)
        const x = indexTip.x * canvasElement.width;
        const y = indexTip.y * canvasElement.height;

        if (distance < pinchThreshold) {
          // Pinching detected.
          pinchFrames++;

          // If not yet calibrated, and the pinch is held long enough, set the bounding box.
          if (!isCalibrated && pinchFrames >= debounceFrames) {
            setBoundingBox({ x, y, size: 200 });
            setIsCalibrated(true);
          } else if (isCalibrated && boundingBox) {
            // Once calibrated, add points only if within the bounding box.
            let withinBounds =
              x >= boundingBox.x - boundingBox.size &&
              x <= boundingBox.x + boundingBox.size &&
              y >= boundingBox.y - boundingBox.size / 2 &&
              y <= boundingBox.y + boundingBox.size / 2;
            if (withinBounds) {
              // Append the current point to the in‑progress stroke.
              currentStrokeRef.current.push({ x, y });
              // If the save button is visible, hide it since drawing has resumed.
              if (showSaveButtonRef.current) {
                setShowSaveButton(false);
              }
            }
          }
        } else {
          // Pinch is released.
          if (currentStrokeRef.current.length > 0) {
            // Save the completed stroke.
            strokesRef.current.push([...currentStrokeRef.current]);
            setShowSaveButton(true);
          }
          pinchFrames = 0;
          currentStrokeRef.current = [];
        }
      }
      // Re‑draw the entire canvas (strokes, current stroke, overlay, etc.)
      redrawCanvas();
    });

    // --- Set up the camera ---
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
    };
  }, [isCalibrated, boundingBox]);

  // --- Clear the canvas and stored strokes ---
  const clearCanvas = () => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const canvasCtx = canvasElement.getContext("2d");
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setShowSaveButton(false);
  };

  // --- Generate an SVG string from the stroke data with smooth paths ---
  const generateSVG = () => {
    const width = 640;
    const height = 480;
    let svgPaths = "";

    // For each completed stroke…
    strokesRef.current.forEach((stroke) => {
      if (stroke.length === 0) return;
      const d = getSmoothPathD(stroke);
      svgPaths += `<path d="${d}" stroke="black" stroke-width="2" fill="none" />\n`;
    });

    // Include the in‑progress stroke (if any).
    if (currentStrokeRef.current.length > 0) {
      const d = getSmoothPathD(currentStrokeRef.current);
      svgPaths += `<path d="${d}" stroke="black" stroke-width="2" fill="none" />\n`;
    }

    // Because the canvas (and video) are displayed mirrored via CSS,
    // wrap the paths in a group that flips them so that the saved SVG matches the on‑screen view.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <g transform="translate(${width},0) scale(-1,1)">
    ${svgPaths}
  </g>
</svg>`;
    return svg;
  };

  // --- Save the canvas as an SVG file ---
  const saveCanvas = () => {
    const svgString = generateSVG();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "signature.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowSaveButton(false);
  };

  return (
    <div style={{ position: "relative", width: "640px", height: "480px" }}>
      {/* The video element is mirrored so that the user sees a mirror image. */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: "640px",
          height: "480px",
          transform: "scaleX(-1)",
          objectFit: "cover",
        }}
        autoPlay
        playsInline
        muted
      />

      {/* The canvas overlay is also mirrored via CSS.
          Note: The underlying drawing uses “natural” coordinates and our redraw logic.
          (This is why we apply a transform in the saved SVG.) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          border: "1px solid black",
          width: "640px",
          height: "480px",
          transform: "scaleX(-1)",
        }}
        width="640"
        height="480"
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
        Clear
      </button>

      {showSaveButton && (
        <button
          onClick={saveCanvas}
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