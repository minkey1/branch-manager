import React from "react";

const ChatLog = ({ chatLog, chatLogRef }) => {
  return (
    <div id="chat-log" className="chat-log" ref={chatLogRef}>
      {chatLog.map((msg, index) => (
        <div
          key={index}
          className={`chat-message ${
            msg.sender === "user" ? "chat-message-user" : "chat-message-ai"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};

export default ChatLog;
