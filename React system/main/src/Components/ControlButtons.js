import React from "react";

const ControlButtons = ({ startRecognition, stopRecognition, clearChat, isRecognizing }) => {
  return (
    <div id="control-buttons" className="control-buttons">
      <button id="start-btn" className="btn" onClick={startRecognition} disabled={isRecognizing}>
        Start
      </button>
      <button id="stop-btn" className="btn" onClick={stopRecognition} disabled={!isRecognizing}>
        Stop
      </button>
      <button id="clear-btn" className="btn" onClick={clearChat}>
        Clear
      </button>
    </div>
  );
};

export default ControlButtons;
