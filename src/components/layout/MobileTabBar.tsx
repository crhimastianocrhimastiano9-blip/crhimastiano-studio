import { useStudio } from '../../context/StudioContext';
import { AudioEngine } from '../../audio/AudioEngine';

const engine = new AudioEngine();

export function TransportBar() {
  const { project, updateTempo } = useStudio();

  const handlePlayDemo = () => {
    engine.init();
    engine.playTone(220, 0.35);
  };

  return (
    <div className="card" style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="secondary-btn">⏮</button>
        <button type="button" className="primary-btn" onClick={handlePlayDemo}>▶</button>
        <button type="button" className="secondary-btn">⏭</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="pill">
          <input
            type="range"
            min={60}
            max={180}
            value={project.bpm}
            onChange={(event) => updateTempo(Number(event.target.value))}
            style={{ width: 110 }}
          />
          {project.bpm} BPM
        </label>
        <span className="pill">{project.timeSignature}</span>
        <span className="pill">{project.key} Major</span>
      </div>
    </div>
  );
}
