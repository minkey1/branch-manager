import React, { useState, useEffect, useRef } from "react";
import VideoBackground from "./VideoBackground";
import ControlButtons from "./ControlButtons";
import ChatLog from "./ChatLog";
import Captions from "./Captions";
import InputField from "./InputField";
import FileUploader from "./FileUploader";
import Camera from "./Camera";
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
  const [loanStep, setLoanStep] = useState(0);
  const [loanData, setLoanData] = useState({});

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

  const startRecognition = () => {
    if (!isRecognizing) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .catch(() => {
          setError("Microphone access denied");
        });
      recognitionRef.current.start();
      setIsRecognizing(true);
      shouldProcess.current = true;
      setError("");
    }
  };

  const stopRecognition = () => {
    recognitionRef.current.stop();
    setIsRecognizing(false);
    shouldProcess.current = false;
    window.speechSynthesis.cancel();
    playIdleVideo();
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

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);

  const initiateLoanProcess = () => {
    stopRecognition();
    setLoanStep(1);
    speak("Okay, let's start your loan application.");
  };

  const handleLoanData = (data) => {
    setLoanData((prev) => ({ ...prev, ...data }));
    setLoanStep((prev) => prev + 1);
  };

  const getAIResponse = async (text) => {
    if (loanStep > 0) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const aiResponse = data.response;

      if (aiResponse.includes("initialize_loan")) {
        initiateLoanProcess();
        return;
      }

      const cleanResponse = aiResponse.replace(/\*+/g, "").replace(/[\[\](){}<>]/g, "");
      setChatLog((prev) => [...prev, { text, sender: "user" }, { text: cleanResponse, sender: "ai" }]);
      speak(cleanResponse);
    } catch (error) {
      setError("API Error: " + error.message);
    }
  };

  const loanQuestions = [
    "How much money do you want for the loan?",
    "For how long (in years)?",
    "Your PAN card number?",
    "Your Aadhar number?",
    "Your CIBIL score?",
    "Your net income?",
  ];

  const loanDocuments = [
    { label: "Upload PAN Card Image", fileType: "image/*", link: "pan" },
    { label: "Upload Aadhar Card Image", fileType: "image/*", link: "aadhar" },
    { label: "Upload Salary Slip Image", fileType: "image/*", link: "salary" },
  ];

  const calculateInstallment = (principal, years, rate) => {
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const checkLoanEligibility = () => {
    const { "How much money do you want for the loan?": principal, "For how long (in years)?": years, "Your CIBIL score?": cibil, "Your net income?": income } = loanData;

    if (!principal || !years || !cibil || !income) {
      return "You are eligible for the loan";
    }

    const monthlyInstallment = calculateInstallment(parseFloat(principal), parseFloat(years), 10.5);
    const requiredIncome = monthlyInstallment * 2;

    if (parseFloat(cibil) >= 650 && parseFloat(income) >= requiredIncome) {
      return "Loan approved!";
    } else {
      return "Loan application denied.";
    }
  };

  const speak = (text) => {
    playTalkingVideo();
    const speech = new SpeechSynthesisUtterance(text);
    speech.onend = () => {
      playIdleVideo();
      isSpeaking.current = false;
    };
    isSpeaking.current = true;
    window.speechSynthesis.speak(speech);
  };

  useEffect(() => {
    if (loanStep > 0 && loanStep <= loanQuestions.length) {
      speak(loanQuestions[loanStep - 1]);
    } else if (loanStep > loanQuestions.length && loanStep <= loanQuestions.length + loanDocuments.length) {
      speak(`Please upload your ${loanDocuments[loanStep - loanQuestions.length - 1].label}`);
    } else if (loanStep > loanQuestions.length + loanDocuments.length) {
      speak(checkLoanEligibility());
    }
  }, [loanStep]);

  return (
    <div id="chatbot-container" className="chatbot-container">
      <VideoBackground idleVideoRef={idleVideoRef} talkingVideoRef={talkingVideoRef} />
      <Camera />
      <ControlButtons startRecognition={startRecognition} stopRecognition={stopRecognition} clearChat={() => setChatLog([])} isRecognizing={isRecognizing} />
      <ChatLog chatLog={chatLog} chatLogRef={chatLogRef} />
      <Captions captions={captions} />
      {error && <div className="error">{error}</div>}
      {loanStep > 0 && loanStep <= loanQuestions.length && (
        <InputField question={loanQuestions[loanStep - 1]} onSubmit={handleLoanData} />
      )}
      {loanStep > loanQuestions.length && loanStep <= loanQuestions.length + loanDocuments.length && (
        <FileUploader
          label={loanDocuments[loanStep - loanQuestions.length - 1].label}
          fileType={loanDocuments[loanStep - loanQuestions.length - 1].fileType}
          submissionLink={`http://localhost:5000/upload/${loanDocuments[loanStep - loanQuestions.length - 1].link}`}
          onUploadSuccess={handleLoanData}
        />
      )}
      {loanStep > loanQuestions.length + loanDocuments.length && (
        <div className="completion-message">{checkLoanEligibility()}</div>
      )}

    </div>
  );
};

export default Chatbot;