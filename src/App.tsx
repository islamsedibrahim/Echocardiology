/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, Activity, Plus, File as FileIcon, ShieldAlert, CheckCircle, Info, Stethoscope, ChevronRight, Download, Eye, Loader2, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { cn } from './lib/utils';

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: "normal" | "mild" | "abnormal";
}

interface Measurement {
  name: string;
  value: number;
  min: number;
  max: number;
  fill: string;
}

interface Report {
  patientContext: string;
  scanType: string;
  findings: Finding[];
  measurements?: Measurement[];
  aiRecommendation: string;
  confidenceScore: number;
  timestamp: string;
}

export default function App() {
  const [patientContext, setPatientContext] = useState("Age 64, Male. History of hypertension, shortness of breath on exertion.");
  const [scanType, setScanType] = useState("Echocardiogram");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const submitAnalysis = async () => {
    if (!fileName) {
      alert("Please upload a CINE loop or select a file for analysis.");
      return;
    }
    
    setIsProcessing(true);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("patientContext", patientContext);
      formData.append("scanType", scanType);
      
      if (file) {
        formData.append("media", file);
      } else {
        formData.append("media", new Blob(["mock video data"], { type: "video/mp4" }), fileName);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reach UltrasoundAI Pipeline via local proxy.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#09090b] text-zinc-100 font-sans min-h-screen flex flex-col overflow-x-hidden relative">
      {/* Background Orbs */}
      <div className="glow-orb bg-cyan-500 w-[600px] h-[600px] -top-[100px] -left-[100px]" />
      <div className="glow-orb bg-rose-500 w-[500px] h-[500px] bottom-0 right-[20%]" />

      <nav className="h-16 shrink-0 border-b border-white/10 flex items-center justify-between px-6 lg:px-8 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center">
              Ultrasound<span className="text-cyan-400">AI</span>
              <span className="text-xs font-mono ml-2 opacity-50 bg-white/10 px-2 py-0.5 rounded">v2.4</span>
            </h1>
          </div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-6"
        >
          <div className="hidden md:flex gap-4 text-sm font-medium text-zinc-400">
            <span className="text-white border-b-2 border-cyan-500 pb-1 cursor-pointer">Diagnostic Center</span>
            <span className="cursor-pointer hover:text-zinc-200 transition-colors">Storage</span>
            <span className="cursor-pointer hover:text-zinc-200 transition-colors">History</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-medium text-zinc-300">Dr. Sarah Jenkins</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white/70" />
            </div>
          </div>
        </motion.div>
      </nav>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* LEFT: Input Form */}
        <motion.aside 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full lg:w-80 flex flex-col gap-4 shrink-0"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-500" />
              Patient Context
            </h2>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Scan Type</label>
                <select 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                  value={scanType}
                  onChange={e => setScanType(e.target.value)}
                >
                  <option value="Echocardiogram" className="bg-zinc-900 text-zinc-200">Echocardiogram</option>
                  <option value="Abdominal" className="bg-zinc-900 text-zinc-200">Abdominal</option>
                  <option value="Obstetric" className="bg-zinc-900 text-zinc-200">Obstetric</option>
                  <option value="Vascular" className="bg-zinc-900 text-zinc-200">Vascular</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">Indications & History</label>
                <textarea 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-cyan-500/50 resize-none h-24"
                  value={patientContext}
                  onChange={e => setPatientContext(e.target.value)}
                  placeholder="Enter patient age, sex, and relevant history..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-cyan-500" />
              Upload Media
            </h2>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="video/*, .dcm" 
              className="hidden" 
            />
            
            <div 
              className={cn(
                "flex-1 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group",
                fileName ? "bg-white/5 border-cyan-500/50" : "hover:bg-white/5 hover:border-white/20"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mb-2">
                    <FileIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="overflow-hidden max-w-full">
                    <span className="text-xs font-medium text-zinc-200 truncate block">{fileName}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 uppercase block">Ready for analysis</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-2 group-hover:bg-cyan-500/20 transition-colors">
                    <Plus className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-zinc-200">Upload DICOM / CINE</span>
                  <span className="text-[10px] text-zinc-500 mt-1 uppercase">MP4, AVI, DCM (Max 500MB)</span>
                </>
              )}
            </div>

            <button 
              onClick={submitAnalysis}
              disabled={isProcessing}
              className={cn(
                "w-full font-bold py-3 rounded-xl text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg",
                isProcessing 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none" 
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_30px_rgba(8,145,178,0.4)]"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ANALYZING
                </>
              ) : (
                <>
                  Run Analysis Pipeline
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.aside>

        {/* RIGHT: Output Dashboard */}
        <section className="flex-1 flex flex-col gap-6 min-w-0">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-8 relative overflow-hidden"
                >
                  <div className="relative w-40 h-40 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                    <div className="absolute w-[200%] h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent left-[-50%] top-1/2 -mt-1 animate-[spin_2s_linear_infinite]" />
                    <div className="w-24 h-24 rounded-full border border-cyan-500/30 border-dashed animate-[spin_4s_linear_infinite_reverse]" />
                    <Activity className="w-8 h-8 text-cyan-400 absolute animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-200 mb-2">MedGemma is analyzing</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Processing spatial features...</p>
                  </div>
                </motion.div>
              ) : report ? (
                <motion.div 
                  key="report"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Pipeline Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-zinc-200">Analysis Complete</span>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">MedGemma Confidence</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-mono text-cyan-400">{Math.round(report.confidenceScore * 100)}%</span>
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: `${Math.round(report.confidenceScore * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center md:col-span-2">
                      <div className="flex justify-between items-center h-full gap-4">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold">Clinical Report Generated</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-zinc-200">{new Date(report.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <Download className="w-4 h-4 text-zinc-300" />
                          </button>
                          <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <Eye className="w-4 h-4 text-zinc-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Panel */}
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-3xl p-6 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-1 focus:outline-none">
                      <Info className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-[10px] text-cyan-500 uppercase font-bold mb-2 tracking-widest">AI Recommendation</h4>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        {report.aiRecommendation}
                      </p>
                    </div>
                  </div>

                  {/* Measurements Chart */}
                  {report.measurements && report.measurements.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Key Measurements</h3>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={report.measurements} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                            <XAxis type="number" stroke="#ffffff50" fontSize={10} tickFormatter={(val) => `${val}`} />
                            <YAxis type="category" dataKey="name" stroke="#ffffff50" fontSize={10} width={80} />
                            <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '12px' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: number, name: string, props: any) => {
                                const { min, max } = props.payload;
                                return [`${value} (Normal: ${min}-${max})`, 'Value'];
                              }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                              {report.measurements.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value < entry.min || entry.value > entry.max ? '#FF3B30' : '#00F0FF'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Findings */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-widest">Severity Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.findings.map((finding, idx) => {
                        const isAbnormal = finding.severity === 'abnormal';
                        const isMild = finding.severity === 'mild';
                        const containerClasses = isAbnormal 
                          ? 'bg-rose-500/5 border-rose-500/20' 
                          : isMild 
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-green-500/5 border-green-500/20';
                            
                        const titleClasses = isAbnormal ? 'text-rose-400' : isMild ? 'text-amber-400' : 'text-green-400';
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={finding.id} 
                            className={cn("border rounded-2xl p-5 flex flex-col justify-between transition-colors hover:bg-white/5", containerClasses)}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={cn("font-bold text-sm tracking-wide", titleClasses)}>{finding.title}</h4>
                                {finding.severity === 'normal' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                {finding.severity === 'mild' && <AlertCircle type="mild" />}
                                {finding.severity === 'abnormal' && <AlertCircle type="abnormal" />}
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                                {finding.description}
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/20",
                                titleClasses
                              )}>
                                {finding.severity}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6 text-zinc-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Awaiting Patient Data</h3>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                    Provide the clinical context and upload the CINE loop on the left to initiate the MedGemma inference pipeline.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </section>
      </main>

      {/* Footer System Bar */}
      <footer className="h-8 shrink-0 bg-zinc-950 border-t border-white/5 px-6 flex items-center justify-between text-[10px] font-mono text-zinc-600 relative z-10 w-full mt-auto">
        <div className="flex gap-4">
          <span>Session: 882-QXA-11</span>
          <span>Node: US-WEST-2-A</span>
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
          <span>Gemma-2-9B-PT Inference Engine Connected</span>
        </div>
      </footer>
    </div>
  );
}

function AlertCircle({ type }: { type: 'mild' | 'abnormal'}) {
  const isMild = type === 'mild';
  return (
    <div className={cn(
      "w-5 h-5 flex items-center justify-center",
      isMild ? "text-amber-500" : "text-rose-500"
    )}>
      <ShieldAlert className="w-full h-full" />
    </div>
  )
}
