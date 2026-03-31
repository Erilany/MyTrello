import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Board2 from './Board/Board2';
import Settings from './Settings/Settings';
import SystemSettings from './Settings/SystemSettings';
import Archives from './Archives/Archives';
import DonneesPage from './Donnees/DonneesPage';
import Sidebar from './Sidebar/Sidebar';
import Dashboard from './Dashboard/Dashboard';
import Header from './Header/Header';
import VoiceControl from './VoiceControl/VoiceControl';
import CardModal from './Card/CardModal';
import CategoryModal from './Category/CategoryModal';
import SubCategoryModal from './SubCategory/SubCategoryModal';
import GuidePanel from './Guide/GuidePanel';
import SearchPanel from './Search/SearchPanel';

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

  React.useEffect(() => {
    if (!currentBoard && boards.length > 0 && location.pathname === '/') {
      loadBoard(boards[0].id);
    }
  }, [boards, currentBoard, loadBoard, location.pathname]);

  React.useEffect(() => {
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
