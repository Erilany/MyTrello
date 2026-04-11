import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  X,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Users,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Layers,
  FileText,
  Link,
  AlertCircle,
} from 'lucide-react';


import { pageGuides } from '../../data/guideData';

function GuidePanel() {
  const { toggleGuide, selectedCard, selectedCategory, selectedSubcategory } = useApp();
  const location = useLocation();
  const [selectedGuide, setSelectedGuide] = React.useState(null);

  const getCurrentGuide = () => {
    if (selectedGuide) {
      return pageGuides[selectedGuide];
    }
    if (location.pathname === '/') {
      return pageGuides.introduction;
    }
    if (selectedSubcategory) {
      return pageGuides.subcategory;
    }
    if (selectedCategory) {
      return pageGuides.category;
    }
    if (selectedCard) {
      return pageGuides.card;
    }

    const path = location.pathname;
    if (path.startsWith('/board') || path.startsWith('/board2')) {
      return pageGuides.board;
    }
    if (path === '/library') {
      return pageGuides.library;
    }
    if (path === '/archives') {
      return pageGuides.archives;
    }
    if (path === '/system-settings') {
      return pageGuides.systemSettings;
    }
    if (path === '/settings') {
      return pageGuides.userSettings;
    }
    return pageGuides.dashboard;
  };

  const currentGuide = getCurrentGuide();
  const firstSectionId = currentGuide?.sections[0]?.id;
  const [expandedSection, setExpandedSection] = React.useState(firstSectionId);

  const toggleSection = section => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const guideOptions = [
    { key: 'introduction', label: 'Guide C-PRojeTs' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'board', label: 'Projet' },
    { key: 'library', label: 'Bibliothèque' },
    { key: 'archives', label: 'Archives' },
    { key: 'userSettings', label: 'Paramètres' },
    { key: 'systemSettings', label: 'Paramètres Système' },
  ];

  const handleGuideChange = key => {
    if (key === 'introduction') {
      setSelectedGuide('introduction');
    } else {
      setSelectedGuide(key);
    }
  };

  return (
    <div className="guide-panel absolute right-0 top-14 w-[320px] h-[calc(100%-3.5rem)] bg-card border-l border-std flex flex-col z-40">
      <div className="flex items-center justify-between p-4 border-b border-std bg-card-hover">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          <select
            value={
              selectedGuide ||
              (location.pathname === '/'
                ? 'introduction'
                : location.pathname.startsWith('/board')
                  ? 'board'
                  : location.pathname === '/library'
                    ? 'library'
                    : location.pathname === '/archives'
                      ? 'archives'
                      : location.pathname === '/settings'
                        ? 'userSettings'
                        : location.pathname === '/system-settings'
                          ? 'systemSettings'
                          : 'dashboard')
            }
            onChange={e => handleGuideChange(e.target.value)}
            className="bg-card text-primary font-semibold cursor-pointer focus:outline-none rounded px-2 py-1 border border-std"
          >
            {guideOptions.map(opt => (
              <option key={opt.key} value={opt.key} className="bg-card text-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={toggleGuide}
          className="p-1 text-muted hover:text-primary rounded hover:bg-card transition-std"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {currentGuide.sections.map(section => (
            <div key={section.id} className="border border-std rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 p-3 bg-card-hover hover:bg-card-hover/70 transition-std text-left"
              >
                <span className="flex-1 font-medium text-primary">{section.title}</span>
                {expandedSection === section.id ? (
                  <ChevronDown size={16} className="text-muted" />
                ) : (
                  <ChevronRight size={16} className="text-muted" />
                )}
              </button>
              {expandedSection === section.id && (
                <div className="p-3 bg-card border-t border-std">{section.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-std bg-card-hover">
        <p className="text-xs text-muted text-center">Guide contextuel - Cliquez pour agrandir</p>
      </div>
    </div>
  );
}

export default GuidePanel;
