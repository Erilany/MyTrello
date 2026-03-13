import React, { useState } from 'react';
import { Settings as SettingsIcon, HardDrive, Database, Clock, BookOpen } from 'lucide-react';
import LibraryEditor from './LibraryEditor';

function SystemSettings() {
  const [activeTab, setActiveTab] = useState('database');

  const tabs = [
    { id: 'database', label: 'Base de données', icon: Database },
    { id: 'storage', label: 'Stockage', icon: HardDrive },
    { id: 'backup', label: 'Sauvegarde auto', icon: Clock },
    { id: 'library', label: 'Modèles Bibliothèque', icon: BookOpen },
  ];

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center">
        <SettingsIcon size={28} className="mr-2" />
        Paramètres système
      </h1>

      <div className="bg-card rounded-lg border border-std min-h-[calc(100vh-180px)]">
        <div className="flex border-b border-std">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 transition-std ${
                  isActive
                    ? 'bg-card border-b-2 border-b-accent text-accent'
                    : 'text-secondary hover:bg-card-hover'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'database' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Database size={24} className="text-accent" />
                <h2 className="text-xl font-semibold text-primary">Base de données</h2>
              </div>
              <p className="text-sm text-secondary mb-4">
                Cette section sera disponible dans une future mise à jour.
              </p>
              <div className="space-y-2 opacity-50">
                <div className="flex items-center justify-between p-3 bg-card-hover rounded">
                  <span className="text-sm text-primary">Type de base</span>
                  <span className="text-sm text-muted">LocalStorage</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card-hover rounded">
                  <span className="text-sm text-primary">Taille utilisée</span>
                  <span className="text-sm text-muted">-</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <HardDrive size={24} className="text-accent" />
                <h2 className="text-xl font-semibold text-primary">Stockage</h2>
              </div>
              <p className="text-sm text-secondary mb-4">
                Cette section sera disponible dans une future mise à jour.
              </p>
              <div className="space-y-2 opacity-50">
                <div className="flex items-center justify-between p-3 bg-card-hover rounded">
                  <span className="text-sm text-primary">Capacité</span>
                  <span className="text-sm text-muted">5 MB</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card-hover rounded">
                  <span className="text-sm text-primary">Utilisé</span>
                  <span className="text-sm text-muted">-</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={24} className="text-accent" />
                <h2 className="text-xl font-semibold text-primary">Sauvegarde automatique</h2>
              </div>
              <p className="text-sm text-secondary mb-4">
                Cette section sera disponible dans une future mise à jour.
              </p>
              <div className="space-y-2 opacity-50">
                <div className="flex items-center justify-between p-3 bg-card-hover rounded">
                  <span className="text-sm text-primary">Intervalle</span>
                  <span className="text-sm text-muted">-</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card-hover rounded">
                  <span className="text-sm text-primary">Destination</span>
                  <span className="text-sm text-muted">-</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="h-full -m-6">
              <LibraryEditor />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
