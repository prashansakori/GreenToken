import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import type { PageView } from '../../context/GreenTokenContext';
import { WalletConnect } from '../WalletConnect';
import { 
  Leaf, 
  Wallet, 
  Menu, 
  X, 
  ChevronDown, 
  BarChart3, 
  ShoppingBag, 
  FileCheck2, 
  User, 
  Settings,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activePage, 
    navigateTo, 
    wallet, 
    openWalletModal, 
    switchNetwork,
    faucetFund
  } = useGreenToken();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const navItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Overview', icon: <Leaf className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'verification', label: 'MRV Portal', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <User className="w-4 h-4" /> },
    { id: 'admin', label: 'Governance', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (page: PageView) => {
    navigateTo(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/30 bg-[#040d07]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/30 to-emerald-900/40 p-0.5 border border-emerald-500/30 group-hover:border-emerald-400/60 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <div className="w-full h-full bg-[#071d10] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-glow opacity-60"></div>
                {/* Stylized Leaf & Stellar nexus */}
                <Leaf className="w-6 h-6 text-emerald-400 transform -rotate-12 group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75"></span>
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-cyan-400"></span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Green<span className="text-emerald-400">Token</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Stellar
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/60 font-mono tracking-wide">
                Carbon Protocol v2.4
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'text-emerald-200/70 hover:text-white hover:bg-emerald-900/30'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-emerald-500/70'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar (Network & Wallet) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Stellar Network Badge & Switcher */}
            <div className="relative">
              <button
                onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-xs font-mono text-emerald-300 hover:border-emerald-500/40 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="capitalize">{wallet.network}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400/70" />
              </button>

              {networkDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-[#092214] border border-emerald-700/40 shadow-2xl p-2 z-50 text-xs font-mono"
                  onMouseLeave={() => setNetworkDropdownOpen(false)}
                >
                  <div className="px-2 py-1 text-emerald-400/60 uppercase text-[10px] tracking-wider border-b border-emerald-800/40 mb-1">
                    Select Stellar Node
                  </div>
                  <button
                    onClick={() => { switchNetwork('testnet'); setNetworkDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      wallet.network === 'testnet' ? 'bg-emerald-600/20 text-emerald-200' : 'text-emerald-400/80 hover:bg-emerald-900/30'
                    }`}
                  >
                    <span>Stellar Testnet</span>
                    {wallet.network === 'testnet' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </button>
                  <button
                    disabled
                    title="Mainnet is unavailable until a production network configuration is deployed."
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-emerald-500/40 cursor-not-allowed"
                  >
                    <span>Stellar Public Mainnet</span>
                    <span className="text-[9px] uppercase">Unavailable</span>
                  </button>
                  <div className="pt-2 mt-1 border-t border-emerald-800/40">
                    <button
                      onClick={() => { faucetFund(); setNetworkDropdownOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Testnet Faucet (+250 XLM)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated WalletConnect Component */}
            <WalletConnect />

            {/* Quick Wallet Options Modal Trigger */}
            <button
              onClick={openWalletModal}
              className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 hover:text-white hover:border-emerald-500/50 transition-colors"
              title="Wallet & Network Details"
            >
              <Wallet className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-emerald-800/40 bg-[#06180e] px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Stellar {wallet.network.toUpperCase()}
            </div>
            <button
              onClick={faucetFund}
              className="text-xs font-mono text-cyan-300 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800/50 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Faucet
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-emerald-200/80 hover:bg-emerald-900/30'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-emerald-500/60'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => { openWalletModal(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-sm"
            >
              <Wallet className="w-4 h-4" />
              {wallet.isConnected ? `Connected (${wallet.publicKeyFormatted})` : 'Connect Stellar Wallet'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

