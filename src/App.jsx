import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Header from './components/Header/Header';
import VoiceControl from './components/VoiceControl/VoiceControl';
import CardModal from './components/Card/CardModal';
import CategoryModal from './components/Category/CategoryModal';
import SubCategoryModal from './components/SubCategory/SubCategoryModal';
import GuidePanel from './components/Guide/GuidePanel';
import SearchPanel from './components/Search/SearchPanel';

const Board2 = lazy(() => import('./components/Board/Board2'));
const Settings = lazy(() => import('./components/Settings/Settings'));
const SystemSettings = lazy(() => import('./components/Settings/SystemSettings'));
const Archives = lazy(() => import('./components/Archives/Archives'));
const DonneesPage = lazy(() => import('./components/Donnees/DonneesPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
  );
}

function Modals() {
  const {
    selectedCard,
    setSelectedCard,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
  } = useApp();

  return (
    <>
      {selectedCard && <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
      {selectedCategory && (
        <CategoryModal category={selectedCategory} onClose={() => setSelectedCategory(null)} />
      )}
      {selectedSubcategory && (
        <SubCategoryModal
          subcategory={selectedSubcategory}
          onClose={() => setSelectedSubcategory(null)}
        />
      )}
    </>
  );
}

function AppContent() {
  const { theme, boards, loadBoard, currentBoard, guideOpen, searchOpen } = useApp();
  const location = useLocation();

  useEffect(() => {
    if (!currentBoard && boards.length > 0 && location.pathname === '/') {
      loadBoard(boards[0].id);
    }
  }, [boards, currentBoard, loadBoard, location.pathname]);

  useEffect(() => {
    const match = location.pathname.match(/^\/board(\/2)?\/(\d+)$/);
    if (match && currentBoard?.id !== parseInt(match[2])) {
      loadBoard(parseInt(match[2]));
    }
  }, [location.pathname, currentBoard, loadBoard]);

  const boardKey = currentBoard?.id || 'no-board';
  const sidePanelOpen = guideOpen || searchOpen;

  return (
    <div className={`flex h-screen bg-app ${theme}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidePanelOpen ? 'mr-[320px]' : ''}`}
        >
          <Header />
          <main className="flex-1 overflow-auto p-4 bg-app">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/board" element={<Board2 key={boardKey} />} />
                <Route path="/board/:boardId" element={<Board2 key={boardKey} />} />
                <Route path="/board2" element={<Board2 key={boardKey} />} />
                <Route path="/board2/:boardId" element={<Board2 key={boardKey} />} />
                <Route path="/library" element={<DonneesPage />} />
                <Route path="/archives" element={<Archives />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/system-settings" element={<SystemSettings />} />
              </Routes>
            </Suspense>
          </main>
        </div>
        {guideOpen && <GuidePanel />}
        <SearchPanel />
      </div>
      <Modals />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
        <VoiceControl />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
