import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const HandSignature: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isCalibrated, setIsCalibrated] = useState(false);
    const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; size: number } | null>(null);

    const pinchThreshold = 0.05; // Sensitivity for pinch detection
    const debounceFrames = 5; // Frames to confirm a pinch
    const positions: { x: number; y: number }[] = []; // Track positions for smoothing

    useEffect(() => {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement?.getContext("2d");

        if (!videoElement || !canvasElement || !canvasCtx) return;

        // Initialize MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        let pinchFrames = 0;

        hands.onResults((results) => {
            if (!canvasCtx) return;

            // Clear the canvas to redraw
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Draw the bounding box and guide line if calibrated
            if (boundingBox) {
                // Draw the semi-transparent bounding box
                canvasCtx.fillStyle = "rgba(128, 128, 128, 0.5)";
                canvasCtx.fillRect(
                    boundingBox.x - boundingBox.size / 2,
                    boundingBox.y - boundingBox.size / 2,
                    boundingBox.size,
                    boundingBox.size
                );

                // Draw the guide line
                canvasCtx.strokeStyle = "blue";
                canvasCtx.lineWidth = 2;
                canvasCtx.beginPath();
                canvasCtx.moveTo(0, boundingBox.y); // Start from left edge
                canvasCtx.lineTo(canvasElement.width, boundingBox.y); // End at right edge
                canvasCtx.stroke();
            }

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];

                // Calculate the distance between thumb and index finger
                const distance = Math.sqrt(
                    Math.pow(thumbTip.x - indexTip.x, 2) +
                        Math.pow(thumbTip.y - indexTip.y, 2)
                );

                const x = indexTip.x * canvasElement.width;
                const y = indexTip.y * canvasElement.height;

                if (distance < pinchThreshold) {
                    pinchFrames++;

                    // Calibration Phase
                    if (!isCalibrated && pinchFrames >= debounceFrames) {
                        setBoundingBox({ x, y, size: 200 }); // Define a 200px bounding box
                        setIsCalibrated(true);
                        console.log(`Calibration complete. Bounding box set at (${x}, ${y})`);
                    } else if (isCalibrated && boundingBox) {
                        // Drawing Phase: Check if within bounding box
                        const withinBounds =
                            x >= boundingBox.x - boundingBox.size / 2 &&
                            x <= boundingBox.x + boundingBox.size / 2 &&
                            y >= boundingBox.y - boundingBox.size / 2 &&
                            y <= boundingBox.y + boundingBox.size / 2;

                        if (withinBounds) {
                            positions.push({ x, y });

                            // Smooth drawing using interpolation
                            if (positions.length > 1) {
                                const lastPos = positions[positions.length - 2];
                                canvasCtx.beginPath();
                                canvasCtx.moveTo(lastPos.x, lastPos.y);
                                canvasCtx.lineTo(x, y);
                                canvasCtx.strokeStyle = "black";
                                canvasCtx.lineWidth = 2;
                                canvasCtx.stroke();
                            }
                        }
                    }
                } else {
                    pinchFrames = 0;
                    positions.length = 0; // Clear positions for smoothing
                }
            }
        });

        // Initialize Camera
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

    // Clear canvas function
    const clearCanvas = () => {
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement?.getContext("2d");
        if (canvasCtx && canvasElement) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
    };

    return (
        <div style={{ position: "relative", width: "640px", height: "480px" }}>
            {/* Webcam feed */}
            <video
                ref={videoRef}
                style={{
                    position: "absolute",
                    width: "640px",
                    height: "480px",
                    transform: "scaleX(-1)", // Mirror the video
                    objectFit: "cover",
                }}
                autoPlay
                playsInline
                muted
            />

            {/* Drawing canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    border: "1px solid black",
                    width: "640px",
                    transform: "scaleX(-1)",
                    height: "480px",
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
