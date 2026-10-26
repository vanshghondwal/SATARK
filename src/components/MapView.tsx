import { useState } from 'react';
import type { TrackView } from '../lib/engine';
import { ZONE_INFO } from '../lib/engine';

const QCOLOR: Record<string, string> = { FRESH: '#0070f3', DEGRADED: '#f5a623', STALE: '#8f8f8f', INCONSISTENT: '#ee0000', NEW: '#8f8f8f' };

export function MapView({ tracks, selected, onSelect, showTrails, showPrediction, showLabels, showZone, replayPos }:
  { tracks: TrackView[]; selected: string | null; onSelect: (id: string) => void; showTrails: boolean; showPrediction: boolean; showLabels: boolean; showZone: boolean; replayPos?: Record<string, { x: number; y: number; quality: string }> | null }) {
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [drag, setDrag] = useState<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const zoom = (f: number) => setView((v) => ({ ...v, k: Math.max(0.6, Math.min(3, v.k * f)) }));
  const reset = () => setView({ k: 1, x: 0, y: 0 });
  const centerSelected = () => {
    const t = tracks.find((x) => x.id === selected); if (!t || !t.hasObservation) return;
    setView((v) => ({ k: Math.max(v.k, 1.4), x: 500 - t.displayX * Math.max(v.k, 1.4), y: 500 - t.displayY * Math.max(v.k, 1.4) }));
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" className="btn-ghost" onClick={() => zoom(1.25)}>Zoom +</button>
        <button type="button" className="btn-ghost" onClick={() => zoom(0.8)}>Zoom −</button>
        <button type="button" className="btn-ghost" onClick={reset}>Reset to fit</button>
        <button type="button" className="btn-ghost" onClick={centerSelected} disabled={!selected}>Center selected</button>
        <span className="chip">FICTIONAL TRAINING COORDINATES — not real geography</span>
      </div>
      <svg viewBox="0 0 1000 1000" role="img" aria-label="Fictional exercise airspace map"
        style={{ width: '100%', height: 'auto', display: 'block', background: '#fafafa', border: '1px solid var(--hairline)', borderRadius: 12, cursor: drag ? 'grabbing' : 'grab', touchAction: 'none' }}
        onWheel={(e) => zoom(e.deltaY < 0 ? 1.1 : 0.9)}
        onMouseDown={(e) => setDrag({ sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y })}
        onMouseMove={(e) => { if (drag) setView((v) => ({ ...v, x: drag.vx + (e.clientX - drag.sx), y: drag.vy + (e.clientY - drag.sy) })); }}
        onMouseUp={() => setDrag(null)} onMouseLeave={() => setDrag(null)}>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <line x1={i * 100} y1={0} x2={i * 100} y2={1000} stroke="#f2f2f2" />
              <line x1={0} y1={i * 100} x2={1000} y2={i * 100} stroke="#f2f2f2" />
            </g>
          ))}
          {showZone && (
            <g>
              <circle cx={ZONE_INFO.cx} cy={ZONE_INFO.cy} r={ZONE_INFO.r} fill="rgba(238,0,0,.06)" stroke="#ee0000" strokeWidth={2} strokeDasharray="8 6" />
              <circle cx={ZONE_INFO.cx} cy={ZONE_INFO.cy} r={ZONE_INFO.r + 60} fill="none" stroke="#f5a623" strokeWidth={1.5} strokeDasharray="4 6" />
              <text x={ZONE_INFO.cx} y={ZONE_INFO.cy - ZONE_INFO.r - 12} textAnchor="middle" fontSize={22} fontFamily="monospace" fill="#c50000">{ZONE_INFO.name}</text>
              <text x={ZONE_INFO.cx} y={ZONE_INFO.cy - ZONE_INFO.r + 8} textAnchor="middle" fontSize={16} fontFamily="monospace" fill="#8f8f8f">boundary review ring: +60 units</text>
            </g>
          )}
          {tracks.map((t) => {
            // No accepted packet yet = no observation to plot. Ground-truth
            // coordinates are never drawn as if they were observed.
            if (!t.hasObservation && !replayPos?.[t.id]) return null;
            const rp = replayPos?.[t.id];
            const x = rp ? rp.x : t.displayX, y = rp ? rp.y : t.displayY;
            const q = rp ? rp.quality : t.quality;
            return (
              <g key={t.id} onClick={() => onSelect(t.id)} style={{ cursor: 'pointer' }}>
                {showTrails && t.history.length > 1 && (
                  <polyline points={t.history.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={QCOLOR[t.quality] || '#8f8f8f'} strokeWidth={selected === t.id ? 3 : 2} opacity={0.7} />
                )}
                {showPrediction && selected === t.id && t.prediction.length > 0 && (
                  <polyline points={[`${t.displayX},${t.displayY}`, ...t.prediction.map((p) => `${p.x},${p.y}`)].join(' ')} fill="none" stroke="#0070f3" strokeWidth={2} strokeDasharray="6 6" />
                )}
                {selected === t.id && <circle cx={x} cy={y} r={26} fill="none" stroke="#171717" strokeWidth={2} />}
                <circle cx={x} cy={y} r={14} fill={QCOLOR[q] || '#8f8f8f'} stroke="#fff" strokeWidth={3} strokeDasharray={q === 'STALE' ? '4 4' : undefined} />
                {q === 'STALE' && <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fill="#fff" fontWeight={700}>?</text>}
                {showLabels && <text x={x + 20} y={y - 14} fontSize={20} fontWeight={600} fill="#171717">{t.id}</text>}
                {showLabels && <text x={x + 20} y={y + 8} fontSize={16} fontFamily="monospace" fill="#4d4d4d">{q}</text>}
              </g>
            );
          })}
        </g>
      </svg>
      <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 8 }}>
        Legend — shape + text, not colour alone: <b style={{ color: '#0070f3' }}>● Fresh</b> · <b style={{ color: '#f5a623' }}>● Degraded</b> · <b style={{ color: '#8f8f8f' }}>◌? Stale — last confirmed only</b> · <b style={{ color: '#ee0000' }}>● Inconsistent</b> · solid = observed trail · dashed blue = 5–15s estimate (selected track only).
        Interpolation between packets is display-only, never a new measurement.
      </p>
    </div>
  );
}
