import React, { useState, useEffect, useRef } from "react";
import VideoBackground from "./VideoBackground";
import ControlButtons from "./ControlButtons";
import ChatLog from "./ChatLog";
import Captions from "./Captions";
import "./Chatbot.css";

const Chatbot = () => {
  const [captions, setCaptions] = useState("Waiting for speech...");
  const [error, setError] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const recognitionRef = useRef(null);
  const chatLogRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const shouldProcess = useRef(true);
  const idleVideoRef = useRef(null);
  const talkingVideoRef = useRef(null);
  const isSpeaking = useRef(false);

  // Initialize Speech Recognition and set up event listeners
  useEffect(() => {
    recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    const recognition = recognitionRef.current;
    
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = async (event) => {
      if (!shouldProcess.current) return;
      let transcript = "";
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
          setCaptions(finalTranscript);
          shouldProcess.current = false;
          await getAIResponse(finalTranscript);
          shouldProcess.current = true;
        }
      }
    };

    recognition.onerror = (event) => {
      setError("Error: " + event.error);
    };

    recognition.onend = () => {
      setIsRecognizing(false);
      if (shouldProcess.current) {
        recognition.start();
        setIsRecognizing(true);
      }
    };
  }, []);

  // Start recognition by requesting microphone access and starting the recognizer
  const startRecognition = () => {
    if (!isRecognizing) {
      navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
        setError("Microphone access denied");
      });
      recognitionRef.current.start();
      setIsRecognizing(true);  // Update state
      shouldProcess.current = true;
      setError("");
    }
  };
  

  // Stop recognition and cancel any speech synthesis
  const stopRecognition = () => {
    recognitionRef.current.stop();
    setIsRecognizing(false);
    shouldProcess.current = false;
    window.speechSynthesis.cancel();
    playIdleVideo(); // Switches the video background to idle
  };
  

  // Clear chat log and reset captions
  const clearChat = () => {
    setCaptions("Waiting for speech...");
    recognitionRef.current.stop();
    setIsRecognizing(false);
    shouldProcess.current = false;
    window.speechSynthesis.cancel();
    playIdleVideo();
    setChatLog([]);
  };

  // Remove unwanted characters from the API response
  const sanitizeResponse = (text) => {
    return text.replace(/\*+/g, "").replace(/[\[\](){}<>]/g, "");
  };

  // Get AI response from API, update chat log, and speak the response
  const getAIResponse = async (text) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const cleanResponse = sanitizeResponse(data.response);
      setChatLog(prev => [
        ...prev,
        { text, sender: "user" },
        { text: cleanResponse, sender: "ai" }
      ]);

      playTalkingVideo();
      const speech = new SpeechSynthesisUtterance(cleanResponse);
      speech.onend = () => {
        playIdleVideo();
        isSpeaking.current = false;
      };
      isSpeaking.current = true;
      window.speechSynthesis.speak(speech);
    } catch (error) {
      setError("API Error: " + error.message);
    }
  };

  // Switch to talking video background
  const playTalkingVideo = () => {
    if (talkingVideoRef.current && idleVideoRef.current) {
      idleVideoRef.current.style.display = "none";
      talkingVideoRef.current.style.display = "block";
      talkingVideoRef.current.play();
    }
  };

  // Switch back to idle video background
  const playIdleVideo = () => {
    if (talkingVideoRef.current && idleVideoRef.current) {
      talkingVideoRef.current.style.display = "none";
      idleVideoRef.current.style.display = "block";
      idleVideoRef.current.play();
    }
  };

  // Auto-scroll the chat log to the latest message
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);

  return (
    <div id="chatbot-container" className="chatbot-container">
      <VideoBackground
        idleVideoRef={idleVideoRef}
        talkingVideoRef={talkingVideoRef}
      />
      <ControlButtons
        startRecognition={startRecognition}
        stopRecognition={stopRecognition}
        clearChat={clearChat}
        isRecognizing={isRecognizing}
      />

      <ChatLog chatLog={chatLog} chatLogRef={chatLogRef} />
      <Captions captions={captions} />
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Chatbot;
