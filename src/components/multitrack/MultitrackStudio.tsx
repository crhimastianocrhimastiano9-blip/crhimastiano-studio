import { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import type { TrackType } from '../../types/daw';

const trackOptions: { name: string; type: TrackType }[] = [
  { name: 'Synthétiseur', type: 'synth' },
  { name: 'Basse', type: 'bass' },
  { name: 'Batterie', type: 'drums' },
  { name: 'Voix', type: 'vocals' },
  { name: 'Effets', type: 'fx' },
];

export function MultitrackStudio() {
  const { project, toggleTrackMute, toggleTrackSolo, setTrackLevel, addTrack, removeTrack } = useStudio();
  const [newTrackType, setNewTrackType] = useState<TrackType>('synth');

  const createTrack = () => {
    const option = trackOptions.find((item) => item.type === newTrackType);
    if (option) addTrack(`${option.name} ${project.tracks.length + 1}`, option.type);
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p className="eyebrow">Studio</p>
          <h2 style={{ margin: '6px 0 0' }}>Multitrack</h2>
        </div>
        <div className="toolbar">
          <span className="pill">{project.bpm} BPM</span>
          <span className="pill">{project.key}</span>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <label className="pill">
          Ajouter une piste
          <select aria-label="Type de nouvelle piste" value={newTrackType} onChange={(event) => setNewTrackType(event.target.value as TrackType)} style={{ color: 'white', background: '#0f172a', border: 0 }}>
            {trackOptions.map((option) => <option key={option.type} value={option.type}>{option.name}</option>)}
          </select>
        </label>
        <button type="button" className="primary-btn" onClick={createTrack}>＋ Ajouter</button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {project.tracks.map((track) => (
          <div key={track.id} className="track-row" style={{ borderLeft: `4px solid ${track.color}` }}>
            <div>
              <strong>{track.name}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{track.type}</div>
            </div>
            <div className="level-bar"><div className="level-fill" style={{ width: `${track.level ?? 50}%` }} /></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="secondary-btn" aria-pressed={Boolean(track.muted)} onClick={() => toggleTrackMute(track.id)}>{track.muted ? 'Son activé' : 'Muet'}</button>
              <button type="button" className="secondary-btn" aria-pressed={Boolean(track.solo)} onClick={() => toggleTrackSolo(track.id)}>{track.solo ? 'Solo actif' : 'Solo'}</button>
              <button type="button" className="secondary-btn" aria-label={`Supprimer ${track.name}`} onClick={() => removeTrack(track.id)}>Supprimer</button>
            </div>
            <label>
              <span className="sr-only">Volume de {track.name} : {track.level ?? 50} %</span>
              <input type="range" min={0} max={100} value={track.level ?? 50} onChange={(event) => setTrackLevel(track.id, Number(event.target.value))} className="slider" />
            </label>
          </div>
        ))}
      </div>
      <p className="status-message">Les pistes et leurs volumes sont sauvegardés sur cet appareil. Le routage et le mixage multipiste en temps réel ne sont pas encore implémentés.</p>
    </section>
  );
}
