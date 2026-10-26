import type { ReactNode } from 'react';

export type PublicRoute = 'problem' | 'features' | 'demo' | 'docs';

function TopNav({ onHome, onLogin, hasSession }: { onHome: () => void; onLogin: () => void; hasSession: boolean }) {
  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onHome} style={{ background: 'none', border: 0, fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>SATARK</button>
        <span className="chip">SIMULATION</span>
      </div>
      <button type="button" className="btn-ghost" onClick={onLogin}>{hasSession ? 'Open Command Center' : 'Log in'}</button>
    </header>
  );
}
function Shell({ title, eyebrow, children, onHome, onLogin, hasSession }: { title: string; eyebrow: string; children: ReactNode; onHome: () => void; onLogin: () => void; hasSession: boolean }) {
  return (
    <div>
      <TopNav onHome={onHome} onLogin={onLogin} hasSession={hasSession} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 64px' }}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 style={{ fontSize: 32, letterSpacing: '-1.28px', fontWeight: 600 }}>{title}</h1>
        {children}
        <footer style={{ borderTop: '1px solid var(--hairline)', marginTop: 48, paddingTop: 24, color: 'var(--mute)', fontSize: 13 }}>
          SATARK — simulation prototype, not an official Indian Army system. <button type="button" onClick={onHome} style={{ background: 'none', border: 0, color: 'var(--link)', cursor: 'pointer', padding: 0 }}>← Back to Home</button>
        </footer>
      </main>
    </div>
  );
}
const P = ({ children }: { children: ReactNode }) => <p style={{ color: 'var(--body)', fontSize: 15, lineHeight: '24px' }}>{children}</p>;

