import { StudioProvider } from './context/StudioContext';
import { HomeDashboard } from './components/home/HomeDashboard';
import { StudioHeader } from './components/layout/StudioHeader';
import { TransportBar } from './components/layout/TransportBar';
import { AudioInterruptionBanner } from './components/layout/AudioInterruptionBanner';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { MultitrackStudio } from './components/multitrack/MultitrackStudio';
import './index.css';

export default function App() {
  return (
    <StudioProvider>
      <div className="app-shell">
        <OfflineIndicator />
        <AudioInterruptionBanner />
        <StudioHeader />
        <TransportBar />
        <main className="studio-layout">
          <HomeDashboard />
          <MultitrackStudio />
        </main>
      </div>
    </StudioProvider>
  );
}
