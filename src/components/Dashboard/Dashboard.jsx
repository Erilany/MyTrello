import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import SubCategoryModal from '../SubCategory/SubCategoryModal';
import ActivityReview from './ActivityReview';
import {
  formatSeconds,
  formatPercentage,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getTaskProgress,
  getWeekNumber,
  getWeekRange,
  getUpcomingTasks,
  getUpcomingMilestones,
  getMyMilestones,
  getMyTasks,
  getOtherTasks,
} from './dashboardUtils';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    boards,
    cards,
    categories,
    subcategories,
    username,
    getProjectTime,
    getAllProjectTime,
    loadProjectTime,
    getWeekNumber,
    setSelectedCard,
    loadBoard,
    db,
    toggleMilestone,
    hiddenMilestones,
    addHiddenMilestone,
  } = useApp();

  // Load all data from localStorage for dashboard
  const STORAGE_KEY = 'c-projets_db';
  const [storageData, setStorageData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekNumber(new Date()));
  const [timeRange, setTimeRange] = useState('week');
  const [showMyTasks, setShowMyTasks] = useState(true);
  const [showOtherTasks, setShowOtherTasks] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedProjectForOthers, setSelectedProjectForOthers] = useState(null);
  const [selectedTaskDashboard, setSelectedTaskDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('time');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [recentlyCompletedMilestones, setRecentlyCompletedMilestones] = useState([]);
  const [milestoneNotification, setMilestoneNotification] = useState(null);

  const handleMilestoneToggle = (e, milestone) => {
    e.stopPropagation();
    toggleMilestone(milestone.subcategoryId, milestone.id);
    setRecentlyCompletedMilestones(prev => [...prev, milestone.id]);
    setTimeout(() => {
      setRecentlyCompletedMilestones(prev => prev.filter(id => id !== milestone.id));
      addHiddenMilestone(milestone.id);
      setMilestoneNotification('Jalon terminé !');
      setTimeout(() => setMilestoneNotification(null), 2000);
    }, 1000);
  };

  const handleTaskClick = task => {
    setSelectedTaskDashboard(task);
  };

  const handleCloseTask = () => {
    setSelectedTaskDashboard(null);
  };

  const handleDueDateClick = (e, task) => {
    e.stopPropagation();
    if (task.board?.id) {
      localStorage.setItem('c-projets_open_tab', 'planning');
      loadBoard(task.board.id);
      navigate('/board');
    }
  };

  const allBoards = storageData?.boards || db?.boards || boards;
  const allCards = storageData?.cards || db?.cards || cards;
  const allCategories = storageData?.categories || db?.categories || categories;
  const allSubcategories = storageData?.subcategories || db?.subcategories || subcategories;
  const allColumns = storageData?.columns || db?.columns || [];

  const resetProjectTime = projectId => {
    if (!window.confirm('Réinitialiser le temps pour ce projet cette semaine ?')) return;
    const timeData = loadProjectTime();
    const currentWeek = getWeekNumber(new Date());
    if (timeData[currentWeek] && timeData[currentWeek][projectId] !== undefined) {
      timeData[currentWeek][projectId] = 0;
      localStorage.setItem('c-projets_project_time', JSON.stringify(timeData));
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
      username,
      days
    );
    return allTasks.filter(task => task.assignee === username);
  }, [allSubcategories, allCategories, allCards, allBoards, allColumns, username, timeRange]);

  const otherTasks = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 180;
    const tasks = getUpcomingTasks(
      allSubcategories,
      allCategories,
      allCards,
      allBoards,
      allColumns,
      username,
      days
    );
    return tasks.filter(task => !task.assignee || task.assignee !== username);
  }, [allSubcategories, allCategories, allCards, allBoards, allColumns, username, timeRange]);

  const myMilestones = useMemo(() => {
    return getMyMilestones(
      allSubcategories,
      allCategories,
      allCards,
      allBoards,
      allColumns,
      username
    ).filter(
      m =>
        !m.milestone.done &&
        !hiddenMilestones.has(m.milestone.id) &&
        !recentlyCompletedMilestones.includes(m.milestone.id)
    );
  }, [
    allSubcategories,
    allCategories,
    allCards,
    allBoards,
    allColumns,
    username,
    hiddenMilestones,
    recentlyCompletedMilestones,
  ]);

  const incompleteTasks = useMemo(() => {
    return myTasks.filter(task => task.status !== 'done');
  }, [myTasks]);

  const completedTasks = useMemo(() => {
    return myTasks.filter(task => task.status === 'done');
  }, [myTasks]);

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-display font-bold text-primary mb-6">Dashboard</h1>

      {/* Toast notification */}
      {milestoneNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg">
          {milestoneNotification}
        </div>
      )}

      {/* Onglets */}
      <div className="flex border-b border-std">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-std ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-std'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {tab.label}
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
                {completedTasks.length > 0 && !showCompletedTasks && (
                  <button
                    onClick={() => setShowCompletedTasks(true)}
                    className="px-3 py-1.5 text-sm rounded bg-green-500 text-white hover:opacity-90"
                  >
                    Afficher terminées ({completedTasks.length})
                  </button>
                )}
                {showCompletedTasks && (
                  <button
                    onClick={() => setShowCompletedTasks(false)}
                    className="px-3 py-1.5 text-sm rounded bg-card-hover text-secondary hover:bg-gray-200"
                  >
                    Masquer terminées
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

            {/* Tâches à terminer */}
            <div className="bg-card rounded-lg border border-std p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <Circle size={20} className="text-blue-500" />
                  Tâches à terminer
                </h2>
                <span className="text-xs text-muted">{incompleteTasks.length} tâches</span>
              </div>
              {incompleteTasks.length === 0 ? (
                <p className="text-secondary text-sm py-4">
                  Aucune tâche à terminer dans cette période
                </p>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-std">
                        <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Chapitre</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">État</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Avancement</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incompleteTasks.map(task => {
                        const isOverdue =
                          task.due_date &&
                          new Date(task.due_date) < new Date(new Date().toDateString());
                        const taskChapter = task.card?.chapter || task.board?.chapter || '-';
                        return (
                          <>
                            <tr
                              key={task.id}
                              className={`border-b border-std hover:bg-card-hover cursor-pointer ${isOverdue ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                              onClick={() => handleTaskClick(task)}
                            >
                              <td className="py-2 px-3 text-primary">{task.board?.title}</td>
                              <td className="py-2 px-3 text-secondary">{taskChapter}</td>
                              <td
                                className={`py-2 px-3 font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}
                                title={task.card?.title || task.category?.title || 'Aucune carte'}
                              >
                                {task.title}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white ${getStatusColor(task.status)}`}
                                >
                                  {task.status === 'in_progress' ? (
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
                                        task.status === 'in_progress'
                                          ? 'bg-blue-500'
                                          : task.status === 'waiting'
                                            ? 'bg-yellow-500'
                                            : 'bg-gray-400'
                                      }`}
                                      style={{ width: `${task.progress || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted w-8">
                                    {task.progress || 0}%
                                  </span>
                                </div>
                              </td>
                              <td
                                className={`py-2 px-3 font-medium ${getPriorityColor(task.priority)}`}
                              >
                                {getPriorityLabel(task.priority)}
                              </td>
                              <td
                                className={`py-2 px-3 cursor-pointer hover:text-accent ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted'}`}
                                onClick={e => handleDueDateClick(e, task)}
                                title="Cliquez pour ouvrir le planning"
                              >
                                {task.due_date
                                  ? new Date(task.due_date).toLocaleDateString('fr-FR')
                                  : '-'}
                              </td>
                            </tr>
                            {task.milestones &&
                              task.milestones.length > 0 &&
                              task.milestones.map(milestone => (
                                <tr
                                  key={'m-' + milestone.id}
                                  className="border-b border-std bg-orange-50/50 dark:bg-orange-900/20 hover:bg-card-hover cursor-pointer"
                                  onClick={() => {
                                    const sub = allSubcategories.find(
                                      s => Number(s.id) === Number(task.id)
                                    );
                                    if (sub) handleTaskClick(sub);
                                  }}
                                >
                                  <td colSpan={2} className="py-2 px-3"></td>
                                  <td className="py-2 px-3 flex items-center gap-2">
                                    <Flag size={12} className="text-orange-500" />
                                    <span className="text-orange-600 dark:text-orange-400">
                                      {milestone.title}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="checkbox"
                                      checked={milestone.done}
                                      onChange={e =>
                                        handleMilestoneToggle(e, {
                                          ...milestone,
                                          subcategoryId: task.id,
                                        })
                                      }
                                      onClick={e => e.stopPropagation()}
                                      className="w-4 h-4 rounded border-std text-accent cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-muted">-</td>
                                  <td className="py-2 px-3 text-muted">-</td>
                                  <td className="py-2 px-3 text-muted">
                                    {milestone.date
                                      ? new Date(milestone.date).toLocaleDateString('fr-FR')
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tâches terminées */}
            {completedTasks.length > 0 && showCompletedTasks && (
              <div className="bg-card rounded-lg border border-std p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    Tâches terminées
                  </h2>
                  <span className="text-xs text-muted">{completedTasks.length} tâches</span>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-std">
                        <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Chapitre</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Avancement</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
                        <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sorted = [...completedTasks].sort((a, b) => {
                          const projCompare = (a.board?.title || '').localeCompare(
                            b.board?.title || ''
                          );
                          if (projCompare !== 0) return projCompare;
                          const chapterA = a.card?.chapter || a.board?.chapter || '';
                          const chapterB = b.card?.chapter || b.board?.chapter || '';
                          return chapterA.localeCompare(chapterB);
                        });
                        let lastProject = null;
                        let lastChapter = null;
                        return sorted.map(task => {
                          const taskChapter = task.card?.chapter || task.board?.chapter || '-';
                          const isNewProject = task.board?.title !== lastProject;
                          const isNewChapter = taskChapter !== lastChapter;
                          lastProject = task.board?.title;
                          lastChapter = taskChapter;
                          return (
                            <tr
                              key={task.id}
                              className="border-b border-std hover:bg-card-hover cursor-pointer opacity-75"
                              onClick={() => handleTaskClick(task)}
                            >
                              <td
                                className={`py-2 px-3 ${isNewProject ? 'text-primary font-semibold' : 'text-muted'}`}
                              >
                                {isNewProject ? task.board?.title : '-'}
                              </td>
                              <td
                                className={`py-2 px-3 ${isNewChapter ? 'text-secondary' : 'text-muted'}`}
                              >
                                {isNewChapter ? taskChapter : '-'}
                              </td>
                              <td
                                className="py-2 px-3 text-primary font-medium line-through"
                                title={task.card?.title || task.category?.title || 'Aucune carte'}
                              >
                                {task.title}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-green-500 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted w-8">100%</span>
                                </div>
                              </td>
                              <td
                                className={`py-2 px-3 font-medium ${getPriorityColor(task.priority)}`}
                              >
                                {getPriorityLabel(task.priority)}
                              </td>
                              <td className="py-2 px-3 text-muted">
                                {task.due_date
                                  ? new Date(task.due_date).toLocaleDateString('fr-FR')
                                  : '-'}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
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
                                  <td
                                    className="py-2 px-3 text-primary font-medium"
                                    title={task.card?.title || 'Aucune carte'}
                                  >
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
                                    {task.due_date
                                      ? new Date(task.due_date).toLocaleDateString('fr-FR')
                                      : '-'}
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
            cards={allCards}
            username={username}
          />
        </div>
      )}
    </div>
  );
}
