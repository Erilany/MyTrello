import React from 'react';
import { Clock, ChevronDown, RotateCcw } from 'lucide-react';
import { getWeekRange } from '../../shared/utils';

export default function TimeTab({
  projectTimeData,
  selectedWeek,
  setSelectedWeek,
  weekOptions,
  onResetTime,
}) {
  return (
    <div className="bg-card rounded-lg border border-std p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Clock size={20} className="text-accent" />
          Temps passé par projet (semaine sélectionnée)
        </h2>
        <div className="flex items-center gap-2">
          <ChevronDown size={16} className="text-muted" />
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            className="px-3 py-1.5 text-sm bg-input border border-std rounded text-primary"
          >
            {weekOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-muted mb-4">
        Ce graphique affiche le pourcentage de temps passé sur chaque projet cette semaine. Le
        chrono démarre automatiquement quand vous sélectionnez un projet et continue même si
        vous changez d'onglet ou si l'application est minimisée.
      </p>

      {projectTimeData.length === 0 ? (
        <p className="text-secondary text-sm py-4">Aucun projet trouvé</p>
      ) : (
        <div className="space-y-3">
          {projectTimeData.map(({ board, time, percentage, eotp }) => (
            <div key={board.id} className="flex items-center gap-4">
              <div className="w-32 text-xs font-mono text-secondary truncate" title={eotp}>
                {eotp || '-'}
              </div>
              <div className="w-[380px] text-sm text-primary truncate" title={board.title}>
                {board.title}
              </div>
              <div className="flex-1 h-6 bg-card-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm font-medium text-primary">
                {time > 0 ? `${Math.round(percentage)}%` : '-'}
              </div>
              <button
                onClick={() => onResetTime(String(board.id))}
                className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Réinitialiser le temps cette semaine"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
