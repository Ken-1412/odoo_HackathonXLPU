import { useState, useEffect, useCallback } from "react";
import {
  PhoneCall,
  Bot,
  ClipboardCheck,
  Search,
  Plus,
  Play,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sparkles,
  Layers,
  Radio,
  Zap,
  CheckCircle2,
  ArrowRight,
  Check,
} from "lucide-react";
import * as api from "../../lib/api";

interface AICommunicationsProps {
  username?: string | null;
  themeMode?: "light" | "dark";
  onOpenAssistantModal?: () => void;
}

export default function AICommunications({
  onOpenAssistantModal,
}: AICommunicationsProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "call_employee" | "triggers" | "campaigns" | "audit_calls" | "history"
  >("call_employee");

  // ─── Shared Reference Data ────────────────────────────────────────────────
  const [employees, setEmployees] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<any[]>([]);
  const [auditCycles, setAuditCycles] = useState<any[]>([]);

  // ─── Automated Triggers States ────────────────────────────────────────────
  const [isScanningTriggers, setIsScanningTriggers] = useState(false);
  const [triggerScanResult, setTriggerScanResult] = useState<any>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookSimMessage, setWebhookSimMessage] = useState<string | null>(null);

  // ─── Single Call Form States ──────────────────────────────────────────────
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [callPurpose, setCallPurpose] = useState("MAINTENANCE_FOLLOWUP");
  const [customPurpose, setCustomPurpose] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeCallStatus, setActiveCallStatus] = useState<any>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // ─── Bulk Campaign States ─────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignPurpose, setCampaignPurpose] = useState("ASSET_AUDIT_VERIFICATION");
  const [campaignAuditId, setCampaignAuditId] = useState("");
  const [campaignLoading, setCampaignLoading] = useState(false);

  // ─── AI Asset Audit States ────────────────────────────────────────────────
  const [auditTargetCycleId, setAuditTargetCycleId] = useState("");
  const [auditCycleDetails, setAuditCycleDetails] = useState<any>(null);
  const [isAuditingBatch, setIsAuditingBatch] = useState(false);

  // ─── Call History States ──────────────────────────────────────────────────
  const [historyCalls, setHistoryCalls] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [historyPurposeFilter, setHistoryPurposeFilter] = useState("ALL");
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Call Details Modal ───────────────────────────────────────────────────
  const [selectedCallDetail, setSelectedCallDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load initial dropdown dependencies
  const loadReferenceData = useCallback(async () => {
    try {
      const [empRes, assetRes, maintRes, auditRes] = await Promise.all([
        api.fetchEmployees().catch(() => []),
        api.fetchAssets().catch(() => []),
        api.fetchMaintenanceTickets().catch(() => []),
        api.fetchAudits().catch(() => []),
      ]);

      const empList = Array.isArray(empRes) ? empRes : empRes?.data || [];
      const assetList = Array.isArray(assetRes) ? assetRes : assetRes?.data || [];
      const maintList = Array.isArray(maintRes) ? maintRes : maintRes?.data || [];
      const auditList = Array.isArray(auditRes) ? auditRes : auditRes?.data || [];

      setEmployees(empList);
      setAssets(assetList);
      setMaintenanceTickets(maintList);
      setAuditCycles(auditList);

      if (auditList.length > 0) {
        setAuditTargetCycleId(auditList[0].id);
        setCampaignAuditId(auditList[0].id);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // When selected employee changes, auto-populate phone & assigned asset
  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find((e) => e.id === selectedEmpId);
      if (emp) {
        setManualPhone(emp.phone || "");
        if (emp.allocatedAssets && emp.allocatedAssets.length > 0) {
          setSelectedAssetId(emp.allocatedAssets[0].assetId || emp.allocatedAssets[0].asset?.id || "");
        }
      }
    }
  }, [selectedEmpId, employees]);

  // Load Call History
  const loadCallHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.fetchAICallHistory({
        page: historyPage,
        limit: 15,
        search: historySearch,
        status: historyStatusFilter,
        purpose: historyPurposeFilter,
      });

      setHistoryCalls(res.data || []);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historySearch, historyStatusFilter, historyPurposeFilter]);

  // Load Campaigns
  const loadCampaigns = useCallback(async () => {
    setCampaignLoading(true);
    try {
      const res = await api.fetchAICampaigns();
      setCampaigns(res.data || []);
    } catch {
      // silent
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  // Load Audit Cycle details for AI Audit tab
  useEffect(() => {
    if (auditTargetCycleId) {
      api
        .fetchAuditById(auditTargetCycleId)
        .then((res: any) => setAuditCycleDetails(res.data || res))
        .catch(() => setAuditCycleDetails(null));
    }
  }, [auditTargetCycleId]);

  useEffect(() => {
    if (activeSubTab === "history") {
      loadCallHistory();
    } else if (activeSubTab === "campaigns") {
      loadCampaigns();
    }
  }, [activeSubTab, loadCallHistory, loadCampaigns]);

  // ─── Single Call Dispatch Handler ─────────────────────────────────────────
  const handleInitiateSingleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchError(null);
    setIsDispatching(true);
    setActiveCallStatus({ status: "QUEUED", message: "Dispatching request to OmniDimension..." });

    try {
      const res = await api.initiateAICall({
        employeeId: selectedEmpId || undefined,
        phoneNumber: manualPhone || undefined,
        purpose: callPurpose,
        customPurpose: callPurpose === "CUSTOM" ? customPurpose : undefined,
        assetId: selectedAssetId || undefined,
        maintenanceId: selectedTicketId || undefined,
        auditCycleId: selectedAuditId || undefined,
        additionalContext,
      });

      const call = res.data || res;
      setActiveCallStatus({
        status: call.status || "INITIATED",
        id: call.id,
        callId: call.callId,
        message: "AI Voice Call initiated successfully!",
      });

      // Refresh history in background
      loadCallHistory();
    } catch (err: any) {
      setDispatchError(err.message || "Failed to initiate AI call.");
      setActiveCallStatus({ status: "FAILED", message: err.message });
    } finally {
      setIsDispatching(false);
    }
  };

  // ─── Bulk Campaign Creation Handler ───────────────────────────────────────
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) return;

    try {
      await api.createAICampaign({
        title: campaignTitle.trim(),
        purpose: campaignPurpose,
        auditCycleId: campaignAuditId || undefined,
      });

      setShowCreateCampaignModal(false);
      setCampaignTitle("");
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to create AI calling campaign.");
    }
  };

  // ─── Start AI Audit Batch Calls ───────────────────────────────────────────
  const handleStartAuditCalls = async () => {
    if (!auditTargetCycleId) return;
    setIsAuditingBatch(true);

    try {
      await api.createAICampaign({
        title: `AI Audit Verification — ${auditCycleDetails?.name || "Audit Cycle"}`,
        purpose: "ASSET_AUDIT_VERIFICATION",
        auditCycleId: auditTargetCycleId,
      });

      alert("AI Asset Audit calls have been queued! The AI will now call assigned employees to verify asset possession.");
      setActiveSubTab("campaigns");
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to launch audit calls.");
    } finally {
      setIsAuditingBatch(false);
    }
  };

  // ─── Automated Triggers Scan Handler ──────────────────────────────────────
  const handleRunTriggerScan = async () => {
    setIsScanningTriggers(true);
    setTriggerScanResult(null);
    try {
      const res = await api.runAutomatedTriggerScan();
      const resultData = res.data || res;
      setTriggerScanResult(resultData);
      loadCallHistory();
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to run automated triggers scan.");
    } finally {
      setIsScanningTriggers(false);
    }
  };

  // ─── Simulate Webhook Outcome Handler ─────────────────────────────────────
  const handleSimulateWebhookOutcome = async (callId: string, outcome: string) => {
    setSimulatingWebhook(true);
    setWebhookSimMessage(null);
    try {
      await api.simulateAICallWebhook(callId, { outcome });
      setWebhookSimMessage(`✅ Post-call Webhook simulated successfully! Recorded outcome: ${outcome}`);
      const updated = await api.fetchAICallDetails(callId);
      setSelectedCallDetail(updated.data || updated);
      loadCallHistory();
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || "Webhook simulation failed");
    } finally {
      setSimulatingWebhook(false);
    }
  };

  // ─── Open Call Details ────────────────────────────────────────────────────
  const handleOpenCallDetails = async (call: any) => {
    try {
      const res = await api.fetchAICallDetails(call.id);
      setSelectedCallDetail(res.data || res);
    } catch {
      setSelectedCallDetail(call);
    }
    setShowDetailModal(true);
  };

  // ─── Dynamic Context Preview Derived ──────────────────────────────────────
  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedTicket = maintenanceTickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="max-w-6xl space-y-6 animate-float">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white font-sans uppercase">
              AI Communications
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-50 dark:bg-brand-950 text-brand-900 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Bot className="w-3.5 h-3.5" />
              OmniDimension Voice
            </span>
          </div>
          <p className="text-sm text-surface-600 dark:text-zinc-400 mt-1 font-medium">
            Automated Employee Calling, Asset Verification Audits, Maintenance Reminders, and Voice Assistant.
          </p>
        </div>

        {/* Action Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAssistantModal?.()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-900 to-indigo-700 hover:from-brand-800 hover:to-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-brand-900/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            Open Voice Assistant
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-surface-200 dark:border-zinc-800 gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "call_employee", label: "Call Employee", icon: PhoneCall },
          { id: "triggers", label: "Automated Triggers", icon: Zap },
          { id: "campaigns", label: "Call Campaigns", icon: Layers },
          { id: "audit_calls", label: "AI Asset Audit", icon: ClipboardCheck },
          { id: "history", label: "Call History & Logs", icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-brand-900 text-brand-900 dark:text-white dark:border-brand-400 bg-brand-50/50 dark:bg-brand-950/30 rounded-t-lg"
                  : "border-transparent text-surface-550 dark:text-zinc-400 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: CALL EMPLOYEE (SINGLE OUTBOUND CALL) ───────────────────── */}
      {activeSubTab === "call_employee" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dispatch Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="border-b border-surface-150 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-surface-900 dark:text-white flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-brand-900 dark:text-brand-400" />
                  Dispatch Outbound AI Call
                </h3>
                <p className="text-xs text-surface-500 dark:text-zinc-400 mt-0.5">
                  Select an employee and configure dynamic context for the AI voice agent.
                </p>
              </div>

              {dispatchError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Dispatch Warning</strong>
                    <span>{dispatchError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleInitiateSingleCall} className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Select Target Employee
                  </label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3.5 h-11 text-xs font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                  >
                    <option value="">-- Choose employee from directory --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department?.name || emp.department || "No Dept"}) — {emp.phone || "No Phone"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number with E.164 Notice */}
                <div>
                  <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex justify-between">
                    <span>Phone Number</span>
                    <span className="text-[10px] text-brand-900 dark:text-brand-400 font-mono">Supports +91 / 10 digits</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3.5 h-11 text-xs font-mono font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                  />
                </div>

                {/* Call Purpose */}
                <div>
                  <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Call Purpose
                  </label>
                  <select
                    value={callPurpose}
                    onChange={(e) => setCallPurpose(e.target.value)}
                    className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3.5 h-11 text-xs font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                  >
                    <option value="MAINTENANCE_FOLLOWUP">Maintenance Follow-up</option>
                    <option value="ASSET_RETURN_REMINDER">Asset Return Reminder</option>
                    <option value="WARRANTY_REMINDER">Warranty Expiry Reminder</option>
                    <option value="ASSET_AUDIT_VERIFICATION">Asset Audit Possession Verification</option>
                    <option value="GENERAL_NOTIFICATION">General Organizational Notification</option>
                    <option value="CUSTOM">Custom Purpose</option>
                  </select>
                </div>

                {callPurpose === "CUSTOM" && (
                  <div>
                    <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Custom Purpose Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Annual IT Security Policy Confirmation"
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3.5 h-11 text-xs font-semibold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                    />
                  </div>
                )}

                {callPurpose === "ASSET_AUDIT_VERIFICATION" && (
                  <div>
                    <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Target Audit Cycle (Optional)
                    </label>
                    <select
                      value={selectedAuditId}
                      onChange={(e) => setSelectedAuditId(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3.5 h-11 text-xs font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                    >
                      <option value="">-- Select Audit Cycle --</option>
                      {auditCycles.map((ac) => (
                        <option key={ac.id} value={ac.id}>
                          {ac.name} ({ac.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Optional Related Asset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Related Asset (Optional)
                    </label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3 h-10 text-xs font-medium text-surface-900 dark:text-white outline-none focus:border-brand-900"
                    >
                      <option value="">-- No specific asset --</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.tag}] {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Related Ticket */}
                  <div>
                    <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Related Ticket (Optional)
                    </label>
                    <select
                      value={selectedTicketId}
                      onChange={(e) => setSelectedTicketId(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3 h-10 text-xs font-medium text-surface-900 dark:text-white outline-none focus:border-brand-900"
                    >
                      <option value="">-- No specific ticket --</option>
                      {maintenanceTickets.map((t) => (
                        <option key={t.id} value={t.id}>
                          #{t.id.slice(0, 6)}: {t.issue}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Context */}
                <div>
                  <label className="block text-xs font-bold text-surface-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Additional Context / Instructions for AI
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please ask the employee if the laptop replacement charger was received and working properly."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl p-3 text-xs font-medium text-surface-900 dark:text-white outline-none focus:border-brand-900"
                  />
                </div>

                {/* Submit Call Button */}
                <button
                  type="submit"
                  disabled={isDispatching || (!selectedEmpId && !manualPhone)}
                  className="w-full py-3 bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-lg shadow-brand-900/20 transition flex items-center justify-center gap-2"
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Queuing Voice Call...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      Call Now via OmniDimension
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Dynamic Context Live Preview & Status (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Call Status Feedback */}
            {activeCallStatus && (
              <div
                className={`p-5 rounded-2xl border shadow-sm space-y-2 animate-fadeIn ${
                  activeCallStatus.status === "COMPLETED"
                    ? "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                    : activeCallStatus.status === "FAILED"
                    ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                    : "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    Call Status Feedback
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                      activeCallStatus.status === "COMPLETED"
                        ? "bg-green-600 text-white"
                        : activeCallStatus.status === "FAILED"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white animate-pulse"
                    }`}
                  >
                    {activeCallStatus.status}
                  </span>
                </div>
                <p className="text-xs font-semibold">{activeCallStatus.message}</p>
                {activeCallStatus.callId && (
                  <div className="font-mono text-[10px] text-surface-500 pt-1">
                    OmniDimension Ref: {activeCallStatus.callId}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Context Preview Card */}
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-surface-150 dark:border-zinc-800 pb-2.5 flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-surface-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-900 dark:text-brand-400" />
                  Dynamic Call Context Preview
                </h4>
                <span className="text-[10px] font-mono font-bold text-surface-400 uppercase">
                  Agent Payload
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-surface-100 dark:border-zinc-800">
                  <span className="text-surface-500 font-semibold">Employee Name</span>
                  <span className="font-bold text-surface-900 dark:text-white">
                    {selectedEmp?.name || "Rahul Singh (Sample)"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-surface-100 dark:border-zinc-800">
                  <span className="text-surface-500 font-semibold">Destination Number</span>
                  <span className="font-mono font-bold text-brand-900 dark:text-brand-300">
                    {manualPhone || "+91 98765 43210"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-surface-100 dark:border-zinc-800">
                  <span className="text-surface-500 font-semibold">Assigned Asset</span>
                  <span className="font-bold text-surface-900 dark:text-white">
                    {selectedAsset ? `[${selectedAsset.tag}] ${selectedAsset.name}` : "Dell Latitude 7440 (AST-1021)"}
                  </span>
                </div>

                {selectedTicket && (
                  <div className="flex justify-between py-1 border-b border-surface-100 dark:border-zinc-800">
                    <span className="text-surface-500 font-semibold">Maintenance Issue</span>
                    <span className="font-bold text-surface-900 dark:text-white max-w-[180px] truncate text-right">
                      {selectedTicket.issue}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-surface-100 dark:border-zinc-800">
                  <span className="text-surface-500 font-semibold">Purpose</span>
                  <span className="font-bold text-surface-900 dark:text-white">
                    {callPurpose.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-surface-500 font-semibold">System Entity</span>
                  <span className="font-bold text-surface-900 dark:text-white">
                    AssetFlow ERP
                  </span>
                </div>
              </div>

              <div className="p-3 bg-surface-50 dark:bg-zinc-950 rounded-xl text-[11px] text-surface-600 dark:text-zinc-400 italic">
                "The OmniDimension AI agent uses this metadata to speak naturally with the employee, reference their specific device, and confirm resolution or possession status."
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: AUTOMATED CALL TRIGGERS ──────────────────────────────────── */}
      {activeSubTab === "triggers" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-surface-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Automated AI Call Triggers
              </h3>
              <p className="text-xs text-surface-500 font-medium mt-0.5">
                AssetFlow continuously monitors ERP events and autonomously dispatches OmniDimension AI Voice calls when operational criteria are met.
              </p>
            </div>

            <button
              onClick={handleRunTriggerScan}
              disabled={isScanningTriggers}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-600/20 transition"
            >
              {isScanningTriggers ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Scanning Triggers...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Run Automated Trigger Scan Now
                </>
              )}
            </button>
          </div>

          {/* Trigger Scan Live Feedback */}
          {triggerScanResult && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-fadeIn space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Automated Trigger Scan Completed Successfully!
                </div>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {triggerScanResult.totalTriggered} call(s) dispatched
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[10px] text-surface-400 font-bold uppercase">Maintenance Follow-ups</div>
                  <div className="font-extrabold text-surface-900 dark:text-white">{triggerScanResult.maintenanceCalls || 0}</div>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[10px] text-surface-400 font-bold uppercase">Return Reminders</div>
                  <div className="font-extrabold text-surface-900 dark:text-white">{triggerScanResult.returnReminderCalls || 0}</div>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[10px] text-surface-400 font-bold uppercase">Warranty Expiries</div>
                  <div className="font-extrabold text-surface-900 dark:text-white">{triggerScanResult.warrantyReminderCalls || 0}</div>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[10px] text-surface-400 font-bold uppercase">Audit Verifications</div>
                  <div className="font-extrabold text-surface-900 dark:text-white">{triggerScanResult.auditVerificationCalls || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* 4 Trigger Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Maintenance Pending */}
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-brand-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    🔧
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-white">
                      1. Maintenance Ticket Pending
                    </h4>
                    <span className="text-[11px] text-surface-500 font-medium">
                      Operational Event Trigger
                    </span>
                  </div>
                </div>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Event Chain Diagram */}
              <div className="bg-surface-50 dark:bg-zinc-950 p-3 rounded-xl border border-surface-150 dark:border-zinc-850">
                <div className="text-[10px] font-bold text-surface-400 uppercase mb-2">Automated Trigger Workflow</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-zinc-300">
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Maintenance Pending
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Follow-up Required
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-brand-50 dark:bg-brand-950 text-brand-900 dark:text-brand-300 font-bold rounded-lg border border-brand-200 dark:border-brand-800">
                    OmniDimension Call
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Employee
                  </span>
                </div>
              </div>

              <p className="text-xs text-surface-600 dark:text-zinc-400 leading-relaxed font-medium">
                When open maintenance tickets remain pending without updates, the system automatically schedules an outbound AI check-in to confirm if the device was received by the technician or if the employee needs loaner equipment.
              </p>
            </div>

            {/* Card 2: Asset Return Due */}
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-brand-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    🔄
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-white">
                      2. Asset Return Due & Overdue
                    </h4>
                    <span className="text-[11px] text-surface-500 font-medium">
                      Operational Event Trigger
                    </span>
                  </div>
                </div>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Event Chain Diagram */}
              <div className="bg-surface-50 dark:bg-zinc-950 p-3 rounded-xl border border-surface-150 dark:border-zinc-850">
                <div className="text-[10px] font-bold text-surface-400 uppercase mb-2">Automated Trigger Workflow</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-zinc-300">
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Asset Return Due
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-brand-50 dark:bg-brand-950 text-brand-900 dark:text-brand-300 font-bold rounded-lg border border-brand-200 dark:border-brand-800">
                    AI Return Call
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Employee Handover
                  </span>
                </div>
              </div>

              <p className="text-xs text-surface-600 dark:text-zinc-400 leading-relaxed font-medium">
                Detects temporary hardware allocations reaching expiration date and automatically calls the assigned employee with drop-off instructions and IT contact details.
              </p>
            </div>

            {/* Card 3: Warranty Expiring */}
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-brand-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    ⏰
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-white">
                      3. Warranty Expiring (&lt; 30 Days)
                    </h4>
                    <span className="text-[11px] text-surface-500 font-medium">
                      Operational Event Trigger
                    </span>
                  </div>
                </div>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Event Chain Diagram */}
              <div className="bg-surface-50 dark:bg-zinc-950 p-3 rounded-xl border border-surface-150 dark:border-zinc-850">
                <div className="text-[10px] font-bold text-surface-400 uppercase mb-2">Automated Trigger Workflow</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-zinc-300">
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Warranty Expiring Soon
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-brand-50 dark:bg-brand-950 text-brand-900 dark:text-brand-300 font-bold rounded-lg border border-brand-200 dark:border-brand-800">
                    AI Health Call
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Renewal / Servicing
                  </span>
                </div>
              </div>

              <p className="text-xs text-surface-600 dark:text-zinc-400 leading-relaxed font-medium">
                Scans all enterprise hardware for manufacturer warranties expiring within 30 days and alerts the custodian to schedule any necessary battery/screen repairs before coverage ends.
              </p>
            </div>

            {/* Card 4: Asset Audit Verification */}
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-brand-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    📋
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-white">
                      4. Asset Audit Verification
                    </h4>
                    <span className="text-[11px] text-surface-500 font-medium">
                      Periodic Verification Trigger
                    </span>
                  </div>
                </div>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Event Chain Diagram */}
              <div className="bg-surface-50 dark:bg-zinc-950 p-3 rounded-xl border border-surface-150 dark:border-zinc-850">
                <div className="text-[10px] font-bold text-surface-400 uppercase mb-2">Automated Trigger Workflow</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-zinc-300">
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Quarterly Audit Cycle
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-brand-50 dark:bg-brand-950 text-brand-900 dark:text-brand-300 font-bold rounded-lg border border-brand-200 dark:border-brand-800">
                    AI Verification Call
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                  <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
                    Verified / Missing / Damaged
                  </span>
                </div>
              </div>

              <p className="text-xs text-surface-600 dark:text-zinc-400 leading-relaxed font-medium">
                Initiates AI voice conversations for all unverified assets in an active audit cycle to ask: "Do you currently possess your assigned MacBook Pro?" and updates the audit trail automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BULK CAMPAIGNS ─────────────────────────────────────────── */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-surface-900 dark:text-white">
                Bulk AI Calling Campaigns
              </h3>
              <p className="text-xs text-surface-500 font-medium">
                Dispatch automated batch calling campaigns across departments for quarterly audits and return reminders.
              </p>
            </div>

            <button
              onClick={() => setShowCreateCampaignModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-brand-900/20 transition"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>

          {campaignLoading ? (
            <div className="p-12 text-center text-xs text-surface-400">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <Layers className="w-12 h-12 text-surface-300 dark:text-zinc-700 mx-auto" />
              <h4 className="font-extrabold text-sm uppercase text-surface-900 dark:text-white">
                No Active Campaigns Found
              </h4>
              <p className="text-xs text-surface-500 max-w-md mx-auto">
                Click "Create Campaign" above to launch an automated AI calling campaign for asset audits or returns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const successRate = camp.totalCalls
                  ? Math.round((camp.completedCalls / camp.totalCalls) * 100)
                  : 0;
                const verifiedRate = camp.totalCalls
                  ? Math.round(((camp.verifiedCount || 0) / camp.totalCalls) * 100)
                  : 0;

                return (
                  <div
                    key={camp.id}
                    className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-surface-900 dark:text-white">
                          {camp.title}
                        </h4>
                        <span className="text-[11px] text-surface-500 font-medium">
                          Purpose: {camp.purpose.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          camp.status === "COMPLETED"
                            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200"
                            : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-surface-500 uppercase">
                        <span>Campaign Completion</span>
                        <span className="text-brand-900 dark:text-brand-300 font-mono font-extrabold">{successRate}% Completed ({verifiedRate}% Verified)</span>
                      </div>
                      <div className="w-full bg-surface-150 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-brand-900 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-surface-150 dark:border-zinc-800 text-center">
                      <div className="bg-surface-50 dark:bg-zinc-950 p-2 rounded-lg">
                        <div className="text-[10px] font-bold text-surface-400 uppercase">Total</div>
                        <div className="text-sm font-extrabold text-surface-900 dark:text-white">
                          {camp.totalCalls}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/60 p-2 rounded-lg text-green-700 dark:text-green-300">
                        <div className="text-[10px] font-bold uppercase">Completed</div>
                        <div className="text-sm font-extrabold">{camp.completedCalls}</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/60 p-2 rounded-lg text-purple-700 dark:text-purple-300">
                        <div className="text-[10px] font-bold uppercase">Verified</div>
                        <div className="text-sm font-extrabold">{camp.verifiedCount}</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg text-amber-700 dark:text-amber-300">
                        <div className="text-[10px] font-bold uppercase">No Answer</div>
                        <div className="text-sm font-extrabold">{camp.noAnswerCalls}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: AI ASSET AUDIT ─────────────────────────────────────────── */}
      {activeSubTab === "audit_calls" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-150 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-surface-900 dark:text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-brand-900 dark:text-brand-400" />
                  AI-Powered Asset Audit Verification
                </h3>
                <p className="text-xs text-surface-500 font-medium mt-0.5">
                  The AI voice agent calls employees holding unverified assets in the cycle to confirm physical possession.
                </p>
              </div>

              {/* Audit Cycle Select */}
              <div className="flex items-center gap-3">
                <select
                  value={auditTargetCycleId}
                  onChange={(e) => setAuditTargetCycleId(e.target.value)}
                  className="bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3.5 h-10 text-xs font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                >
                  {auditCycles.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.name} ({ac.department})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleStartAuditCalls}
                  disabled={isAuditingBatch || !auditTargetCycleId}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-md shadow-brand-900/20 transition"
                >
                  {isAuditingBatch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Start AI Audit Calls
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Audit Items List */}
            {auditCycleDetails?.items ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-zinc-300">
                  Target Assets in this Audit Cycle ({auditCycleDetails.items.length} Assets)
                </h4>

                <div className="border border-surface-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-zinc-800 bg-surface-50 dark:bg-zinc-950 text-[10px] text-surface-500 font-bold uppercase tracking-wider">
                        <th className="p-3 text-left">Asset Code</th>
                        <th className="p-3 text-left">Device Name</th>
                        <th className="p-3 text-left">Location</th>
                        <th className="p-3 text-left">Verification Status</th>
                        <th className="p-3 text-left">AI Audit Readiness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-150 dark:divide-zinc-800 font-semibold text-surface-850 dark:text-zinc-200">
                      {auditCycleDetails.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-surface-50/50 dark:hover:bg-zinc-900/50">
                          <td className="p-3 font-mono font-bold text-brand-900 dark:text-brand-300">
                            {item.asset?.tag}
                          </td>
                          <td className="p-3 font-bold text-surface-900 dark:text-white">
                            {item.asset?.name}
                          </td>
                          <td className="p-3 text-surface-600 dark:text-zinc-400">
                            {item.asset?.location || "Assigned"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                item.status === "VERIFIED"
                                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200"
                                  : item.status === "MISSING"
                                  ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200"
                                  : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-green-600 dark:text-green-400 font-semibold">
                            Ready for Voice Verification
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-surface-400">
                No active audit cycle selected or cycle has no assets.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: CALL HISTORY & DETAILS ─────────────────────────────────── */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by employee, phone, or purpose..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 h-9 text-xs font-medium text-surface-900 dark:text-white outline-none focus:border-brand-900"
              />
            </div>

            {/* Status Filter */}
            <select
              value={historyStatusFilter}
              onChange={(e) => {
                setHistoryStatusFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-lg px-3 h-9 text-xs font-bold text-surface-700 dark:text-zinc-300 outline-none focus:border-brand-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="INITIATED">Initiated</option>
              <option value="FAILED">Failed</option>
              <option value="NO_ANSWER">No Answer</option>
            </select>

            {/* Purpose Filter */}
            <select
              value={historyPurposeFilter}
              onChange={(e) => {
                setHistoryPurposeFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-lg px-3 h-9 text-xs font-bold text-surface-700 dark:text-zinc-300 outline-none focus:border-brand-900"
            >
              <option value="ALL">All Purposes</option>
              <option value="MAINTENANCE_FOLLOWUP">Maintenance Follow-up</option>
              <option value="ASSET_RETURN_REMINDER">Asset Return Reminder</option>
              <option value="WARRANTY_REMINDER">Warranty Reminder</option>
              <option value="ASSET_AUDIT_VERIFICATION">Asset Audit Verification</option>
              <option value="GENERAL_NOTIFICATION">General Notification</option>
            </select>

            {/* Refresh */}
            <button
              onClick={loadCallHistory}
              className="p-2 border border-surface-300 dark:border-zinc-800 rounded-lg bg-surface-50 dark:bg-zinc-950 text-surface-600 dark:text-zinc-300 hover:bg-surface-100 cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Call Logs Table */}
          <div className="bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            {historyLoading ? (
              <div className="p-12 text-center text-xs text-surface-400">Loading call history...</div>
            ) : historyCalls.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Radio className="w-12 h-12 text-surface-300 dark:text-zinc-700 mx-auto" />
                <h4 className="font-extrabold text-sm uppercase text-surface-900 dark:text-white">
                  No Call Records Found
                </h4>
                <p className="text-xs text-surface-500">
                  Calls initiated by admins or event triggers will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-zinc-800 bg-surface-50 dark:bg-zinc-950 text-[10px] text-surface-500 font-bold uppercase tracking-wider">
                      <th className="p-3 text-left">Employee / Target</th>
                      <th className="p-3 text-left">Phone Number</th>
                      <th className="p-3 text-left">Purpose</th>
                      <th className="p-3 text-left">Related Asset</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Outcome</th>
                      <th className="p-3 text-left">Duration</th>
                      <th className="p-3 text-left">Date & Time</th>
                      <th className="p-3 text-center">Details & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-150 dark:divide-zinc-800 font-semibold text-surface-850 dark:text-zinc-200">
                    {historyCalls.map((call) => (
                      <tr key={call.id} className="hover:bg-surface-50/50 dark:hover:bg-zinc-900/50">
                        <td className="p-3 font-bold text-surface-900 dark:text-white">
                          {call.employee?.name || "Direct Dial"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-brand-900 dark:text-brand-300">
                          {call.toNumber}
                        </td>
                        <td className="p-3 text-surface-600 dark:text-zinc-400">
                          {call.purpose.replace(/_/g, " ")}
                        </td>
                        <td className="p-3">
                          {call.asset ? (
                            <span className="font-mono text-brand-900 dark:text-brand-300 font-bold">
                              {call.asset.tag}
                            </span>
                          ) : (
                            <span className="text-surface-400">--</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              call.status === "COMPLETED"
                                ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200"
                                : call.status === "FAILED"
                                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200"
                                : call.status === "NO_ANSWER"
                                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200"
                                : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200"
                            }`}
                          >
                            {call.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              call.outcome === "VERIFIED"
                                ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200"
                                : call.outcome === "ASSET_MISSING" || call.outcome === "ASSET_DAMAGED"
                                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200"
                                : "bg-surface-100 dark:bg-zinc-800 text-surface-600 dark:text-zinc-400"
                            }`}
                          >
                            {call.outcome || "Pending"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {call.duration ? `${call.duration}s` : "--"}
                        </td>
                        <td className="p-3 text-[11px] text-surface-500 font-mono">
                          {new Date(call.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenCallDetails(call)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-100 dark:bg-zinc-800 hover:bg-surface-200 dark:hover:bg-zinc-700 text-surface-700 dark:text-zinc-300 rounded-lg cursor-pointer transition font-bold"
                            title="View Transcript & Simulate Webhook"
                          >
                            <Eye className="w-3.5 h-3.5" /> View / Test
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CALL DETAILS & WEBHOOK SIMULATION MODAL ───────────────────────── */}
      {showDetailModal && selectedCallDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-zinc-800 bg-surface-50 dark:bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-brand-900 dark:text-brand-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-surface-900 dark:text-white">
                  Call Record, Webhook & Transcript
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-surface-400 hover:text-surface-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Webhook Feedback Toast */}
              {webhookSimMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {webhookSimMessage}
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-surface-200 dark:border-zinc-850">
                <div>
                  <span className="block text-[10px] font-bold text-surface-400 uppercase">Employee</span>
                  <span className="font-bold text-surface-900 dark:text-white">
                    {selectedCallDetail.employee?.name || "Direct Dial"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-surface-400 uppercase">Phone</span>
                  <span className="font-mono font-bold text-brand-900 dark:text-brand-300">
                    {selectedCallDetail.toNumber}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-surface-400 uppercase">Status</span>
                  <span className="font-bold">{selectedCallDetail.status}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-surface-400 uppercase">Duration</span>
                  <span className="font-mono font-bold">
                    {selectedCallDetail.duration ? `${selectedCallDetail.duration}s` : "--"}
                  </span>
                </div>
              </div>

              {/* Outcome Badge */}
              <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-zinc-950 rounded-xl border border-surface-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Verification Outcome</span>
                  <span className="font-extrabold text-sm text-surface-900 dark:text-white">
                    {selectedCallDetail.outcome || "Pending Callback / Result"}
                  </span>
                </div>
                {selectedCallDetail.asset && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-surface-400 block">Target Asset</span>
                    <span className="font-mono font-bold text-brand-900 dark:text-brand-300">
                      {selectedCallDetail.asset.tag} ({selectedCallDetail.asset.name})
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Webhook Simulator Box */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-850 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Test / Simulate OmniDimension Post-Call Webhook
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                  Trigger an instantaneous post-call webhook callback to verify database updates, audit record resolutions, and asset status changes:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateWebhookOutcome(selectedCallDetail.id, "VERIFIED")}
                    disabled={simulatingWebhook}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Simulate Verified (Confirmed)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateWebhookOutcome(selectedCallDetail.id, "ASSET_MISSING")}
                    disabled={simulatingWebhook}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Simulate Asset Missing (Lost)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateWebhookOutcome(selectedCallDetail.id, "ASSET_DAMAGED")}
                    disabled={simulatingWebhook}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Simulate Asset Damaged
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              {selectedCallDetail.summary && (
                <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl space-y-1">
                  <span className="font-extrabold text-[10px] text-brand-900 dark:text-brand-300 uppercase tracking-wider">
                    AI Call Summary & Sentiment ({selectedCallDetail.sentiment || "Neutral"})
                  </span>
                  <p className="text-xs text-surface-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {selectedCallDetail.summary}
                  </p>
                </div>
              )}

              {/* Conversation Transcript */}
              <div className="space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-surface-800 dark:text-zinc-200">
                  Full Conversation Transcript
                </span>
                <div className="bg-surface-50 dark:bg-zinc-950 p-4 rounded-xl border border-surface-200 dark:border-zinc-800 text-xs font-mono whitespace-pre-wrap text-surface-800 dark:text-zinc-300 leading-relaxed max-h-60 overflow-y-auto">
                  {selectedCallDetail.transcript || "No transcript recorded for this call."}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-surface-200 dark:border-zinc-800 bg-surface-50 dark:bg-zinc-950 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-surface-200 dark:bg-zinc-800 text-surface-800 dark:text-zinc-200 font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE CAMPAIGN MODAL ─────────────────────────────────────────── */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-zinc-800 bg-surface-50 dark:bg-zinc-950">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-surface-900 dark:text-white">
                Create AI Call Campaign
              </h3>
              <button
                onClick={() => setShowCreateCampaignModal(false)}
                className="p-1 text-surface-400 hover:text-surface-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[10px] text-surface-700 dark:text-zinc-300 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q1 2026 Laptop Possession Audit"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3 h-10 font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-surface-700 dark:text-zinc-300 mb-1">
                  Campaign Purpose
                </label>
                <select
                  value={campaignPurpose}
                  onChange={(e) => setCampaignPurpose(e.target.value)}
                  className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3 h-10 font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                >
                  <option value="ASSET_AUDIT_VERIFICATION">Asset Audit Possession Verification</option>
                  <option value="ASSET_RETURN_REMINDER">Asset Return Reminder</option>
                  <option value="MAINTENANCE_FOLLOWUP">Maintenance Follow-up Check</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-surface-700 dark:text-zinc-300 mb-1">
                  Target Audit Cycle (Optional)
                </label>
                <select
                  value={campaignAuditId}
                  onChange={(e) => setCampaignAuditId(e.target.value)}
                  className="w-full bg-surface-50 dark:bg-zinc-950 border border-surface-300 dark:border-zinc-800 rounded-xl px-3 h-10 font-bold text-surface-900 dark:text-white outline-none focus:border-brand-900"
                >
                  <option value="">-- All Unverified Employees --</option>
                  {auditCycles.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.name} ({ac.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-4 py-2 bg-surface-200 dark:bg-zinc-800 text-surface-700 dark:text-zinc-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl shadow"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
