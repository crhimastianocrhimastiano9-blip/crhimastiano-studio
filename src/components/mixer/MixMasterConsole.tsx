import { useStudio } from '../../context/StudioContext';
import { AudioOutputSettings } from './AudioOutputSettings';

export function MixMasterConsole() {
  const { project, setTrackLevel, toggleTrackMute, toggleTrackSolo } = useStudio();

  return (
    <section className="studio-layout">
      <section className="card">
        <p className="eyebrow">Console de mixage</p>
        <h2 style={{ margin: '6px 0 16px' }}>Pistes du projet</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {project.tracks.map((track) => (
            <div className="mixer-channel" key={track.id} style={{ borderLeft: `4px solid ${track.color}` }}>
              <div className="toolbar"><strong>{track.name}</strong><span>{track.level ?? 50}%</span></div>
              <input aria-label={`Volume de ${track.name}`} className="slider" type="range" min={0} max={100} value={track.level ?? 50} onChange={(event) => setTrackLevel(track.id, Number(event.target.value))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="secondary-btn" aria-pressed={Boolean(track.muted)} onClick={() => toggleTrackMute(track.id)}>{track.muted ? 'Son activé' : 'Muet'}</button>
                <button type="button" className="secondary-btn" aria-pressed={Boolean(track.solo)} onClick={() => toggleTrackSolo(track.id)}>{track.solo ? 'Solo actif' : 'Solo'}</button>
              </div>
            </div>
          ))}
        </div>
        <p className="status-message">Volumes, muet et solo sont sauvegardés ; ils ne modifient pas encore les instruments du piano roll. Le mixage multipiste complet viendra après l’ajout de pistes audio/MIDI réellement routées.</p>
      </section>
      <AudioOutputSettings />
    </section>
  );
}
