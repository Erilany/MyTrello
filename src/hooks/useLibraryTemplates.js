import { useState, useEffect } from 'react';

export function useLibraryTemplates() {
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importTemplatesList, setImportTemplatesList] = useState([]);
  const [selectedImportTemplates, setSelectedImportTemplates] = useState([]);
  const [showTemplatesList, setShowTemplatesList] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('c-projets_templates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTemplates(parsed.templates || []);
      } catch (e) {
        console.error('Error loading templates:', e);
      }
    }
  }, []);

  const saveTemplates = newTemplates => {
    setTemplates(newTemplates);
    localStorage.setItem('c-projets_templates', JSON.stringify({ templates: newTemplates }));
  };

  const handleSaveTemplate = (selectedCards, selectedCategories, selectedSubcategories) => {
    if (!templateName.trim()) {
      alert('Veuillez entrer un nom pour le template');
      return;
    }
    if (
      selectedCards.length === 0 &&
      selectedCategories.length === 0 &&
      selectedSubcategories.length === 0
    ) {
      alert('Veuillez sélectionner au moins un élément');
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      created_at: new Date().toISOString(),
      cards: selectedCards.map(c => ({
        id: c.id,
        title: c.title,
        tags: c.tags,
        content_json: c.content_json,
      })),
      categories: selectedCategories.map(c => ({
        title: c.title,
        cardTitle: c.cardTitle,
        content_json: c.content_json,
      })),
      subcategories: selectedSubcategories.map(s => ({
        title: s.title,
        categoryTitle: s.categoryTitle,
        cardTitle: s.cardTitle,
        content_json: s.content_json,
      })),
    };

    saveTemplates([...templates, newTemplate]);
    setTemplateName('');
    setShowTemplateModal(false);
    alert('Template sauvegardé !');
  };

  const handleLoadTemplate = (template, setSelectedCards, setSelectedCategories, setSelectedSubcategories) => {
    setSelectedCards(template.cards || []);
    setSelectedCategories(template.categories || []);
    setSelectedSubcategories(template.subcategories || []);
    setShowTemplatesList(false);
  };

  const handleDeleteTemplate = templateId => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce template ?')) return;
    saveTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleExportTemplates = () => {
    if (templates.length === 0) {
      alert('Aucun template à exporter');
      return;
    }
    const dataStr = JSON.stringify({ templates }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'c-projets-templates.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.templates && Array.isArray(data.templates)) {
          setImportTemplatesList(data.templates);
          setImportFile(file);
        } else {
          alert('Format de fichier invalide');
        }
      } catch {
        alert('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (selectedImportTemplates.length === 0) {
      alert('Veuillez sélectionner au moins un template à importer');
      return;
    }
    const templatesToImport = importTemplatesList.filter(t =>
      selectedImportTemplates.includes(t.id)
    );
    const newTemplates = templatesToImport.map(t => ({
      ...t,
      id: Date.now() + Math.random(),
      created_at: new Date().toISOString(),
    }));
    saveTemplates([...templates, ...newTemplates]);
    setShowImportModal(false);
    setImportFile(null);
    setImportTemplatesList([]);
    setSelectedImportTemplates([]);
    alert(`${newTemplates.length} template(s) importé(s) !`);
  };

  const toggleImportTemplate = templateId => {
    setSelectedImportTemplates(prev =>
      prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]
    );
  };

  return {
    templates,
    showTemplateModal, setShowTemplateModal,
    templateName, setTemplateName,
    showImportModal, setShowImportModal,
    importFile,
    importTemplatesList,
    selectedImportTemplates,
    showTemplatesList, setShowTemplatesList,
    handleSaveTemplate,
    handleLoadTemplate,
    handleDeleteTemplate,
    handleExportTemplates,
    handleImportFileSelect,
    handleConfirmImport,
    toggleImportTemplate,
  };
}
