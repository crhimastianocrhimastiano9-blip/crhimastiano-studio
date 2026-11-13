import { useStudio } from '../../context/StudioContext';

export function TransportBar() {
  const { project, updateTempo } = useStudio();

  return (
    <div className="transport-panel card">
      <div className="transport-left">
        <button type="button" className="secondary-btn transport-step">⏮</button>
        <button type="button" className="primary-btn transport-play">▶</button>
        <button type="button" className="secondary-btn transport-step">⏭</button>
      </div>

      <div className="transport-right">
        <label className="pill tempo-control">
          <input
            aria-label="Tempo en battements par minute"
            type="range"
            min={60}
            max={180}
            value={project.bpm}
            onChange={(event) => updateTempo(Number(event.target.value))}
          />
          <span>{project.bpm} BPM</span>
        </label>
        <span className="pill">{project.timeSignature}</span>
        <span className="pill">{project.key} Major</span>
      </div>
    </div>
  );
}
