import { useStudio } from '../../context/StudioContext';
import type { StudioTab } from '../../types/daw';

const tabs: { key: StudioTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Accueil', icon: '⌂' },
  { key: 'multitrack', label: 'Pistes', icon: '▥' },
  { key: 'beatmaker', label: 'Beat', icon: '▦' },
  { key: 'piano', label: 'Piano', icon: '♫' },
  { key: 'voice', label: 'Voix', icon: '◉' },
  { key: 'choir', label: 'Chœur', icon: '♫' },
  { key: 'duo', label: 'Duo', icon: '♬' },
  { key: 'mix', label: 'Mix', icon: '☷' },
  { key: 'ai', label: 'IA', icon: '✦' },
  { key: 'export', label: 'Export', icon: '⇧' },
];

export function MobileTabBar() {
  const { activeTab, setActiveTab } = useStudio();

  return (
    <nav className="studio-nav" aria-label="Navigation du studio">
      <div className="studio-nav-scroll">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`studio-nav-item ${tab.key === activeTab ? 'selected' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            aria-current={tab.key === activeTab ? 'page' : undefined}
          >
            <span className="studio-nav-icon" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
