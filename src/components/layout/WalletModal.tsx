import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { STELLAR_CONFIG } from '../../services/stellar';
import { 
  X, 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const WalletModal: React.FC = () => {
  const { 
    isWalletModalOpen, 
    closeWalletModal, 
    wallet, 
    isFreighterAvailable,
    connectWallet, 
    disconnectWallet, 
    faucetFund,
    refreshOnChainBalances
  } = useGreenToken();

  const [copied, setCopied] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  if (!isWalletModalOpen) return null;

  const handleCopy = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setConnectingType('freighter');
    try {
      await connectWallet();
    } finally {
      setConnectingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={closeWalletModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#081d11] border border-emerald-500/30 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] text-emerald-100 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-sans">
                {wallet.isConnected ? 'Stellar Wallet Connected' : 'Connect Stellar Wallet'}
              </h3>
              <p className="text-xs text-emerald-400/70 font-mono">
                Stellar Testnet • SCP Non-Mining Consensus
              </p>
            </div>
          </div>
          <button 
            onClick={closeWalletModal}
            className="p-1.5 rounded-lg text-emerald-400/60 hover:text-white hover:bg-emerald-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {wallet.isConnected ? (
          <div className="py-5 space-y-5">
            {/* Address & Network */}
            <div className="p-4 rounded-xl bg-[#05140b] border border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-400/70">
                <span className="font-mono">Connected Stellar Public Key</span>
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {wallet.network.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-emerald-950">
                <span className="font-mono text-xs text-emerald-200 break-all select-all pr-2">
                  {wallet.address}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 transition-colors shrink-0"
                  title="Copy Address"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs font-mono pt-1">
                <a
                  href={STELLAR_CONFIG.explorerAccountUrl(wallet.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-200 flex items-center gap-1 text-[11px]"
                >
                  View on Stellar Expert <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={refreshOnChainBalances}
                  className="text-emerald-400/70 hover:text-white text-[11px] underline"
                >
                  Sync Balances
                </button>
              </div>
            </div>

            {/* Balances */}
            <div>
              <h4 className="text-xs uppercase font-mono text-emerald-400/60 mb-2.5 tracking-wider">
                Stellar On-Chain Balances
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-xl bg-[#071a0f] border border-emerald-800/30">
                  <span className="text-[10px] text-emerald-400/70 font-mono uppercase">Native XLM</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    {wallet.xlmBalance.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-400/60 font-mono">≈ ${(wallet.xlmBalance * 0.115).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={faucetFund}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Friendbot Faucet (+10,000 XLM)
              </button>
              <button
                onClick={disconnectWallet}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 text-xs font-mono font-medium transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 space-y-3">
            <p className="text-xs text-emerald-300/80 mb-3">
              Connect Freighter on Stellar Testnet. Purchases and issuance remain disabled until their Soroban settlement is configured.
            </p>

            {/* Freighter */}
            <button
              onClick={handleConnect}
              disabled={connectingType !== null}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#071a0f] hover:bg-[#0c2a19] border border-emerald-800/40 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold font-mono">
                  F
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      Freighter Browser Wallet
                    </h4>
                    {isFreighterAvailable ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                        Installed
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                        Not Detected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-400/60">
                    Official Stellar Development Foundation extension
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400/70 group-hover:text-emerald-300">
                {connectingType === 'freighter' ? 'Connecting...' : 'Connect →'}
              </span>
            </button>

            {/* Install link if not detected */}
            {!isFreighterAvailable && (
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs font-mono hover:bg-amber-950/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Don't have Freighter? Get it at freighter.app</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-emerald-800/40 flex items-center justify-between text-[11px] font-mono text-emerald-400/60">
          <span>Stellar Core v21.2 • Soroban Ready</span>
          <a
            href="https://developers.stellar.org/docs/tools/developer-tools/wallets"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-emerald-200 transition-colors"
          >
            Stellar Wallet Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
