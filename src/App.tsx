import React from 'react';
import { GreenTokenProvider, useGreenToken } from './context/GreenTokenContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WalletModal } from './components/layout/WalletModal';
import { ToastContainer } from './components/common/Toast';

// Pages
import { LandingPage } from './components/pages/LandingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { MarketplacePage } from './components/pages/MarketplacePage';
import { ProjectDetailsPage } from './components/pages/ProjectDetailsPage';
import { VerificationPortalPage } from './components/pages/VerificationPortalPage';
import { PortfolioPage } from './components/pages/PortfolioPage';
import { RetirementCertificatePage } from './components/pages/RetirementCertificatePage';
import { AdminDashboardPage } from './components/pages/AdminDashboardPage';

const AppContent: React.FC = () => {
  const { activePage } = useGreenToken();

  return (
    <div className="min-h-screen flex flex-col bg-[#040d07] text-emerald-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {activePage === 'landing' && <LandingPage />}
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'marketplace' && <MarketplacePage />}
        {activePage === 'project-details' && <ProjectDetailsPage />}
        {activePage === 'verification' && <VerificationPortalPage />}
        {activePage === 'portfolio' && <PortfolioPage />}
        {activePage === 'certificate' && <RetirementCertificatePage />}
        {activePage === 'admin' && <AdminDashboardPage />}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Interactive Global Modals & Notifications */}
      <WalletModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <GreenTokenProvider>
      <AppContent />
    </GreenTokenProvider>
  );
}

export default App;
