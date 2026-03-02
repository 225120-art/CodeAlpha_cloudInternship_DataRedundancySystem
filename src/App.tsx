import React, { useState, useEffect } from "react";
import { 
  Database, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  Info,
  Layers,
  Cloud,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Record {
  id: number;
  content: string;
  hash: string;
  created_at: string;
}

interface IngestResult {
  unique: number;
  redundant: number;
  errors: number;
  details: { status: string; hash: string }[];
}

export default function App() {
  const [records, setRecords] = useState<Record[]>([]);
  const [inputData, setInputData] = useState("");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showArch, setShowArch] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/records");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch records", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleIngest = async () => {
    if (!inputData.trim()) return;
    setLoading(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(inputData);
      } catch (e) {
        alert("Invalid JSON format");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed }),
      });
      const data = await res.json();
      setResult(data);
      fetchRecords();
    } catch (err) {
      console.error("Ingestion failed", err);
    } finally {
      setLoading(false);
    }
  };

  const clearRecords = async () => {
    if (!confirm("Are you sure you want to clear all records?")) return;
    await fetch("/api/records", { method: "DELETE" });
    fetchRecords();
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2 uppercase">
            <Database className="w-6 h-6" />
            Cloud Dedupe
          </h1>
          <p className="text-xs opacity-60 font-mono mt-1">v1.0.0 // REDUNDANCY REMOVAL SYSTEM</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowArch(!showArch)}
            className="px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-xs font-mono flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            {showArch ? "HIDE ARCHITECTURE" : "VIEW ARCHITECTURE"}
          </button>
          <button 
            onClick={clearRecords}
            className="px-4 py-2 border border-[#141414] hover:bg-red-600 hover:text-white transition-colors text-xs font-mono flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            PURGE DB
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Architecture Overlay */}
        <AnimatePresence>
          {showArch && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:col-span-12 bg-[#141414] text-[#E4E3E0] p-8 rounded-sm mb-6"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-serif italic uppercase tracking-widest">System Architecture</h2>
                <button onClick={() => setShowArch(false)} className="opacity-50 hover:opacity-100">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Cloud className="w-5 h-5" />
                    <span className="font-mono text-sm">INGESTION LAYER</span>
                  </div>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Incoming data via API Gateway (AWS) or Load Balancer. Validated for schema integrity before processing.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-mono text-sm">VALIDATION LAYER</span>
                  </div>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Cryptographic hashing (SHA-256) creates a unique fingerprint. Bloom filters or indexed lookups check for existing hashes.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Database className="w-5 h-5" />
                    <span className="font-mono text-sm">STORAGE LAYER</span>
                  </div>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Unique records persisted to RDS/Cloud SQL. Redundant entries logged but discarded to optimize storage efficiency.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4 overflow-x-auto pb-2">
                <span className="text-[10px] font-mono opacity-40">WORKFLOW:</span>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="px-2 py-1 bg-white/5 text-[10px] font-mono">RAW DATA</span>
                  <ArrowRight className="w-3 h-3 opacity-30" />
                  <span className="px-2 py-1 bg-white/5 text-[10px] font-mono">NORMALIZE</span>
                  <ArrowRight className="w-3 h-3 opacity-30" />
                  <span className="px-2 py-1 bg-white/5 text-[10px] font-mono">HASH (SHA-256)</span>
                  <ArrowRight className="w-3 h-3 opacity-30" />
                  <span className="px-2 py-1 bg-white/5 text-[10px] font-mono">DB LOOKUP</span>
                  <ArrowRight className="w-3 h-3 opacity-30" />
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">APPEND UNIQUE</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Section */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif italic text-sm uppercase tracking-widest flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Data Ingestion
              </h3>
              <span className="text-[10px] font-mono opacity-50">JSON FORMAT REQUIRED</span>
            </div>
            <textarea 
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='[{"name": "John", "id": 1}, {"name": "John", "id": 1}]'
              className="w-full h-64 bg-[#F5F5F5] border border-[#141414] p-4 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#141414] resize-none"
            />
            <button 
              onClick={handleIngest}
              disabled={loading}
              className="w-full mt-4 bg-[#141414] text-[#E4E3E0] py-3 text-xs font-mono hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "PROCESSING..." : "VALIDATE & INGEST"}
            </button>
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414]"
            >
              <h3 className="font-serif italic text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Ingestion Result
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-white/10 p-4">
                  <p className="text-[10px] font-mono opacity-50 uppercase">Unique</p>
                  <p className="text-2xl font-bold text-emerald-400">{result.unique}</p>
                </div>
                <div className="border border-white/10 p-4">
                  <p className="text-[10px] font-mono opacity-50 uppercase">Redundant</p>
                  <p className="text-2xl font-bold text-red-400">{result.redundant}</p>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {result.details.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 py-1">
                    <span className="opacity-40 truncate w-32">{d.hash}</span>
                    <span className={d.status === "unique" ? "text-emerald-400" : "text-red-400"}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* Database View */}
        <section className="lg:col-span-7">
          <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] h-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-[#F9F9F9]">
              <h3 className="font-serif italic text-sm uppercase tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4" />
                Verified Records
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-mono opacity-50 uppercase leading-none">Total Unique</p>
                  <p className="text-lg font-bold leading-none">{records.length}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <Info className="w-12 h-12 mb-4" />
                  <p className="font-mono text-xs uppercase tracking-widest">Database is empty</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#F9F9F9] border-b border-[#141414] z-10">
                    <tr>
                      <th className="text-[10px] font-mono text-left p-4 uppercase opacity-50 font-normal">ID</th>
                      <th className="text-[10px] font-mono text-left p-4 uppercase opacity-50 font-normal">Content</th>
                      <th className="text-[10px] font-mono text-left p-4 uppercase opacity-50 font-normal">Fingerprint</th>
                      <th className="text-[10px] font-mono text-left p-4 uppercase opacity-50 font-normal">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-[#EEE] hover:bg-[#F5F5F5] transition-colors group">
                        <td className="p-4 font-mono text-[10px]">{record.id}</td>
                        <td className="p-4 font-mono text-[10px] truncate max-w-[200px]">{record.content}</td>
                        <td className="p-4 font-mono text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                          {record.hash.substring(0, 12)}...
                        </td>
                        <td className="p-4 font-mono text-[10px] opacity-40">
                          {new Date(record.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer / Tech Stack */}
      <footer className="p-6 border-t border-[#141414] mt-12 grid grid-cols-1 md:grid-cols-4 gap-8 opacity-60">
        <div>
          <h4 className="text-[10px] font-mono uppercase font-bold mb-2">Tech Stack</h4>
          <ul className="text-[10px] font-mono space-y-1">
            <li>Frontend: React 19 + Tailwind 4</li>
            <li>Backend: Node.js + Express</li>
            <li>Database: SQLite (Demo) / RDS (Prod)</li>
            <li>Logic: SHA-256 Fingerprinting</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase font-bold mb-2">Detection Logic</h4>
          <p className="text-[10px] font-mono leading-relaxed">
            Data is normalized by sorting object keys before hashing. This ensures that identical JSON objects with different key orders are correctly identified as redundant.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase font-bold mb-2">Cloud Scaling</h4>
          <p className="text-[10px] font-mono leading-relaxed">
            For high-volume streams, implement a Redis-based Bloom Filter as a pre-check layer to reduce database lookup latency.
          </p>
        </div>
        <div className="flex flex-col justify-end items-end">
          <p className="text-[10px] font-mono">© 2026 CLOUD SOLUTIONS ARCHITECT</p>
          <p className="text-[10px] font-mono">SECURE DATA PIPELINE</p>
        </div>
      </footer>
    </div>
  );
}
