import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Board from './components/Board/Board';
import Settings from './components/Settings/Settings';
import Archives from './components/Archives/Archives';
import Library from './components/Library/Library';
import LibraryPanel from './components/Library/LibraryPanel';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import VoiceControl from './components/VoiceControl/VoiceControl';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
              <Routes>
                <Route path="/" element={<Board />} />
                <Route path="/board/:boardId" element={<Board />} />
                <Route path="/library" element={<Library />} />
                <Route path="/archives" element={<Archives />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
          <LibraryPanel />
        </div>
        <VoiceControl />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
