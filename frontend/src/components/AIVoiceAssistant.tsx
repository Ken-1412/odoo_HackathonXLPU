import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  X,
  Bot,
  User,
  CheckCircle2,
} from "lucide-react";
import * as api from "../lib/api";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  toolUsed?: string;
  data?: any;
  actionTaken?: string;
  timestamp: string;
}

interface AIVoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
  userName?: string | null;
}

export default function AIVoiceAssistant({
  isOpen,
  onClose,
  userRole,
  userName,
}: AIVoiceAssistantProps) {
  const isAdmin = userRole === "Administrator" || userRole === "Asset Manager";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: isAdmin
        ? `Hello ${userName || "Admin"}! I'm your **AssetFlow Admin AI Voice Assistant** 🤖.\n\nAsk me about company asset availability, IT administrator details, maintenance repairs, expiring warranties, department analytics, or dispatching AI voice calls!`
        : `Hello ${userName || "there"}! I'm your **AssetFlow AI Voice Assistant** 🤖.\n\nYou can ask me who the IT Admin is, check how many assets are available in the company, request a new laptop/device directly, report broken hardware, or check your assigned equipment!`,
      timestamp: "Just now",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [suggestionsList, setSuggestionsList] = useState<string[]>(
    isAdmin
      ? [
          "How many assets are available in company?",
          "Who is the IT admin?",
          "Assets under maintenance",
          "Hardware warranties expiring soon",
          "Call employee Priya Sharma",
          "Department asset utilization",
        ]
      : [
          "Who is the IT admin?",
          "How many assets are available in company?",
          "Request a laptop",
          "What assets are assigned to me?",
          "Report a broken screen",
          "Check meeting room availability",
        ]
  );

  // Auto-scroll conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, transcriptPreview]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setTranscriptPreview("Listening...");
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript) {
            setTranscriptPreview(interimTranscript);
          }

          if (finalTranscript) {
            setTranscriptPreview("");
            handleSend(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("[SpeechRecognition Error]:", event.error);
          setIsListening(false);
          setTranscriptPreview("");
        };

        recognition.onend = () => {
          setIsListening(false);
          setTranscriptPreview("");
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Pre-load and select female voice
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const findFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Priority list of premium female voices across Windows, macOS, Android, and iOS
      const femalePatterns = [
        /zira/i,
        /jenny/i,
        /samantha/i,
        /victoria/i,
        /karen/i,
        /fiona/i,
        /tessa/i,
        /moira/i,
        /veena/i,
        /serena/i,
        /allison/i,
        /ava/i,
        /susan/i,
        /aria/i,
        /google.*female/i,
        /en-us.*female/i,
        /en-gb.*female/i,
        /female/i,
        /woman/i,
      ];

      for (const pattern of femalePatterns) {
        const found = voices.find(v => pattern.test(v.name) || pattern.test(v.voiceURI));
        if (found) {
          setSelectedVoice(found);
          return;
        }
      }

      // Fallback: search any English voice
      const englishVoice = voices.find(v => v.lang.startsWith("en"));
      if (englishVoice) {
        setSelectedVoice(englishVoice);
      } else {
        setSelectedVoice(voices[0]);
      }
    };

    findFemaleVoice();
    window.speechSynthesis.onvoiceschanged = findFemaleVoice;
  }, []);

  // Text to Speech
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      // Strip markdown symbols for natural speech
      const clean = text
        .replace(/[*#`_\[\]()]/g, "")
        .replace(/•/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\n+/g, ". ");

      const utterance = new SpeechSynthesisUtterance(clean);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.18; // Warm, natural feminine timbre

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use text input.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await api.queryAIAssistant(textToSend);
      // apiFetch already unwraps json.data, so res IS the result object
      const result = res || {};

      const botMsg: Message = {
        id: `msg_bot_${Date.now()}`,
        sender: "assistant",
        text: result.answer || result.data?.answer || "Sorry, I couldn't process that. Could you try rephrasing?",
        toolUsed: result.toolUsed || result.data?.toolUsed,
        actionTaken: result.actionTaken || result.data?.actionTaken,
        data: result.data,
        timestamp: "Just now",
      };

      if (botMsg.actionTaken && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("assetflow:data-updated"));
      }

      const suggestions = result.suggestions || result.data?.suggestions;
      if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
        setSuggestionsList(suggestions);
      }

      setMessages((prev) => [...prev, botMsg]);
      speakText(botMsg.text);
    } catch (err: any) {
      const errMsg: Message = {
        id: `msg_err_${Date.now()}`,
        sender: "assistant",
        text: `Sorry, I encountered an issue processing that: ${err.message || "Unknown error"}. Please try again.`,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[720px] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-zinc-800 bg-surface-50/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-900 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-900/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-surface-900 dark:text-white uppercase tracking-wider">
                  AssetFlow Voice AI
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {isSpeaking ? "Speaking..." : "Online"}
                </span>
              </div>
              <p className="text-[11px] text-surface-500 dark:text-zinc-400 font-medium">
                Powered by OmniDimension AI Voice Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg border cursor-pointer transition ${
                voiceEnabled
                  ? "bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800 text-brand-900 dark:text-brand-300"
                  : "bg-surface-100 dark:bg-zinc-800 border-surface-200 dark:border-zinc-700 text-surface-400"
              }`}
              title={voiceEnabled ? "Mute Voice Speech" : "Unmute Voice Speech"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-surface-200 dark:border-zinc-800 hover:bg-surface-100 dark:hover:bg-zinc-800 text-surface-500 dark:text-zinc-400 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation Feed */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-4 bg-surface-50/40 dark:bg-zinc-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-brand-900/10 dark:bg-brand-400/10 text-brand-900 dark:text-brand-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-brand-900 text-white font-medium rounded-tr-none"
                    : "bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 text-surface-850 dark:text-zinc-200 rounded-tl-none"
                }`}
              >
                {/* Render Text with Markdown Bold / Bullets */}
                <div className="space-y-1.5 whitespace-pre-wrap">
                  {msg.text.split("\n").map((line, idx) => {
                    if (line.startsWith("•") || line.startsWith("-")) {
                      return (
                        <div key={idx} className="flex gap-1.5 items-start pl-1">
                          <span className="text-brand-900 dark:text-brand-400 font-bold shrink-0">
                            •
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: line
                                .replace(/^[•\-]\s*/, "")
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/`(.*?)`/g, "<code class='font-mono bg-surface-150 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] font-bold'>$1</code>"),
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <p
                        key={idx}
                        dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/`(.*?)`/g, "<code class='font-mono bg-surface-150 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] font-bold'>$1</code>"),
                        }}
                      />
                    );
                  })}
                </div>

                {/* Structured Action Confirmation Card */}
                {msg.actionTaken === "ASSET_ALLOCATED" && msg.data && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] space-y-1 text-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hardware Asset Allocated to Your Profile!
                    </div>
                    <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                      Asset: {msg.data.asset?.name || msg.data.name || "Hardware"} [{msg.data.asset?.tag || msg.data.tag || "AF"}] • Status: ACTIVE ALLOCATION
                    </div>
                  </div>
                )}

                {msg.actionTaken === "ASSET_REQUESTED" && msg.data && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] space-y-1 text-blue-800 dark:text-blue-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Asset Request Submitted to IT Admin
                    </div>
                    <div className="font-mono text-[10px] text-blue-700 dark:text-blue-300">
                      Request ID: #{msg.data.id?.slice(0, 8)} • Asset: {msg.data.asset?.name || msg.data.name || "Requested Item"} ({msg.data.asset?.tag || msg.data.tag || "AF"}) • Status: PENDING
                    </div>
                  </div>
                )}

                {msg.actionTaken === "MAINTENANCE_CREATED" && msg.data && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 rounded-xl text-[11px] space-y-1 text-green-800 dark:text-green-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      Maintenance Ticket Registered
                    </div>
                    <div className="font-mono text-[10px] text-green-700 dark:text-green-300">
                      Ticket ID: #{msg.data.id?.slice(0, 8)}
                    </div>
                  </div>
                )}

                {msg.actionTaken === "AI_CALL_DISPATCHED" && msg.data && (
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] space-y-1 text-indigo-800 dark:text-indigo-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      OmniDimension Voice AI Call Dispatched
                    </div>
                    <div className="font-mono text-[10px] text-indigo-700 dark:text-indigo-300">
                      Call Ref: #{msg.data.callId || msg.data.id?.slice(0, 8)} • Status: {msg.data.status}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1 text-right font-mono ${
                    msg.sender === "user"
                      ? "text-brand-200"
                      : "text-surface-400 dark:text-zinc-500"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-lg bg-surface-200 dark:bg-zinc-800 text-surface-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Transcript live preview while speaking */}
          {transcriptPreview && (
            <div className="flex gap-3 justify-end animate-pulse">
              <div className="bg-brand-900/60 text-white text-xs px-4 py-2.5 rounded-2xl rounded-tr-none italic">
                {transcriptPreview}
              </div>
            </div>
          )}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-surface-500 dark:text-zinc-400">
              <div className="w-8 h-8 rounded-lg bg-brand-900/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-brand-900 animate-spin" />
              </div>
              <div className="flex gap-1.5 items-center bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-none">
                <span className="w-2 h-2 rounded-full bg-brand-900 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-brand-900 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-brand-900 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-t border-surface-200 dark:border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-surface-400 dark:text-zinc-500 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-brand-900 dark:text-brand-400" />
            Suggestions:
          </div>
          {suggestionsList.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion)}
              disabled={isLoading}
              className="text-[11px] font-semibold bg-surface-100 dark:bg-zinc-800 hover:bg-surface-200 dark:hover:bg-zinc-700 text-surface-700 dark:text-zinc-300 px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition border border-surface-200 dark:border-zinc-700"
            >
              {suggestion}
            </button>
          ))}
        </div>


        {/* Input Bar & Mic Controls */}
        <div className="p-4 bg-surface-50 dark:bg-zinc-950 border-t border-surface-200 dark:border-zinc-800 flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`p-3.5 rounded-xl cursor-pointer transition shadow flex items-center justify-center shrink-0 ${
              isListening
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-500/20"
                : "bg-brand-900 hover:bg-brand-800 text-white"
            }`}
            title={isListening ? "Stop Listening" : "Click to Speak"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-grow flex items-center gap-2 bg-white dark:bg-zinc-900 border border-surface-300 dark:border-zinc-800 rounded-xl px-3 h-12 focus-within:border-brand-900 shadow-sm"
          >
            <input
              type="text"
              placeholder={isListening ? "Listening to your voice..." : "Type or speak a question..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="w-full bg-transparent text-xs font-semibold text-surface-900 dark:text-white outline-none placeholder:text-surface-400 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-brand-900 disabled:opacity-40 text-white rounded-lg cursor-pointer transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
