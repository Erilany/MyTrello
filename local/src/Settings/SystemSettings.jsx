import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  HardDrive,
  Database,
  Clock,
  BookOpen,
  FileText,
  Building,
} from 'lucide-react';
import LibraryEditor from './LibraryEditor';
import { DataTable } from './DataTable';
import ChaptersDragDrop from './ChaptersDragDrop';
import ContractsSettings from './ContractsSettings';
import EntreprisesTab from './EntreprisesTab';
import {
  loadGMRData,
  addGMRItem,
  updateGMRItem,
  deleteGMRItem,
  defaultGMRData,
} from '../data/GMRData';
import {
  loadPriorityData,
  addPriorityItem,
  updatePriorityItem,
  deletePriorityItem,
  resetPriorityData,
} from '../data/PriorityData';
import { loadZonesData, addZoneItem, updateZoneItem, deleteZoneItem } from '../data/ZonesData';
import { loadTagsData, addTag, updateTag, deleteTag, resetTagsData } from '../data/TagsData';
import { getOrderedChapters, saveChaptersOrder } from '../data/ChaptersData';

const AVAILABLE_FUNCTIONS = [
  'Manager de projets',
  'Chargé(e) de Concertation',
  "Chargé(e) d'Etudes LA",
  "Chargé(e) d'Etudes LS",
  "Chargé(e) d'Etudes Poste HT",
  "Chargé(e) d'Etudes Poste BT et CC",
  "Chargé(e) d'Etudes SPC",
  'Contrôleur Travaux',
  'Assistant(e) Etudes',
];

