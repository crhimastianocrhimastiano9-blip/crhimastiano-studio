import { useStudio } from '../../context/StudioContext';
import type { StudioTab } from '../../types/daw';

const studioCards: { label: string; subtitle: string; key: StudioTab; accent: string; symbol: string }[] = [
  { label: 'Arrangement', subtitle: 'Pistes & sessions', key: 'multitrack', accent: '#8b5cf6', symbol: '▣' },
  { label: 'Beatmaker', subtitle: 'Rythmes', key: 'beatmaker', accent: '#ec4899', symbol: '▦' },
  { label: 'Piano roll', subtitle: 'Instruments', key: 'piano', accent: '#38bdf8', symbol: '♫' },
  { label: 'Voix', subtitle: 'Micro / prise', key: 'voice', accent: '#22c55e', symbol: '◉' },
  { label: 'Mix', subtitle: 'Volumes & casque', key: 'mix', accent: '#a78bfa', symbol: '☷' },
  { label: 'Export', subtitle: 'Sauvegarder', key: 'export', accent: '#f97316', symbol: '⇧' },
];

export function HomeDashboard() {
  const { project, setActiveTab, setProject } = useStudio();
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleCreateProject = () => {
    const name = projectName.trim() || `Session ${new Date().toLocaleDateString('fr-FR')}`;
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
    <section className="card dashboard-card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p className="eyebrow">Espace de production</p>
          <h2 style={{ margin: '6px 0 0' }}>Bienvenue dans le studio</h2>
        </div>
        <button type="button" className="primary-btn" onClick={() => setShowNewProject((current) => !current)}>
          + Nouveau projet
        </button>
      </div>

      {showNewProject && (
        <div className="new-project-panel">
          <label style={{ display: 'grid', gap: 8 }}>
            <strong>Nom de la session</strong>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Ex. Mon titre 2026"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateProject();
              }}
            />
          </label>
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button type="button" className="primary-btn" onClick={handleCreateProject}>Créer</button>
            <button type="button" className="secondary-btn" onClick={() => setShowNewProject(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="studio-shortcuts">
        {studioCards.map((studio) => (
          <button
            key={studio.key}
            type="button"
            className="studio-shortcut"
            style={{ ['--shortcut-accent' as string]: studio.accent }}
            onClick={() => setActiveTab(studio.key)}
          >
            <span className="shortcut-icon" aria-hidden="true">{studio.symbol}</span>
            <span>
              <strong>{studio.label}</strong>
              <small>{studio.subtitle}</small>
            </span>
            <span className="shortcut-arrow" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
