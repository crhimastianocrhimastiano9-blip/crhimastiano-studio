import { useStudio } from '../../context/StudioContext';
import type { StudioTab } from '../../types/daw';

const tabs: { key: StudioTab; label: string }[] = [
  { key: 'home', label: 'Accueil' },
  { key: 'multitrack', label: 'Multitrack' },
  { key: 'beatmaker', label: 'Beatmaker' },
  { key: 'piano', label: 'Piano' },
  { key: 'voice', label: 'Voix' },
  { key: 'choir', label: 'Chœur' },
  { key: 'duo', label: 'Duo' },
  { key: 'mix', label: 'Mix' },
  { key: 'ai', label: 'IA' },
  { key: 'export', label: 'Export' },
];

export function MobileTabBar() {
  const { activeTab, setActiveTab } = useStudio();

  return (
    <nav className="card" aria-label="Navigation des studios" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab(tab.key)}
            aria-current={tab.key === activeTab ? 'page' : undefined}
            style={{ flex: '0 0 auto', minHeight: 44 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
