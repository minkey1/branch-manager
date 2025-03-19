import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css"
const Chatbot = () => {
    const [captions, setCaptions] = useState("Waiting for speech...");
    const [error, setError] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const recognitionRef = useRef(null);
    const chatLogRef = useRef(null);
    const isRecognizing = useRef(false);
    const shouldProcess = useRef(true);
    const idleVideoRef = useRef(null);
    const talkingVideoRef = useRef(null);
    const isSpeaking = useRef(false);

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
                } else {
                    setCaptions(prev => prev + transcript);
                }
            }
        };

        recognition.onerror = (event) => {
            setError("Error: " + event.error);
        };

        recognition.onend = () => {
            isRecognizing.current = false;
            if (shouldProcess.current) {
                recognition.start();
                isRecognizing.current = true;
            }
        };
    }, []);

    const startRecognition = () => {
        if (!isRecognizing.current) {
            navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
                setError("Microphone access denied");
            });
            recognitionRef.current.start();
            isRecognizing.current = true;
            shouldProcess.current = true;
            setError("");
        }
    };

    const stopRecognition = () => {
        recognitionRef.current.stop();
        isRecognizing.current = false;
        shouldProcess.current = false;
        window.speechSynthesis.cancel();
    };

    const clearChat = () => {
        setCaptions("Waiting for speech...");
        setChatLog([]);
    };

    const sanitizeResponse = (text) => {
        return text.replace(/\*+/g, '').replace(/[\[\](){}<>]/g, '');
    };

    const getAIResponse = async (text) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            const cleanResponse = sanitizeResponse(data.response);
            setChatLog(prev => [...prev, { text, sender: "user" }, { text: cleanResponse, sender: "ai" }]);

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

    const playTalkingVideo = () => {
        if (talkingVideoRef.current && idleVideoRef.current) {
            idleVideoRef.current.style.display = "none";
            talkingVideoRef.current.style.display = "block";
            talkingVideoRef.current.play();
        }
    };

    const playIdleVideo = () => {
        if (talkingVideoRef.current && idleVideoRef.current) {
            talkingVideoRef.current.style.display = "none";
            idleVideoRef.current.style.display = "block";
            idleVideoRef.current.play();
        }
    };

    // Scroll to the latest message
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [chatLog]);

    return (
        <div id="chatbot-container" className="chatbot-container">
            {/* Video Background */}
            <video 
                ref={idleVideoRef}
                id="idle-video"
                src="/idle.mp4" 
                autoPlay 
                loop 
                muted
                className="video-background"
            />
            <video 
                ref={talkingVideoRef}
                id="talking-video"
                src="/talking.mp4" 
                loop 
                muted
                className="video-background talking-video"
            />

            {/* Buttons */}
            <div id="control-buttons" className="control-buttons">
                <button id="start-btn" className="btn" onClick={startRecognition}>Start</button>
                <button id="stop-btn" className="btn" onClick={stopRecognition}>Stop</button>
                <button id="clear-btn" className="btn" onClick={clearChat}>Clear</button>
            </div>

            {/* Chat Log */}
            <div id="chat-log" className="chat-log" ref={chatLogRef}>
                {chatLog.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat-message ${msg.sender === "user" ? "chat-message-user" : "chat-message-ai"}`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Captions */}
            <div id="captions" className="captions">
                {captions}
            </div>
        </div>
    );
};

export default Chatbot;
