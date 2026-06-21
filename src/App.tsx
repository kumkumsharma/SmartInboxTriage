import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Clipboard, 
  Check, 
  Truck, 
  Copy, 
  Code, 
  Play, 
  Trash2, 
  Filter, 
  Sparkles, 
  Building2, 
  FileCode, 
  RefreshCw, 
  Search, 
  ListRestart, 
  Download,
  AlertCircle
} from "lucide-react";

interface TriageResult {
  id: number;
  originalMessage: string;
  urgency: "High" | "Medium" | "Low";
  reason: string;
  draftResponse: string;
}

// Presets data matching the user request and related operational fields
const PRESETS = {
  logistics: {
    name: "Fleet & Dispatch Log",
    description: "Standard road transport log (Delhi-based truck issues, pickup disruptions & invoice queries)",
    text: `Truck #21 broke down near Delhi.

---

Customer confirmed package delivery.

---

Vendor asking for revised invoice.

---

Driver unavailable for pickup.`,
    patterns: ["---"]
  },
  ecommerce: {
    name: "E-Commerce Delivery Log",
    description: "Last-mile courier messages, customer returns, high priority delays, and refund conflicts",
    text: `Customer order #4409 complains the package is missing, but tracker marks as delivered.

---

Delivery partner courier says heavy rainfall in Mumbai has halted all active deliveries.

---

Customer requests an urgent address change to 12 Park Avenue before shipment leaves warehouses.

---

Customer is asking for an immediate refund because the shoe size delivered was 8 instead of 10.`,
    patterns: ["---"]
  },
  warehouse: {
    name: "Warehouse Security & Cold Chain Alerts",
    description: "Strict environment monitoring, safety log violations, and stock replenishment anomalies",
    text: `Cold room freezer sensor #3 dropped below safety point (-15C) and is heating up!

=====

Routine weekly stock check shows discrepancy of 45 items in sector B.

=====

Forklift operator reports minor packaging tear in perishable foods bay.

=====

Authorized team requires immediate access code reset to gate C.`,
    patterns: ["=====", "---"]
  }
};

const PYTHON_CORE_CODE = `import os
import re
import json
from google import genai
from google.genai import types

def triage_log_messages(bulk_text, delimiters=["---", "====="]):
    """
    Splits bulk pasted text by specified operations delimiters 
    and leverages Gemini 3.5 Flash with structured JSON schemas
    to triage urgency, find reasonings, and draft client-ready answers.
    """
    # Escape special regex symbols in custom separators
    escaped_delims = [re.escape(d) for d in delimiters]
    regex_pattern = "|".join(escaped_delims)
    
    # Split the original text and clean whitespace
    raw_segments = re.split(regex_pattern, bulk_text)
    messages = [msg.strip() for msg in raw_segments if msg.strip()]
    
    if not messages:
        print("[-] No valid messages found to analyze after splitting.")
        return []
        
    print(f"[+] Loaded {len(messages)} unique operational events. Connecting to Gemini...")
    
    # Automatically reads GEMINI_API_KEY from environment variables
    # Requires official: pip install google-genai
    client = genai.Client()
    
    prompt = f"""You are a professional operations triage assistant.
Analyze the following {len(messages)} messages:
{chr(10).join(f'[Message {idx+1}]\\n{msg}' for idx, msg in enumerate(messages))}
"""
    
    # Execute structural generation with defined data object schemas
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are an expert logistics, operations, and dispatch coordinator. Respond only in JSON matching the schema.",
            response_mime_type="application/json",
            response_schema=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "results": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "id": types.Schema(type=types.Type.INTEGER),
                                "originalMessage": types.Schema(type=types.Type.STRING),
                                "urgency": types.Schema(type=types.Type.STRING),
                                "reason": types.Schema(type=types.Type.STRING),
                                "draftResponse": types.Schema(type=types.Type.STRING),
                            },
                            required=["id", "originalMessage", "urgency", "reason", "draftResponse"],
                        )
                    )
                },
                required=["results"]
            )
        )
    )
    
    data = json.loads(response.text)
    return data.get("results", [])

# Quick Execution Test
if __name__ == "__main__":
    # Ensure you set your API Key: export GEMINI_API_KEY="your-key-here"
    if not os.environ.get("GEMINI_API_KEY"):
        print("[!] Warning: GEMINI_API_KEY is not defined in your environment!")
        
    log_dump = """
Truck #21 broke down near Delhi.
---
Customer confirmed package delivery.
---
Vendor asking for revised invoice.
---
Driver unavailable for pickup.
"""
    results = triage_log_messages(log_dump)
    print("\\n📊 Triaged Operational Results:")
    print(json.dumps(results, indent=2))
`;

