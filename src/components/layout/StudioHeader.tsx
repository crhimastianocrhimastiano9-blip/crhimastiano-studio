import { useStudio } from '../../context/StudioContext';

export function StudioHeader() {
  const { project } = useStudio();

  return (
    <header className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a5b4fc' }}>Crhimastiano</p>
        <h1 style={{ margin: '6px 0 0', fontSize: '2rem' }}>{project.name}</h1>
      </div>
      <button type="button" className="primary-btn">
        Nouveau projet
      </button>
    </header>
  );
}
