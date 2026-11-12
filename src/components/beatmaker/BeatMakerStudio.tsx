import { useStudio } from '../../context/StudioContext';

export function MultitrackStudio() {
  const { project, toggleTrackMute, toggleTrackSolo, setTrackLevel } = useStudio();

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Studio</p>
          <h2 style={{ margin: '6px 0 0' }}>Multitrack</h2>
        </div>
        <div className="toolbar">
          <span className="pill">{project.bpm} BPM</span>
          <span className="pill">{project.key}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {project.tracks.map((track) => (
          <div key={track.id} className="track-row" style={{ borderLeft: `4px solid ${track.color}` }}>
            <div>
              <strong>{track.name}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{track.type}</div>
            </div>

            <div>
              <div className="level-bar">
                <div className="level-fill" style={{ width: `${track.level ?? 50}%` }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="secondary-btn" onClick={() => toggleTrackMute(track.id)}>
                {track.muted ? 'Unmute' : 'Mute'}
              </button>
              <button type="button" className="secondary-btn" onClick={() => toggleTrackSolo(track.id)}>
                {track.solo ? 'Solo on' : 'Solo'}
              </button>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={track.level ?? 50}
              onChange={(event) => setTrackLevel(track.id, Number(event.target.value))}
              className="slider"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
