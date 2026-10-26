import { useEffect, useMemo, useRef, useState } from 'react';
import { Engine, SCENARIOS, fmtSim, ZONE_INFO, type Scenario, type ReviewStatus, type Group } from '../lib/engine';
import { SidebarNav } from '../components/SidebarNav';
import { MapView } from '../components/MapView';
import { evaluateMl, ruleCheck, runBenchmark, MODEL, MODEL_STATUS, FEATURE_ORDER, type Benchmark } from '../lib/ml';
import { DEMO_USER } from './LoginPage';

const PRI_LABEL: Record<string, string> = { HIGH_REVIEW: 'HIGH REVIEW', MEDIUM_REVIEW: 'MEDIUM REVIEW', LOW_REVIEW: 'LOW REVIEW', VERIFY_DATA: 'VERIFY DATA' };
const PRI_CLASS: Record<string, string> = { HIGH_REVIEW: 'badge-high', MEDIUM_REVIEW: 'badge-med', LOW_REVIEW: 'badge-low', VERIFY_DATA: 'badge-low' };

export function CommandCenterPage({ onLogout }: { onLogout: () => void }) {
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) engineRef.current = new Engine(42, 'CLEAN');
  const engine = engineRef.current;
  const [, setRender] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [scenario, setScenario] = useState<Scenario>('CLEAN');
  const [seed, setSeed] = useState(42);
  const [selected, setSelected] = useState<string | null>('T-01');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'SECURITY_ADVISORY' | 'DATA_QUALITY'>('SECURITY_ADVISORY');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [drawerGroup, setDrawerGroup] = useState<Group | null>(null);
  const [drawerTrack, setDrawerTrack] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showPrediction, setShowPrediction] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showZone, setShowZone] = useState(true);
  const [navActive, setNavActive] = useState('command');
  const [notice, setNotice] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [copyMsg, setCopyMsg] = useState('');
  const [proofTrack, setProofTrack] = useState('T-07');
  const [proofFault, setProofFault] = useState<'DELAY' | 'MISSING' | 'POSITION_ERROR'>('DELAY');
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [trackCount, setTrackCount] = useState(8);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const downloadReport = () => {
    const report = { project: 'SATARK', tagline: 'See the sky. Verify the signal.', generatedAt: new Date().toISOString(),
      seed, scenario, simTimeMs: engine.simTimeMs, stats: engine.stats(), tracks: engine.views(),
      groups: engine.groups, events: engine.events.slice(0, 500), modelVersion: MODEL.version,
      disclaimer: 'Simulation prototype — not an official Indian Army system. Synthetic data only.' };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `satark-run-report-seed${seed}-${scenario}.json`; a.click();
    URL.revokeObjectURL(a.href); setNotice('Run report downloaded — real data from this run, not a template.');
  };
  const guidedSteps = [
    { title: 'Start the run', text: 'Press Start, then switch to ZONE_ENTRY. Watch SIM time advance and the tracks move.', act: () => { doReset('ZONE_ENTRY'); setRunning(true); } },
    { title: 'Review a HIGH advisory', text: 'Open the first HIGH_REVIEW group in Airspace Advisories, read its evidence, then Mark reviewed.', act: () => { const g = engine.groups.find((x) => x.priority === 'HIGH_REVIEW'); if (g) setDrawerGroup(g); else setNotice('No HIGH group yet — let ZONE_ENTRY run a few more seconds, then try again.'); } },
    { title: 'Challenge the AI', text: 'Open Proof Mode, inject a fault, and compare Rules vs ML on the same features. Run the benchmark.', act: () => setProofOpen(true) },
    { title: 'Count the grouped evidence', text: 'Switch to ALERT_SURGE, open Data Quality, expand a group and count its raw event IDs.', act: () => { doReset('ALERT_SURGE'); setRunning(true); setTab('DATA_QUALITY'); } },
    { title: 'Replay + prove persistence', text: 'Open Replay, step through, Return to Live, then reload the page — before you restart the run, the Saved reviews strip above the queue shows your review from step 2 is still there.', act: () => { setReplayOpen(true); setReplayIdx(Math.max(0, engine.snapshots.length - 1)); } },
  ];

  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on); window.addEventListener('offline', on);
    const kd = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', kd);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on); window.removeEventListener('keydown', kd); };
  }, []);
  useEffect(() => {
    if (!running || replayOpen) return;
    const id = window.setInterval(() => { engine.tick(); setRender((r) => r + 1); }, 1000 / speed);
    return () => window.clearInterval(id);
  }, [running, speed, replayOpen, engine]);
  useEffect(() => {
    if (!replayPlaying || !replayOpen) return;
    const id = window.setInterval(() => setReplayIdx((i) => Math.min(engine.snapshots.length - 1, i + 1)), 1000 / speed);
    return () => window.clearInterval(id);
  }, [replayPlaying, replayOpen, speed, engine]);

  const views = engine.views();
  const stats = engine.stats();
  const sel = views.find((v) => v.id === selected) || views[0];
  const filteredTracks = views.filter((v) => v.id.toLowerCase().includes(query.toLowerCase()));
  // NOTE: engine.groups is mutated in place each tick, so no useMemo here —
  // a memo keyed on the same array reference would go stale.
  const groups = engine.groups.filter((g) => g.category === tab);
  const unresolved = engine.groups.filter((g) => g.reviewStatus === 'UNREVIEWED' || g.reviewStatus === 'FOLLOW_UP').length;
  // Saved reviews from earlier runs in this browser (localStorage). Shown
  // only while the live run has no groups yet — i.e. right after a reload,
  // when the queue is empty and the persistence claim would otherwise look
  // false on screen. Re-running the same seed + scenario regenerates the
  // same groups and these statuses reattach (engine.addEvent restores them).
  // UNREVIEWED entries (a deliberate Reopen) are not "saved reviews" to show.
  const savedReviews: { trackId: string; cause: string; status: ReviewStatus }[] = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('satark-reviews-v1') || '{}') as Record<string, string>;
      return Object.entries(raw)
        .filter(([, s]) => s !== 'UNREVIEWED')
        .map(([gid, status]) => {
          const [trackId, , cause] = gid.split('|');
          return { trackId: trackId || gid, cause: (cause || '').replace(/_/g, ' '), status: status as ReviewStatus };
        });
    } catch { return []; }
  })();
  const rawInGroups = engine.groups.reduce((a, g) => a + g.rawEventIds.length, 0);
  const compression = rawInGroups > 0 ? (1 - engine.groups.length / rawInGroups) * 100 : 0;

  // No window.confirm here on purpose: it froze the judge flow (and broke
  // automated checks, where confirm() defaults to Cancel). Reviews are
  // persisted separately, so a reset never deletes saved review decisions.
  const [tmpSeed, setTmpSeed] = useState(seed);
  const [tmpScenario, setTmpScenario] = useState<Scenario>(scenario);
  const [tmpTrackCount, setTmpTrackCount] = useState(trackCount);
  // Settings edits must NOT leak into the live UI before Apply: previously
  // the settings inputs wrote straight into scenario/seed/trackCount state,
  // so closing settings without Apply still changed the header scenario
  // while the engine kept running the old one.
  useEffect(() => { if (settingsOpen) { setTmpSeed(seed); setTmpScenario(scenario); setTmpTrackCount(trackCount); } }, [settingsOpen]);
  const doReset = (sc?: Scenario, sd?: number, tc?: number) => {
    const useTc = tc ?? trackCount;
    engine.trackCount = useTc; engine.reset(sd ?? seed, sc ?? scenario);
    setScenario(sc ?? scenario); setSeed(sd ?? seed); if (tc !== undefined) setTrackCount(tc);
    setDrawerGroup(null); setDrawerTrack(null); setRender((r) => r + 1);
    setNotice(`Reset to seed ${sd ?? seed}, scenario ${sc ?? scenario} — deterministic replay will reproduce the same run.`);
  };
  const nav = (id: string) => {
    setNavActive(id);
    if (id === 'command') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (id === 'search') setSearchOpen(true);
    else if (id === 'proof') setProofOpen(true);
    else if (id === 'replay') { setReplayOpen(true); setReplayIdx(Math.max(0, engine.snapshots.length - 1)); }
    else if (id === 'settings') setSettingsOpen(true);
    else if (id === 'advisories') document.getElementById('queue')?.scrollIntoView({ behavior: 'smooth' });
    else if (id === 'tracks' || id === 'tracks-all') document.getElementById('tracklist')?.scrollIntoView({ behavior: 'smooth' });
    else if (id === 'tracks-stale') { const s = views.find((v) => v.quality === 'STALE'); if (s) setSelected(s.id); else setNotice('No stale track right now — try MISSING_UPDATES or DELAYED_PACKET.'); }
    else if (id === 'scenario-clean') doReset('CLEAN');
    else if (id === 'scenario-surge') doReset('ALERT_SURGE');
    else if (id === 'analytics') setAnalyticsOpen(true);
    else if (id === 'team') setTeamOpen(true);
    else if (id === 'zone') { setShowZone(true); document.getElementById('airspace-map')?.scrollIntoView({ behavior: 'smooth' }); setNotice(`${ZONE_INFO.name}: centre (${ZONE_INFO.cx}, ${ZONE_INFO.cy}), radius ${ZONE_INFO.r} units, +60 boundary-review ring. Advisories fire only on accepted fresh observations.`); }
  };
  const copyJson = async (obj: unknown, label: string) => {
    try { await navigator.clipboard.writeText(JSON.stringify(obj, null, 2)); setCopyMsg(`${label} copied.`); }
    catch { setCopyMsg('Copy failed — clipboard unavailable in this browser.'); }
    window.setTimeout(() => setCopyMsg(''), 3000);
  };
  // Proof Mode sandbox experiment: transform the selected track's last real
  // features by the chosen fault, then score the SAME features with rules + ML.
  // If no packet has been accepted yet, there is no "real" baseline — the UI
  // says so instead of quietly scoring a made-up default vector.
  // NOTE: proofTrack defaults to T-07, but track count is configurable (4–10),
  // so after a reset with fewer tracks T-07 may not exist. Clamping to a real
  // track here (instead of trusting the stale state) keeps the Proof Mode
  // select from rendering blank and wrongly claiming "no accepted packet"
  // even after Start, when tracks do exist.
  const proofTrackId = views.some((v) => v.id === proofTrack) ? proofTrack : (views[0]?.id ?? proofTrack);
  const proofHasPacket = !!views.find((v) => v.id === proofTrackId)?.features;
  const proofBase = views.find((v) => v.id === proofTrackId)?.features || [1, 0.1, 0, 0.5, 5];
  const proofAfter = [...proofBase];
  if (proofFault === 'DELAY') proofAfter[1] = proofBase[1] + 4;
  if (proofFault === 'MISSING') { proofAfter[0] = proofBase[0] + 2; proofAfter[2] = proofBase[2] + 2; }
  if (proofFault === 'POSITION_ERROR') proofAfter[4] = proofBase[4] + 130;
  const mlBefore = evaluateMl(proofBase), mlAfter = evaluateMl(proofAfter);
  const ruleBefore = ruleCheck({ gap_s: proofBase[0], age_s: proofBase[1], missing: proofBase[2], residual: proofBase[4] });
  const ruleAfter = ruleCheck({ gap_s: proofAfter[0], age_s: proofAfter[1], missing: proofAfter[2], residual: proofAfter[4] });
  const agreement = mlAfter.status !== 'OK' ? 'ML unavailable — rules only' : mlAfter.flagged === ruleAfter.triggered ? 'Both agree' : mlAfter.flagged ? 'ML only' : 'Rules only';

  const replaySnap = replayOpen ? engine.snapshots[replayIdx] : null;

  return (
    <div>
      <header className="topnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong>SATARK</strong><span className="chip">SIMULATION</span>
          <span className="chip">{online ? 'ONLINE — SIMULATION' : 'OFFLINE SIMULATION'}</span>
          {stats.stale > 0 && <span className="chip" style={{ color: '#8f8f8f' }}>DATA STALE — {stats.stale} track{stats.stale > 1 ? 's' : ''} last-confirmed only</span>}
          <span className="chip mono">SIM {fmtSim(engine.simTimeMs)}</span>
          <span className="chip">{running ? (replayOpen ? 'REPLAY — HISTORICAL SIMULATION' : 'RUNNING') : 'PAUSED'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn-ghost" onClick={() => { setRunning(!running); }}>{running ? 'Pause' : 'Start'}</button>
          <button type="button" className="btn-ghost" onClick={() => doReset()}>Reset</button>
          <select aria-label="Scenario" className="input" style={{ width: 170 }} value={scenario} onChange={(e) => { const sc = e.target.value as Scenario; setScenario(sc); doReset(sc); }}>
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
          </select>
          <select aria-label="Speed" className="input" style={{ width: 80 }} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={1}>1×</option><option value={2}>2×</option>
          </select>
          <button type="button" className="btn-ghost" onClick={() => { setGuidedOpen(true); setGuidedStep(0); }}>Guided judge demo</button>
          <button type="button" className="btn-ghost" onClick={downloadReport}>Download run report</button>
          <button type="button" className="btn-ghost" onClick={() => setProofOpen(true)}>Proof Mode</button>
          <button type="button" className="btn-ghost" onClick={() => { setReplayOpen(true); setReplayIdx(Math.max(0, engine.snapshots.length - 1)); }}>Replay</button>
          <span className="chip mono">{DEMO_USER}</span>
          <button type="button" className="btn-ghost" onClick={onLogout}>Log out</button>
        </div>
      </header>
      {notice && <div style={{ background: '#fff', borderBottom: '1px solid var(--hairline)', padding: '8px 24px', fontSize: 13 }}>{notice} <button type="button" onClick={() => setNotice('')} style={{ background: 'none', border: 0, color: 'var(--link)', cursor: 'pointer' }}>Dismiss</button></div>}
      <div className="layout">
        <aside className="sidebar"><SidebarNav activeId={navActive} onSelect={nav} unresolved={unresolved} onLogout={onLogout} /></aside>
        <main style={{ flex: 1, padding: 24, minWidth: 0 }}>
          {replayOpen && <div style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontWeight: 600 }}>REPLAY — HISTORICAL SIMULATION · Live ticking is paused while replay is open. Nothing here changes the live log or reviews.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 16 }}>
            {[['Tracks', String(stats.tracks)], ['Raw events', String(stats.events)], ['Review groups', String(stats.groups)], ['Unresolved', String(stats.unresolved)], ['Stale tracks', String(stats.stale)], ['HIGH review open', String(stats.high)]].map(([l, v]) => (
              <div className="card" key={l} style={{ padding: 16 }}><p className="eyebrow" style={{ margin: 0 }}>{l}</p><p style={{ fontSize: 28, fontWeight: 600, margin: '4px 0 0', letterSpacing: '-0.5px' }}>{v}</p></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 16 }} className="cmd-grid">
            <section>
              <div id="tracklist" className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Tracks</h2>
                  <input className="input" style={{ width: 200 }} placeholder="Search track ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                  {filteredTracks.map((t) => (
                    <button type="button" key={t.id} onClick={() => { setSelected(t.id); setDrawerTrack(t.id); }}
                      style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, border: selected === t.id ? '1px solid var(--ink)' : '1px solid var(--hairline)', background: selected === t.id ? '#f2f2f2' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <span><b className="mono">{t.id}</b> · {t.quality}{t.stale ? ' — current position UNKNOWN' : ''}{!t.hasObservation ? ' — no observation yet' : ''}</span>
                      <span className="mono" style={{ color: 'var(--mute)' }}>{t.hasObservation ? `age ${t.ageSec.toFixed(0)}s` : 'no data yet'} · {t.accepted} pkts</span>
                    </button>
                  ))}
                  {filteredTracks.length === 0 && <p style={{ color: 'var(--mute)', fontSize: 13 }}>No track matches “{query}”.</p>}
                </div>
              </div>
              <div id="airspace-map" className="mapwrap" style={{ padding: 16 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Airspace — {ZONE_INFO.name} (fictional)</h2>
                <MapView tracks={views} selected={selected} onSelect={(id) => { setSelected(id); setDrawerTrack(id); }}
                  showTrails={showTrails} showPrediction={showPrediction} showLabels={showLabels} showZone={showZone}
                  replayPos={replaySnap ? replaySnap.pos : null} />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13 }}>
                  {[['Trails', showTrails, setShowTrails], ['Predictions (5–15s)', showPrediction, setShowPrediction], ['Labels', showLabels, setShowLabels], ['Zone outlines', showZone, setShowZone]].map(([l, v, fn]) => (
                    <label key={l as string} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" checked={v as boolean} onChange={(e) => (fn as (b: boolean) => void)(e.target.checked)} /> {l as string}
                    </label>
                  ))}
                </div>
              </div>
              {sel && (
                <div className="card" style={{ marginTop: 16 }}>
                  <p className="eyebrow">Selected track strip · {sel.id}</p>
                  <p style={{ margin: '8px 0' }}>
                    <b>{!sel.hasObservation ? 'No observation yet — press Start to begin the run' : sel.stale ? 'Current position: UNKNOWN' : `Position: (${sel.displayX.toFixed(0)}, ${sel.displayY.toFixed(0)})`}</b>{sel.hasObservation ? ` · alt ${sel.altitudeM}m · speed ${sel.speedMps} units/s · heading ${sel.headingDeg}° · ${sel.lastConfirmedLabel}` : ''}
                  </p>
                  <p style={{ margin: 0, color: 'var(--body)', fontSize: 13 }}>
                    Quality: {sel.quality} · age {sel.ageSec.toFixed(1)}s · latency {sel.latencySec.toFixed(1)}s · missing {sel.missing} · residual {sel.residual.toFixed(0)} · accepted {sel.accepted} / rejected {sel.rejected}
                    {sel.prediction.length ? ` · Projection (estimate, not guarantee): ${sel.prediction.map((p) => `${p.t}s→(${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(' ')}` : ' · Projection suspended (stale / inconsistent / insufficient data).'}
                    {sel.ml ? (sel.ml.status === 'OK' ? ` · ML decision ${sel.ml.decision.toFixed(3)} (threshold 0, ${sel.ml.flagged ? 'flagged' : 'not flagged'})` : ' · ML: MODEL UNAVAILABLE (rules still work)') : ' · ML: not evaluated yet (no accepted packet).'}
                  </p>
                  <button type="button" className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setDrawerTrack(sel.id)}>Open Trust Lens + evidence</button>
                </div>
              )}
            </section>
            <section id="queue">
              {engine.groups.length === 0 && savedReviews.length > 0 && (
                <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                  <p className="eyebrow" style={{ margin: 0 }}>Saved reviews in this browser</p>
                  <p style={{ fontSize: 13, color: 'var(--body)', margin: '8px 0' }}>
                    These review decisions survived the reload (browser-local storage). Re-run the same seed + scenario and they reattach to the regenerated groups.
                  </p>
                  <ul className="mono" style={{ fontSize: 12, paddingLeft: 16, margin: 0 }}>
                    {savedReviews.slice(0, 8).map((r, i) => <li key={i}>{r.trackId} · {r.cause} → {r.status}</li>)}
                  </ul>
                  {savedReviews.length > 8 && <p style={{ fontSize: 12, color: 'var(--mute)', margin: '8px 0 0' }}>+ {savedReviews.length - 8} more</p>}
                </div>
              )}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className={tab === 'SECURITY_ADVISORY' ? 'btn-sm' : 'btn-ghost'} onClick={() => setTab('SECURITY_ADVISORY')}>Airspace Advisories ({engine.groups.filter((g) => g.category === 'SECURITY_ADVISORY').length})</button>
                  <button type="button" className={tab === 'DATA_QUALITY' ? 'btn-sm' : 'btn-ghost'} onClick={() => setTab('DATA_QUALITY')}>Data Quality ({engine.groups.filter((g) => g.category === 'DATA_QUALITY').length})</button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--mute)' }}>Mission Focus: {engine.groups.length} groups from {rawInGroups} raw events · presentation compression {compression.toFixed(0)}% (not a missed-alert rate). Groups never merge across tracks or categories.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groups.length === 0 && <p style={{ fontSize: 13, color: 'var(--mute)' }}>No groups in this tab yet. Start the simulator and try ZONE_ENTRY (advisories) or ALERT_SURGE (grouped quality events).</p>}
                  {groups.map((g) => (
                    <div key={g.groupId} style={{ border: '1px solid var(--hairline)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <b className="mono" style={{ fontSize: 13 }}>{g.trackId}</b>
                        <span className={`chip ${PRI_CLASS[g.priority]}`}>{PRI_LABEL[g.priority]}</span>
                      </div>
                      <p style={{ fontSize: 13, margin: '6px 0' }}>{g.normalizedCause.replace(/_/g, ' ')} · <b>{g.rawEventIds.length} raw event{g.rawEventIds.length > 1 ? 's' : ''}</b> · first {fmtSim(g.firstSeenMs)} · last {fmtSim(g.lastSeenMs)} · status: {g.reviewStatus}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className="btn-ghost" onClick={() => { setSelected(g.trackId); setDrawerGroup(g); }}>Evidence</button>
                        <button type="button" className="btn-ghost" onClick={() => { setSelected(g.trackId); document.getElementById('airspace-map')?.scrollIntoView({ behavior: 'smooth' }); setNotice(`Focused ${g.trackId} on the map — use “Center selected” on the map to zoom to it.`); }}>Focus track</button>
                        <button type="button" className="btn-ghost" onClick={() => setExpanded((s) => { const n = new Set(s); if (n.has(g.groupId)) n.delete(g.groupId); else n.add(g.groupId); return n; })}>{expanded.has(g.groupId) ? 'Hide raw events' : 'Expand raw events'}</button>
                      </div>
                      {expanded.has(g.groupId) && (
                        <ul className="mono" style={{ fontSize: 12, paddingLeft: 16, margin: '8px 0 0' }}>
                          {g.rawEventIds.map((id) => { const ev = engine.events.find((e) => e.id === id); return <li key={id}>{id} — {ev ? `${ev.cause} @ ${fmtSim(ev.simulatedAtMs)}` : 'event record'} {ev?.evidence.ml ? (ev.evidence.ml.status === 'OK' ? `· ML ${ev.evidence.ml.decision.toFixed(3)}` : '· MODEL UNAVAILABLE') : ''}</li>; })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 16 }}>Anomaly scores are telemetry-quality scores, not probabilities of hostility. Zone events are simulated review advisories, not determinations of intent and never instructions to engage. {copyMsg}</p>
        </main>
      </div>

      {drawerTrack && (() => { const t = views.find((v) => v.id === drawerTrack); if (!t) return null; return (
        <div className="drawer" role="dialog" aria-label="Track detail">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>{t.id} — Trust Lens</h2><button type="button" className="btn-ghost" onClick={() => setDrawerTrack(null)}>Close</button></div>
          <p className="mono" style={{ fontSize: 13, color: 'var(--body)' }}>
            Quality {t.quality}<br />Age {t.ageSec.toFixed(1)}s (DEGRADED &gt; 2s, STALE &gt; 4s, demo thresholds)<br />
            Latency at receipt {t.latencySec.toFixed(1)}s · Missing {t.missing} · Residual {t.residual.toFixed(0)} (threshold 60)<br />
            Accepted {t.accepted} · Rejected {t.rejected} · {t.lastConfirmedLabel}<br />
            {t.stale ? 'Current position UNKNOWN — last confirmed marker only. Trajectory and zone-crossing projection suspended.' : 'Current position is the latest accepted observation.'}
          </p>
          {t.features && <table><tbody>
            {FEATURE_ORDER.map((f, i) => <tr key={f}><td>{f}</td><td className="mono">{t.features![i].toFixed(2)}</td></tr>)}
            <tr><td>ML decision</td><td className="mono">{t.ml ? (t.ml.status === 'OK' ? `${t.ml.decision.toFixed(3)} (threshold 0, ${t.ml.flagged ? 'flagged' : 'not flagged'})` : 'MODEL UNAVAILABLE') : '—'}</td></tr>
            <tr><td>Rules triggered</td><td>{t.ruleTriggered ? 'Yes' : 'No'}</td></tr>
          </tbody></table>}
          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: '0 0 6px' }}>Rejected packets — original evidence preserved</h3>
            {t.rejectedDetail.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>No rejected packets for this track yet.</p>
              : <ul className="mono" style={{ fontSize: 12, paddingLeft: 16, margin: 0 }}>{t.rejectedDetail.map((r) => <li key={r.eventId}>{r.eventId} · {r.reason} · ({r.x.toFixed(0)}, {r.y.toFixed(0)}) · observed {fmtSim(r.observedAtMs)} · received {fmtSim(r.receivedAtMs)}</li>)}</ul>}
            <p style={{ fontSize: 12, color: 'var(--mute)' }}>Rejected packets are never used as observations, and never overwrite a newer accepted one. Showing the last 10; the full run report carries the same view.</p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--body)' }}>Why flagged? — the measured features above are the evidence. Isolation Forest does not give exact causal feature importance; “factors to inspect” are the features furthest from the normal envelope, labelled as a heuristic, not a cause.</p>
          <button type="button" className="btn-ghost" onClick={() => { setProofTrack(t.id); setProofOpen(true); }}>Open Proof Mode for this track</button>
        </div>); })()}

      {drawerGroup && (
        <div className="drawer" role="dialog" aria-label="Incident evidence">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Incident evidence</h2><button type="button" className="btn-ghost" onClick={() => setDrawerGroup(null)}>Close</button></div>
          <p className="mono" style={{ fontSize: 13, color: 'var(--body)' }}>
            Group {drawerGroup.groupId}<br />Track {drawerGroup.trackId} · {drawerGroup.category} · {drawerGroup.normalizedCause}<br />
            Priority {PRI_LABEL[drawerGroup.priority]} · First {fmtSim(drawerGroup.firstSeenMs)} · Last {fmtSim(drawerGroup.lastSeenMs)}<br />
            Raw events: {drawerGroup.rawEventIds.join(', ')}<br />Review status: {drawerGroup.reviewStatus} · Operator: {DEMO_USER}
          </p>
          {(() => { const ev = engine.events.find((e) => e.id === drawerGroup.rawEventIds[drawerGroup.rawEventIds.length - 1]); if (!ev) return null; return (
            <div style={{ fontSize: 13 }}>
              <p>Rule detail: {ev.evidence.ruleDetail}</p>
              {ev.evidence.ml && (ev.evidence.ml.status === 'OK'
                ? <p>ML score: {ev.evidence.ml.score.toFixed(3)} · decision {ev.evidence.ml.decision.toFixed(3)} · threshold 0 · {ev.evidence.ml.flagged ? 'flagged' : 'not flagged'} · model {MODEL.version}</p>
                : <p>ML: MODEL UNAVAILABLE — rules baseline still applies; no ML score is shown.</p>)}
              {ev.evidence.features && <p className="mono">Features [{ev.evidence.features.map((x) => x.toFixed(2)).join(', ')}] — order: {FEATURE_ORDER.join(', ')}</p>}
              <p style={{ color: 'var(--mute)' }}>Limitation: this is synthetic training data. A flag means “unusual telemetry quality”, not hostility.</p>
            </div>); })()}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['ACKNOWLEDGED', 'REVIEWED', 'FOLLOW_UP', 'UNREVIEWED'] as ReviewStatus[]).map((s) => (
              <button key={s} type="button" className="btn-ghost" onClick={() => { engine.setReview(drawerGroup.groupId, s); setDrawerGroup({ ...drawerGroup, reviewStatus: s }); setRender((r) => r + 1); }}>{s === 'UNREVIEWED' ? 'Reopen' : s === 'REVIEWED' ? 'Mark reviewed' : s === 'FOLLOW_UP' ? 'Needs follow-up' : 'Acknowledge'}</button>
            ))}
            <button type="button" className="btn-ghost" onClick={() => copyJson(drawerGroup, 'Evidence JSON')}>Copy Evidence JSON</button>
          </div>
        </div>
      )}

      {proofOpen && (
        <div className="overlay" role="dialog" aria-label="Proof Mode">
          <div className="sheet">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Proof Mode — judge the AI on the same inputs</h2><button type="button" className="btn-ghost" onClick={() => setProofOpen(false)}>Close</button></div>
            <p style={{ color: 'var(--body)', fontSize: 14 }}>The sandbox below transforms a real track's last measured features. The “Inject into live stream” button applies the same fault to the next real packet — it changes telemetry, not just the display.</p>
            {MODEL_STATUS !== 'OK' && <p role="alert" style={{ color: 'var(--error)', fontSize: 13, fontWeight: 500 }}>MODEL UNAVAILABLE — the local model could not be validated, so no ML score is shown anywhere. The rules baseline below still works, and live monitoring is unaffected.</p>}
            {!proofHasPacket && <p role="alert" style={{ color: 'var(--error)', fontSize: 13, fontWeight: 500 }}>No accepted packet for {proofTrackId} yet — press Start in the Command Center first, then come back. The numbers below are a placeholder until then and are labelled as such.</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <select aria-label="Proof track" className="input" style={{ width: 140 }} value={proofTrackId} onChange={(e) => setProofTrack(e.target.value)}>{views.map((v) => <option key={v.id} value={v.id}>{v.id}</option>)}</select>
              <select aria-label="Fault" className="input" style={{ width: 180 }} value={proofFault} onChange={(e) => setProofFault(e.target.value as typeof proofFault)}>
                <option value="DELAY">Inject delayed packet (+4s age)</option><option value="MISSING">Inject missing update (+2 gap/missing)</option><option value="POSITION_ERROR">Inject position error (+130 residual)</option>
              </select>
              <button type="button" className="btn-sm" disabled={!proofHasPacket} onClick={() => { engine.injectFault(proofTrackId, proofFault); setNotice(`Fault ${proofFault} queued for ${proofTrackId} — start the simulator to see it flow through the real pipeline.`); setRender((r) => r + 1); }}>Inject into live stream</button>
              <button type="button" className="btn-ghost" onClick={() => setBenchmark(runBenchmark())}>Run held-out benchmark (n=400)</button>
            </div>
            <table>
              <thead><tr><th>Feature</th><th>Before</th><th>After</th><th>Changed?</th></tr></thead>
              <tbody>{FEATURE_ORDER.map((f, i) => <tr key={f}><td>{f}</td><td className="mono">{proofBase[i].toFixed(2)}</td><td className="mono">{proofAfter[i].toFixed(2)}</td><td>{proofBase[i] !== proofAfter[i] ? 'YES' : '—'}</td></tr>)}</tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="card" style={{ padding: 16 }}><h3 style={{ marginTop: 0 }}>Rules baseline</h3><p style={{ fontSize: 13 }}>Before: {ruleBefore.triggered ? 'TRIGGERED' : 'not triggered'} · After: <b>{ruleAfter.triggered ? 'TRIGGERED' : 'not triggered'}</b></p><p style={{ fontSize: 12, color: 'var(--mute)' }}>{ruleAfter.checks.map((c) => `${c.id}: ${c.detail}`).join(' · ')}</p></div>
              <div className="card" style={{ padding: 16 }}><h3 style={{ marginTop: 0 }}>ML — Isolation Forest ({MODEL.version})</h3>{mlAfter.status === 'OK'
                ? <p style={{ fontSize: 13 }}>Before decision {mlBefore.decision.toFixed(3)} ({mlBefore.flagged ? 'flagged' : 'not flagged'})<br />After decision <b>{mlAfter.decision.toFixed(3)} ({mlAfter.flagged ? 'flagged' : 'not flagged'})</b> · threshold 0</p>
                : <p style={{ fontSize: 13, fontWeight: 600 }}>MODEL UNAVAILABLE — no ML score is shown. Rules baseline still works.</p>}<p style={{ fontSize: 12, color: 'var(--mute)' }}>Agreement: <b>{agreement}</b> — disagreement is not automatically a system error. Trained on synthetic normal data only; model file loads locally, no API key.</p></div>
            </div>
            {benchmark && (
              <div style={{ marginTop: 16 }}>
                <h3>Held-out benchmark — computed now, not invented</h3>
                <p style={{ fontSize: 13, color: 'var(--body)' }}>Dataset: 400 cases, seed 999 (200 normal, 200 fault-injected). Division by zero would show N/A.</p>
                {!benchmark.mlAvailable && <p role="alert" style={{ color: 'var(--error)', fontSize: 13, fontWeight: 500 }}>MODEL UNAVAILABLE — ML benchmark rows are not computed. Rules below are real and unaffected.</p>}
                <table><thead><tr><th></th><th>TP</th><th>FP</th><th>TN</th><th>FN</th><th>Precision</th><th>Recall</th><th>False-positive rate</th></tr></thead>
                <tbody>
                  <tr><td>ML</td><td>{benchmark.mlAvailable ? benchmark.tp : '—'}</td><td>{benchmark.mlAvailable ? benchmark.fp : '—'}</td><td>{benchmark.mlAvailable ? benchmark.tn : '—'}</td><td>{benchmark.mlAvailable ? benchmark.fn : '—'}</td><td>{benchmark.mlPrecision?.toFixed(3) ?? 'N/A'}</td><td>{benchmark.mlRecall?.toFixed(3) ?? 'N/A'}</td><td>{benchmark.mlFpr?.toFixed(3) ?? 'N/A'}</td></tr>
                </tbody></table>
                <p style={{ fontSize: 12, color: 'var(--mute)' }}>Rules on the same set: precision {benchmark.rulePrecision?.toFixed(3) ?? 'N/A'} · recall {benchmark.ruleRecall?.toFixed(3) ?? 'N/A'} · FPR {benchmark.ruleFpr?.toFixed(3) ?? 'N/A'}.</p>
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--mute)' }}>Model metadata: {MODEL.trained_on} · {MODEL.n_estimators} trees · max_samples {MODEL.max_samples} · scaler mean/std shipped in the model JSON.</p>
          </div>
        </div>
      )}

      {replayOpen && (
        <div className="overlay" role="dialog" aria-label="Replay">
          <div className="sheet">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Replay — historical simulation</h2><button type="button" className="btn-ghost" onClick={() => { setReplayOpen(false); setReplayPlaying(false); }}>Return to Live</button></div>
            {engine.snapshots.length === 0 ? <p style={{ color: 'var(--mute)' }}>No snapshots yet — start the simulator first, then reopen replay.</p> : (
              <>
                <p className="mono">Snapshot {replayIdx + 1} / {engine.snapshots.length} · {replaySnap ? fmtSim(replaySnap.t) : ''}</p>
                <input type="range" min={0} max={engine.snapshots.length - 1} value={replayIdx} onChange={(e) => setReplayIdx(Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn-ghost" onClick={() => setReplayIdx((i) => Math.max(0, i - 1))}>Step back</button>
                  <button type="button" className="btn-ghost" onClick={() => setReplayPlaying(!replayPlaying)}>{replayPlaying ? 'Pause' : 'Play'}</button>
                  <button type="button" className="btn-ghost" onClick={() => setReplayIdx((i) => Math.min(engine.snapshots.length - 1, i + 1))}>Step forward</button>
                  <button type="button" className="btn-ghost" onClick={() => setReplayIdx(0)}>Reset to start</button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--body)' }}>The map behind this overlay shows the replay snapshot positions. Replay state is isolated: it does not append to the live log or change reviews.</p>
              </>
            )}
          </div>
        </div>
      )}

      {analyticsOpen && (
        <div className="overlay" role="dialog" aria-label="Trust analytics">
          <div className="sheet" style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Trust analytics — live from this run</h2><button type="button" className="btn-ghost" onClick={() => setAnalyticsOpen(false)}>Close</button></div>
            <p style={{ color: 'var(--body)', fontSize: 14 }}>Not a slide chart: every number below is computed from the current engine state.</p>
            <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
              <tr><td>Tracks by quality</td><td>{(['FRESH', 'DEGRADED', 'STALE', 'INCONSISTENT', 'NEW'] as const).map((q) => `${q}: ${views.filter((v) => v.quality === q).length}`).join(' · ')}</td></tr>
              <tr><td>ML-flagged tracks (latest packet)</td><td>{views.filter((v) => v.ml?.flagged).length} of {views.length}</td></tr>
              <tr><td>Rules-triggered tracks</td><td>{views.filter((v) => v.ruleTriggered).length} of {views.length}</td></tr>
              <tr><td>Raw events / groups / compression</td><td>{stats.events} / {stats.groups} / {compression.toFixed(0)}% (presentation only)</td></tr>
              <tr><td>Unresolved groups</td><td>{unresolved}</td></tr>
            </tbody></table>
            <h3>Per-track quality</h3>
            <table><thead><tr><th>Track</th><th>Quality</th><th>Age</th><th>Missing</th><th>Residual</th><th>ML decision</th></tr></thead>
            <tbody>{views.map((v) => <tr key={v.id}><td className="mono">{v.id}</td><td>{v.quality}</td><td>{v.ageSec.toFixed(1)}s</td><td>{v.missing}</td><td>{v.residual.toFixed(0)}</td><td>{v.ml ? (v.ml.status === 'OK' ? v.ml.decision.toFixed(3) : 'MODEL UNAVAILABLE') : '—'}</td></tr>)}</tbody></table>
            <button type="button" className="btn-ghost" style={{ marginTop: 12 }} onClick={() => { setAnalyticsOpen(false); setProofOpen(true); }}>Open Proof Mode for the benchmark</button>
          </div>
        </div>
      )}

      {teamOpen && (
        <div className="overlay" role="dialog" aria-label="Demo operator">
          <div className="sheet" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Demo operator</h2><button type="button" className="btn-ghost" onClick={() => setTeamOpen(false)}>Close</button></div>
            <p style={{ color: 'var(--body)', fontSize: 14 }}>Operator: <b className="mono">{DEMO_USER}</b> — Simulation Operator (Demo).<br />Session: browser-local demo session only. It is not institutional verification, and it protects no real data — everything behind it is synthetic demo material.<br />Unresolved groups: {unresolved} · Stale tracks: {views.filter((v) => v.quality === 'STALE').map((v) => v.id).join(', ') || 'none'}.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-ghost" onClick={() => { setTeamOpen(false); setSettingsOpen(true); }}>Shift handover summary</button>
              <button type="button" className="btn-ghost" onClick={onLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      {guidedOpen && (
        <div className="overlay" role="dialog" aria-label="Guided judge demo">
          <div className="sheet" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Guided judge demo — step {guidedStep + 1} of {guidedSteps.length}</h2><button type="button" className="btn-ghost" onClick={() => setGuidedOpen(false)}>Close</button></div>
            <h3 style={{ marginBottom: 4 }}>{guidedSteps[guidedStep].title}</h3>
            <p style={{ color: 'var(--body)', fontSize: 14, lineHeight: '20px' }}>{guidedSteps[guidedStep].text}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn-sm" onClick={() => { guidedSteps[guidedStep].act(); setRender((r) => r + 1); }}>Do this step</button>
              <button type="button" className="btn-ghost" disabled={guidedStep === 0} onClick={() => setGuidedStep((s) => Math.max(0, s - 1))}>Back</button>
              <button type="button" className="btn-ghost" disabled={guidedStep === guidedSteps.length - 1} onClick={() => setGuidedStep((s) => Math.min(guidedSteps.length - 1, s + 1))}>Next step</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--mute)' }}>Tip for the presenter: at step 3, let the judge pick the fault. Do not defend the model — let them inject it.</p>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="overlay" role="dialog" aria-label="Simulation settings">
          <div className="sheet" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Simulation settings</h2><button type="button" className="btn-ghost" onClick={() => setSettingsOpen(false)}>Close</button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <label style={{ fontSize: 14 }}>Seed (deterministic)
                <input className="input" style={{ marginTop: 6 }} type="number" value={tmpSeed} onChange={(e) => setTmpSeed(Number(e.target.value) || 42)} />
              </label>
              <label style={{ fontSize: 14 }}>Scenario
                <select className="input" style={{ marginTop: 6 }} value={tmpScenario} onChange={(e) => setTmpScenario(e.target.value as Scenario)}>{SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.desc}</option>)}</select>
              </label>
              <label style={{ fontSize: 14 }}>Track count (4–10)
                <input className="input" style={{ marginTop: 6 }} type="number" min={4} max={10} value={tmpTrackCount} onChange={(e) => setTmpTrackCount(Math.max(4, Math.min(10, Number(e.target.value) || 8)))} />
              </label>
              <button type="button" className="btn-sm" onClick={() => { doReset(tmpScenario, tmpSeed, tmpTrackCount); setSettingsOpen(false); }}>Apply + reset run</button>
              <p style={{ fontSize: 12, color: 'var(--mute)', margin: 0 }}>Closing without Apply changes nothing — settings only take effect on Apply.</p>
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                <h3 style={{ margin: '0 0 8px' }}>Shift handover summary (local, deterministic)</h3>
                <p style={{ fontSize: 13, color: 'var(--body)', whiteSpace: 'pre-wrap' }}>{`Unresolved groups: ${unresolved}\nStale tracks: ${views.filter((v) => v.quality === 'STALE').map((v) => v.id).join(', ') || 'none'}\nHIGH review open: ${stats.high}\nGroups:\n${engine.groups.map((g) => `- ${g.trackId} ${g.normalizedCause} ×${g.rawEventIds.length} [${g.reviewStatus}]`).join('\n') || 'none'}`}</p>
                <button type="button" className="btn-ghost" onClick={() => copyJson({ unresolved, stale: views.filter((v) => v.quality === 'STALE').map((v) => v.id), groups: engine.groups }, 'Handover JSON')}>Copy handover JSON</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="overlay" role="dialog" aria-label="Search">
          <div className="sheet" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input autoFocus className="input" placeholder="Search tracks or groups…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="button" className="btn-ghost" onClick={() => setSearchOpen(false)}>ESC</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {views.filter((v) => v.id.toLowerCase().includes(query.toLowerCase())).map((v) => (
                <button key={v.id} type="button" className="btn-ghost" style={{ textAlign: 'left' }} onClick={() => { setSelected(v.id); setDrawerTrack(v.id); setSearchOpen(false); }}>{v.id} — {v.quality}{v.hasObservation ? ` · age ${v.ageSec.toFixed(0)}s` : ' · no data yet'}</button>
              ))}
              {engine.groups.filter((g) => g.trackId.toLowerCase().includes(query.toLowerCase()) || g.normalizedCause.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map((g) => (
                <button key={g.groupId} type="button" className="btn-ghost" style={{ textAlign: 'left' }} onClick={() => { setDrawerGroup(g); setSearchOpen(false); }}>{g.trackId} — {g.normalizedCause} ×{g.rawEventIds.length}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@media (max-width:900px){ .cmd-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
