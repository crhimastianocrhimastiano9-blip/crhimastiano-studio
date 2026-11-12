import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Layers, Play, Plus } from 'lucide-react';

interface ChoirVoiceConfig {
  id: string;
  name: string;
  role: 'lead' | 'high_harmony' | 'low_harmony' | 'stereo_double' | 'adlib';
  semitones: number;
  pan: number;
  volume: number;
  reverb: number;
  active: boolean;
}

export const ChoirStudio: React.FC = () => {
  const { addTrack, audioEngine } = useStudio();
  const [voices, setVoices] = useState<ChoirVoiceConfig[]>([
    { id: 'voice-lead', name: 'Voix Principale (Lead)', role: 'lead', semitones: 0, pan: 0, volume: 0.95, reverb: 0.25, active: true },
    { id: 'voice-harmony-high', name: 'Harmonie Haute (Tierce +4)', role: 'high_harmony', semitones: 4, pan: 0.35, volume: 0.75, reverb: 0.5, active: true },
    { id: 'voice-harmony-low', name: 'Harmonie Basse (Quinte -5)', role: 'low_harmony', semitones: -5, pan: -0.35, volume: 0.7, reverb: 0.55, active: true },
    { id: 'voice-double-stereo', name: 'Doublage Chœur Large (Stéréo)', role: 'stereo_double', semitones: 0, pan: 0.65, volume: 0.6, reverb: 0.7, active: true },
    { id: 'voice-adlibs', name: 'Ad-libs & Échos Flottants', role: 'adlib', semitones: 7, pan: -0.65, volume: 0.55, reverb: 0.8, active: true },
  ]);

  const handleAuditionChoirChord = (rootFreq = 329.63) => {
    audioEngine.initAudio().then(() => voices.forEach((v) => {
      if (v.active) audioEngine.playSynthNote(rootFreq * Math.pow(2, v.semitones / 12), 1.2, 'rhodes', v.volume * 0.7);
    }));
  };

  const handleAuditionSingleVoice = (voice: ChoirVoiceConfig, rootFreq = 329.63) => {
    audioEngine.initAudio().then(() => audioEngine.playSynthNote(rootFreq * Math.pow(2, voice.semitones / 12), 0.9, 'rhodes', voice.volume * 0.9));
  };
n  const updateVoice = (id: string, updates: Partial<ChoirVoiceConfig>) => setVoices((prev) => prev.map((v) => v.id === id ? { ...v, ...updates } : v));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0C10]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1117] border border-[#222938]">
        <div><div className="flex items-center gap-2"><Layers className="w-5 h-5 text-[#A78BFA]" /><h1 className="text-lg font-bold text-white">Studio Chœur & Harmonies Polyphoniques</h1></div><p className="text-xs text-neutral-400">Structurez vos arrangements choraux : voix lead, tierces, quintes, doubles stéréo et ad-libs.</p></div>
        <div className="flex items-center gap-3"><button onClick={() => handleAuditionChoirChord()} className="px-4 py-2 bg-[#1A2230] text-white text-xs rounded-lg flex items-center gap-2"><Play className="w-3.5 h-3.5 text-[#F5D77F]" />Auditionner l'Accord Choral</button><button onClick={() => voices.filter((v) => v.active).forEach((v) => addTrack('choir', `Chœur — ${v.name}`))} className="px-4 py-2 bg-[#A78BFA] text-[#0A0C10] font-bold text-xs rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" />Créer Pistes dans le DAW</button></div>
      </div>
      <div className="p-5 rounded-xl bg-[#0E1118] border border-[#222938] space-y-4">
        <div className="flex justify-between border-b border-[#1E2536] pb-3"><span className="text-sm font-bold text-white">Couches Vocales Indépendantes</span><span className="text-xs font-mono text-[#A78BFA]">{voices.filter((v) => v.active).length} Voix actives sur 5</span></div>
        {voices.map((voice) => <div key={voice.id} className={`p-4 rounded-xl border ${voice.active ? 'bg-[#121622] border-[#2B354D]' : 'bg-[#0B0D13] border-[#1C2230] opacity-50'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3 min-w-[240px]"><input type="checkbox" checked={voice.active} onChange={(e) => updateVoice(voice.id, { active: e.target.checked })} /><div><span className="text-sm font-bold text-white block">{voice.name}</span><span className="text-[11px] font-mono text-neutral-400">Décalage : {voice.semitones > 0 ? `+${voice.semitones}` : voice.semitones} demi-tons</span></div><button onClick={() => handleAuditionSingleVoice(voice)} className="ml-auto px-2 py-1 rounded bg-[#1A2230] text-xs text-[#F5D77F]">Écouter Voix</button></div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">{(['volume', 'pan', 'reverb'] as const).map((field) => <label key={field} className="flex items-center gap-2 text-[10px] text-neutral-400">{field === 'volume' ? 'Vol' : field === 'pan' ? 'Pan' : 'Réverbe'}<input type="range" min={field === 'pan' ? -1 : 0} max={field === 'volume' ? 1.2 : 1} step="0.02" value={voice[field]} disabled={!voice.active} onChange={(e) => updateVoice(voice.id, { [field]: parseFloat(e.target.value) })} className="w-full" /><span>{Math.round(voice[field] * 100)}%</span></label>)}</div></div>
        </div>)}
      </div>
    </div>
  );
};
