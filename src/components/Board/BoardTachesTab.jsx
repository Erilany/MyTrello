import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, X, Mail } from 'lucide-react';
import { getOrderedChapters } from '../../data/ChaptersData';
import { normalizeChapter, isSpacer } from './boardUtils';
import { getSubcategorySystemTag } from '../Settings/favoritesUtils';
import { formatUserName } from '../../utils/nameUtils';

export default function BoardTachesTab({
  selectedChapter,
  setSelectedChapter,
  selectedCategoryForTasks,
  setSelectedCategoryForTasks,
  newTaskTitle,
  setNewTaskTitle,
  hoveredCategoryData,
  setHoveredCategoryData,
  hoverPanelVisible,
  setHoverPanelVisible,
  hoverTimeoutRef,
}) {
  const {
    cards,
    categories,
    subcategories,
    libraryItems,
    setSelectedCard,
    setSelectedSubcategory,
    createCard,
    createSubcategory,
    deleteCard,
    deleteSubcategory,
    getEmailsForSubcategory,
    showTagOnCard,
  } = useApp();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-full">
        <div className="mb-4 flex flex-wrap gap-2">
          {(() => {
            const orderedChapters = getOrderedChapters();

            return orderedChapters.map(chapter => {
              const spacer = isSpacer(chapter);

              if (spacer) {
                return <div key={chapter} className="w-12 h-8 flex-shrink-0" />;
              }

              const normalizedChapter = normalizeChapter(chapter);
              const hasCards = cards.some(
                card => card.chapter && normalizeChapter(card.chapter) === normalizedChapter
              );

              return (
                <button
                  key={chapter}
                  onClick={() => setSelectedChapter(chapter)}
                  disabled={!hasCards}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedChapter === chapter
                      ? 'bg-accent text-white'
                      : !hasCards
                        ? 'bg-card border border-std text-muted opacity-50 cursor-not-allowed'
                        : 'bg-card border border-std text-secondary hover:bg-card-hover'
                  }`}
                  title={chapter}
                >
                  {chapter}
                </button>
              );
            });
          })()}
        </div>

        {selectedChapter ? (
          <div className="bg-card rounded-lg border border-std p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary">{selectedChapter}</h2>
              <button
                onClick={() => setSelectedChapter(null)}
                className="text-sm text-secondary hover:text-primary"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards &&
                cards
                  .filter(
                    card =>
                      card.chapter &&
                      normalizeChapter(card.chapter) === normalizeChapter(selectedChapter)
                  )
                  .map(card => {
                    const cardCategories = categories.filter(c => c.card_id === card.id);
                    const categoriesWithSubcats = cardCategories.map(cat => {
                      const catSubcats = subcategories.filter(s => s.category_id === cat.id);
                      return {
                        ...cat,
                        subcats: catSubcats,
                        isSingleTask: catSubcats.length === 1,
                      };
                    });
                    const hasMultiTaskCategories = categoriesWithSubcats.some(
                      cat => !cat.isSingleTask
                    );
                    const hasSingleTaskCategories = categoriesWithSubcats.some(
                      cat => cat.isSingleTask
                    );
                    const skipAction = hasSingleTaskCategories && !hasMultiTaskCategories;

                    return (
                      <div
                        key={card.id}
                        className={`bg-card-hover rounded-lg border-2 p-4 transition-all ${
                          skipAction
                            ? 'border-purple-400 hover:border-purple-500 hover:ring-2 hover:ring-purple-300/30'
                            : 'border-std hover:border-accent hover:ring-2 hover:ring-accent/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3
                            onClick={() => setSelectedCard(card)}
                            className="font-semibold text-primary cursor-pointer hover:text-accent flex items-center gap-2 flex-1"
                          >
                            {card.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const confirm1 = window.confirm(
                                  'Êtes-vous sûr de vouloir supprimer cette carte ? Cette action est irréversible.'
                                );
                                if (!confirm1) return;
                                const confirm2 = window.confirm(
                                  'Confirmez-vous définitivement la suppression ?'
                                );
                                if (!confirm2) return;
                                deleteCard(card.id);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                              title="Supprimer la carte"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {categoriesWithSubcats.length === 0 ? (
                            <p className="text-sm text-muted italic">Aucune tâche disponible</p>
                          ) : (
                            categoriesWithSubcats.map(cat =>
                              cat.isSingleTask ? (
                                cat.subcats.map(sub => (
                                  <div
                                    key={sub.id}
                                    className="pl-3 border-l-2 border-purple-400 cursor-pointer hover:bg-[var(--bg-card)] rounded p-2 transition-colors"
                                    onClick={() => setSelectedSubcategory(sub)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          sub.status === 'done'
                                            ? 'bg-green-500'
                                            : sub.status === 'waiting'
                                              ? 'bg-blue-500'
                                              : sub.status === 'todo'
                                                ? 'bg-red-500'
                                                : sub.status === 'in_progress'
                                                  ? 'bg-yellow-500'
                                                  : sub.status === 'blocked'
                                                    ? 'bg-red-500'
                                                    : 'bg-gray-400'
                                        }`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-[var(--txt-primary)] truncate">
                                          {sub.title}
                                        </div>
                                        <div className="flex items-center gap-[10px] text-xs text-[var(--txt-muted)]">
                                          {showTagOnCard && (() => {
                                            const libraryTag = getSubcategorySystemTag(sub, libraryItems);
                                            const displayTag = libraryTag || sub.tag;
                                            return (
                                              displayTag && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                  {displayTag}
                                                </span>
                                              )
                                            );
                                          })()}
                                          {sub.assignee && (
                                            <span className="truncate">👤 {formatUserName(sub.assignee)}</span>
                                          )}
                                          {sub.due_date && (
                                            <span className="whitespace-nowrap">
                                              📅{' '}
                                              {new Date(sub.due_date).toLocaleDateString('fr-FR')}
                                            </span>
                                          )}
                                          {getEmailsForSubcategory &&
                                            getEmailsForSubcategory(sub.id)?.length > 0 &&
                                            (() => {
                                              const emails = getEmailsForSubcategory(sub.id);
                                              const hasPending = emails.some(
                                                e => !e.status || e.status === 'pending'
                                              );
                                              return (
                                                <span>
                                                  <Mail
                                                    size={14}
                                                    style={{
                                                      color: hasPending ? '#ef4444' : '#22c55e',
                                                    }}
                                                  />
                                                </span>
                                              );
                                            })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div
                                  key={cat.id}
                                  className="pl-3 border-l-2 border-accent relative"
                                  onMouseEnter={e => {
                                    if (hoverTimeoutRef.current)
                                      clearTimeout(hoverTimeoutRef.current);
                                    setHoveredCategoryData({
                                      card,
                                      category: cat,
                                      subcategories: cat.subcats,
                                      mouseX: e.clientX,
                                      mouseY: e.clientY,
                                    });
                                    hoverTimeoutRef.current = setTimeout(
                                      () => setHoverPanelVisible(true),
                                      100
                                    );
                                  }}
                                  onMouseLeave={() => {
                                    setHoverPanelVisible(false);
                                    hoverTimeoutRef.current = setTimeout(
                                      () => setHoveredCategoryData(null),
                                      300
                                    );
                                  }}
                                >
                                  <div
                                    className="text-sm text-[var(--txt-primary)] font-medium cursor-pointer hover:text-accent"
                                    onClick={() =>
                                      setSelectedCategoryForTasks({
                                        card,
                                        category: cat,
                                        subcategories: cat.subcats,
                                      })
                                    }
                                  >
                                    {cat.title}{' '}
                                    <span className="ml-2 text-xs text-[var(--txt-muted)]">
                                      ({cat.subcats.length} tâches)
                                    </span>
                                  </div>
                                  {hoverPanelVisible &&
                                    hoveredCategoryData?.category?.id === cat.id &&
                                    cat.subcats.length > 0 && (
                                      <div
                                        className="absolute left-1/2 top-0 -translate-x-1/2 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl z-[60] overflow-hidden"
                                        onMouseEnter={() => {
                                          if (hoverTimeoutRef.current)
                                            clearTimeout(hoverTimeoutRef.current);
                                          setHoverPanelVisible(true);
                                        }}
                                        onMouseLeave={() => {
                                          setHoverPanelVisible(false);
                                          hoverTimeoutRef.current = setTimeout(
                                            () => setHoveredCategoryData(null),
                                            300
                                          );
                                        }}
                                      >
                                        <div className="max-h-48 overflow-auto p-1">
                                          {cat.subcats.map(sub => (
                                            <div
                                              key={sub.id}
                                              className="p-2 hover:bg-[var(--bg-card-hover)] rounded cursor-pointer"
                                              onClick={e => {
                                                e.stopPropagation();
                                                setSelectedSubcategory(sub);
                                                setHoverPanelVisible(false);
                                                setHoveredCategoryData(null);
                                              }}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    sub.status === 'done'
                                                      ? 'bg-green-500'
                                                      : sub.status === 'waiting'
                                                        ? 'bg-blue-500'
                                                        : sub.status === 'todo'
                                                          ? 'bg-red-500'
                                                          : sub.status === 'in_progress'
                                                            ? 'bg-yellow-500'
                                                            : sub.status === 'blocked'
                                                              ? 'bg-red-500'
                                                              : 'bg-gray-400'
                                                  }`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-xs text-[var(--txt-primary)] truncate">
                                                    {sub.title}
                                                  </div>
                                                  <div className="flex items-center gap-[10px] text-xs text-[var(--txt-muted)]">
                                                    {sub.assignee && (
                                                      <span className="truncate">
                                                        👤 {formatUserName(sub.assignee)}
                                                      </span>
                                                    )}
                                                    {sub.due_date && (
                                                      <span className="whitespace-nowrap">
                                                        📅{' '}
                                                        {new Date(
                                                          sub.due_date
                                                        ).toLocaleDateString('fr-FR')}
                                                      </span>
                                                    )}
                                                    {getEmailsForSubcategory &&
                                                      getEmailsForSubcategory(sub.id)?.length >
                                                        0 && (
                                                        <Mail
                                                          size={14}
                                                          style={{
                                                            color: getEmailsForSubcategory(
                                                              sub.id
                                                            ).some(
                                                              e =>
                                                                !e.status ||
                                                                e.status === 'pending'
                                                            )
                                                              ? '#ef4444'
                                                              : '#22c55e',
                                                          }}
                                                        />
                                                      )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
              {(!cards ||
                cards.filter(
                  card => normalizeChapter(card.chapter) === normalizeChapter(selectedChapter)
                ).length === 0) && (
                <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted mb-4">Aucune carte pour ce chapitre</p>
                  <button
                    onClick={() => {
                      const title = prompt('Nom de la nouvelle carte :');
                      if (title && title.trim()) {
                        createCard({ title: title.trim(), chapter: selectedChapter });
                      }
                    }}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors flex items-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Créer une carte
                  </button>
                </div>
              )}
            </div>

            {selectedCategoryForTasks && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-lg border border-std max-w-lg w-full max-h-[80vh] overflow-auto">
                  <div className="p-4 border-b border-std flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-primary">
                        {selectedCategoryForTasks.category.title}
                      </h3>
                      <p className="text-sm text-muted">{selectedCategoryForTasks.card.title}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCategoryForTasks(null)}
                      className="p-2 hover:bg-card-hover rounded"
                    >
                      <X size={20} className="text-secondary" />
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {selectedCategoryForTasks.subcategories.length > 0 ? (
                      selectedCategoryForTasks.subcategories.map(subcat => {
                        const isNotStarted = !subcat.start_date && !subcat.due_date;
                        const status = isNotStarted ? 'not_started' : subcat.status || 'todo';
                        return (
                          <div
                            key={subcat.id}
                            onClick={() => setSelectedSubcategory(subcat)}
                            className={`p-3 rounded border cursor-pointer transition-all ${
                              status === 'not_started'
                                ? 'bg-gray-200 border-gray-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                : status === 'todo'
                                  ? 'bg-orange-100 border-orange-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                  : status === 'in_progress'
                                    ? 'bg-yellow-100 border-yellow-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                    : status === 'waiting'
                                      ? 'bg-blue-100 border-blue-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                      : status === 'done'
                                        ? 'bg-green-100 border-green-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                        : 'bg-gray-200 border-gray-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-secondary">{subcat.title}</h4>
                              <button
                                onClick={async e => {
                                  e.stopPropagation();
                                  if (confirm('Supprimer cette tâche ?')) {
                                    await deleteSubcategory(subcat.id);
                                    setSelectedCategoryForTasks({
                                      ...selectedCategoryForTasks,
                                      subcategories: selectedCategoryForTasks.subcategories.filter(
                                        s => s.id !== subcat.id
                                      ),
                                    });
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-[10px] mt-1 text-xs text-muted pl-7">
                              {showTagOnCard && (() => {
                                const libraryTag = getSubcategorySystemTag(subcat, libraryItems);
                                const displayTag = libraryTag || subcat.tag;
                                return (
                                  displayTag && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                      {displayTag}
                                    </span>
                                  )
                                );
                              })()}
                              {subcat.assignee && (
                                <span className="flex items-center gap-[10px]">
                                  👤 {formatUserName(subcat.assignee)}
                                </span>
                              )}
                              {subcat.due_date && (
                                <span className="flex items-center gap-[10px]">
                                  📅 {new Date(subcat.due_date).toLocaleDateString('fr-FR')}
                                  {getEmailsForSubcategory &&
                                    getEmailsForSubcategory(subcat.id)?.length > 0 && (
                                      <Mail
                                        size={14}
                                        style={{
                                          color: getEmailsForSubcategory(subcat.id).some(
                                            e => !e.status || e.status === 'pending'
                                          )
                                            ? '#ef4444'
                                            : '#22c55e',
                                        }}
                                      />
                                    )}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted mb-3">Aucune tâche pour cette action</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={async () => {
                              const existingSub = selectedCategoryForTasks.subcategories.find(
                                s =>
                                  s.title.toLowerCase() ===
                                  selectedCategoryForTasks.category.title.toLowerCase()
                              );
                              if (existingSub) {
                                setSelectedSubcategory(existingSub);
                                return;
                              }
                              try {
                                const newSubId = await createSubcategory(
                                  selectedCategoryForTasks.category.id,
                                  selectedCategoryForTasks.category.title
                                );
                                setSelectedCategoryForTasks({
                                  ...selectedCategoryForTasks,
                                  subcategories: [
                                    ...selectedCategoryForTasks.subcategories,
                                    {
                                      id: newSubId,
                                      category_id: selectedCategoryForTasks.category.id,
                                      title: selectedCategoryForTasks.category.title,
                                    },
                                  ],
                                });
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 text-sm"
                          >
                            + Créer une tâche "{selectedCategoryForTasks.category.title}"
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-std">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          placeholder="Nouvelle tâche..."
                          className="flex-1 px-3 py-2 bg-card-hover border border-std rounded text-secondary text-sm"
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && newTaskTitle.trim()) {
                              const newSub = await createSubcategory(
                                selectedCategoryForTasks.category.id,
                                newTaskTitle.trim()
                              );
                              setSelectedCategoryForTasks({
                                ...selectedCategoryForTasks,
                                subcategories: [
                                  ...selectedCategoryForTasks.subcategories,
                                  newSub,
                                ],
                              });
                              setNewTaskTitle('');
                            }
                          }}
                        />
                        <button
                          onClick={async () => {
                            if (newTaskTitle.trim()) {
                              const newSub = await createSubcategory(
                                selectedCategoryForTasks.category.id,
                                newTaskTitle.trim()
                              );
                              setSelectedCategoryForTasks({
                                ...selectedCategoryForTasks,
                                subcategories: [
                                  ...selectedCategoryForTasks.subcategories,
                                  newSub,
                                ],
                              });
                              setNewTaskTitle('');
                            }
                          }}
                          className="px-3 py-2 bg-accent text-white rounded text-sm hover:opacity-90"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
