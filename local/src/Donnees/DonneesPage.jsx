import React, { useState, useEffect } from 'react';
import LibraryPanel from '../Library/LibraryPanel';
import ContractsView from './ContractsView';
import { Library, FileText, FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DonneesPage() {
  const { loadLibrary } = useApp();
  const [activeTab, setActiveTab] = useState('bibliotheque');

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const tabs = [
    { id: 'bibliotheque', label: 'Bibliothèque', icon: Library },
    { id: 'contrats', label: 'Contrats', icon: FileText },
  ];

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center">
        <FolderOpen size={28} className="mr-2" />
        Ressources
      </h1>

      <div className="bg-card rounded-lg border border-std">
        <div className="flex border-b border-std">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 transition-std ${
                  isActive
                    ? 'bg-card border-b-2 border-b-accent text-accent'
                    : 'text-secondary hover:bg-card-hover'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-0">
          {activeTab === 'bibliotheque' && <LibraryPanel standalone={true} />}
          {activeTab === 'contrats' && <ContractsView />}
        </div>
      </div>
    </div>
  );
}
