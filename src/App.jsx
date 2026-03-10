import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Board from './components/Board/Board';
import Settings from './components/Settings/Settings';
import SystemSettings from './components/Settings/SystemSettings';
import Archives from './components/Archives/Archives';
import Library from './components/Library/Library';
import LibraryPanel from './components/Library/LibraryPanel';
import Sidebar from './components/Sidebar/Sidebar';
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
  const { theme, boards, loadBoard, currentBoard } = useApp();

  React.useEffect(() => {
    if (!currentBoard && boards.length > 0) {
      loadBoard(boards[0].id);
    }
  }, [boards, currentBoard, loadBoard]);

  return (
    <div className={`flex h-screen bg-app ${theme}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 bg-app">
          <Routes>
            <Route path="/" element={<Board />} />
            <Route path="/board/:boardId" element={<Board />} />
            <Route path="/library" element={<Library />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/system-settings" element={<SystemSettings />} />
          </Routes>
        </main>
      </div>
      <LibraryPanel />
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
