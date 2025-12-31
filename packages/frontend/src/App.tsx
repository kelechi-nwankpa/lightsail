import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { LandingPage } from './pages/Landing';
import { DashboardPage } from './pages/Dashboard';
import ControlsPage from './pages/Controls';
import { AppSidebarProvider, AppSidebar, useSidebar } from './components/layout/AppSidebar';
import { cn } from './lib/utils';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppSidebar />
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-60"
      )}>
        {children}
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppSidebarProvider>
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/controls" element={<ControlsPage />} />
          {/* Redirect root to dashboard when authenticated */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </AppSidebarProvider>
  );
}

export function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <LandingPage />
          </SignedOut>
        </>
      } />
      {/* All other routes go through authenticated app */}
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
  );
}
