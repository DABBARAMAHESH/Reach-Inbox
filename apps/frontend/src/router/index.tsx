import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { ComposeModal } from '../components/email/ComposeModal';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Scheduled } from '../pages/Scheduled';
import { Sent } from '../pages/Sent';
import { Failed } from '../pages/Failed';
import { Campaigns } from '../pages/Campaigns';
import { Senders } from '../pages/Senders';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout onOpenCompose={() => setIsComposeOpen(true)} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scheduled" element={<Scheduled />} />
          <Route path="sent" element={<Sent />} />
          <Route path="failed" element={<Failed />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="senders" element={<Senders />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </>
  );
};
