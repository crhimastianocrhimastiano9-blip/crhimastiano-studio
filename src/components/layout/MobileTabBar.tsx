import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { StudioTab } from '../../types/daw';
import { Home, Layers, Drum, Mic, Sliders, Sparkles } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useStudio();

  const tabs: { id: StudioTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'multitrack', label: 'Pistes', icon: Layers },
    { id: 'beatmaker', label: 'Rythmes', icon: Drum },
    { id: 'voice', label: 'Voix', icon: Mic },
    { id: 'mixer', label: 'Mixeur', icon: Sliders },
    { id: 'ai_assistant', label: 'IA Studio', icon: Sparkles },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0C10]/95 backdrop-blur-md border-t border-[#222938] px-2 py-1 select-none">
      <div className="grid grid-cols-6 items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all cursor-pointer ${
                isActive ? 'text-[#F5D77F]' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap truncate max-w-[55px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1 bg-[#14B8A6] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
