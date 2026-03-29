import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import SubCategoryModal from '../SubCategory/SubCategoryModal';
import ActivityReview from './ActivityReview';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Circle,
  PlayCircle,
  Users,
  ChevronDown,
  ChevronRight,
  BarChart3,
  ListTodo,
  Activity,
  RotateCcw,
  Flag,
} from 'lucide-react';

function formatSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatPercentage(value, total) {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function getStatusColor(status) {
  switch (status) {
    case 'done':
      return 'bg-green-500';
    case 'waiting':
      return 'bg-blue-500';
    case 'todo':
      return 'bg-red-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'blocked':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'done':
      return 'Terminé';
    case 'in_progress':
      return 'En cours';
    case 'waiting':
      return 'En attente';
    case 'todo':
      return 'À faire';
    default:
      return 'Pas encore';
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    default:
      return 'text-blue-500';
  }
}

function getPriorityLabel(priority) {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'Haute';
    default:
      return 'Normale';
  }
}

function getTaskProgress(status) {
  switch (status) {
    case 'done':
      return 100;
    case 'in_progress':
      return 50;
    case 'waiting':
      return 25;
    case 'todo':
      return 0;
    default:
      return 0;
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
    .toString()
    .padStart(2, '0')}`;
}

function getWeekRange(weekStr) {
  const [year, week] = weekStr.split('-W').map(Number);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const start = new Date(simple);
  if (dow <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
  else start.setDate(simple.getDate() + 8 - simple.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function getUpcomingTasks(subcategories, categories, cards, boards, columns, username, days) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const result = subcategories
    .filter(sub => {
      if (!sub.due_date) return false;
      const dueDate = new Date(sub.due_date);
      return dueDate >= now && dueDate <= futureDate;
    })
    .map(sub => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
      const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
      const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
      return { ...sub, category, card, board };
    })
    .filter(task => task.board)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return result;
}


function getUpcomingMilestones(subcategories, categories, cards, boards, columns, days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const milestonesList = [];

  subcategories.forEach(sub => {
    let milestones = sub.milestones;
    if (typeof milestones === 'string') {
      try { milestones = JSON.parse(milestones); } catch (e) { milestones = []; }
    }
    if (!Array.isArray(milestones)) return;

    milestones.forEach(m => {
      if (m.date) {
        const milestoneDate = new Date(m.date);
        if (milestoneDate >= now && milestoneDate <= futureDate && !m.done) {
          const category = categories.find(c => Number(c.id) === Number(sub.category_id));
          const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
          const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
          const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
          milestonesList.push({
            milestone: { ...m, subcategoryId: sub.id, subcategoryTitle: sub.title },
            category,
            card,
            board,
          });
        }
      }
    });
  });

  return milestonesList.sort((a, b) => new Date(a.milestone.date) - new Date(b.milestone.date));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    boards,
    cards,
    categories,
    subcategories,
    currentUsername,
    getProjectTime,
    getAllProjectTime,
    loadProjectTime,
    getWeekNumber,
    setSelectedCard,
    loadBoard,
    db,
  } = useApp();

  // Load all data from localStorage for dashboard
  const STORAGE_KEY = 'd-projet_db';
  const [storageData, setStorageData] = useState(null);
  const loadStorageData = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      setStorageData(JSON.parse(data));
    }
  };
  useEffect(() => {
    loadStorageData();
    const handleStorageChange = () => loadStorageData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Also refresh when tab becomes active
  useEffect(() => {
    const handleFocus = () => loadStorageData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Use storage data if available, otherwise fallback to db
  const allBoards = storageData?.boards || db?.boards || boards;
  const allCards = storageData?.cards || db?.cards || cards;
  const allCategories = storageData?.categories || db?.categories || categories;
  const allSubcategories = storageData?.subcategories || db?.subcategories || subcategories;
  const allColumns = storageData?.columns || db?.columns || [];

  const [selectedWeek, setSelectedWeek] = useState(() => getWeekNumber(new Date()));
  const [timeRange, setTimeRange] = useState('week');
  const [showMyTasks, setShowMyTasks] = useState(true);
  const [showOtherTasks, setShowOtherTasks] = useState(false);
  const [selectedProjectForOthers, setSelectedProjectForOthers] = useState(null);
  const [selectedTaskDashboard, setSelectedTaskDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('time');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState({});

  const handleTaskClick = task => {
    setSelectedTaskDashboard(task);
  };

  const handleCloseTask = () => {
    setSelectedTaskDashboard(null);
  };

  const handleDueDateClick = (e, task) => {
    e.stopPropagation();
    if (task.board?.id) {
      localStorage.setItem('d-projet_open_tab', 'planning');
      loadBoard(task.board.id);
      navigate('/board');
    }
  };

  const resetProjectTime = projectId => {
    if (!window.confirm('Réinitialiser le temps pour ce projet cette semaine ?')) return;
    const timeData = loadProjectTime();
    const currentWeek = getWeekNumber(new Date());
    if (timeData[currentWeek] && timeData[currentWeek][projectId] !== undefined) {
      timeData[currentWeek][projectId] = 0;
      localStorage.setItem('d-projet_project_time', JSON.stringify(timeData));
      setRefreshKey(k => k + 1);
    }
  };

     const upcomingMilestones = useMemo(() => {
     const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 180;
     return getUpcomingMilestones(
       allSubcategories,
       allCategories,
       allCards,
       allBoards,
       allColumns,
       days
     );
   }, [allSubcategories, allCategories, allCards, allBoards, allColumns, timeRange]);

const getOtherTasksFiltered = () => {
    let tasks = otherTasks;
    if (selectedProjectForOthers) {
      tasks = tasks.filter(t => Number(t.board?.id) === Number(selectedProjectForOthers));
    }

    const groups = {};
    tasks.forEach(task => {
      const boardId = task.board?.id || 'unassigned';
      if (!groups[boardId]) {
        groups[boardId] = {
          board: task.board,
          tasks: [],
        };
      }
      groups[boardId].tasks.push(task);
    });

    Object.keys(groups).forEach(boardId => {
      groups[boardId].tasks.sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
        const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
        return dateA - dateB;
      });
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (!a.board) return 1;
      if (!b.board) return -1;
      const firstTaskA = a.tasks[0];
      const firstTaskB = b.tasks[0];
      const dateA = firstTaskA?.due_date ? new Date(firstTaskA.due_date) : new Date('9999-12-31');
      const dateB = firstTaskB?.due_date ? new Date(firstTaskB.due_date) : new Date('9999-12-31');
      return dateA - dateB;
    });

    return sortedGroups;
  };

  const toggleProject = boardId => {
    setExpandedProjects(prev => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  const weekOptions = useMemo(() => {
    const timeData = loadProjectTime();
    let weeks = Object.keys(timeData).sort();

    const currentWeek = getWeekNumber(new Date());
    if (!weeks.includes(currentWeek)) {
      weeks.push(currentWeek);
      weeks.sort();
    }

    return weeks.map(week => {
      const range = getWeekRange(week);
      const year = range.start.getFullYear();
      const startStr = range.start.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      });
      const endStr = range.end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return {
        value: week,
        label: `${year} - S${week.split('-W')[1]} (${startStr} - ${endStr})`,
      };
    });
  }, [refreshKey]);

  const projectTimeData = useMemo(() => {
    const allTimes = getAllProjectTime(selectedWeek);
    const totalTime = Object.values(allTimes).reduce((sum, val) => sum + val, 0);

    return boards
      .map(board => {
        const time = allTimes[String(board.id)] || 0;
        const percentage = totalTime > 0 ? (time / totalTime) * 100 : 0;
        const eotpData = JSON.parse(localStorage.getItem(`board-${board.id}-eotp`) || '[]');
        const eotp =
          eotpData.length > 0
            ? eotpData
                .map(l => l.ruo)
                .filter(Boolean)
                .join(', ')
            : '';
        return { board, time, percentage, eotp };
      })
      .filter(item => item.time > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }, [boards, selectedWeek, refreshKey]);

  const maxPercentage = useMemo(() => {
    return Math.max(...projectTimeData.map(p => p.percentage), 0);
  }, [projectTimeData]);

  const tabs = [
    { id: 'time', label: 'Temps passé', icon: Clock },
    { id: 'tasks', label: 'Mes tâches', icon: ListTodo },
    { id: 'activity', label: "Revue d'activité", icon: Activity },
  ];

  const myTasks = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 180;
    const allTasks = getUpcomingTasks(
      allSubcategories,
      allCategories,
      allCards,
      allBoards,
      allColumns,
      currentUsername,
      days
    );
    return allTasks.filter(task => task.assignee === currentUsername);
  }, [
    allSubcategories,
    allCategories,
    allCards,
    allBoards,
    allColumns,
    currentUsername,
    timeRange,
  ]);

  const otherTasks = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 180;
    const tasks = getUpcomingTasks(
      allSubcategories,
      allCategories,
      allCards,
      allBoards,
      allColumns,
      currentUsername,
      days
    );
    return tasks.filter(task => !task.assignee || task.assignee !== currentUsername);
  }, [
    allSubcategories,
    allCategories,
    allCards,
    allBoards,
    allColumns,
    currentUsername,
    timeRange,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-primary mb-6">Dashboard</h1>

      {/* Onglets */}
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

      {/* Contenu des onglets */}
      {activeTab === 'time' && (
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
                    onClick={() => resetProjectTime(String(board.id))}
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
      )}

      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-4">
          {/* Mes tâches */}
          <div className="bg-card rounded-lg border border-std p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                Mes tâches à terminer
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimeRange('week')}
                  className={`px-3 py-1.5 text-sm rounded ${timeRange === 'week' ? 'bg-accent text-white' : 'bg-card-hover text-secondary'}`}
                >
                  7 jours
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-3 py-1.5 text-sm rounded ${timeRange === 'month' ? 'bg-accent text-white' : 'bg-card-hover text-secondary'}`}
                >
                  30 jours
                </button>
                <button
                  onClick={() => setTimeRange('semester')}
                  className={`px-3 py-1.5 text-sm rounded ${timeRange === 'semester' ? 'bg-accent text-white' : 'bg-card-hover text-secondary'}`}
                >
                  6 mois
                </button>
                {!showOtherTasks && (
                  <button
                    onClick={() => setShowOtherTasks(true)}
                    className="px-3 py-1.5 text-sm rounded bg-orange-500 text-white hover:opacity-90"
                  >
                    Afficher autres
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted mb-4">
              Liste des tâches qui vous sont assignées et qui doivent être terminées dans les{' '}
              {timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '180'} prochains jours.
              <br />
              <span className="text-xs">
                Cliquez sur une tâche pour voir ses détails ci-dessous
              </span>
            </p>


            {/* Jalons à venir */}
            {upcomingMilestones.length > 0 && (
              <div className="bg-card rounded-lg border border-std p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <Flag size={20} className="text-orange-500" />
                    Jalons à venir
                  </h2>
                </div>
                <p className="text-sm text-muted mb-4">
                  Liste des jalons avec une date dans les prochains jours.
                </p>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-std">
                        <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Jalon</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingMilestones.map(({ milestone, category, card, board }, idx) => (
                        <tr key={'m'+milestone.id+'-'+idx} className="border-b border-std">
                          <td className="py-2 px-3 text-primary">{board?.title || '-'}</td>
                          <td className="py-2 px-3 text-secondary">{category?.title || '-'}</td>
                          <td className="py-2 px-3 text-primary">{card?.title || '-'}</td>
                          <td className="py-2 px-3 text-primary font-medium">{milestone.title}</td>
                          <td className="py-2 px-3 text-muted">{new Date(milestone.date).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {myTasks.length === 0 ? (
              <p className="text-secondary text-sm py-4">
                Aucune tâche assignée à terminer dans cette période
              </p>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-std">
                      <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                      <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
                      <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                      <th className="text-left py-2 px-3 text-muted font-medium">État</th>
                      <th className="text-left py-2 px-3 text-muted font-medium">Avancement</th>
                      <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
                      <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTasks.map(task => (
                      <tr
                        key={task.id}
                        className="border-b border-std hover:bg-card-hover cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <td className="py-2 px-3 text-primary">{task.board?.title}</td>
                        <td className="py-2 px-3 text-secondary">{task.category?.title}</td>
                        <td className="py-2 px-3 text-primary font-medium">{task.title}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white ${getStatusColor(task.status)}`}
                          >
                            {task.status === 'done' ? (
                              <CheckCircle size={12} />
                            ) : task.status === 'in_progress' ? (
                              <PlayCircle size={12} />
                            ) : (
                              <Circle size={12} />
                            )}
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-card-hover rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  task.status === 'done'
                                    ? 'bg-green-500'
                                    : task.status === 'in_progress'
                                      ? 'bg-blue-500'
                                      : task.status === 'waiting'
                                        ? 'bg-yellow-500'
                                        : 'bg-gray-400'
                                }`}
                                style={{ width: `${task.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted w-8">{task.progress || 0}%</span>
                          </div>
                        </td>
                        <td className={`py-2 px-3 font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </td>
                        <td
                          className="py-2 px-3 text-muted cursor-pointer hover:text-accent"
                          onClick={e => handleDueDateClick(e, task)}
                          title="Cliquez pour ouvrir le planning"
                        >
                          {task.due_date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selected task display */}
            {selectedTaskDashboard && (
              <div className="mt-4 p-4 bg-card-hover rounded-lg border border-std">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-primary">Tâche sélectionnée</h3>
                  <button onClick={handleCloseTask} className="text-muted hover:text-primary">
                    ✕
                  </button>
                </div>
                <SubCategoryModal subcategory={selectedTaskDashboard} onClose={handleCloseTask} />
              </div>
            )}
          </div>

          {/* Autres tâches des projets */}
          {showOtherTasks && (
            <div className="bg-card rounded-lg border border-std p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <Users size={20} className="text-orange-500" />
                  Autres tâches des projets
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOtherTasks(false)}
                    className="px-3 py-1.5 text-sm rounded bg-card-hover text-secondary hover:bg-std"
                  >
                    Masquer
                  </button>
                </div>
              </div>
              {selectedProjectForOthers && (
                <p className="text-sm text-muted mb-2">
                  Projet:{' '}
                  {allBoards.find(b => Number(b.id) === Number(selectedProjectForOthers))?.title}
                  <button
                    onClick={() => setSelectedProjectForOthers(null)}
                    className="ml-2 text-accent hover:underline text-xs"
                  >
                    Voir tous les projets
                  </button>
                </p>
              )}
              <p className="text-sm text-muted mb-4">
                Liste des tâches non assignées ou assignées à d'autres utilisateurs
              </p>

              {getOtherTasksFiltered().length === 0 ? (
                <p className="text-secondary text-sm py-4">Aucune tâche trouvée</p>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-std">
                        <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Assigné à</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">État</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getOtherTasksFiltered().map(group => {
                        const boardId = group.board?.id || 'unassigned';
                        const isExpanded = expandedProjects[boardId] !== false;
                        const taskCount = group.tasks.length;

                        return (
                          <Fragment key={boardId}>
                            <tr
                              className="border-b border-std bg-card-hover cursor-pointer hover:bg-std"
                              onClick={() => toggleProject(boardId)}
                            >
                              <td colSpan={7} className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown size={16} className="text-muted" />
                                  ) : (
                                    <ChevronRight size={16} className="text-muted" />
                                  )}
                                  <span className="font-semibold text-primary">
                                    {group.board?.title || 'Projet non identifié'}
                                  </span>
                                  <span className="text-xs text-muted">
                                    ({taskCount} tâche{taskCount > 1 ? 's' : ''})
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {isExpanded &&
                              group.tasks.map(task => (
                                <tr
                                  key={task.id}
                                  className="border-b border-std hover:bg-card-hover cursor-pointer pl-8"
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <td className="py-2 px-3 pl-12 text-secondary">
                                    {task.category?.title}
                                  </td>
                                  <td className="py-2 px-3 text-primary font-medium">
                                    {task.title}
                                  </td>
                                  <td className="py-2 px-3 text-muted">
                                    {task.assignee || 'Non assigné'}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white ${getStatusColor(task.status)}`}
                                    >
                                      {task.status === 'done' ? (
                                        <CheckCircle size={12} />
                                      ) : task.status === 'in_progress' ? (
                                        <PlayCircle size={12} />
                                      ) : (
                                        <Circle size={12} />
                                      )}
                                      {getStatusLabel(task.status)}
                                    </span>
                                  </td>
                                  <td
                                    className={`py-2 px-3 font-medium ${getPriorityColor(task.priority)}`}
                                  >
                                    {getPriorityLabel(task.priority)}
                                  </td>
                                  <td
                                    className="py-2 px-3 text-muted cursor-pointer hover:text-accent"
                                    onClick={e => handleDueDateClick(e, task)}
                                    title="Cliquez pour ouvrir le planning"
                                  >
                                    {task.due_date}
                                  </td>
                                </tr>
                              ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Selected task display for other tasks */}
              {selectedTaskDashboard && (
                <div className="mt-4 p-4 bg-card-hover rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-primary">Tâche sélectionnée</h3>
                    <button onClick={handleCloseTask} className="text-muted hover:text-primary">
                      ✕
                    </button>
                  </div>
                  <SubCategoryModal subcategory={selectedTaskDashboard} onClose={handleCloseTask} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-card rounded-lg border border-std p-4">
          <ActivityReview
            boards={allBoards}
            categories={allCategories}
            subcategories={allSubcategories}
            columns={allColumns}
            currentUsername={currentUsername}
          />
        </div>
      )}
    </div>
  );
}
