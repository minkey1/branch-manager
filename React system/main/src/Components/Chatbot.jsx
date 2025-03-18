import React, { useState, useEffect, useRef } from "react";

const Chatbot = () => {
    const [captions, setCaptions] = useState("Waiting for speech...");
    const [error, setError] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const recognitionRef = useRef(null);
    const isRecognizing = useRef(false);
    const shouldProcess = useRef(true);

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
            
            const speech = new SpeechSynthesisUtterance(data.response);
            window.speechSynthesis.speak(speech);
        } catch (error) {
            setError("API Error: " + error.message);
        }
    };

    return (
        <div style={{ fontFamily: "sans-serif", margin: "20px" }}>
            <h1>Gemini AI Voice Chat</h1>
            <button onClick={startRecognition}>Start</button>
            <button onClick={stopRecognition}>Stop</button>
            <button onClick={clearChat}>Clear</button>
            <div style={{ background: "#000", color: "#fff", padding: "10px", margin: "10px 0", borderRadius: "5px" }}>
                {captions}
            </div>
            <div style={{ color: "red" }}>{error}</div>
            <div style={{ marginTop: "20px", maxHeight: "300px", overflowY: "auto" }}>
                {chatLog.map((msg, index) => (
                    <div key={index} style={{ background: msg.sender === "user" ? "#e0f7fa" : "#f0f0f0", padding: "8px", margin: "5px 0" }}>
                        {msg.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Chatbot;
