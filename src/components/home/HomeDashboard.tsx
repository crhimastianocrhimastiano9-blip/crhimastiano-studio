import { useStudio } from '../../context/StudioContext';
import type { StudioTab } from '../../types/daw';

const studioCards: { label: string; key: StudioTab; accent: string }[] = [
  { label: 'Multitrack', key: 'multitrack', accent: '#8b5cf6' },
  { label: 'Beatmaker', key: 'beatmaker', accent: '#ec4899' },
  { label: 'Voix', key: 'voice', accent: '#22c55e' },
  { label: 'Chœur', key: 'choir', accent: '#38bdf8' },
  { label: 'Duo', key: 'duo', accent: '#f59e0b' },
  { label: 'Mix', key: 'mix', accent: '#a78bfa' },
  { label: 'IA', key: 'ai', accent: '#10b981' },
  { label: 'Export', key: 'export', accent: '#f97316' },
];

export function HomeDashboard() {
  const { setActiveTab } = useStudio();

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Dashboard</p>
          <h2 style={{ margin: '6px 0 0' }}>Accès direct aux studios</h2>
        </div>
        <button type="button" className="primary-btn">Nouveau projet</button>
      </div>

      <div className="grid-3">
        {studioCards.map((studio) => (
          <button
            key={studio.key}
            type="button"
            onClick={() => setActiveTab(studio.key)}
            className="secondary-btn"
            style={{
              textAlign: 'left',
              padding: '20px 18px',
              borderColor: `${studio.accent}66`,
              background: 'rgba(15, 23, 42, 0.96)',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 999, background: studio.accent, marginBottom: 12 }} />
            <strong>{studio.label}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
