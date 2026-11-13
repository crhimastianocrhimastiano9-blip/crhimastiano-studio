import { StudioProvider, useStudio } from './context/StudioContext';
import { HomeDashboard } from './components/home/HomeDashboard';
import { StudioHeader } from './components/layout/StudioHeader';
import { TransportBar } from './components/layout/TransportBar';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { MultitrackStudio } from './components/multitrack/MultitrackStudio';
import { BeatMakerStudio } from './components/beatmaker/BeatMakerStudio';
import { PianoRollStudio } from './components/piano/PianoRollStudio';
import { VoiceStudio } from './components/voice/VoiceStudio';
import { ChoirStudio } from './components/choir/ChoirStudio';
import { DuoStudio } from './components/duo/DuoStudio';
import { MixMasterConsole } from './components/mixer/MixMasterConsole';
import { AiMusicAssistant } from './components/ai/AiMusicAssistant';
import { ExportStudio } from './components/export/ExportStudio';
import './index.css';

function StudioContent() {
  const { activeTab } = useStudio();

  const views = {
    home: <HomeDashboard />,
    multitrack: <MultitrackStudio />,
    beatmaker: <BeatMakerStudio />,
    piano: <PianoRollStudio />,
    voice: <VoiceStudio />,
    choir: <ChoirStudio />,
    duo: <DuoStudio />,
    mix: <MixMasterConsole />,
    ai: <AiMusicAssistant />,
    export: <ExportStudio />,
  };

  return (
    <div className="app-shell studio-app">
      <OfflineIndicator />
      <StudioHeader />
      <TransportBar />
      <MobileTabBar />
      <main className="studio-layout">{views[activeTab]}</main>
      <footer className="app-footer">Crhimastiano Studio · Projet sauvegardé sur cet appareil</footer>
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <StudioContent />
    </StudioProvider>
  );
}
