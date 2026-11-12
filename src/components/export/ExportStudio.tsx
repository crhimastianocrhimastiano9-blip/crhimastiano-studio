import { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AudioEngine } from '../../audio/AudioEngine';

const engine = new AudioEngine();

export function ExportStudio() {
  const { project } = useStudio();
  const [message, setMessage] = useState('');

  const downloadProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.trim().replace(/[^a-z0-9-_]+/gi, '-') || 'projet'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('Le fichier de projet a été téléchargé.');
  };

  const previewTone = async () => {
    try {
      await engine.playTone(440, 0.5, { masterVolume: project.masterVolume });
      setMessage('Aperçu sonore joué.');
    } catch {
      setMessage('La lecture audio n’est pas disponible sur cet appareil.');
    }
  };

  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Export</p>
      <h2 style={{ margin: '6px 0 0' }}>Exporter le projet</h2>
      <p>Cette version exporte les données du projet en JSON. Le mixage WAV n’est pas encore implémenté.</p>
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Projet</strong>
          <p>{project.name} · {project.tracks.length} pistes · {project.bpm} BPM</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Format disponible</strong>
          <p>Fichier JSON de sauvegarde</p>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="primary-btn" onClick={downloadProject}>Télécharger le projet</button>
        <button type="button" className="secondary-btn" onClick={() => void previewTone()}>Tester le son</button>
      </div>
      {message && <p className="status-message" role="status">{message}</p>}
    </section>
  );
}
