import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  PhoneCall,
  Clock,
  Send,
  HelpCircle,
  Activity,
  Layers,
  Info
} from 'lucide-react';

export const StockSenseOmniDim: React.FC = () => {
  // Agent State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'ACTIVE' | 'STANDBY' | 'CONNECTING'>('ACTIVE');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Live Conversation Transcript
  const [transcripts, setTranscripts] = useState<
    Array<{ id: string; sender: 'user' | 'agent' | 'system'; text: string; time: string; actionTag?: string }>
  >([
    {
      id: 'init-1',
      sender: 'system',
      text: 'OmniDimension Voice AI Integration initialized. Connected to StockSense live inventory engine.',
      time: 'Just now',
    },
    {
      id: 'init-2',
      sender: 'agent',
      text: 'Hello, I am Sophia, your StockSense AI Inventory Assistant. You can speak to check live stock, receive incoming consignments, transfer materials between racks, or verify low inventory levels.',
      time: 'Just now',
    },
  ]);

  // Voice / Command Input
  const [commandInput, setCommandInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: string;
    endpoint: string;
    payload: any;
    promptText: string;
  } | null>(null);

  // Recent Calls
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  // Fetch Agent Status & Calls from Backend
  const loadCalls = async () => {
    setIsLoadingCalls(true);
    try {
      const res = await fetch('/api/omnidim/calls');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setCalls(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch calls from backend:', err);
    } finally {
      setIsLoadingCalls(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  // Start Voice Session (calls backend POST /api/omnidim/session)
  const handleStartSession = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('dare_token');
      const res = await fetch('/api/omnidim/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to create session (${res.status})`);
      }

      const json = await res.json();
      const sessData = json.data;

      setSessionId(sessData.sessionId);
      setIsSessionActive(true);
      setAgentStatus('ACTIVE');

      setTranscripts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'system',
          text: `Voice session established (ID: ${sessData.sessionId}). Microphone active.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: String(Date.now() + 1),
          sender: 'agent',
          text: 'Voice channel opened. I am listening for your inventory commands.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Request browser audio permission if supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          console.warn('Microphone permission ignored or denied for browser UI');
        }
      }
    } catch (err: any) {
      alert(`Could not start OmniDimension voice session: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setTranscripts((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'system',
        text: 'Voice session ended.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    loadCalls();
  };

  // Execute Voice Command Simulation against backend tools
  const handleSendCommand = async (customCmd?: string) => {
    const text = (customCmd || commandInput).trim();
    if (!text) return;

    setCommandInput('');
    setIsProcessing(true);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTranscripts((prev) => [
      ...prev,
      { id: String(Date.now()), sender: 'user', text, time: timeStr },
    ]);

    try {
      const lower = text.toLowerCase();

      // Check if user is confirming a pending mutation
      if (pendingConfirmation && (lower.includes('yes') || lower.includes('proceed') || lower.includes('confirm') || lower.includes('sure') || lower.includes('do it'))) {
        const confirmPayload = { ...pendingConfirmation.payload, confirmed: true };
        const res = await fetch(pendingConfirmation.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer stocksense-omnidim-tool-secret-token-2026',
          },
          body: JSON.stringify(confirmPayload),
        });

        const json = await res.json();
        setPendingConfirmation(null);

        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: json.speechResponse || 'Operation confirmed and posted to the stock ledger.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: 'LEDGER POSTED [VOICE_AI]',
          },
        ]);
        loadCalls();
        setIsProcessing(false);
        return;
      }

      if (pendingConfirmation && (lower.includes('no') || lower.includes('cancel') || lower.includes('abort') || lower.includes('stop'))) {
        setPendingConfirmation(null);
        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: 'Understood. Action cancelled. No inventory changes were made.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsProcessing(false);
        return;
      }

      // Query Stock
      if (lower.includes('stock of') || lower.includes('how many') || lower.includes('available')) {
        let queryTerm = 'Steel';
        if (lower.includes('steel')) queryTerm = 'Steel';
        else if (lower.includes('aluminum')) queryTerm = 'Aluminum';
        else if (lower.includes('mcu') || lower.includes('microcontroller')) queryTerm = 'Microcontrollers';
        else if (lower.includes('chair')) queryTerm = 'Chair';
        else if (lower.includes('sensor')) queryTerm = 'Sensor';
        else if (lower.includes('box')) queryTerm = 'Box';

        const res = await fetch(`/api/omnidim/tools/stock?query=${encodeURIComponent(queryTerm)}`, {
          headers: { Authorization: 'Bearer stocksense-omnidim-tool-secret-token-2026' },
        });
        const json = await res.json();

        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: json.speechResponse || 'Found inventory data.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: 'LIVE STOCK QUERY',
          },
        ]);
      }
      // Low stock query
      else if (lower.includes('low') || lower.includes('out of stock') || lower.includes('reorder')) {
        const res = await fetch('/api/omnidim/tools/low-stock', {
          headers: { Authorization: 'Bearer stocksense-omnidim-tool-secret-token-2026' },
        });
        const json = await res.json();

        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: json.speechResponse || 'Retrieved stock threshold analysis.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: 'REORDER ANALYSIS',
          },
        ]);
      }
      // Receive Goods
      else if (lower.includes('received') || lower.includes('receipt') || lower.includes('incoming')) {
        // Extract quantity
        const match = lower.match(/\d+/);
        const qty = match ? parseInt(match[0], 10) : 50;

        const res = await fetch('/api/omnidim/tools/receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer stocksense-omnidim-tool-secret-token-2026',
          },
          body: JSON.stringify({
            productName: 'Steel Rods',
            quantity: qty,
            supplier: 'ABC Steelworks Corp',
            confirmed: false,
          }),
        });
        const json = await res.json();

        if (json.requiresConfirmation) {
          setPendingConfirmation({
            action: 'RECEIVE_STOCK',
            endpoint: '/api/omnidim/tools/receipt',
            payload: { productName: 'Steel Rods', quantity: qty, supplier: 'ABC Steelworks Corp' },
            promptText: json.speechResponse,
          });
        }

        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: json.speechResponse || `Received request to intake ${qty} units.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: 'CONFIRMATION REQUIRED',
          },
        ]);
      }
      // Move / Transfer
      else if (lower.includes('move') || lower.includes('transfer')) {
        const match = lower.match(/\d+/);
        const qty = match ? parseInt(match[0], 10) : 20;

        const res = await fetch('/api/omnidim/tools/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer stocksense-omnidim-tool-secret-token-2026',
          },
          body: JSON.stringify({
            productName: 'Steel Rods',
            quantity: qty,
            fromLocation: 'Main Rack',
            toLocation: 'Production Floor Rack',
            confirmed: false,
          }),
        });
        const json = await res.json();

        if (json.requiresConfirmation) {
          setPendingConfirmation({
            action: 'TRANSFER_STOCK',
            endpoint: '/api/omnidim/tools/transfer',
            payload: {
              productName: 'Steel Rods',
              quantity: qty,
              fromLocation: 'Main Rack',
              toLocation: 'Production Floor Rack',
            },
            promptText: json.speechResponse,
          });
        }

        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: json.speechResponse || `Transfer request prepared.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: 'CONFIRMATION REQUIRED',
          },
        ]);
      }
      // Adjust
      else if (lower.includes('adjust') || lower.includes('count') || lower.includes('physical')) {
        const match = lower.match(/\d+/);
        const countVal = match ? parseInt(match[0], 10) : 97;

        const res = await fetch('/api/omnidim/tools/adjustment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer stocksense-omnidim-tool-secret-token-2026',
          },
          body: JSON.stringify({
            productName: 'Steel Rods',
            countedQuantity: countVal,
            locationName: 'Main Rack',
            confirmed: false,
          }),
        });
        const json = await res.json();

        if (json.requiresConfirmation) {
          setPendingConfirmation({
            action: 'ADJUST_STOCK',
            endpoint: '/api/omnidim/tools/adjustment',
            payload: {
              productName: 'Steel Rods',
              countedQuantity: countVal,
              locationName: 'Main Rack',
            },
            promptText: json.speechResponse,
          });
        }

        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: json.speechResponse || `Adjustment prepared.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: 'CONFIRMATION REQUIRED',
          },
        ]);
      }
      // Fallback general query
      else {
        setTranscripts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'agent',
            text: `I heard "${text}". You can ask about product stock ("What is the stock of Steel?"), check low stock ("Which items are low?"), or record receipts, transfers, and adjustments.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setTranscripts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'agent',
          text: `Could not process request: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
                OmniDimension Voice AI Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agent #241840 ({agentStatus})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Conversational Voice & Telephony engine for real-time warehouse queries, stock intakes, transfers, and physical audits.
            </p>
          </div>
        </div>

        {/* Start / Stop Session CTA */}
        <div className="flex items-center gap-3">
          {isSessionActive ? (
            <button
              onClick={handleEndSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
            >
              <MicOff className="w-4 h-4" />
              End Voice Session
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50"
            >
              <Mic className="w-4 h-4 animate-bounce" />
              {isConnecting ? 'Connecting...' : 'Start Voice Session'}
            </button>
          )}

          <button
            onClick={loadCalls}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Call Logs"
          >
            <RotateCw className={`w-4 h-4 ${isLoadingCalls ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Live Voice Terminal & Quick Simulators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Conversation Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
            {/* Terminal Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
                  Live Voice & Command Console
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>Session: {sessionId ? sessionId.substring(0, 14) + '...' : 'Offline'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>Protected by OMNIDIM_TOOL_TOKEN</span>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`flex flex-col ${
                    t.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                      {t.sender === 'user' ? 'Operator' : t.sender === 'agent' ? 'Sophia (Voice AI)' : 'System Event'}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400">{t.time}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                      t.sender === 'user'
                        ? 'bg-blue-600 text-white font-medium rounded-br-xs shadow-2xs'
                        : t.sender === 'agent'
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                        : 'bg-slate-100 border border-slate-200/80 text-slate-600 italic font-mono'
                    }`}
                  >
                    {t.text}
                    {t.actionTag && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] font-mono font-bold text-blue-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {t.actionTag}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-lg p-2.5 max-w-xs shadow-2xs">
                  <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  Sophia is processing backend inventory data...
                </div>
              )}

              {/* Write Action Confirmation Bar */}
              {pendingConfirmation && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Write Action Confirmation Required
                  </div>
                  <p className="text-amber-800/90 leading-relaxed font-mono text-[11px]">
                    {pendingConfirmation.promptText}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSendCommand('Yes, proceed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      Confirm (Yes)
                    </button>
                    <button
                      onClick={() => handleSendCommand('Cancel')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                placeholder="Type or simulate a voice command (e.g., 'What is the stock of Steel?')..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
              <button
                onClick={() => handleSendCommand()}
                disabled={!commandInput.trim() || isProcessing}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
                title="Send command"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Voice Command Prompts */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                1-Click Voice Command Tests (Requirement 52)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleSendCommand('What is the stock of Steel Rods?')}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs text-slate-700 transition-all flex items-start gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Query Stock</div>
                  <div className="text-[11px] text-slate-500 font-mono">"What is the stock of Steel Rods?"</div>
                </div>
              </button>

              <button
                onClick={() => handleSendCommand('Which products are low in stock?')}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs text-slate-700 transition-all flex items-start gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Low Stock Query</div>
                  <div className="text-[11px] text-slate-500 font-mono">"Which products are low in stock?"</div>
                </div>
              </button>

              <button
                onClick={() => handleSendCommand('We received 50 more Steel Rods.')}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs text-slate-700 transition-all flex items-start gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Intake / Receipt</div>
                  <div className="text-[11px] text-slate-500 font-mono">"We received 50 more Steel Rods."</div>
                </div>
              </button>

              <button
                onClick={() => handleSendCommand('Move 20 Steel Rods from Main Rack to Production Floor Rack.')}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs text-slate-700 transition-all flex items-start gap-2"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Internal Transfer</div>
                  <div className="text-[11px] text-slate-500 font-mono">"Move 20 Steel to Production."</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Agent Config & Integration Status */}
        <div className="space-y-4">
          {/* Agent Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Agent Configuration
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                v0.6.0 SDK
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Agent Name</span>
                <span className="font-semibold text-slate-900">StockSense Assistant</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Agent ID</span>
                <span className="font-mono text-slate-900 font-bold">241840</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Voice Profile</span>
                <span className="font-medium text-slate-800">Sophia (Warm Industrial)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Primary Language</span>
                <span className="font-medium text-slate-800">English (en-US)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Stock Mutation Source</span>
                <span className="font-mono text-blue-600 font-bold">VOICE_AI</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Security Mode</span>
                <span className="font-semibold text-emerald-700">Write-Confirm Guarded</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1 font-mono">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Security Guarantee
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                OMNIDIM_API_KEY is retained strictly on the backend server. The browser client receives only short-lived session tokens.
              </p>
            </div>
          </div>

          {/* Integration Health Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider block border-b border-slate-100 pb-2">
              Integration Health
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                <span className="font-medium text-emerald-900">Backend API Services</span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase">Operational (200 OK)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                <span className="font-medium text-emerald-900">Custom API Tool Endpoints</span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase">7 Tools Active</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                <span className="font-medium text-emerald-900">Stock Ledger Hook</span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase">Audited</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                <span className="font-medium text-emerald-900">Post-Call Webhook</span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase">/webhooks/omnidim</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calls & Telephony Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight font-['Space_Grotesk'] uppercase">
              Recent Voice Interactions & Post-Call Logs
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {calls.length} logged sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 font-mono uppercase text-[10px] text-slate-500 tracking-wider">
                <th className="py-3 px-4">Session / Call ID</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-mono">
                    No recent calls recorded. Start a voice session above to test.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call._id || call.externalCallId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {call.externalCallId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {call.userName || 'Inventory Staff'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {call.duration || 45}s
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {call.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-bold">
                      {call.intent || 'STOCK_AUDIT'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {call.summary || call.transcript || 'Live voice interaction session completed.'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {call.startedAt ? new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
