import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Board from './components/Board/Board';
import Board2 from './components/Board/Board2';
import Settings from './components/Settings/Settings';
import SystemSettings from './components/Settings/SystemSettings';
import Archives from './components/Archives/Archives';
import LibraryPanel from './components/Library/LibraryPanel';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Header from './components/Header/Header';
import VoiceControl from './components/VoiceControl/VoiceControl';
import CardModal from './components/Card/CardModal';
import CategoryModal from './components/Category/CategoryModal';
import SubCategoryModal from './components/SubCategory/SubCategoryModal';

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
  const {
    theme,
    boards,
    loadBoard,
    currentBoard,
    libraryOpen,
    setLibraryOpen,
    libraryViewMode,
    setLibraryViewMode,
  } = useApp();
  const location = useLocation();

  React.useEffect(() => {
    if (!currentBoard && boards.length > 0 && location.pathname === '/') {
      loadBoard(boards[0].id);
    }
  }, [boards, currentBoard, loadBoard, location.pathname]);

  React.useEffect(() => {
    if (location.pathname === '/library') {
      setLibraryOpen(true);
      setLibraryViewMode('main');
    } else {
      setLibraryOpen(false);
      setLibraryViewMode('panel');
    }
  }, [location.pathname, setLibraryOpen, setLibraryViewMode]);

  const showMainLibrary =
    libraryOpen && libraryViewMode === 'main' && location.pathname === '/library';

  return (
    <div className={`flex h-screen bg-app ${theme}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 bg-app">
          {showMainLibrary ? (
            <LibraryPanel />
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/board" element={<Board />} />
              <Route path="/board/:boardId" element={<Board />} />
              <Route path="/board2" element={<Board2 />} />
              <Route path="/board2/:boardId" element={<Board2 />} />
              <Route path="/library" element={<LibraryPanel />} />
              <Route path="/archives" element={<Archives />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/system-settings" element={<SystemSettings />} />
            </Routes>
          )}
        </main>
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
