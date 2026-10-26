export function HomePage({ onEnter, hasSession, onNavigate }: { onEnter: () => void; hasSession: boolean; onNavigate?: (r: 'problem' | 'features' | 'demo' | 'docs') => void }) {
  const nav = onNavigate || (() => {});
  return (
    <div>
      <header className="topnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>S</span>
          <strong style={{ letterSpacing: '-0.02em' }}>SATARK</strong>
          <span className="chip">SIMULATION</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn-ghost" onClick={() => nav('problem')}>Problem</button>
          <button type="button" className="btn-ghost" onClick={() => nav('features')}>Features</button>
          <button type="button" className="btn-ghost" onClick={() => nav('demo')}>Judge demo</button>
          <button type="button" className="btn-ghost" onClick={() => nav('docs')}>Docs</button>
          <button type="button" className="btn-ghost" onClick={onEnter}>{hasSession ? 'Open Command Center' : 'Log in'}</button>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <section className="hero-mesh" style={{ padding: '96px 0 64px', textAlign: 'center' }}>
          <p className="eyebrow">Counter-Drone Monitoring · Problem Statement 2 · Simulation Prototype</p>
          <h1 style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-2.4px', lineHeight: '48px', margin: '16px 0' }}>SATARK</h1>
          <p style={{ fontSize: 20, color: 'var(--body)', margin: '0 0 8px' }}>See the sky. Verify the signal.</p>
          <p style={{ fontSize: 16, color: 'var(--body)', maxWidth: 640, margin: '0 auto 24px', lineHeight: '24px' }}>
            Track the airspace. Question the data. Trust the evidence. A browser-based, offline-capable
            simulation that tracks multiple aerial objects, predicts short trajectories, and prioritises
            review advisories — with the evidence behind every flag inspectable.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn-pill" onClick={onEnter}>{hasSession ? 'Open Command Center' : 'Enter Demo'}</button>
            <button type="button" className="btn-pill-white" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: '#c50000', fontWeight: 500 }}>Simulation prototype — not an official Indian Army system. No real sensor feeds, no classified data, no targeting or interdiction.</p>
        </section>
        <section id="how" style={{ padding: '48px 0' }}>
          <p className="eyebrow">How it works</p>
          <h2 style={{ fontSize: 32, letterSpacing: '-1.28px', fontWeight: 600 }}>Track → Assess trust → Review grouped advisories → Verify AI</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 24 }}>
            {[
              ['1 · Airspace view', '8 simulated tracks update ~1×/second on a fictional XY map, with trails, zone boundaries and 5–15s projections.'],
              ['2 · Mission Focus', 'Repeated data-quality alerts are grouped into incident cards. Every raw event ID stays expandable — nothing is silently deleted.'],
              ['3 · Trust Lens', 'Freshness age, missing updates, residuals and rejected packets are shown per track. Stale tracks stop projecting and are labelled UNKNOWN.'],
              ['4 · Proof Mode', 'Inject a real fault into the packet stream and compare deterministic rules with a locally trained Isolation Forest on the same inputs.'],
            ].map(([t, d]) => (
              <div className="card" key={t}><h3 style={{ fontSize: 20, margin: '0 0 8px' }}>{t}</h3><p style={{ color: 'var(--body)', fontSize: 14, lineHeight: '20px', margin: 0 }}>{d}</p></div>
            ))}
          </div>
        </section>
        <section style={{ padding: '48px 0' }}>
          <p className="eyebrow">Problem, decoded — not just a feature list</p>
          <h2 style={{ fontSize: 32, letterSpacing: '-1.28px', fontWeight: 600 }}>Who it is for, what actually hurts, and how we prove it</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 24 }}>
            {[
              ['User', 'A simulated airspace-monitoring operator on a time-sensitive shift — and the trainer / judge who must check their work. Not a real soldier, not a real feed.'],
              ['Surface symptom', 'Alert floods, and stale positions still drawn as if they were live. An operator cannot tell a real zone event from a broken sensor.'],
              ['Root cause', 'Telemetry quality and threat are conflated, with no inspectable chain from packet → rule / ML → grouped incident → human review.'],
              ['Constraints', 'No real sensor feeds, no API keys, offline-capable, demo-only login, and a hard rule: never claim hostility or engagement from a score.'],
            ].map(([t, d]) => (
              <div className="card" key={t}><h3 style={{ fontSize: 20, margin: '0 0 8px' }}>{t}</h3><p style={{ color: 'var(--body)', fontSize: 14, lineHeight: '20px', margin: 0 }}>{d}</p></div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <p className="eyebrow">Measurable success — checked in the app, not claimed in slides</p>
            <ul style={{ color: 'var(--body)', fontSize: 14, lineHeight: '22px', margin: '8px 0 0', paddingLeft: 20 }}>
              <li>Same seed + scenario = same run, reproducible in Replay.</li>
              <li>Mission Focus groups preserve 100% of raw event IDs — expand any group and count them.</li>
              <li>Stale tracks stop projecting and are labelled UNKNOWN; prediction is withheld, not faked.</li>
              <li>Browser Isolation Forest reproduces scikit-learn decision_function (parity test: max diff &lt; 0.0001).</li>
              <li>Proof Mode benchmark is computed live on a held-out set (n=400) — precision, recall and false-positive rate, with N/A on zero denominators.</li>
            </ul>
          </div>
        </section>
        <section style={{ padding: '0 0 48px' }}>
          <p className="eyebrow">Judge demo script — 5 minutes, no wandering</p>
          <h2 style={{ fontSize: 32, letterSpacing: '-1.28px', fontWeight: 600 }}>Everyone shows a radar. We show why you should believe it.</h2>
          <ol style={{ color: 'var(--body)', fontSize: 15, lineHeight: '28px', paddingLeft: 20 }}>
            <li><b>0:00</b> — Home → Enter Demo → Fill demo credentials → Command Center → Start.</li>
            <li><b>1:00</b> — Scenario ZONE_ENTRY: a HIGH_REVIEW advisory appears → Evidence → Mark reviewed.</li>
            <li><b>2:30</b> — Proof Mode: inject a delayed packet → compare Rules vs ML on the same features → Run held-out benchmark.</li>
            <li><b>3:30</b> — Scenario ALERT_SURGE: expand a Data Quality group and count the raw event IDs it preserved.</li>
            <li><b>4:30</b> — Replay: step through the recorded run → Return to Live → reload the page: the Saved reviews strip still shows the review, before the run restarts.</li>
          </ol>
          <p style={{ color: 'var(--body)', fontSize: 14, lineHeight: '20px' }}>If a judge challenges the AI, do not defend it — open Proof Mode and let them inject the fault themselves. That is the demo.</p>
        </section>
        <section style={{ padding: '0 0 48px' }}>
          <p className="eyebrow">PS2 checklist — requirement → proof → where to click</p>
          <table>
            <thead><tr><th>PS2 requirement</th><th>SATARK proof</th><th>Click</th></tr></thead>
            <tbody>
              <tr><td>Real-time dashboard</td><td>~1 packet / track / second, live SIM clock</td><td>Start</td></tr>
              <tr><td>Simulated telemetry</td><td>Seeded packets with observed vs received timestamps</td><td>Track detail → Trust Lens</td></tr>
              <tr><td>Multiple aerial objects</td><td>8 tracks, configurable 4–10</td><td>Settings</td></tr>
              <tr><td>Track + predict trajectories</td><td>History trail + dashed 5–15s projection, withheld when stale</td><td>Select a track on the map</td></tr>
              <tr><td>Prioritise threats</td><td>Explainable HIGH / MEDIUM / LOW / VERIFY_DATA review queue</td><td>Airspace Advisories tab</td></tr>
              <tr><td>Meaningful AI</td><td>Local Isolation Forest + rules baseline + live benchmark</td><td>Proof Mode</td></tr>
              <tr><td>Offline / low-bandwidth</td><td>Local SVG map, no remote tiles or fonts, local model</td><td>Works with no API key</td></tr>
            </tbody>
          </table>
        </section>
        <section className="card">
          <p className="eyebrow">How offline works</p>
          <p style={{ color: 'var(--body)', fontSize: 14, lineHeight: '20px' }}>
            After the first load, the app runs on locally generated synthetic telemetry — no external API is
            required for core functions. All map assets are local SVG; there are no remote map tiles or fonts.
            Reviews are stored only in this browser (localStorage) and are not centrally audited or shared
            between devices. An anomaly score is a telemetry-quality score, never a probability of hostility,
            and a zone advisory is a review note, never an instruction to engage.
          </p>
          <p style={{ color: 'var(--body)', fontSize: 14, lineHeight: '20px' }}>Dataset disclosure: all coordinates, tracks and incidents are fictional training data. Model: Isolation Forest trained on synthetic normal telemetry-quality features (seed 42, n=4000); browser inference reproduces scikit-learn decision_function (parity verified, see README).</p>
        </section>
        <footer style={{ borderTop: '1px solid var(--hairline)', marginTop: 48, paddingTop: 24, color: 'var(--mute)', fontSize: 13 }}>
          SATARK — student hackathon prototype (PS2: Counter-Drone Monitoring &amp; Airspace Security). Demo credentials on the login page are public test data only.
        </footer>
      </main>
    </div>
  );
}
