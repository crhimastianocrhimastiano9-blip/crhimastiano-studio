import { useEffect, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AudioEngine } from '../../audio/AudioEngine';

const engine = new AudioEngine();

export function TransportBar() {
  const { project, updateTempo } = useStudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      void engine.playTone(880, 0.12).catch(() => {
        setIsPlaying(false);
        setAudioError('Lecture audio indisponible sur cet appareil.');
      });
    }, 60_000 / project.bpm);

    return () => window.clearInterval(interval);
  }, [isPlaying, project.bpm]);

  const togglePlayback = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    try {
      await engine.resume();
      setAudioError('');
      setIsPlaying(true);
    } catch {
      setAudioError('Autorise l’audio sur cet appareil puis réessaie.');
    }
  };

  return (
    <div className="card transport-row" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" className={isPlaying ? 'secondary-btn' : 'primary-btn'} onClick={() => void togglePlayback()}>
          {isPlaying ? '⏸ Pause' : '▶ Lecture'}
        </button>
        <span className="status-message">{isPlaying ? 'Métronome actif' : 'Arrêté'}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="pill tempo-control">
          <input
            aria-label="Tempo en battements par minute"
            type="range"
            min={60}
            max={180}
            value={project.bpm}
            onChange={(event) => updateTempo(Number(event.target.value))}
          />
          {project.bpm} BPM
        </label>
        <span className="pill">{project.timeSignature}</span>
        <span className="pill">{project.key} Major</span>
      </div>
      {audioError && <p role="alert" className="status-message" style={{ flexBasis: '100%', margin: 0 }}>{audioError}</p>}
    </div>
  );
}
