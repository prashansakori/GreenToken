import React from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { 
  Leaf, 
  ShieldCheck, 
  ExternalLink, 
  Globe, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  FileText 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useGreenToken();

  return (
    <footer className="w-full bg-[#030905] border-t border-emerald-950 text-emerald-200/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-900/40">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-3 cursor-pointer group w-fit"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 -rotate-12" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Green<span className="text-emerald-400">Token</span>
              </span>
            </div>
            
            <p className="text-xs text-emerald-300/70 leading-relaxed max-w-sm">
              A Testnet prototype for Soroban-tracked carbon credits, wallet-authorized retirement, and on-chain retirement records.
            </p>

            <p className="text-[11px] font-mono text-emerald-500/80 pt-2">
              Current Testnet ledger data is shown only when available in the impact dashboard.
            </p>
          </div>

          {/* Platform Nav */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button 
                  onClick={() => navigateTo('marketplace')} 
                  className="hover:text-emerald-300 transition-colors text-left"
                >
                  Carbon Marketplace
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('dashboard')} 
                  className="hover:text-emerald-300 transition-colors text-left"
                >
                  Protocol Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('portfolio')} 
                  className="hover:text-emerald-300 transition-colors text-left"
                >
                  Portfolio & Holdings
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('certificate', 'cert-grn-ret-892f')} 
                  className="hover:text-emerald-300 transition-colors text-left"
                >
                  Retirement Certificates
                </button>
              </li>
            </ul>
          </div>

          {/* Verification & Governance */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-white mb-4">
              Standards & MRV
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button 
                  onClick={() => navigateTo('verification')} 
                  className="hover:text-emerald-300 transition-colors text-left"
                >
                  Submit Project for MRV
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('admin')} 
                  className="hover:text-emerald-300 transition-colors text-left"
                >
                  Verifier Governance
                </button>
              </li>
              <li>
                <a 
                  href="https://verra.org" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  Verra VCS Registry <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://goldstandard.org" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  Gold Standard Registry <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Blockchain specs */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-white mb-4">
              Stellar Infrastructure
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-emerald-400/70">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stellar Core v21.2</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Soroban Smart Contracts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SCP Non-Mining Consensus</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sub-Cent Transaction Fees</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-emerald-500/60">
          <div>
            © {new Date().getFullYear()} GreenToken Protocol. Built on Stellar Blockchain.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Terms of Protocol
            </span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Privacy Framework
            </span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Article 6 Compliance
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

