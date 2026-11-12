import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  FileText,
  Music,
  Sliders,
  Layers,
  Disc,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AiMusicAssistant: React.FC = () => {
  const { project, updateProjectMetadata } = useStudio();

  const [mode, setMode] = useState<
    'lyrics' | 'chords' | 'structure' | 'mixing' | 'afrobeats_rhythm'
  >('lyrics');
  const [topic, setTopic] = useState('Voyage nocturne, ambition, triomphe et amour en ville');
  const [lyricsDraft, setLyricsDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sourceTag, setSourceTag] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);
    setInserted(false);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic,
          bpm: project.bpm,
          key: project.key,
          genre: project.genre,
          lyricsDraft: lyricsDraft.trim() || undefined,
        }),
      });

      const data = await res.json();
      setResult(data.content || 'Aucune réponse reçue.');
      setSourceTag(data.source || 'gemini-3.8-flash');
    } catch (err) {
      console.error('Erreur appel assistant IA:', err);
      setResult('Impossible de joindre le serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertToProject = () => {
    if (!result) return;
    updateProjectMetadata({ lyricsDraft: result });
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0C10]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1117] border border-[#222938]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#38BDF8]" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              Assistant de Production Musicale IA
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Propulsé par Google Gemini 3.8 Flash via appel serveur sécurisé. Paroles, grilles d'accords, structures et astuces de mixage.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-3 py-1.5 rounded-lg border border-[#38BDF8]/20">
          <span>Gemini 3.8 Flash</span>
          <span aria-hidden="true">·</span>
          <span>Serveur Sécurisé</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#0E1118] p-1.5 rounded-xl border border-[#222938]">
        {[
          { id: 'lyrics' as const, label: 'Paroles & Rimes', icon: FileText },
          { id: 'chords' as const, label: 'Accords & Harmonie', icon: Music },
          { id: 'structure' as const, label: 'Structure Arrangement', icon: Layers },
          { id: 'mixing' as const, label: 'Conseils de Mixage', icon: Sliders },
          { id: 'afrobeats_rhythm' as const, label: 'Rythmique Afro', icon: Disc },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id);
                setResult(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#151D2A] text-[#38BDF8] border border-[#23354C] shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Request Form */}
      <div className="p-5 rounded-xl bg-[#0E1118] border border-[#222938] space-y-4">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Thématique ou orientation musicale souhaitée
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Célébration, nostalgie nocturne, persévérance dans la musique..."
              className="w-full bg-[#151922] border border-[#283246] focus:border-[#14B8A6] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          {mode === 'lyrics' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Brouillon ou idées initiales de paroles (optionnel)
              </label>
              <textarea
                rows={3}
                value={lyricsDraft}
                onChange={(e) => setLyricsDraft(e.target.value)}
                placeholder="Collez ici vos rimes ou idées pour que Gemini les enrichisse..."
                className="w-full bg-[#151922] border border-[#283246] focus:border-[#14B8A6] rounded-lg p-3 text-xs text-neutral-200 focus:outline-none font-mono resize-none"
              />
            </div>
          )}

          {/* Session Context pill summary */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono py-1">
            <span>Tempo session : <strong className="text-[#14B8A6]">{project.bpm} BPM</strong></span>
            <span aria-hidden="true">·</span>
            <span>Tonalité : <strong className="text-[#F5D77F]">{project.key}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Genre : <strong className="text-white">{project.genre}</strong></span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#0284C7] hover:from-[#7DD3FC] hover:to-[#0369A1] text-[#0A0C10] font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-[#38BDF8]/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#0A0C10] border-t-transparent rounded-full animate-spin" />
                <span>Génération par Gemini 3.8 Flash...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Générer avec l'IA Studio</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Display */}
      {result && (
        <div className="p-6 rounded-xl bg-[#0E1118] border border-[#222938] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-sm font-bold text-white tracking-tight">
                Proposition de l'Assistant Musical
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 bg-[#1A2230] hover:bg-[#253042] text-white border border-[#2D3A50] text-xs font-semibold rounded cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>

              {mode === 'lyrics' && (
                <button
                  onClick={handleInsertToProject}
                  className="flex items-center gap-1 px-3 py-1 bg-[#1A2230] hover:bg-[#253042] text-white border border-[#2D3A50] text-xs font-semibold rounded cursor-pointer transition-colors"
                >
                  {inserted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>Inséré !</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-[#F5D77F]" />
                      <span>Insérer au projet</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Formatted Text Content */}
          <div className="bg-[#07090D] p-5 rounded-lg border border-[#1A202C] text-xs md:text-sm text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        </div>
      )}

      {/* Technical Integration Notice */}
      <div className="p-4 rounded-xl bg-[#0B0D13] border border-[#1C2230] flex items-start gap-3 text-xs text-neutral-400">
        <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-neutral-300">Architecture Audio & IA :</strong> L'assistance de composition (paroles, accords, structures) s'exécute côté serveur via le modèle officiel <code className="text-[#38BDF8]">gemini-3.8-flash</code>. Conformément aux standards professionnels, la génération brute de fichiers audio IA requiert un connecteur fournisseur audio dédié.
        </p>
      </div>
    </div>
  );
};
