import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { ProblemPage, FeaturesPage, DemoPage, DocsPage, type PublicRoute } from './pages/PublicPages';

type Route = 'home' | 'login' | 'command' | PublicRoute;
export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    sessionStorage.getItem('satark-session') ? 'command' : 'home');
  const hasSession = !!sessionStorage.getItem('satark-session');
  const goLogin = () => setRoute(hasSession ? 'command' : 'login');
  const pub = { onHome: () => setRoute('home'), onLogin: goLogin, hasSession };
  if (route === 'command' && !hasSession) return <LoginPage onLogin={() => setRoute('command')} onHome={() => setRoute('home')} />;
  if (route === 'login') return <LoginPage onLogin={() => setRoute('command')} onHome={() => setRoute('home')} />;
  if (route === 'command') return <CommandCenterPage onLogout={() => { sessionStorage.removeItem('satark-session'); setRoute('login'); }} />;
  if (route === 'problem') return <ProblemPage {...pub} />;
  if (route === 'features') return <FeaturesPage {...pub} />;
  if (route === 'demo') return <DemoPage {...pub} />;
  if (route === 'docs') return <DocsPage {...pub} />;
  return <HomePage onEnter={goLogin} hasSession={hasSession} onNavigate={(r) => setRoute(r)} />;
}
