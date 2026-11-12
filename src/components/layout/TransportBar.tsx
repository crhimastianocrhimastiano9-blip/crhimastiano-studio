import React, { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Play, Pause, Square, Circle, Repeat, Volume2, Plus, Minus, Bell } from 'lucide-react';

export const TransportBar: React.FC = () => {
  const {
    isPlaying,
    currentTime,
    currentStep,
    isRecording,
    metronome,
    project,
    play,
    pause,
    stop,
    toggleMetronome,
    setBpm,
    startRecording,
    stopRecording,
    audioEngine,
    selectedTrackId,
    updateProjectMetadata,
  } = useStudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [masterVol, setMasterVol] = useState(0.9);

  // Time calculations
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const centiseconds = Math.floor((currentTime * 100) % 100);

  const secondsPerBeat = 60 / project.bpm;
  const currentBeatTotal = Math.floor(currentTime / secondsPerBeat);
  const bar = Math.floor(currentBeatTotal / 4) + 1;
  const beat = (currentBeatTotal % 4) + 1;
  const subBeat = Math.floor(((currentTime % secondsPerBeat) / secondsPerBeat) * 4) + 1;

  // Real-time canvas VU meter
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const renderMeter = () => {
      animId = requestAnimationFrame(renderMeter);

      const analyser = audioEngine.masterAnalyser;
      let peakL = 0;
      let peakR = 0;

      if (analyser && isPlaying) {
        analyser.getByteTimeDomainData(dataArray);
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          const abs = Math.abs(val);
          if (i % 2 === 0) peakL = Math.max(peakL, abs);
          else peakR = Math.max(peakR, abs);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 16;
      const barWidth = 4;
      const gap = 2;

      // Draw Left & Right Meter
      [peakL, peakR].forEach((peak, channelIdx) => {
        const y = channelIdx * 7;
        const activeBars = Math.round(peak * numBars * 1.4);

        for (let b = 0; b < numBars; b++) {
          const x = b * (barWidth + gap);
          let color = '#151922'; // idle dark
          if (b < activeBars) {
            if (b > 13) color = '#EF4444'; // Red clip
            else if (b > 10) color = '#F59E0B'; // Amber warm
            else color = '#14B8A6'; // Turquoise signal
          }
          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth, 5);
        }
      });
    };

    renderMeter();
    return () => cancelAnimationFrame(animId);
  }, [audioEngine, isPlaying]);

  const handleRecordToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      // Find armed track or use selected track
      const armedTrack = project.tracks.find((t) => t.armed) || project.tracks.find((t) => t.id === selectedTrackId) || project.tracks[0];
      if (armedTrack) {
        await startRecording(armedTrack.id);
      }
    }
  };

  const handleMasterVolChange = (val: number) => {
    setMasterVol(val);
    if (audioEngine.masterGain) {
      audioEngine.masterGain.gain.value = val;
    }
    updateProjectMetadata({ masterVolume: val });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#0E1117] border-b border-[#222938] text-neutral-300 text-xs select-none">
      {/* Transport Controls */}
      <div className="flex items-center gap-1.5">
        <button onClick={stop} title="Arrêt (Rembobiner)" className="w-8 h-8 rounded flex items-center justify-center bg-[#151922] hover:bg-[#202736] text-neutral-300 hover:text-white transition-colors cursor-pointer border border-[#222938]">
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        <button onClick={isPlaying ? pause : play} title={isPlaying ? 'Pause' : 'Lecture (Espace)'} className={`w-9 h-8 rounded flex items-center justify-center transition-all cursor-pointer font-bold border ${isPlaying ? 'bg-[#14B8A6] border-[#2DD4BF] text-[#0A0C10] shadow-sm shadow-[#14B8A6]/30' : 'bg-[#1E2533] border-[#2E384D] text-white hover:border-[#14B8A6]'}`}>
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button onClick={handleRecordToggle} title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer sur la piste armée'} className={`w-8 h-8 rounded flex items-center justify-center transition-all cursor-pointer border ${isRecording ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-[#151922] border-[#222938] text-red-500 hover:bg-red-950/30'}`}>
          <Circle className="w-3.5 h-3.5 fill-current" />
        </button>

        <button onClick={() => { audioEngine.isLooping = !audioEngine.isLooping; }} title="Boucle active" className="w-8 h-8 rounded flex items-center justify-center bg-[#151922] text-[#14B8A6] hover:bg-[#202736] transition-colors cursor-pointer border border-[#222938]">
          <Repeat className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Timecode & Bar Counter */}
      <div className="flex items-center gap-3 bg-[#07080B] border border-[#222938] px-3 py-1.5 rounded-md font-mono tabular-nums">
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans font-semibold">Mesure · Temps</span>
          <span className="text-sm font-bold text-[#F5D77F]">{String(bar).padStart(2, '0')}.{String(beat).padStart(2, '0')}.{String(subBeat).padStart(2, '0')}</span>
        </div>
        <div className="w-px h-6 bg-[#222938]" />
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans font-semibold">Chronomètre</span>
          <span className="text-sm font-semibold text-neutral-200">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}.{String(centiseconds).padStart(2, '0')}</span>
        </div>
        <div className="hidden sm:flex flex-col text-left pl-1 border-l border-[#222938]">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans font-semibold">Pas</span>
          <span className="text-xs font-semibold text-[#14B8A6]">{String(currentStep + 1).padStart(2, '0')} / 16</span>
        </div>
      </div>

      {/* BPM & Signature & Metronome */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#151922] border border-[#222938] rounded-md px-2 py-1">
          <span className="text-[10px] text-neutral-400 font-semibold mr-2 font-mono">BPM</span>
          <button onClick={() => setBpm(project.bpm - 1)} className="w-5 h-5 flex items-center justify-center hover:bg-[#252E3E] rounded text-neutral-400 hover:text-white cursor-pointer"><Minus className="w-3 h-3" /></button>
          <span className="w-10 text-center font-mono font-bold text-sm text-[#F5D77F] tabular-nums">{project.bpm}</span>
          <button onClick={() => setBpm(project.bpm + 1)} className="w-5 h-5 flex items-center justify-center hover:bg-[#252E3E] rounded text-neutral-400 hover:text-white cursor-pointer"><Plus className="w-3 h-3" /></button>
        </div>
        <button onClick={toggleMetronome} title="Métronome" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${metronome ? 'bg-[#14B8A6]/15 border-[#14B8A6] text-[#2DD4BF]' : 'bg-[#151922] border-[#222938] text-neutral-400 hover:text-neutral-200'}`}>
          <Bell className="w-3.5 h-3.5" /><span className="hidden sm:inline">Clic</span>
        </button>
        <div className="hidden md:flex items-center bg-[#151922] border border-[#222938] rounded-md px-2 py-1 text-[11px] font-mono font-semibold text-neutral-300">{project.timeSignature}</div>
      </div>

      {/* Master Bus VU Meter & Volume Slider */}
      <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-[#222938]">
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans font-semibold">Master L/R</span>
          <canvas ref={canvasRef} width={100} height={14} className="rounded bg-[#07080B] border border-[#1A202C]" />
        </div>
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
          <input type="range" min="0" max="1.2" step="0.01" value={masterVol} onChange={(e) => handleMasterVolChange(parseFloat(e.target.value))} title={`Volume Master: ${Math.round(masterVol * 100)}%`} className="w-20 h-1.5 bg-[#1E2533] rounded-lg appearance-none cursor-pointer" />
          <span className="font-mono text-[10px] text-neutral-400 w-8 tabular-nums">{Math.round(masterVol * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