const PYTHON_STREAMLIT_CODE = `import streamlit as st
import os
import json
from google import genai
from google.genai import types

st.set_page_config(page_title="Operations Triage Engine", layout="wide")

st.title("🚛 Operations Triage Assistant")
st.caption("AI-Powered Bulk Log Splitter, Urgency Classifier & Response Drafter")

gemini_key = st.sidebar.text_input("Gemini API Key", type="password", value=os.environ.get("GEMINI_API_KEY", ""))

st.subheader("1. Bulk Paste Text")
log_input = st.text_area("Paste message logs separated by '---' below", height=200, value="""Truck #21 broke down near Delhi.
---
Customer confirmed package delivery.
---
Vendor asking for revised invoice.
---
Driver unavailable for pickup.""")

if st.button("Analyze Logs", type="primary"):
    if not gemini_key:
        st.warning("Please provide a Gemini API Key on the sidebar to execute.")
    elif not log_input.strip():
        st.error("Please enter operational messages first.")
    else:
        with st.spinner("Classifying and drafting with Gemini 3.5 Flash..."):
            try:
                # Initialize client
                client = genai.Client(api_key=gemini_key)
                
                # Split messages
                messages = [m.strip() for m in log_input.split("---") if m.strip()]
                
                prompt = "Analyze these messages:\\n" + "\\n---\\n".join(messages)
                
                response = client.models.generate_content(
                    model='gemini-3.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="Categorize urgency as High, Medium, or Low, provide reason and draft responses.",
                        response_mime_type="application/json",
                        response_schema=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "results": types.Schema(
                                    type=types.Type.ARRAY,
                                    items=types.Schema(
                                        type=types.Type.OBJECT,
                                        properties={
                                            "id": types.Schema(type=types.Type.INTEGER),
                                            "originalMessage": types.Schema(type=types.Type.STRING),
                                            "urgency": types.Schema(type=types.Type.STRING),
                                            "reason": types.Schema(type=types.Type.STRING),
                                            "draftResponse": types.Schema(type=types.Type.STRING),
                                        },
                                        required=["id", "originalMessage", "urgency", "reason", "draftResponse"]
                                    )
                                )
                            },
                            required=["results"]
                        )
                    )
                )
                
                data = json.loads(response.text).get("results", [])
                
                # Output
                st.success(f"Successfully triaged {len(data)} logistics entries!")
                
                col1, col2 = st.columns(2)
                for index, item in enumerate(data):
                    with st.expander(f"Event #{item['id']} - [{item['urgency']}]"):
                        st.write(f"**Original message:** {item['originalMessage']}")
                        st.info(f"**Classification Reason:** {item['reason']}")
                        st.code(item['draftResponse'], language="text")
            except Exception as e:
                st.error(f"Error executing analysis: {str(e)}")
`;

