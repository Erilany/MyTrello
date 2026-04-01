import React from 'react';
import { Flag } from 'lucide-react';

export default function MilestoneList({ milestones, allSubcategories, onToggle, onTaskClick }) {
  if (milestones.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-std p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Flag size={20} className="text-orange-500" />
          Mes jalons
        </h2>
        <span className="text-xs text-muted">
          {milestones.filter(m => !m.milestone.done).length} en cours /{' '}
          {milestones.filter(m => m.milestone.done).length} terminés
        </span>
      </div>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-std">
              <th className="text-left py-2 px-3 text-muted font-medium">Statut</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Jalon</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map(({ milestone, category, card, board }, idx) => (
              <tr
                key={'m' + milestone.id + '-' + idx}
                className={`border-b border-std ${milestone.done ? 'opacity-60' : 'hover:bg-card-hover cursor-pointer'}`}
                onClick={() => {
                  const sub = allSubcategories.find(
                    s => Number(s.id) === Number(milestone.subcategoryId)
                  );
                  if (sub) onTaskClick(sub);
                }}
              >
                <td className="py-2 px-3">
                  <input
                    type="checkbox"
                    checked={milestone.done}
                    onChange={e => onToggle(e, milestone)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-std text-accent cursor-pointer"
                  />
                </td>
                <td
                  className={`py-2 px-3 ${milestone.done ? 'line-through text-muted' : 'text-primary'}`}
                >
                  {board?.title || '-'}
                </td>
                <td
                  className={`py-2 px-3 ${milestone.done ? 'line-through text-muted' : 'text-secondary'}`}
                >
                  {card?.title || '-'}
                </td>
                <td
                  className={`py-2 px-3 font-medium ${milestone.done ? 'line-through text-muted' : 'text-primary'}`}
                >
                  {milestone.title}
                </td>
                <td
                  className={`py-2 px-3 ${milestone.done ? 'line-through text-muted' : 'text-muted'}`}
                >
                  {milestone.date
                    ? new Date(milestone.date).toLocaleDateString('fr-FR')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
