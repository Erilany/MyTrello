import { useState } from 'react';
import { mergeExportData } from '../services/migration';

const EMPTY_MERGE_STATE = {
  userA: null,
  userB: null,
  userAFile: null,
  userBFile: null,
  conflicts: [],
  resolved: {},
  merged: null,
  step: null,
};

export function useDataMerge() {
  const [mergeState, setMergeState] = useState({
    userA: null,
    userB: null,
    userAFile: null,
    userBFile: null,
    conflicts: [],
    resolved: {},
  });

  const handleMergeFileSelect = user => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target?.result);
          if (user === 'A') {
            setMergeState(prev => ({ ...prev, userA: data, userAFile: file.name }));
          } else {
            setMergeState(prev => ({ ...prev, userB: data, userBFile: file.name }));
          }
        } catch (err) {
          alert('Erreur lors de la lecture du fichier: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleMerge = () => {
    if (!mergeState.userA || !mergeState.userB) {
      alert('Veuillez sélectionner les deux fichiers à fusionner');
      return;
    }

    const result = mergeExportData(mergeState.userA, mergeState.userB);
    setMergeState(prev => ({
      ...prev,
      conflicts: result.conflicts,
      merged: result.merged,
      userAName: result.userAName,
      userBName: result.userBName,
      step: 'resolve',
    }));
  };

  const handleResolveConflict = (index, choice) => {
    setMergeState(prev => ({
      ...prev,
      resolved: { ...prev.resolved, [index]: choice },
    }));
  };

  const handleDownloadMerged = () => {
    const { merged, conflicts, resolved } = mergeState;

    if (conflicts.length > 0 && Object.keys(resolved).length < conflicts.length) {
      alert('Veuillez résoudre tous les conflits avant de télécharger');
      return;
    }

    let finalData = JSON.parse(JSON.stringify(merged));

    if (conflicts.length > 0) {
      conflicts.forEach((conflict, index) => {
        if (resolved[index] === 'A') {
          const target =
            finalData.databases.core[conflict.type] ||
            finalData.databases[conflict.type] ||
            finalData.projects;
          const item = target?.find(t => t.id === conflict.id);
          if (item) {
            item.source = mergeState.userAName;
            Object.assign(item, conflict.userA.data);
          }
        } else if (resolved[index] === 'B') {
          const target =
            finalData.databases.core[conflict.type] ||
            finalData.databases[conflict.type] ||
            finalData.projects;
          const item = target?.find(t => t.id === conflict.id);
          if (item) {
            item.source = mergeState.userBName;
            Object.assign(item, conflict.userB.data);
          }
        }
      });
    }

    const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mytrello-merged-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMergeState({ ...EMPTY_MERGE_STATE });
  };

  const handleResetMerge = () => {
    setMergeState({ ...EMPTY_MERGE_STATE });
  };

  return {
    mergeState,
    handleMergeFileSelect,
    handleMerge,
    handleResolveConflict,
    handleDownloadMerged,
    handleResetMerge,
  };
}
