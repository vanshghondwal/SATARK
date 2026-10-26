import { useState } from 'react';

export const DEMO_USER = 'SATARK-DEMO-001';
export const DEMO_PASS = 'SatarkDemo@2026!';

export function LoginPage({ onLogin, onHome }: { onLogin: () => void; onHome: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass) { setErr('Enter both User ID and Password.'); return; }
    if (user.trim() === DEMO_USER && pass === DEMO_PASS) { sessionStorage.setItem('satark-session', 'demo'); onLogin(); }
    else setErr('Invalid credentials. Use the demo credentials shown below — this is a demo gate only, not verified access.');
  };
  return (
    <div>
      <header className="topnav">
        <button type="button" onClick={onHome} style={{ background: 'none', border: 0, fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>SATARK</button>
        <span className="chip">SIMULATION · DEMO ONLY</span>
      </header>
      <main style={{ maxWidth: 440, margin: '64px auto', padding: '0 24px' }}>
        <p className="eyebrow">Demo access</p>
        <h1 style={{ fontSize: 32, letterSpacing: '-1.28px', fontWeight: 600 }}>Log in to the Command Center</h1>
        <p style={{ color: 'var(--body)', fontSize: 14 }}>Public hackathon demo credentials. No Indian Army identity verification or affiliation is provided.</p>
        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>User ID
            <input className="input" style={{ marginTop: 6 }} value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" />
          </label>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Password
            <span style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input className="input" type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} />
              <button type="button" className="btn-ghost" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          {err && <p role="alert" style={{ color: 'var(--error)', fontSize: 13, margin: 0 }}>{err}</p>}
          <button type="submit" className="btn-sm" style={{ padding: '10px' }}>Enter Command Center</button>
          <button type="button" className="btn-ghost" onClick={() => { setUser(DEMO_USER); setPass(DEMO_PASS); setErr(''); }}>Fill demo credentials</button>
        </form>
        <div className="card" style={{ marginTop: 16, fontSize: 13, color: 'var(--body)' }}>
          <p className="mono" style={{ margin: '0 0 8px' }}>DEMO ACCOUNT (PUBLIC TEST DATA)</p>
          <p style={{ margin: 0 }}>User ID: <b className="mono">{DEMO_USER}</b><br />Password: <b className="mono">{DEMO_PASS}</b><br />Role label: Simulation Operator (Demo)</p>
          <p style={{ margin: '8px 0 0' }}>This client-side demo gate is UX gating only. It is not security and never verifies real institutional membership.</p>
          <p style={{ margin: '8px 0 0' }}>Offline note: after the first online load, this login works offline from the cached app. No real sensor data is fetched at any point — all telemetry is locally simulated.</p>
        </div>
      </main>
    </div>
  );
}
