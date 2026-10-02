/**
 * Types and helpers for CardioSolv digital-twin reports
 * (cardiosolv_report.json written by the Isaac Sim extension).
 */

export interface TwinMetrics {
  edv_ml: number;
  esv_ml: number;
  stroke_volume_ml: number;
  ejection_fraction_pct: number;
  peak_lv_pressure_mmhg: number;
  cardiac_output_l_min: number;
  peak_aortic_pressure_mmhg: number;
  min_aortic_pressure_mmhg: number;
  peak_mean_fiber_strain: number;
}

export interface TwinReport {
  cardiosolv_version: string;
  source_prim: string;
  validation?: { status: string; errors: string[]; warnings: string[] };
  geometry?: {
    myocardium_source: string;
    metrics: Record<string, number>;
    long_axis: { length_mm: number; confidence: number };
  };
  electrophysiology?: {
    protocol: string;
    solver: string;
    metrics: Record<string, number>;
    pseudo_ecg?: { t_ms: number[]; [lead: string]: number[] };
  };
  hemodynamics?: {
    metrics: TwinMetrics;
    pv_loop: { t_ms: number[]; pressure_mmhg: number[]; volume_ml: number[]; aortic_mmhg: number[]; phase: string[] };
  };
  surrogate?: {
    backbone: string;
    metrics: { ejection_fraction_pct: number };
    calibration?: { target_ef_pct: number; contractility_scale: number; achieved_ef_pct: number } | null;
    pv_loop?: { t_ms: number[]; pressure_mmhg: number[]; volume_ml: number[] };
  };
}

export interface ValidationGate {
  name: string;
  twin: number | null;
  reference: number | null;
  tolerance: string;
  pass: boolean | null;
}

/** Stage-8 validation gates of the HUMDT pipeline (echo EF within +/-5 points). */
export function validationGates(twin: TwinReport | null, echoLvef: number | null): ValidationGate[] {
  const ef = twin?.hemodynamics?.metrics.ejection_fraction_pct ?? null;
  const calibrated = twin?.surrogate?.calibration?.achieved_ef_pct ?? null;
  const twinEf = calibrated ?? ef;
  return [
    {
      name: "LVEF vs echo",
      twin: twinEf,
      reference: echoLvef,
      tolerance: "±5 %",
      pass: twinEf != null && echoLvef != null ? Math.abs(twinEf - echoLvef) <= 5 : null,
    },
    {
      name: "Anatomy validation",
      twin: null,
      reference: null,
      tolerance: twin?.validation?.status ?? "-",
      pass: twin?.validation ? twin.validation.errors.length === 0 : null,
    },
  ];
}

export function pvLoopPoints(twin: TwinReport | null) {
  const pv = twin?.hemodynamics?.pv_loop;
  if (!pv) return [];
  return pv.volume_ml
    .map((v, i) => ({ volume: +v.toFixed(2), pressure: +pv.pressure_mmhg[i].toFixed(2), t: pv.t_ms[i], phase: pv.phase[i] }))
    .filter((p) => p.t >= 0);
}

export function ecgPoints(twin: TwinReport | null) {
  const ecg = twin?.electrophysiology?.pseudo_ecg;
  if (!ecg) return [];
  const leads = Object.keys(ecg).filter((k) => k !== "t_ms");
  return ecg.t_ms.map((t, i) => {
    const row: Record<string, number> = { t };
    leads.forEach((l) => (row[l] = ecg[l][i]));
    return row;
  });
}
