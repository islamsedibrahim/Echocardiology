import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, CheckCircle, FileUp, HeartPulse, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import { cn } from '../lib/utils';
import { ecgPoints, pvLoopPoints, TwinReport, validationGates } from '../twin';

interface Props {
  echoLvef: number | null;
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
      <p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p>
      <p className={cn('text-xl font-mono mt-1', accent ?? 'text-zinc-100')}>
        {value}
        {unit && <span className="text-xs text-zinc-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

const fmt = (v: number | null | undefined, d = 1) => (v == null || Number.isNaN(v) ? '-' : v.toFixed(d));

export default function DigitalTwinPanel({ echoLvef }: Props) {
  const [twin, setTwin] = useState<TwinReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const res = await fetch('/api/twin/report');
      const data = await res.json();
      if (data.success && data.report) {
        setTwin(data.report);
        setError(null);
      }
    } catch {
      setError('Dashboard server not reachable.');
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const report = JSON.parse(await f.text()) as TwinReport;
      setTwin(report);
      setError(null);
      await fetch('/api/twin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch {
      setError('Not a valid cardiosolv_report.json');
    }
  };

  const m = twin?.hemodynamics?.metrics;
  const ep = twin?.electrophysiology?.metrics;
  const geo = twin?.geometry?.metrics;
  const pv = pvLoopPoints(twin);
  const ecg = ecgPoints(twin);
  const leads = ecg.length ? Object.keys(ecg[0]).filter((k) => k !== 't') : [];
  const gates = validationGates(twin, echoLvef);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-200">CardioSolv Digital Twin</h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              {twin ? `${twin.source_prim} · v${twin.cardiosolv_version}` : 'No twin loaded'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="file" accept="application/json,.json" ref={fileRef} className="hidden" onChange={onUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wide hover:bg-white/10 flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" /> Load report
          </button>
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wide hover:bg-white/10 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {!twin ? (
        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
          <Activity className="w-8 h-8 text-zinc-500 mb-3" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Awaiting digital twin</h3>
          <p className="text-xs text-zinc-600 max-w-md leading-relaxed">
            Run CardioSolv in Isaac Sim on the patient's heart. The extension posts its report here, or load
            <span className="font-mono"> cardiosolv_report.json</span> manually. The echo LVEF from the Diagnostic
            Center is used to personalise and validate the twin.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Twin LVEF" value={fmt(m?.ejection_fraction_pct)} unit="%" accent="text-cyan-400" />
            <Stat label="Echo LVEF" value={fmt(echoLvef)} unit="%" />
            <Stat label="EDV / ESV" value={`${fmt(m?.edv_ml, 0)} / ${fmt(m?.esv_ml, 0)}`} unit="mL" />
            <Stat label="Stroke volume" value={fmt(m?.stroke_volume_ml)} unit="mL" />
            <Stat label="LV peak pressure" value={fmt(m?.peak_lv_pressure_mmhg, 0)} unit="mmHg" />
            <Stat label="Aortic pressure" value={`${fmt(m?.peak_aortic_pressure_mmhg, 0)}/${fmt(m?.min_aortic_pressure_mmhg, 0)}`} unit="mmHg" />
            <Stat label="QRS duration" value={fmt(ep?.qrs_duration_ms, 0)} unit="ms" accent="text-amber-300" />
            <Stat label="Myocardial mass" value={fmt(geo?.myocardial_mass_g, 0)} unit="g" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-4">Pressure–volume loop</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis type="number" dataKey="volume" name="Volume" unit=" mL" stroke="#ffffff50" fontSize={10} domain={['auto', 'auto']} />
                    <YAxis type="number" dataKey="pressure" name="Pressure" unit=" mmHg" stroke="#ffffff50" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: 8, fontSize: 12 }} />
                    <Scatter data={pv} line={{ stroke: '#22d3ee', strokeWidth: 2 }} fill="#22d3ee" shape={() => null} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-4">
                Pseudo-ECG · {twin.electrophysiology?.protocol ?? '-'}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ecg} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="t" unit=" ms" stroke="#ffffff50" fontSize={10} />
                    <YAxis stroke="#ffffff50" fontSize={10} tickFormatter={(v) => v.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: 8, fontSize: 12 }} />
                    {leads.map((l, i) => (
                      <Line key={l} type="monotone" dataKey={l} dot={false} stroke={i ? '#fb7185' : '#4ade80'} strokeWidth={1.5} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-3">
            <h3 className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Validation gates</h3>
            {gates.map((g) => (
              <div key={g.name} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{g.name}</span>
                <span className="font-mono text-xs text-zinc-400">
                  {g.twin != null ? `${fmt(g.twin)} vs ${fmt(g.reference)} (${g.tolerance})` : g.tolerance}
                </span>
                {g.pass == null ? (
                  <span className="text-[10px] uppercase text-zinc-500">n/a</span>
                ) : g.pass ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                )}
              </div>
            ))}
            {twin.surrogate?.calibration && (
              <p className="text-xs text-zinc-400">
                Personalised contractility ×{fmt(twin.surrogate.calibration.contractility_scale, 2)} (
                {twin.surrogate.backbone}) to match echo EF {fmt(twin.surrogate.calibration.target_ef_pct)} %.
              </p>
            )}
            {(twin.validation?.warnings ?? []).slice(0, 5).map((w) => (
              <p key={w} className="text-xs text-amber-400">! {w}</p>
            ))}
            <p className="text-[10px] text-zinc-600">
              Research prototype: simulated values are not a substitute for clinical measurement.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
