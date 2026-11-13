import { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import type { StudioTab } from '../../types/daw';

const studioCards: { label: string; subtitle: string; key: StudioTab; accent: string; symbol: string }[] = [
  { label: 'Arrangement', subtitle: 'Pistes et sessions', key: 'multitrack', accent: '#8b5cf6', symbol: '▥' },
  { label: 'Beatmaker', subtitle: 'Crée un rythme', key: 'beatmaker', accent: '#ec4899', symbol: '▦' },
  { label: 'Piano roll', subtitle: 'Joue des instruments', key: 'piano', accent: '#38bdf8', symbol: '♫' },
  { label: 'Studio vocal', subtitle: 'Enregistre ta voix', key: 'voice', accent: '#22c55e', symbol: '◉' },
  { label: 'Mixage', subtitle: 'Volumes et casque', key: 'mix', accent: '#a78bfa', symbol: '☷' },
  { label: 'Export', subtitle: 'Sauvegarde le projet', key: 'export', accent: '#f97316', symbol: '⇧' },
];

export function HomeDashboard() {
  const { setActiveTab, setProject, project } = useStudio();
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');

  const createProject = () => {
    const name = projectName.trim() || `Nouveau projet ${new Date().toLocaleDateString('fr-FR')}`;
    setProject({
      ...project,
      id: `project-${Date.now()}`,
      name,
      tracks: [
        { id: `drums-${Date.now()}`, name: 'Drums', type: 'drums', color: '#8b5cf6', level: 78 },
        { id: `bass-${Date.now()}`, name: 'Bass', type: 'bass', color: '#22c55e', level: 66 },
        { id: `vocals-${Date.now()}`, name: 'Vocals', type: 'vocals', color: '#f59e0b', level: 88 },
        { id: `synth-${Date.now()}`, name: 'Synth', type: 'synth', color: '#38bdf8', level: 55 },
      ],
    });
    setProjectName('');
    setShowNewProject(false);
    setActiveTab('multitrack');
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div>
          <p className="eyebrow">Espace de production</p>
          <h2 style={{ margin: '6px 0 0' }}>Bonjour, bienvenue au studio</h2>
          <p className="status-message">Projet ouvert : {project.name}</p>
        </div>
        <button type="button" className="primary-btn" onClick={() => setShowNewProject((visible) => !visible)}>＋ Nouveau projet</button>
      </div>

      {showNewProject && (
        <div className="new-project-panel">
          <label style={{ display: 'grid', gap: 8 }}>
            <strong>Nom de la nouvelle session</strong>
            <input autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Ex. Mon premier morceau" onKeyDown={(event) => { if (event.key === 'Enter') createProject(); }} />
          </label>
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button type="button" className="primary-btn" onClick={createProject}>Créer la session</button>
            <button type="button" className="secondary-btn" onClick={() => setShowNewProject(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="studio-shortcuts">
        {studioCards.map((studio) => (
          <button key={studio.key} type="button" onClick={() => setActiveTab(studio.key)} className="studio-shortcut" style={{ '--shortcut-accent': studio.accent } as React.CSSProperties}>
            <span className="shortcut-icon" aria-hidden="true">{studio.symbol}</span>
            <span><strong>{studio.label}</strong><small>{studio.subtitle}</small></span>
            <span className="shortcut-arrow" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
