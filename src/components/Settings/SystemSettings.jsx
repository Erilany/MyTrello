import React from 'react';
import { Settings as SettingsIcon, HardDrive, Database, Clock } from 'lucide-react';

function SystemSettings() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center">
        <SettingsIcon size={28} className="mr-2" />
        Paramètres système
      </h1>

      <div className="bg-card rounded-lg border border-std p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-primary">Base de données</h2>
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

      <div className="bg-card rounded-lg border border-std p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-primary">Stockage</h2>
        </div>
        <p className="text-sm text-secondary mb-4">
          Cette section sera disponible dans une future mise à jour.
        </p>
        <div className="space-y-2 opacity-50">
          <div className="flex items-center justify-between p-3 bg-card-hover rounded">
            <span className="text-sm text-primary">Cache</span>
            <span className="text-sm text-muted">-</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-card-hover rounded">
            <span className="text-sm text-primary">Fichiers temporaires</span>
            <span className="text-sm text-muted">-</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-std p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-primary">Sauvegarde automatique</h2>
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
    </div>
  );
}

export default SystemSettings;
