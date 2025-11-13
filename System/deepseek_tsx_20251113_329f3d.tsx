import React, { useState, useEffect } from 'react';
import { WebhookManager } from './components/WebhookManager';
import { ScheduleManager } from './components/ScheduleManager';
import { TemplateManager } from './components/TemplateManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Login } from './components/Login';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/tailwind.css';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <WebhookManager />
            <ScheduleManager />
            <TemplateManager />
            <AnalyticsDashboard />
            <SettingsPanel />
          </main>
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