export function ProblemPage(props: { onHome: () => void; onLogin: () => void; hasSession: boolean }) {
  return (
    <Shell {...props} eyebrow="Problem, decoded" title="The problem is not a missing radar">
      <P>A radar screen is easy. What an operator actually lacks, on a time-sensitive shift, is a reason to believe the screen: which alerts are fresh, which positions are stale, which flags have evidence, and which repeated alerts are really one incident.</P>
      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {[
          ['User', 'Simulated airspace-monitoring operator, plus the trainer / judge who audits their decisions.'],
          ['Surface symptom', 'Alert floods, and stale positions still drawn as if they were live.'],
          ['Root cause', 'Telemetry quality and threat are conflated, with no inspectable chain from packet → rule / ML → grouped incident → human review.'],
          ['Constraints', 'No real sensor feeds, no API keys, offline-capable, demo-only login. Never claim hostility or engagement from a score.'],
          ['Measurable success', 'Same seed reproduces the same run. Grouping preserves 100% of raw event IDs. Stale tracks stop projecting. ML parity vs scikit-learn is tested, not asserted. Benchmark is computed live in Proof Mode.'],
        ].map(([t, d]) => <div className="card" key={t}><h3 style={{ margin: '0 0 8px' }}>{t}</h3><P>{d}</P></div>)}
      </div>
    </Shell>
  );
}
export function FeaturesPage(props: { onHome: () => void; onLogin: () => void; hasSession: boolean }) {
  return (
    <Shell {...props} eyebrow="What SATARK does" title="Features — every one of them does something real">
      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {[
          ['Airspace view', '8 seeded tracks (configurable 4–10) on a fictional SVG map: trails, zone boundaries, 5–15s projections, zoom / pan / reset / center. No remote map tiles.'],
          ['Trust Lens', 'Per-track freshness age, latency, missing updates, residual vs threshold, accepted vs rejected packets. Stale = current position UNKNOWN.'],
          ['Mission Focus', 'Repeated data-quality events grouped by track + category + cause within 10s. Security advisories never merge with quality events. Every raw ID stays expandable.'],
          ['Proof Mode', 'Inject a real fault into the packet stream. Compare deterministic rules with a locally trained Isolation Forest on the same features, plus a live held-out benchmark.'],
          ['Evidence + review', 'Each incident shows its packet, rule detail, ML score, features and limitations. Acknowledge / Mark reviewed / Needs follow-up / Reopen — persisted in this browser.'],
          ['Replay + report', 'Step through recorded snapshots without touching live history, then download a full run report (JSON) with tracks, groups and events.'],
          ['Guided judge demo', 'Inside the Command Center, a 5-step guided demo walks a judge through the exact winning path, one click per step.'],
        ].map(([t, d]) => <div className="card" key={t}><h3 style={{ margin: '0 0 8px' }}>{t}</h3><P>{d}</P></div>)}
      </div>
    </Shell>
  );
}
export function DemoPage(props: { onHome: () => void; onLogin: () => void; hasSession: boolean }) {
  return (
    <Shell {...props} eyebrow="Judge demo script — 5 minutes" title="Everyone shows a radar. We show why you should believe it.">
      <ol style={{ color: 'var(--body)', fontSize: 15, lineHeight: '28px', paddingLeft: 20 }}>
        <li><b>0:00</b> — Home → Enter Demo → Fill demo credentials → Command Center → Start.</li>
        <li><b>1:00</b> — Scenario ZONE_ENTRY: HIGH_REVIEW advisory → Evidence → Mark reviewed.</li>
        <li><b>2:30</b> — Proof Mode: judge injects a fault → Rules vs ML on the same features → Run benchmark.</li>
        <li><b>3:30</b> — ALERT_SURGE: expand a Data Quality group and count its raw event IDs.</li>
        <li><b>4:30</b> — Replay → step → Return to Live → reload: the Saved reviews strip still shows the review, before the run restarts.</li>
      </ol>
      <P>Pitch line: SATARK is an integrated, inspectable, reproducible review workflow — not just a radar. If a judge challenges the AI, do not defend it. Open Proof Mode and let them inject the fault themselves.</P>
      <P>Demo login (public test data only): SATARK-DEMO-001 / SatarkDemo@2026! — Simulation Operator (Demo). This is not verified institutional access.</P>
    </Shell>
  );
}
export function DocsPage(props: { onHome: () => void; onLogin: () => void; hasSession: boolean }) {
  return (
    <Shell {...props} eyebrow="Documentation, limits & how to run" title="How SATARK works, and what it honestly does not do">
      <h2 style={{ fontSize: 20 }}>Run it</h2>
      <pre className="card mono" style={{ fontSize: 13, overflow: 'auto' }}>{`npm install\nnpm run dev      # http://localhost:5173\nnpm run build    # production build\nnpm test         # ML parity tests`}</pre>
      <h2 style={{ fontSize: 20 }}>Model</h2>
      <P>Isolation Forest, trained with scikit-learn 1.9.1 on synthetic normal telemetry-quality features only (seed 42, n=4000, 40 trees). Exported to a local JSON file; the browser evaluator reproduces sklearn decision_function (parity test, max diff &lt; 0.0001). Features, in order: gap_s, age_at_receipt_s, missing_recent, speed_change_mps, residual_units. A flag means “unusual telemetry quality”, never hostility.</P>
      <h2 style={{ fontSize: 20 }}>Limits — stated, not hidden</h2>
      <ul style={{ color: 'var(--body)', fontSize: 15, lineHeight: '24px' }}>
        <li>Simulation only: fictional coordinates, synthetic tracks, no real feeds, no targeting, no interdiction.</li>
        <li>Demo login is client-side UX gating only, not security or institutional verification.</li>
        <li>Reviews persist in this browser (localStorage); they are not centrally audited or shared between devices.</li>
        <li>Offline: all map assets, fonts (system stack) and the model are local, so no API key or internet is needed for the core flow. A service worker is now generated in the production build (7 precached entries) — test one offline reload on the presenting machine before claiming it live, since loopback browsers are blocked in the build environment.</li>
      </ul>
      <h2 style={{ fontSize: 20 }}>Frequently asked by judges</h2>
      <P><b>Is the ML real?</b> Yes — train it yourself with ml/train.py, then run npm test for parity. <b>Can I reproduce a run?</b> Yes — same seed + scenario, then Replay. <b>Does grouping hide alerts?</b> No — expand any group and count every raw event ID.</P>
    </Shell>
  );
}
