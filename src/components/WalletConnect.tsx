import React, { useState } from 'react';
import { useGreenToken } from '../context/GreenTokenContext';
import { STELLAR_CONFIG } from '../services/stellar';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  RefreshCw, 
  Loader2,
  ChevronDown
} from 'lucide-react';

interface WalletConnectProps {
  compact?: boolean;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ compact = false }) => {
  const {
    wallet,
    isFreighterAvailable,
    connectWallet,
    disconnectWallet,
    refreshOnChainBalances,
    faucetFund
  } = useGreenToken();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopy = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const connected = await connectWallet();
      if (!connected) setConnectionError('Connection failed. Check Freighter and the selected network.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-semibold font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 ${compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'}`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
        {!isFreighterAvailable && (
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-amber-300 font-mono flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            Install Freighter <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {connectionError && (
          <span className="text-[10px] text-rose-400 font-mono max-w-xs truncate">
            {connectionError}
          </span>
        )}
      </div>
    );
  }

  // State: Connected (Compact vs Full)
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Main Connected Trigger */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl bg-[#071c10] border border-emerald-500/40 hover:border-emerald-400 text-xs font-mono text-white shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-emerald-200 leading-tight">
              {wallet.publicKeyFormatted}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono">
              {wallet.xlmBalance.toFixed(1)} XLM
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-400/70" />
        </button>
      </div>

      {/* Connected Dropdown / Card */}
      {dropdownOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#071d10] border border-emerald-600/40 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50 text-xs font-mono text-emerald-100 space-y-3 animate-in zoom-in-95 duration-150"
          onMouseLeave={() => setDropdownOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Freighter {wallet.network.toUpperCase()}</span>
            </div>
            <button
              onClick={refreshOnChainBalances}
              className="text-emerald-400/60 hover:text-white p-1"
              title="Refresh balances from Horizon"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Address box */}
          <div className="p-2.5 rounded-xl bg-[#030d06] border border-emerald-900/60 space-y-1">
            <span className="text-[10px] text-emerald-400/60 uppercase block">Stellar Public Key</span>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-200 truncate pr-2 select-all">
                {wallet.address}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 transition-colors shrink-0"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Real On-Chain Balance */}
          <div className="p-2.5 rounded-xl bg-[#030d06] border border-emerald-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-400/60 uppercase block">Horizon Balance</span>
              <span className="text-sm font-bold text-white font-mono">{wallet.xlmBalance.toFixed(2)} XLM</span>
            </div>
            <a
              href={STELLAR_CONFIG.explorerAccountUrl(wallet.address)}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-emerald-400 hover:text-emerald-200 flex items-center gap-1"
            >
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Friendbot fund action */}
          <button
            onClick={faucetFund}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Fund Account (+10,000 Test XLM)</span>
          </button>

          {/* Disconnect */}
          <div className="pt-2 border-t border-emerald-800/40">
            <button
              onClick={() => { disconnectWallet(); setDropdownOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-950/40 text-[11px] transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