function SystemSettings() {
  const [activeTab, setActiveTab] = useState('database');

  const [gmrData, setGmrData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [zonesData, setZonesData] = useState([]);
  const [tagsData, setTagsData] = useState([]);
  const [chaptersOrder, setChaptersOrder] = useState([]);

  useEffect(() => {
    setGmrData(loadGMRData());
    setPriorityData(loadPriorityData());
    setZonesData(loadZonesData());
    setTagsData(loadTagsData());
    setChaptersOrder(getOrderedChapters());
  }, []);

  useEffect(() => {
    const handleLibraryChange = () => {
      setChaptersOrder(getOrderedChapters());
    };

    window.addEventListener('storage', handleLibraryChange);
    const interval = setInterval(handleLibraryChange, 2000);

    return () => {
      window.removeEventListener('storage', handleLibraryChange);
      clearInterval(interval);
    };
  }, []);

  const handleChaptersReorder = newOrder => {
    saveChaptersOrder(newOrder);
    setChaptersOrder(newOrder);
  };

  const tabs = [
    { id: 'database', label: 'Base de données', icon: Database },
    { id: 'storage', label: 'Stockage', icon: HardDrive },
    { id: 'backup', label: 'Sauvegarde auto', icon: Clock },
    { id: 'library', label: 'Modèles Bibliothèque', icon: BookOpen },
    { id: 'contracts', label: 'Contrats', icon: FileText },
    { id: 'entreprises', label: 'Annuaire Entreprises', icon: Building },
  ];

  const gmrColumns = [
    { key: 'code', label: 'Identifiant', maxLength: 4, placeholder: '4 caractères max' },
    { key: 'label', label: 'Libellé' },
  ];

  const priorityColumns = [{ key: 'label', label: 'Libellé' }];

  const zonesColumns = [{ key: 'label', label: 'Libellé' }];

  const tagsColumns = [
    { key: 'name', label: 'Nom du tag' },
    { key: 'color', label: 'Couleur', isColor: true },
    { key: 'functions', label: 'Fonctions', isMultiSelect: true },
  ];

  const tagsMultiSelectOptions = {
    functions: AVAILABLE_FUNCTIONS,
  };

  const handleGMRAdd = values => addGMRItem(values.code, values.label);
  const handleGMRUpdate = (id, values) => {
    const data = loadGMRData();
    const item = data.find(i => (i.id || i.code) === id);
    if (!item) return data;
    return updateGMRItem(item.code, values.code, values.label);
  };
  const handleGMRDelete = code => {
    const data = deleteGMRItem(code);
    setGmrData(data);
    return data;
  };

  const handlePriorityAdd = values => addPriorityItem(values.label);
  const handlePriorityUpdate = (id, values) => {
    const data = loadPriorityData();
    const item = data.find(i => i.id === id);
    if (!item) return data;
    return updatePriorityItem(item.id, values.label);
  };
  const handlePriorityDelete = id => {
    const data = deletePriorityItem(id);
    setPriorityData(data);
    return data;
  };
  const handlePriorityReset = () => {
    const data = resetPriorityData();
    setPriorityData(data);
    return data;
  };

  const handleZoneAdd = values => addZoneItem(values.label);
  const handleZoneUpdate = (id, values) => {
    const data = loadZonesData();
    const item = data.find(i => i.id === id);
    if (!item) return data;
    return updateZoneItem(item.id, values.label);
  };
  const handleZoneDelete = id => {
    const data = deleteZoneItem(id);
    setZonesData(data);
    return data;
  };

  const handleTagAdd = values => {
    const data = addTag(values.name, values.color, values.functions || []);
    setTagsData(data);
    return data;
  };
  const handleTagUpdate = (id, values) => {
    const data = updateTag(id, values.name, values.color, values.functions || []);
    setTagsData(data);
    return data;
  };
  const handleTagDelete = id => {
    const data = deleteTag(id);
    setTagsData(data);
    return data;
  };
  const handleTagReset = () => {
    const data = resetTagsData();
    setTagsData(data);
    return data;
  };

  useEffect(() => {
    setGmrData(loadGMRData());
    setPriorityData(loadPriorityData());
    setZonesData(loadZonesData());
    setTagsData(loadTagsData());
  }, [activeTab]);

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
              <div className="flex items-center gap-3 mb-6">
                <Database size={24} className="text-accent" />
                <h2 className="text-xl font-semibold text-primary">Bases de données</h2>
              </div>

              <div className="mb-6 p-4 bg-card rounded-lg border border-std">
                <h3 className="text-sm font-semibold text-primary mb-3">Chapitres</h3>
                <p className="text-xs text-muted mb-3">
                  Faites glisser les chapitres pour les réorganiser. Les modifications sont
                  synchronisées avec la bibliothèque.
                </p>
                <ChaptersDragDrop chapters={chaptersOrder} onReorder={handleChaptersReorder} />
              </div>

              <div className="space-y-6">
                <DataTable
                  title="GMR"
                  data={gmrData}
                  onAdd={handleGMRAdd}
                  onUpdate={handleGMRUpdate}
                  onDelete={handleGMRDelete}
                  columns={gmrColumns}
                />

                <DataTable
                  title="Catégorie des projets"
                  data={priorityData}
                  onAdd={handlePriorityAdd}
                  onUpdate={handlePriorityUpdate}
                  onDelete={handlePriorityDelete}
                  onReset={handlePriorityReset}
                  columns={priorityColumns}
                  canReset={true}
                />

                <DataTable
                  title="Zones"
                  data={zonesData}
                  onAdd={handleZoneAdd}
                  onUpdate={handleZoneUpdate}
                  onDelete={handleZoneDelete}
                  columns={zonesColumns}
                />

                <DataTable
                  title="Tag Revue d'activité"
                  data={tagsData}
                  onAdd={handleTagAdd}
                  onUpdate={handleTagUpdate}
                  onDelete={handleTagDelete}
                  onReset={handleTagReset}
                  columns={tagsColumns}
                  canReset={true}
                  multiSelectOptions={tagsMultiSelectOptions}
                />
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

          {activeTab === 'contracts' && <ContractsSettings />}

          {activeTab === 'entreprises' && <EntreprisesTab />}
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
