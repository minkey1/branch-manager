import { useState, useEffect, useRef } from "react";

const Camera = () => {
  const [borderColor, setBorderColor] = useState("green");
  const videoRef = useRef(null);

  useEffect(() => {
    // Request access to the camera
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });

    // Handle border color change on key press
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        setBorderColor("red");
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey) {
        setBorderColor("green");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className={`camera-container ${borderColor === "red" ? "border-red" : "border-green"}`}>
      <video ref={videoRef} autoPlay playsInline className="camera-video" />
    </div>
  );
};

export default Camera;
