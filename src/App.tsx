/**
 * CRHIMASTIANO STUDIO — Station de Travail Audio Numérique (DAW)
 * Main Application Component
 */

import React, { useEffect } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { StudioHeader } from './components/layout/StudioHeader';
import { TransportBar } from './components/layout/TransportBar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { HomeDashboard } from './components/home/HomeDashboard';
import { MultitrackStudio } from './components/multitrack/MultitrackStudio';
import { BeatMakerStudio } from './components/beatmaker/BeatMakerStudio';
import { VoiceStudio } from './components/voice/VoiceStudio';
import { ChoirStudio } from './components/choir/ChoirStudio';
import { DuoStudio } from './components/duo/DuoStudio';
import { MixMasterConsole } from './components/mixer/MixMasterConsole';
import { AiMusicAssistant } from './components/ai/AiMusicAssistant';
import { ExportStudio } from './components/export/ExportStudio';
import { AudioInterruptionBanner } from './components/layout/AudioInterruptionBanner';
import { OfflineIndicator } from './components/layout/OfflineIndicator';

const StudioWorkspace: React.FC = () => {
  const { activeTab, isPlaying, play, pause } = useStudio();

  // Spacebar hotkey to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause]);

  return (
    <div className="min-h-screen bg-[#07080B] text-[#E6E8EC] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] pb-16 lg:pb-0 overflow-x-hidden">
      {/* Interruption warning banner for Android calls / background suspension */}
      <AudioInterruptionBanner />

      {/* Top Bar: Brand, Navigation, Action */}
      <StudioHeader />

      {/* DAW Transport Bar: Playhead, Timecode, BPM, VU Meter */}
      <TransportBar />

      {/* Offline Status */}
      <OfflineIndicator />

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'multitrack' && <MultitrackStudio />}
        {activeTab === 'beatmaker' && <BeatMakerStudio />}
        {activeTab === 'voice' && <VoiceStudio />}
        {activeTab === 'choir' && <ChoirStudio />}
        {activeTab === 'duo' && <DuoStudio />}
        {activeTab === 'mixer' && <MixMasterConsole />}
        {activeTab === 'ai_assistant' && <AiMusicAssistant />}
        {activeTab === 'export' && <ExportStudio />}
      </main>

      {/* Mobile Ergonomic Thumb Bottom Tab Bar */}
      <MobileTabBar />
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <StudioWorkspace />
    </StudioProvider>
  );
}
