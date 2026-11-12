import { useStudio } from '../../context/StudioContext';
import type { StudioTab } from '../../types/daw';

const tabs: { key: StudioTab; label: string }[] = [
  { key: 'home', label: 'Accueil' },
  { key: 'multitrack', label: 'Multitrack' },
  { key: 'beatmaker', label: 'Beat' },
  { key: 'voice', label: 'Voix' },
  { key: 'mix', label: 'Mix' },
  { key: 'ai', label: 'IA' },
  { key: 'export', label: 'Export' },
];

export function MobileTabBar() {
  const { activeTab, setActiveTab } = useStudio();

  return (
    <nav className="card" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', overflowX: 'auto', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab(tab.key)}
            style={{ flex: '1 1 120px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
