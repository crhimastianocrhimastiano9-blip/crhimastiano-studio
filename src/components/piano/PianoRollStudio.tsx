import { useEffect, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AudioEngine } from '../../audio/AudioEngine';

const midiNotes = Array.from({ length: 25 }, (_, index) => 84 - index);
const stepNumbers = Array.from({ length: 16 }, (_, index) => index);
const noteNames = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const blackPitchClasses = new Set([1, 3, 6, 8, 10]);
const engine = new AudioEngine();

function getNoteLabel(midi: number) {
  return `${noteNames[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function getMidiFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function PianoRollStudio() {
  const { project } = useStudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [audioError, setAudioError] = useState('');
  const [notes, setNotes] = useState<Record<number, boolean[]>>({
    72: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    67: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    64: [false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false],
    60: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
  });

  useEffect(() => {
    if (!isPlaying) return;

    let step = -1;
    const interval = window.setInterval(() => {
      step = (step + 1) % stepNumbers.length;
      setCurrentStep(step);
      midiNotes.forEach((midi) => {
        if (notes[midi]?.[step]) {
          void engine.playPianoNote(getMidiFrequency(midi), 0.22).catch(() => {
            setIsPlaying(false);
            setAudioError('Lecture audio indisponible sur cet appareil.');
          });
        }
      });
    }, 60_000 / project.bpm / 4);

    return () => window.clearInterval(interval);
  }, [isPlaying, notes, project.bpm]);

  const toggleNote = (midi: number, step: number) => {
    setNotes((current) => {
      const row = current[midi] ?? Array.from({ length: 16 }, () => false);
      return { ...current, [midi]: row.map((active, index) => index === step ? !active : active) };
    });
  };

  const startOrStop = async () => {
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
      setAudioError('Autorise la lecture audio sur cet appareil puis réessaie.');
    }
  };

  const clearNotes = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
    setNotes({});
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div>
          <p className="eyebrow">Clavier & composition</p>
          <h2 style={{ margin: '6px 0 0' }}>Piano roll</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="primary-btn" onClick={() => void startOrStop()}>
            {isPlaying ? '⏸ Arrêter' : '▶ Lire'}
          </button>
          <button type="button" className="secondary-btn" onClick={clearNotes}>Effacer</button>
        </div>
      </div>
      <p className="status-message" aria-live="polite">
        16 pas · {project.bpm} BPM · {isPlaying ? `Lecture du pas ${currentStep + 1}` : 'Appuie sur les cases pour placer des notes'}
      </p>
      <p className="status-message">Synthèse piano intégrée (son électronique, pas un échantillon de piano).</p>
      {audioError && <p role="alert" className="status-message">{audioError}</p>}

      <div className="piano-roll-scroll">
        <div className="piano-roll">
          <div className="piano-roll-heading">
            <span>Note</span>
            {stepNumbers.map((step) => <span key={step} className={step % 4 === 0 ? 'bar-start' : ''}>{step + 1}</span>)}
          </div>
          {midiNotes.map((midi) => {
            const activeNotes = notes[midi] ?? [];
            const isBlackKey = blackPitchClasses.has(midi % 12);
            return (
              <div className={`piano-roll-row ${isBlackKey ? 'black-note-row' : ''}`} key={midi}>
                <button
                  type="button"
                  className={`piano-roll-key ${isBlackKey ? 'black-key' : ''}`}
                  onClick={() => void engine.playPianoNote(getMidiFrequency(midi), 0.4).catch(() => setAudioError('Lecture audio indisponible.'))}
                  aria-label={`Jouer la note ${getNoteLabel(midi)}`}
                >
                  {getNoteLabel(midi)}
                </button>
                {stepNumbers.map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`piano-note-cell ${activeNotes[step] ? 'note-active' : ''} ${currentStep === step ? 'playhead-cell' : ''} ${step % 4 === 0 ? 'bar-start' : ''}`}
                    onClick={() => toggleNote(midi, step)}
                    aria-label={`${getNoteLabel(midi)}, pas ${step + 1}${activeNotes[step] ? ', note présente' : ', vide'}`}
                    aria-pressed={Boolean(activeNotes[step])}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