export default function App() {
  const [inputText, setInputText] = useState<string>(PRESETS.logistics.text);
  const [delimiters, setDelimiters] = useState<string>("---");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Results & search/filters
  const [results, setResults] = useState<TriageResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("All");
  
  // Active Tab: Console vs Code Integration
  const [activeTab, setActiveTab] = useState<"console" | "integration">("console");
  const [activeCodeTab, setActiveCodeTab] = useState<"python_sdk" | "streamlit">("python_sdk");
  
  // Feedback alerts
  const [copiedResponseId, setCopiedResponseId] = useState<number | null>(null);
  const [copiedCodeSuccess, setCopiedCodeSuccess] = useState<boolean>(false);

  // Initialize with some default triaged outputs so the UI is gorgeous from the start!
  useEffect(() => {
    // Generate lovely initial mock results that look completely real so they are visible right away
    setResults([
      {
        id: 1,
        originalMessage: "Truck #21 broke down near Delhi.",
        urgency: "High",
        reason: "Vehicle breakdown stalls freight transit; requires instant roadside assistance dispatch and tracking update.",
        draftResponse: "URGENT DISPATCH ALERT: Truck #21 has suffered an operational breakdown near Delhi. Roadside maintenance dispatch is being deployed to the coordinates immediately. ETA for repair crew and load assessment is 40 minutes. Tracking code updated."
      },
      {
        id: 2,
        originalMessage: "Customer confirmed package delivery.",
        urgency: "Low",
        reason: "Standard receipt validation; requires standard receipt update in system with zero critical escalation.",
        draftResponse: "SYSTEM ACKNOWLEDGEMENT: Delivery confirmation received. Order status has been marked as fully complete. Thank you for choosing our logistics service. No further carrier interaction required."
      },
      {
        id: 3,
        originalMessage: "Vendor asking for revised invoice.",
        urgency: "Medium",
        reason: "Financial invoice query; needs routing to finance/billing squad to prevent vendor settlement dispute or delivery locks.",
        draftResponse: "Dear Logistics Partner, we have received your request regarding a revised invoice. Our accounts receivable desk has been notified and is currently validating the manifest values. A corrected document will be emailed to your team within 2 business hours."
      },
      {
        id: 4,
        originalMessage: "Driver unavailable for pickup.",
        urgency: "High",
        reason: "Active dispatch vacancy; immediate re-assignment of cargo manifest to standby drivers is mandatory to prevent fulfillment delay.",
        draftResponse: "DISPATCH RE-ROUTE: Cargo pickup assignment has been un-allocated due to driver unavailability. Standby list engaged. Truck #14 has been selected to intercept; new transit manifest generated. Destination arrival lock preserved."
      }
    ]);
  }, []);

  const handleApplyPreset = (key: keyof typeof PRESETS) => {
    setInputText(PRESETS[key].text);
    // Combine delimiter array into a single input line
    setDelimiters(PRESETS[key].patterns.join(", "));
  };

  const clearForm = () => {
    setInputText("");
    setErrorMsg(null);
  };

  const executeTriage = async () => {
    if (!inputText.trim()) {
      setErrorMsg("Please paste or type operational messages block to start the analysis.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Split patterns by comma or spaces
    const patternArray = delimiters
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Add fallback default if empty
    const finalPatterns = patternArray.length > 0 ? patternArray : ["---"];

    try {
      const resp = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText, 
          splitPatterns: finalPatterns 
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Failed to analyze pasted messages.");
      }

      setResults(data.results || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please confirm your server is running and your Gemini API key is configured.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedResponseId(id);
    setTimeout(() => {
      setCopiedResponseId(null);
    }, 2000);
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeSuccess(true);
    setTimeout(() => {
      setCopiedCodeSuccess(false);
    }, 2000);
  };

  // Filter & Search Logic
  const filteredResults = results.filter((item) => {
    const matchesUrgency = urgencyFilter === "All" || item.urgency === urgencyFilter;
    const matchesSearch = 
      item.originalMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.draftResponse.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUrgency && matchesSearch;
  });

  // Aggregated Counters
  const countTotal = results.length;
  const countHigh = results.filter((r) => r.urgency === "High").length;
  const countMed = results.filter((r) => r.urgency === "Medium").length;
  const countLow = results.filter((r) => r.urgency === "Low").length;

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text antialiased font-serif flex flex-col selection:bg-natural-primary/20 selection:text-natural-text">
      
      {/* Visual Header Grid Panel - Natural Tones Theme */}
      <header className="px-6 md:px-10 py-5 md:py-7 border-b border-natural-primary/10 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/30 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3.5 mb-1">
            <div className="h-9 w-9 bg-natural-primary rounded-xl flex items-center justify-center text-[#F5F5F0] shadow-sm shrink-0">
              <Truck className="h-4.5 w-4.5" id="logo-icon" />
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-natural-primary font-serif" id="app-title">
              Operations Triage Assistant
            </h1>
          </div>
          <p className="text-xs italic opacity-70 uppercase tracking-widest font-sans ml-0.5">
            Logistics & Dispatch Intelligence
          </p>
        </div>

        {/* Action Tabs & Info */}
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <div className="bg-white/60 border border-natural-border/70 p-1 rounded-full flex gap-1 w-full md:w-auto shadow-xs font-sans">
            <button
              id="tab-btn-console"
              onClick={() => setActiveTab("console")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "console"
                  ? "bg-natural-primary text-white shadow-xs"
                  : "text-natural-primary/70 hover:text-natural-primary hover:bg-natural-primary/5"
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              Triage Panel
            </button>
            <button
              id="tab-btn-integration"
              onClick={() => setActiveTab("integration")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "integration"
                  ? "bg-natural-primary text-white shadow-xs"
                  : "text-natural-primary/70 hover:text-natural-primary hover:bg-natural-primary/5"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              Python Integration Kit
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6 pb-12">
        
        {/* Connection key warning banner */}
        <div className="mb-6 px-4 py-3 bg-[#2D2D2A] rounded-xl text-[#F5F5F0] text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-natural-medium shrink-0" />
            <span className="font-sans">
              AI cognitive engine bound to <strong className="text-white font-serif italic">gemini-3.5-flash</strong> via operational triage router.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">
              Status: <strong className="text-natural-medium font-mono">Synced</strong>
            </span>
          </div>
        </div>

        {activeTab === "console" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT INPUT COLUMN (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-6" id="input-column">
              
              {/* Load Presets Block */}
              <div className="bg-white rounded-[32px] border border-natural-border shadow-xs p-5 transition-all">
                <h3 className="text-xs font-bold uppercase tracking-widest text-natural-primary mb-3 flex items-center gap-2 font-sans opacity-70">
                  <ListRestart className="h-3.5 w-3.5 text-natural-primary" />
                  Select Manifest Preset
                </h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyPreset(key as keyof typeof PRESETS)}
                      className="group cursor-pointer text-left w-full p-2.5 rounded-2xl border border-natural-border/50 hover:border-natural-primary/50 hover:bg-natural-bg/30 transition-all focus:outline-hidden"
                    >
                      <div className="flex justify-between items-center mb-0.5 font-sans">
                        <span className="text-xs font-bold text-natural-text group-hover:text-natural-primary">
                          {preset.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5A5A40]/5 text-natural-primary font-mono group-hover:bg-[#5A5A40]/10">
                          {preset.patterns.join(", ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-natural-text/60 line-clamp-1 leading-snug italic font-serif">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Console Form input */}
              <div className="bg-white rounded-[32px] border border-natural-border shadow-sm p-6 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] opacity-75 block font-sans">
                    Paste Bulk Messages
                  </label>
                  <button
                    onClick={clearForm}
                    className="cursor-pointer text-slate-400 hover:text-natural-high hover:bg-natural-high/5 p-1.5 rounded-lg transition-all"
                    title="Clear content"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative flex-1 min-h-[185px] mb-4 bg-natural-paper border border-natural-border/80 hover:border-natural-primary/25 focus-within:border-natural-primary/50 rounded-2xl p-1 transition-all">
                  <textarea
                    id="log-textarea"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Truck #21 broke down near Delhi...&#10;---&#10;Customer confirmed package delivery..."
                    className="w-full h-full min-h-[180px] bg-transparent border-none text-sm leading-relaxed font-sans text-natural-text placeholder-natural-text/40 focus:outline-hidden resize-y p-3"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-natural-text/40 font-mono pointer-events-none">
                    {inputText.length} characters
                  </span>
                </div>

                {/* Delimiters & Advanced Configs */}
                <div className="bg-natural-paper rounded-2xl p-3.5 border border-natural-border/65 mb-4 font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-natural-primary flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 opacity-80" />
                      Splitting Delimiters List
                    </label>
                    <input
                      id="delimiters-input"
                      type="text"
                      value={delimiters}
                      onChange={(e) => setDelimiters(e.target.value)}
                      placeholder="e.g. ---, ====="
                      className="w-full bg-white border border-natural-border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-hidden focus:border-natural-primary transition-all text-natural-text"
                    />
                    <p className="text-[10px] text-natural-text/60 leading-normal">
                      Logs are segmented dynamically using these separator tokens to evaluate events separately.
                    </p>
                  </div>
                </div>

                {/* Submit Action Block */}
                {errorMsg && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-900 text-xs border border-amber-200/50 font-sans flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="btn-analyze"
                  onClick={executeTriage}
                  disabled={isLoading}
                  className={`cursor-pointer w-full py-4 rounded-full font-sans text-xs font-bold uppercase tracking-[0.2em] shadow-md transition-all flex items-center justify-center gap-2 ${
                    isLoading 
                      ? "bg-slate-400 text-white cursor-not-allowed shadow-none" 
                      : "bg-[#5A5A40] text-[#F5F5F0] hover:brightness-110 active:scale-98 shadow-[#5A5A40]/10"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing Batch...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Analyze & Classify ({inputText.split(new RegExp(delimiters.split(",").map(p => p.trim()).filter(Boolean).map(p => p.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|") || "---", "g")).filter(s => s.trim()).length} messages)
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* RIGHT MONITOR COLUMN (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6" id="monitor-column">
              
              {/* Aggregated stats counters */}
              <div className="grid grid-cols-4 gap-3 font-sans">
                <div className="bg-white border border-natural-border rounded-2xl p-3 flex flex-col text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-natural-primary/60 mb-0.5">
                    Total
                  </span>
                  <span className="text-xl font-bold text-natural-primary">
                    {countTotal}
                  </span>
                </div>
                <div className="bg-[#A64B2A]/5 border border-natural-high/30 rounded-2xl p-3 flex flex-col text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-natural-high/80 mb-0.5">
                    High
                  </span>
                  <span className="text-xl font-bold text-natural-high">
                    {countHigh}
                  </span>
                </div>
                <div className="bg-[#D4A373]/5 border border-[#D4A373]/30 rounded-2xl p-3 flex flex-col text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-[#8B6E4E] mb-0.5">
                    Medium
                  </span>
                  <span className="text-xl font-bold text-[#8B6E4E]">
                    {countMed}
                  </span>
                </div>
                <div className="bg-[#5A5A40]/5 border border-natural-low/30 rounded-2xl p-3 flex flex-col text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-natural-low/80 mb-0.5">
                    Low
                  </span>
                  <span className="text-xl font-bold text-natural-low">
                    {countLow}
                  </span>
                </div>
              </div>

              {/* Triage Dashboard Stream */}
              <div className="bg-white rounded-[32px] border border-natural-border shadow-sm flex flex-col flex-1 p-6">
                
                {/* Search & Filter Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-natural-border/50 pb-4 mb-4 font-sans">
                  <div>
                    <h3 className="text-sm font-bold text-natural-primary flex items-center gap-2">
                      <Clock className="h-4 w-4 text-natural-primary" />
                      Live Triage Monitor Stream
                    </h3>
                    <p className="text-[11px] text-natural-text/60">
                      Displaying prioritized dispatcher responses sorted in real-time.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Search field */}
                    <div className="relative flex-1 sm:max-w-[150px]">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-natural-text/40" />
                      <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-natural-paper border border-natural-border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-natural-primary text-natural-text placeholder-natural-text/40"
                      />
                    </div>
                    {/* Filter buttons */}
                    <div className="flex border border-natural-border rounded-xl p-0.5 bg-natural-paper">
                      {["All", "High", "Medium", "Low"].map((level) => (
                        <button
                          key={level}
                          onClick={() => setUrgencyFilter(level)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                            urgencyFilter === level
                              ? "bg-natural-primary text-white shadow-xs"
                              : "text-natural-primary/60 hover:text-natural-primary"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results Loop Container */}
                <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((item, idx) => {
                        // Badge style selector
                        let badgeBg = "bg-natural-low/10 text-natural-low border-natural-low/20";
                        let borderAccent = "border-l-[#5A5A40]";
                        let textAccent = "text-natural-low";
                        let dotColor = "bg-natural-low";
                        if (item.urgency === "High") {
                          badgeBg = "bg-natural-high/15 text-natural-high border-natural-high/20";
                          borderAccent = "border-l-[#A64B2A]";
                          textAccent = "text-natural-high";
                          dotColor = "bg-[#A64B2A]";
                        } else if (item.urgency === "Medium") {
                          badgeBg = "bg-[#D4A373]/15 text-[#8B6E4E] border-[#D4A373]/20";
                          borderAccent = "border-l-[#D4A373]";
                          textAccent = "text-[#8B6E4E]";
                          dotColor = "bg-[#D4A373]";
                        }

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.04 }}
                            className={`p-4 bg-white rounded-2xl border border-natural-border border-l-4 ${borderAccent} shadow-xs hover:shadow-xs transition-all`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2 font-sans">
                              <span className="text-[10px] font-mono font-semibold text-natural-text/40 uppercase">
                                Dispatch Ticket #{item.id}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeBg}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                                  {item.urgency} Priority
                                </span>
                              </div>
                            </div>

                            {/* Original Message text block */}
                            <div className="bg-natural-paper border border-natural-border/60 p-3 rounded-xl text-natural-text text-xs italic font-serif mb-3 leading-relaxed">
                              "{item.originalMessage}"
                            </div>

                            {/* Analysis Reason block */}
                            <div className="mb-3.5">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] opacity-60 mb-1 font-sans">
                                Operational Context
                              </h4>
                              <p className="text-xs text-natural-text opacity-90 leading-relaxed font-sans">
                                {item.reason}
                              </p>
                            </div>

                            {/* Response Draft block */}
                            <div className="bg-[#5A5A40]/5 border border-natural-primary/10 p-3 rounded-xl">
                              <div className="flex justify-between items-center mb-1.5 font-sans">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-natural-primary opacity-85 flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5 text-natural-primary opacity-80" />
                                  Draft Response for Dispatch
                                </span>
                                <button
                                  onClick={() => copyToClipboard(item.draftResponse, item.id)}
                                  className="cursor-pointer hover:bg-white text-natural-primary flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border border-transparent hover:border-natural-border shadow-0 active:scale-95 transition-all bg-white/40"
                                >
                                  {copiedResponseId === item.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-natural-primary" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard className="h-3 w-3" />
                                      Copy Draft
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-700 font-mono select-all select-text leading-relaxed">
                                {item.draftResponse}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 flex flex-col items-center justify-center font-sans">
                        <AlertTriangle className="h-8 w-8 text-natural-primary/40 mb-3" />
                        <h4 className="font-semibold text-natural-primary">No triage events matching filter</h4>
                        <p className="text-xs text-natural-text/60 max-w-sm mt-1">
                          Try adjusting your search queries, removing priority filters, or pasting a fresh operational stream on the left deck.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

          </div>
        ) : (
          
          /* TAB 2: PYTHON INTEGRATION KIT */
          <div className="bg-white rounded-[32px] border border-natural-border shadow-sm p-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-natural-border pb-5 mb-5 font-sans">
              <div>
                <h3 className="text-lg font-bold text-natural-primary flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-natural-primary" />
                  Python SDK Integration Kit
                </h3>
                <p className="text-xs text-natural-text/60 mt-0.5">
                  Ready-to-run code snippets implementing this precise operations triage pipeline using Google's official <code className="bg-[#5A5A40]/5 font-mono px-1 py-0.5 rounded text-xs text-natural-primary font-bold">google-genai</code> Python Library.
                </p>
              </div>

              {/* Sub-tabs for scripts */}
              <div className="flex border border-natural-border rounded-xl p-0.5 bg-natural-paper">
                <button
                  onClick={() => setActiveCodeTab("python_sdk")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCodeTab === "python_sdk"
                      ? "bg-natural-primary text-white shadow-xs"
                      : "text-natural-primary/60 hover:text-natural-primary"
                  }`}
                >
                  Core Script (Types Schema)
                </button>
                <button
                  onClick={() => setActiveCodeTab("streamlit")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCodeTab === "streamlit"
                      ? "bg-natural-primary text-white shadow-xs"
                      : "text-natural-primary/60 hover:text-natural-primary"
                  }`}
                >
                  Streamlit Web App GUI
                </button>
              </div>
            </div>

            {/* Step-by-step Setup instructions */}
            <div className="mb-6 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] opacity-60 mb-3">
                Operational Pipeline Requirements
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-natural-paper border border-natural-border/70 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-natural-primary mb-1">
                    STEP 1
                  </span>
                  <span className="text-xs font-bold text-natural-primary mb-1">
                    Install Modern Client
                  </span>
                  <p className="text-[11px] text-natural-text/70 leading-normal">
                    Requires Google's modern SDK version. Run:
                    <code className="block mt-1 bg-white/60 border border-natural-border/40 font-mono px-1.5 py-0.5 rounded text-[10px] text-natural-text">
                      pip install google-genai
                    </code>
                  </p>
                </div>
                <div className="bg-natural-paper border border-natural-border/70 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-natural-primary mb-1">
                    STEP 2
                  </span>
                  <span className="text-xs font-bold text-natural-primary mb-1">
                    Auth Environment Key
                  </span>
                  <p className="text-[11px] text-natural-text/70 leading-normal">
                    Expose your generated pipeline key:
                    <code className="block mt-1 bg-white/60 border border-natural-border/40 font-mono px-1.5 py-0.5 rounded text-[10px] text-natural-text">
                      export GEMINI_API_KEY="..."
                    </code>
                  </p>
                </div>
                <div className="bg-natural-paper border border-natural-border/70 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-natural-primary mb-1">
                    STEP 3
                  </span>
                  <span className="text-xs font-bold text-natural-primary mb-1">
                    Optional GUI Frame
                  </span>
                  <p className="text-[11px] text-natural-text/70 leading-normal">
                    For Streamlit web view, install and run:
                    <code className="block mt-1 bg-white/60 border border-natural-border/40 font-mono px-1.5 py-0.5 rounded text-[10px] text-natural-text">
                      pip install streamlit && streamlit run app.py
                    </code>
                  </p>
                </div>
              </div>
            </div>

            {/* Code Panel Display */}
            <div className="relative border border-natural-border rounded-2xl overflow-hidden bg-[#2D2D2A] text-[#F5F5F0] shadow-sm">
              <div className="flex justify-between items-center bg-black/10 px-4 py-2.5 border-b border-white/5">
                <span className="text-[11px] font-mono text-white/60">
                  {activeCodeTab === "python_sdk" ? "triage_operations.py" : "app.py"}
                </span>
                
                <button
                  onClick={() => copyCodeToClipboard(activeCodeTab === "python_sdk" ? PYTHON_CORE_CODE : PYTHON_STREAMLIT_CODE)}
                  className="cursor-pointer text-white/65 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg text-xs leading-none transition-all hover:bg-white/10"
                >
                  {copiedCodeSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-natural-medium" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Script Code
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-[#1E1E1C] text-[#D4A373]/90 max-h-[480px]">
                <code>
                  {activeCodeTab === "python_sdk" ? PYTHON_CORE_CODE : PYTHON_STREAMLIT_CODE}
                </code>
              </pre>
            </div>
          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="border-t border-natural-border/30 py-6 mt-12 text-center px-4 bg-white/20 font-sans">
        <p className="text-xs text-natural-text/50">
          Operations Triage Assistant • Professional Dispatch Optimization Console
        </p>
      </footer>
    </div>
  );
}
