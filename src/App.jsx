import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext.jsx';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login.jsx';
import Register from '@/pages/Register.jsx';
import DateTime from '@/pages/DateTime.jsx';
import Geometry from '@/pages/Geometry.jsx';
import HistoryPage from '@/pages/HistoryPage.jsx';
import CalculatorWrapper from '@/pages/CalculatorWrapper.jsx';
import ConverterWrapper from '@/pages/ConverterWrapper.jsx';
import Radio from '@/pages/Radio.jsx';
import GraphingWrapper from '@/pages/GraphingWrapper.jsx';
import Notes from '@/pages/Notes.jsx';
import Generator from '@/pages/Generator.jsx';
import TextConverter from '@/pages/TextConverter.jsx';
import Weather from '@/pages/Weather.jsx';
import PipBoyHome from '@/pages/PipBoyHome.jsx';
import SystemStatus from '@/pages/SystemStatus.jsx';
import EmailInbox from '@/pages/EmailInbox.jsx';
import Messages from '@/pages/Messages.jsx';
import CallsPage from '@/pages/CallsPage.jsx';
import Contacts from '@/pages/Contacts.jsx';
import GroupChat from '@/pages/GroupChat.jsx';
import MapPage from '@/pages/MapPage.jsx';
import ChessGame from '@/pages/Games/ChessGame.jsx';
import MinesweeperGame from '@/pages/Games/MinesweeperGame.jsx';
import SnakeGame from '@/pages/Games/SnakeGame.jsx';
import TetrisGame from '@/pages/Games/TetrisGame.jsx';
import DoomGame from '@/pages/Games/DoomGame.jsx';


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<PipBoyHome />} />
          <Route path="/calculator" element={<CalculatorWrapper />} />
          <Route path="/converter" element={<ConverterWrapper />} />
          <Route path="/datetime" element={<DateTime />} />
          <Route path="/geometry" element={<Geometry />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/graphing" element={<GraphingWrapper />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/text-converter" element={<TextConverter />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/system-status" element={<SystemStatus />} />
          <Route path="/email-inbox" element={<EmailInbox />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/group-chat" element={<GroupChat />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/games/chess" element={<ChessGame />} />
          <Route path="/games/minesweeper" element={<MinesweeperGame />} />
          <Route path="/games/snake" element={<SnakeGame />} />
          <Route path="/games/blocks" element={<TetrisGame />} />
          <Route path="/games/dungeon" element={<DoomGame />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App