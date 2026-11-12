import { useEffect, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AudioEngine } from '../../audio/AudioEngine';

const rows = ['Kick', 'Snare', 'Clap', 'Bass'];
const steps = Array.from({ length: 16 }, (_, i) => i);
const frequencies: Record<string, number> = { Kick: 82, Snare: 180, Clap: 620, Bass: 110 };
const engine = new AudioEngine();

export function BeatMakerStudio() {
  const { project } = useStudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [audioError, setAudioError] = useState('');
  const [pattern, setPattern] = useState<Record<string, boolean[]>>({
    Kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    Snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    Clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    Bass: [true, false, true, false, false, true, false, true, true, false, true, false, false, true, false, true],
  });

  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 60_000 / project.bpm / 4;
    const interval = window.setInterval(() => {
      setCurrentStep((previous) => {
        const next = (previous + 1) % steps.length;
        rows.forEach((row) => {
          if (pattern[row][next]) {
            void engine.playTone(frequencies[row], 0.1).catch(() => {
              setIsPlaying(false);
              setAudioError('Lecture audio indisponible sur cet appareil.');
            });
          }
        });
        return next;
      });
    }, stepDuration);

    return () => window.clearInterval(interval);
  }, [isPlaying, pattern, project.bpm]);

  const toggleStep = (row: string, step: number) => {
    setPattern((current) => ({
      ...current,
      [row]: current[row].map((value, index) => (index === step ? !value : value)),
    }));
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentStep(-1);
      return;
    }

    try {
      await engine.resume();
      setAudioError('');
      setCurrentStep(-1);
      setIsPlaying(true);
    } catch {
      setAudioError('Autorise l’audio sur cet appareil puis réessaie.');
    }
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Beatmaker</p>
          <h2 style={{ margin: '6px 0 0' }}>Séquenceur de rythme</h2>
        </div>
        <button type="button" className="primary-btn" onClick={() => void togglePlayback()}>
          {isPlaying ? '⏸ Arrêter' : '▶ Lire le motif'}
        </button>
      </div>
      <p className="status-message" aria-live="polite">Tempo : {project.bpm} BPM · {isPlaying ? `Pas ${currentStep + 1} sur 16` : 'Arrêté'}</p>
      {audioError && <p role="alert" className="status-message">{audioError}</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
            <strong>{row}</strong>
            <div className="step-grid">
              {steps.map((step) => (
                <button
                  key={`${row}-${step}`}
                  type="button"
                  className={`step ${pattern[row][step] ? 'active' : ''}`}
                  onClick={() => toggleStep(row, step)}
                  aria-label={`${row}, pas ${step + 1}${pattern[row][step] ? ', actif' : ', inactif'}`}
                  aria-pressed={pattern[row][step]}
                  style={isPlaying && currentStep === step ? { outline: '2px solid white' } : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
