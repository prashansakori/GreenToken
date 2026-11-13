import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import type { UserHolding } from '../../types';
import { 
  User, 
  Wallet, 
  Flame, 
  ExternalLink, 
  TrendingUp, 
  Award, 
  Sparkles, 
  Car, 
  Plane, 
  Trees, 
  Copy, 
  Check, 
  Coins, 
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { RetireCreditsModal } from '../common/RetireCreditsModal';

export const PortfolioPage: React.FC = () => {
  const { 
    wallet, 
    holdings, 
    transactions, 
    certificates, 
    navigateTo, 
    openWalletModal, 
    faucetFund 
  } = useGreenToken();

  const [selectedHoldingToRetire, setSelectedHoldingToRetire] = useState<UserHolding | null>(null);
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txFilter, setTxFilter] = useState<'ALL' | 'BUY' | 'RETIRE'>('ALL');

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalHoldingTonnes = holdings.reduce((acc, h) => acc + h.amount, 0);
  const totalHoldingUSD = holdings.reduce((acc, h) => acc + h.currentValueUSD, 0);
  const totalRetiredTonnes = certificates.reduce((acc, c) => acc + c.amountTonnes, 0);

  // Equivalencies: 1 tCO2e ≈ 2,500 miles driven by avg car, or 0.8 flights NY to London, or 45 urban trees grown for 10 years
  const carsOffRoad = Math.round(totalHoldingTonnes * 0.22);
  const flightsNeutralized = Math.round(totalHoldingTonnes * 1.25);
  const treesEquiv = Math.round(totalHoldingTonnes * 45);

  const filteredTxs = transactions.filter(t => {
    if (txFilter === 'ALL') return true;
    return t.type === txFilter;
  });

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Wallet Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#072414] via-[#051c0f] to-[#041209] border border-emerald-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none"></div>

          <div className="space-y-3 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                Stellar {wallet.network.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-emerald-400/70">
                Connected Keypair
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg sm:text-xl font-bold font-mono text-white select-all">
                {wallet.address}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800/60 text-emerald-300 hover:text-white transition-colors"
                title="Copy full public key"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-emerald-300/70 font-mono">
              Non-custodial account holding tokenized fractional environmental impact assets on Stellar.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <button
              onClick={faucetFund}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs font-mono transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Testnet Faucet (+XLM)</span>
            </button>

            <button
              onClick={() => { setSelectedHoldingToRetire(null); setRetireModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <Flame className="w-4 h-4" />
              <span>Retire Carbon</span>
            </button>
          </div>
        </div>

        {/* 1. WALLET ASSET BALANCES & CARBON VALUE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#071c10] border border-emerald-800/40 space-y-1">
            <span className="text-xs uppercase font-mono text-emerald-400/70">Total Carbon Held</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {totalHoldingTonnes.toLocaleString()} <span className="text-xs text-emerald-400">tCO2e</span>
            </p>
            <span className="text-xs font-mono text-emerald-400/70">
              Across {holdings.length} verified projects
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#071c10] border border-emerald-800/40 space-y-1">
            <span className="text-xs uppercase font-mono text-emerald-400/70">Carbon Market Value</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white">
              ${totalHoldingUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs font-mono text-emerald-400/70">
              Live DEX spot evaluation
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#071c10] border border-emerald-800/40 space-y-1">
            <span className="text-xs uppercase font-mono text-emerald-400/70">Native Stellar XLM</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300">
              {wallet.xlmBalance.toFixed(1)} <span className="text-xs">XLM</span>
            </p>
            <span className="text-xs font-mono text-emerald-400/70">
              ≈ ${(wallet.xlmBalance * 0.115).toFixed(2)} USD
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#071c10] border border-emerald-800/40 space-y-1">
            <span className="text-xs uppercase font-mono text-emerald-400/70">Circle USDC Balance</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-teal-300">
              ${wallet.usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs font-mono text-emerald-400/70">
              Ready for instant trading
            </span>
          </div>
        </div>

        {/* 2. REAL-WORLD CLIMATE EQUIVALENCIES BANNER */}
        <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Your Environmental Impact Equivalencies
          </h3>
          <p className="text-xs text-emerald-300/70">
            Based on EPA & Greenhouse Gas Protocol greenhouse equivalency calculations:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#030d06] border border-emerald-950 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-bold font-mono text-white">{carsOffRoad} Vehicles</p>
                <p className="text-[11px] text-emerald-400/70">Taken off the road for 1 year</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#030d06] border border-emerald-950 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-bold font-mono text-white">{flightsNeutralized} Flights</p>
                <p className="text-[11px] text-emerald-400/70">Transatlantic passenger flights offset</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#030d06] border border-emerald-950 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-300 shrink-0">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-bold font-mono text-white">{treesEquiv.toLocaleString()} Trees</p>
                <p className="text-[11px] text-emerald-400/70">Grown for 10 consecutive years</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. OWNED CARBON ASSETS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-sans">
              Owned Carbon Credit Holdings ({holdings.length})
            </h2>
            <button
              onClick={() => navigateTo('marketplace')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-200 flex items-center gap-1"
            >
              Acquire More in Marketplace <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {holdings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-3">
              <p className="text-emerald-300 text-sm font-mono">You do not hold any tokenized carbon credits yet.</p>
              <button
                onClick={() => navigateTo('marketplace')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs font-mono"
              >
                Browse Carbon Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {holdings.map((h) => (
                <div
                  key={h.projectId}
                  className="rounded-2xl bg-[#071c10] border border-emerald-800/40 hover:border-emerald-500/50 p-5 space-y-4 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={h.imageUrl}
                        alt={h.projectName}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-800/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {h.assetCode}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/60">
                            Vintage {h.vintage}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate mt-1">
                          {h.projectName}
                        </h4>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-950 space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-emerald-400/70">Quantity Owned:</span>
                        <span className="font-bold text-white">{h.amount} tCO2e</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-400/70">Est. Market Value:</span>
                        <span className="font-bold text-emerald-300">${h.currentValueUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-400/70">Standard:</span>
                        <span className="text-emerald-200">{h.standard}</span>
                      </div>
                    </div>
                  </div>

                  {/* Retire button */}
                  <div className="flex gap-2 pt-2 border-t border-emerald-900/40">
                    <button
                      onClick={() => { setSelectedHoldingToRetire(h); setRetireModalOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs font-mono transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Retire Credits
                    </button>
                    <button
                      onClick={() => navigateTo('project-details', h.projectId)}
                      className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 text-xs font-mono transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. TRANSACTION HISTORY & CERTIFICATE LINKS */}
        <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Portfolio Transaction History
              </h3>
              <p className="text-xs text-emerald-400/70 font-mono">
                Soroban transactions and confirmed retirement records
              </p>
            </div>

            <div className="flex gap-1.5 text-xs font-mono">
              {['ALL', 'BUY', 'RETIRE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f as any)}
                  className={`px-3 py-1 rounded-lg border transition-colors ${
                    txFilter === f
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400/60 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-900/50 text-emerald-400/70 uppercase">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Project / Asset</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Stellar TX Hash</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/80">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-emerald-950/30 transition-colors">
                    <td className="py-3 px-3">
                      {tx.type === 'RETIRE' ? (
                        <span className={`px-2 py-0.5 rounded border ${
                          tx.status === 'pending'
                            ? 'bg-amber-950/60 text-amber-200 border-amber-800/50'
                            : 'bg-amber-950 text-amber-300 border-amber-800/50'
                        }`}>
                          {tx.status === 'pending' ? 'RETIREMENT PENDING' : 'RETIRED (SOROBAN)'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                          {tx.type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white block truncate max-w-[200px]">
                        {tx.projectName || tx.stellarAssetCode}
                      </span>
                      <span className="text-[10px] text-emerald-400/70">
                        {tx.retirementId
                          ? `Soroban retirement #${tx.retirementId}`
                          : tx.status === 'pending'
                            ? 'Awaiting Soroban confirmation'
                            : `Asset: ${tx.stellarAssetCode}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-300">
                      {tx.amount} tCO2e
                    </td>
                    <td className="py-3 px-3 text-white">
                      ${tx.totalValueUSD?.toFixed(2) || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-200 flex items-center gap-1"
                      >
                        {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-emerald-500/80">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      {tx.retirementCertificateId ? (
                        <button
                          onClick={() => navigateTo('certificate', tx.retirementCertificateId)}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Award className="w-3 h-3 text-emerald-400" />
                          View Certificate
                        </button>
                      ) : (
                        <span className="text-emerald-600/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Retire Modal */}
      {retireModalOpen && (
        <RetireCreditsModal
          holding={selectedHoldingToRetire || undefined}
          isOpen={true}
          onClose={() => { setRetireModalOpen(false); setSelectedHoldingToRetire(null); }}
        />
      )}
    </div>
  );
};
