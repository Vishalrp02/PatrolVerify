"use client";
import { useState, useRef } from "react";
import { reportIncident } from "@/app/actions/incident";
import { toast } from "sonner"; // Ensure you installed sonner: npm install sonner
import { Mic, Square, Loader2, FileText } from "lucide-react"; // Icons

export default function IncidentRecorder({ userId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    // 1. Check Browser Support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Voice recording is not supported in this browser. Please use Chrome or Safari.",
      );
      return;
    }

    // 2. Configure Recognition (browser may use default locale; AI analyzes any language)
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;

    // 3. Event Handlers
    recognition.onstart = () => {
      setIsRecording(true);
      toast.info("Listening... Speak in any language.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      setIsRecording(false);
      toast.error("Error hearing audio. Try again.");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      // Stop recognition immediately after getting result
      recognition.stop();

      // Send to Backend
      handleSubmission(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmission = async (text) => {
    if (!text) return;

    setIsProcessing(true);
    toast.loading("🤖 AI is analyzing your report...");

    try {
      const result = await reportIncident(text, userId);

      toast.dismiss(); // Remove loading toast

      if (result.success) {
        toast.success("Incident Logged Successfully!");
      } else {
        toast.error(result?.error || "Failed to save report.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col items-center">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-800">
          Voice Incident Report
        </h3>
        <p className="text-xs text-gray-500">
          Tap, speak in any language. AI will analyze and set severity.
        </p>
      </div>

      <button
        onClick={
          isRecording ? () => recognitionRef.current?.stop() : startRecording
        }
        disabled={isProcessing}
        className={`
          relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-xl
          ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : isRecording
                ? "bg-red-500 ring-4 ring-red-200 scale-110"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
          }
        `}
      >
        {/* Animated Ping Effect when Recording */}
        {isRecording && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
        )}

        {isProcessing ? (
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-8 h-8 text-white fill-current" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </button>

      <div className="mt-6 text-sm font-medium text-gray-600">
        {isProcessing ? (
          <span className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing with
            Gemini...
          </span>
        ) : isRecording ? (
          <span className="text-red-500 animate-pulse">● Recording...</span>
        ) : (
          <span className="text-gray-400">Tap microphone to start</span>
        )}
      </div>
    </div>
  );
}
