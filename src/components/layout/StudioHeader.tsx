import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { StudioTab } from '../../types/daw';
import { Download } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const StudioHeader: React.FC = () => {
  const { activeTab, setActiveTab, project } = useStudio();

  const navItems: { id: StudioTab; label: string }[] = [
    { id: 'home', label: 'Accueil' },
    { id: 'multitrack', label: 'Studio Multipiste' },
    { id: 'beatmaker', label: 'Beat Maker' },
    { id: 'voice', label: 'Studio Vocal' },
    { id: 'mixer', label: 'Mixage & Master' },
    { id: 'ai_assistant', label: 'Assistant IA' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-5 py-3 border-b border-[#222938] bg-[#0A0C10]/95 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('home')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-[#F5D77F] via-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent whitespace-nowrap">
            CRHIMASTIANO STUDIO
          </span>
          <span className="hidden sm:inline-block ml-2 text-[11px] text-[#14B8A6] font-mono tracking-widest font-semibold uppercase">
            DAW PRO
          </span>
        </button>
      </div>

      {/* Zone 2: Single-line Text Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer text-xs font-semibold ${
                isActive
                  ? 'text-[#F5D77F]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action & Quick Info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span className="text-neutral-300 font-medium max-w-[130px] truncate">
            {project.name}
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="text-[#14B8A6] font-bold">{project.bpm} BPM</span>
        </div>

        <PWAInstallButton />

        <button
          onClick={() => setActiveTab('export')}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#0A0C10] bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] hover:from-[#FFF1B8] hover:to-[#E5C158] rounded-md transition-all shadow-md shadow-[#D4AF37]/15 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter Audio</span>
        </button>
      </div>
    </header>
  );
};
