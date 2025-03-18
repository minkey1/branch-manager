import React, { useState, useEffect, useRef } from "react";

const Chatbot = () => {
    const [captions, setCaptions] = useState("Waiting for speech...");
    const [error, setError] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const recognitionRef = useRef(null);
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

    const getAIResponse = async (text) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            setChatLog(prev => [...prev, { text, sender: "user" }, { text: data.response, sender: "ai" }]);

            playTalkingVideo();
            const speech = new SpeechSynthesisUtterance(data.response);
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

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
            {/* Video Background */}
            <video 
            ref={idleVideoRef}
            src="/idle.mp4" 
            autoPlay 
            loop 
            muted
            style={{ 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)", 
                height: "100%", 
                objectFit: "cover" 
            }}
        />
        <video 
            ref={talkingVideoRef}
            src="/talking.mp4" 
            loop 
            muted
            style={{ 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)", 
                height: "100%", 
                objectFit: "cover", 
                display: "none" 
            }}
        />

            
            {/* Buttons */}
            <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
                <button onClick={startRecognition}>Start</button>
                <button onClick={stopRecognition}>Stop</button>
                <button onClick={clearChat}>Clear</button>
            </div>

            {/* Chat Log */}
            <div style={{ 
                position: "absolute", 
                bottom: "20px", 
                left: "20px", 
                width: "300px", 
                maxHeight: "200px", 
                overflowY: "auto", 
                background: "rgba(0, 0, 0)", 
                color: "#fff", 
                padding: "10px", 
                borderRadius: "5px"
            }}>
                {chatLog.map((msg, index) => (
                    <div key={index} style={{ background: msg.sender === "user" ? "#9999ff44" : "#f0f0f044", padding: "5px", margin: "5px 0" }}>
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Captions */}
            <div style={{ 
                position: "absolute", 
                bottom: "10px", 
                width: "100%", 
                textAlign: "center", 
                background: "rgba(0, 0, 0)", 
                color: "#fff", 
                padding: "10px", 
                fontSize: "18px" 
            }}>
                {captions}
            </div>
        </div>
    );
};

export default Chatbot;
