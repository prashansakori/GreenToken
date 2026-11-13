import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { 
  Leaf, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  BarChart3, 
  Cpu, 
  Globe2, 
  Lock, 
  Zap, 
  Coins, 
  CheckCircle2, 
  FileCheck, 
  Flame, 
  TrendingUp, 
  RefreshCw,
  ExternalLink,
  Satellite,
  Compass
} from 'lucide-react';
import { BuyCreditsModal } from '../common/BuyCreditsModal';
import type { CarbonProject } from '../../types';

export const LandingPage: React.FC = () => {
  const { navigateTo, projects } = useGreenToken();
  const [selectedBuyProject, setSelectedBuyProject] = useState<CarbonProject | null>(null);

  const featuredProjects = projects.filter(p => p.featured || p.id === 'proj-rimba-raya' || p.id === 'proj-orca-dac' || p.id === 'proj-mikoko-pamoja').slice(0, 3);

  const steps = [
    {
      num: '01',
      title: 'Satellite & Ground MRV Audit',
      desc: 'Accredited VVBs (Verra, Gold Standard, DNV) validate project biomass, additionality, and remote sensing satellite telemetry (ESA Sentinel-2).',
      badge: 'Level 3 MRV',
      icon: <Satellite className="w-5 h-5 text-cyan-400" />
    },
    {
      num: '02',
      title: 'Native Stellar Asset Minting',
      desc: 'Each verified metric tonne (tCO2e) is minted as a 1:1 asset on Stellar with Soroban smart contract custody and tamper-evident metadata.',
      badge: 'Soroban Smart Contract',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />
    },
    {
      num: '03',
      title: 'Fractional Trading & Liquidity',
      desc: 'Institutional buyers and corporations trade fractional credits seamlessly on the Stellar Decentralized Exchange with sub-cent fees and instant liquidity.',
      badge: 'Sub-Cent Fees',
      icon: <Coins className="w-5 h-5 text-teal-400" />
    },
    {
      num: '04',
      title: 'Cryptographic Proof of Retirement',
      desc: 'Permanent burn to Stellar address GAAAA...WHF destroys the asset forever, generating an immutable cryptographic ESG certificate with on-chain hash.',
      badge: 'Permanent Burn',
      icon: <Flame className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Live Network Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-xs font-mono text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Stellar Consensus Protocol (SCP) • ~3.2s Finality • Zero Proof-of-Work</span>
            </div>
          </div>

          {/* Main Hero Copy */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Institutional Carbon Credits. <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Tokenized & Verifiably Retired
              </span> <br />
              on Stellar Blockchain.
            </h1>

            <p className="text-base sm:text-lg text-emerald-200/80 max-w-2xl mx-auto leading-relaxed">
              GreenToken is a carbon-credit prototype with Soroban-tracked project balances and wallet-authorized retirement records on Stellar Testnet.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigateTo('marketplace')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all group"
              >
                <span>Explore Carbon Marketplace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigateTo('dashboard')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 text-emerald-200 font-semibold text-sm font-mono flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Protocol Analytics</span>
              </button>

              <button
                onClick={() => navigateTo('verification')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-transparent hover:bg-emerald-950/30 text-emerald-300/80 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>For Developers: Submit Project</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          <div className="mt-16 max-w-5xl mx-auto rounded-2xl bg-emerald-950/40 border border-emerald-800/40 px-6 py-5 text-center">
            <p className="text-sm text-emerald-200/80">
              The impact dashboard reads issuance, retirement, project approval, and activity from the configured Soroban Testnet contract.
              Local marketplace examples are not reported as blockchain impact.
            </p>
            <button
              onClick={() => navigateTo('dashboard')}
              className="mt-4 px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-200 text-xs font-mono hover:bg-emerald-900/40"
            >
              Open Testnet impact dashboard
            </button>
          </div>

        </div>
      </section>

      {/* 2. THE CARBON MARKET DILEMMA & THE STELLAR SOLUTION */}
      <section className="py-20 bg-[#030a05] border-y border-emerald-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              The Transparency Revolution
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Solving the $250 Billion Carbon Trust Gap
            </h2>
            <p className="text-sm text-emerald-300/70 leading-relaxed">
              Traditional Voluntary Carbon Markets (VCM) suffer from opaque intermediaries, double-counting, delayed registry syncs, and paper certificates. GreenToken fixes this with Stellar blockchain finality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#09150d] border border-rose-900/30 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Legacy Carbon Market
              </div>
              <h3 className="text-lg font-bold text-white">
                Opaque, Fragmented & High Friction
              </h3>
              <ul className="space-y-3 text-xs text-rose-200/70">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Double-Counting Risk:</strong> Overlapping claims across registries with no cryptographic single-source-of-truth.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Excessive Intermediary Fees:</strong> Brokers and syndicates capture 30% - 40% of capital before reaching project ground teams.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Slow Settlement:</strong> Trades take days to weeks with paper PDFs and manual retirement processing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Illiquid Holdings:</strong> High minimum contract lots ($50k+) preclude smaller enterprises and everyday participants.</span>
                </li>
              </ul>
            </div>

            {/* The GreenToken Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#072013] border border-emerald-500/40 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none"></div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                GreenToken on Stellar
              </div>
              <h3 className="text-lg font-bold text-white">
                Programmable, Verifiable & Instant
              </h3>
              <ul className="space-y-3 text-xs text-emerald-200/90">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Double-Counting:</strong> Native Stellar tokenization paired with Soroban smart contract custody guarantees single-owner truth.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>98% Direct Capital Pass-Through:</strong> Sub-cent fees mean nearly all capital flows straight to forest rangers and carbon removal engineers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Deterministic ~3s Finality:</strong> Stellar Consensus Protocol achieves absolute finality in under 5 seconds with zero rollbacks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Cryptographic Retirement Certificates:</strong> Instant verifiable certificates linked directly to on-chain burn transactions.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 3. HOW IT WORKS (4-STEP ARCHITECTURE) */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              Protocol Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              From Satellite Remote Sensing to Immutable Retirement
            </h2>
            <p className="text-sm text-emerald-300/70">
              The end-to-end tokenization lifecycle operating transparently on the Stellar ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-[#071a0f] border border-emerald-800/40 hover:border-emerald-500/50 transition-all hover:-translate-y-1 group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-emerald-500/30 group-hover:text-emerald-400 transition-colors">
                      {s.num}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      {s.icon}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/50 inline-block mb-2">
                    {s.badge}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-emerald-300/70 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. WHY STELLAR BLOCKCHAIN? */}
      <section className="py-20 bg-[#030905] border-y border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left explanation */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                Stellar Network Advantage
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Why Carbon Credits Belong on Stellar
              </h2>
              <p className="text-sm text-emerald-200/80 leading-relaxed">
                Tokenizing environmental assets on energy-intensive Proof-of-Work blockchains is fundamentally contradictory. Stellar’s Federated Byzantine Agreement (SCP) consensus is mathematically carbon-neutral, ultra-fast, and designed natively for asset issuance.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Negligible Carbon Footprint</h4>
                    <p className="text-xs text-emerald-300/70 mt-0.5">
                      Stellar does not burn electricity on cryptographic hashing puzzle races. The entire global network consumes less energy annually than 35 US households.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Micro-Transactions & Sub-Cent Fees</h4>
                    <p className="text-xs text-emerald-300/70 mt-0.5">
                      Fixed base fee of 100 stroops (0.00001 XLM) allows micro-retirements for e-commerce checkouts, ride-sharing, and API-driven automated corporate offsets.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Soroban WebAssembly Smart Contracts</h4>
                    <p className="text-xs text-emerald-300/70 mt-0.5">
                      High performance Rust/WASM smart contracts provide formal audit guarantees, programmatic royalty distributions, and automated MRV data oracles.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right comparison card */}
            <div className="lg:col-span-6">
              <div className="p-6 rounded-2xl bg-[#06170d] border border-emerald-700/40 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40">
                  <h3 className="text-sm font-bold text-white font-mono">
                    Blockchain Environmental Comparison
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">Validated 2026</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-emerald-300 font-semibold">Stellar (SCP)</span>
                      <span className="text-emerald-400 font-bold">0.00022 kWh / tx (Net Zero)</span>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/50">
                      <div className="h-full bg-emerald-400 w-[2%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-emerald-400/80">Solana (PoS)</span>
                      <span className="text-emerald-400/70">0.00051 kWh / tx</span>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/50">
                      <div className="h-full bg-teal-500 w-[5%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-emerald-400/80">Ethereum (PoS)</span>
                      <span className="text-emerald-400/70">0.0300 kWh / tx (~136x more)</span>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/50">
                      <div className="h-full bg-amber-500 w-[25%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-rose-300">Bitcoin (PoW Mining)</span>
                      <span className="text-rose-400">707.0 kWh / tx (~3,200,000x)</span>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/50">
                      <div className="h-full bg-rose-500 w-[100%]"></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#040e07] border border-emerald-900/60 text-xs font-mono text-emerald-300/80 flex items-center justify-between">
                  <span>Stellar Network Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    100% Carbon Neutral Anchor
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FEATURED PROJECTS PREVIEW */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                Institutional Inventory
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight mt-2">
                Featured Verified Carbon Projects
              </h2>
              <p className="text-sm text-emerald-300/70 mt-1">
                Directly audit satellite telemetry, registry certification, and reserve backing.
              </p>
            </div>
            <button
              onClick={() => navigateTo('marketplace')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 shrink-0"
            >
              <span>View All {projects.length} Verified Projects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-[#071d10] border border-emerald-800/40 hover:border-emerald-500/50 overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071d10] via-transparent to-transparent"></div>
                    
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                        {p.standard}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-800/40">
                        Vintage {p.vintage}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-3">
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#040e07]/90 text-emerald-400 border border-emerald-500/30">
                        Rating: {p.rating ?? 'Not rated'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="text-[11px] font-mono text-emerald-400/80 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{p.location}, {p.country}</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {p.name}
                    </h3>

                    <p className="text-xs text-emerald-300/70 line-clamp-2 leading-relaxed">
                      {p.shortDescription}
                    </p>

                    <div className="pt-2 border-t border-emerald-900/50 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-emerald-400/60 block">Price per tCO2e</span>
                        <span className="text-base font-bold text-white">${p.pricePerTon.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400/60 block">Stock Available</span>
                        <span className="text-xs font-bold text-emerald-300">{p.availableCredits.toLocaleString()} t</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button
                    onClick={() => navigateTo('project-details', p.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-mono transition-colors"
                  >
                    Audit Details
                  </button>
                  <button
                    onClick={() => setSelectedBuyProject(p)}
                    className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-colors"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#0a2817] via-[#072013] to-[#041209] border border-emerald-500/40 p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-400/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-400/20 blur-[80px] rounded-full pointer-events-none"></div>

            <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-semibold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 inline-block mb-4">
              Begin Tokenizing or Offsetting Today
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
              Ready to Accelerate Your Enterprise Net-Zero Transition?
            </h2>

            <p className="text-sm text-emerald-200/80 max-w-xl mx-auto mt-4 leading-relaxed">
              Connect your Stellar wallet to trade high-permanence carbon removals, or submit your reforestation project for automated MRV tokenization.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <button
                onClick={() => navigateTo('marketplace')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
              >
                Launch Carbon Marketplace
              </button>
              <button
                onClick={() => navigateTo('verification')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 font-semibold text-sm font-mono transition-all"
              >
                Developer Verification Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Buy Modal when clicked on featured card */}
      {selectedBuyProject && (
        <BuyCreditsModal
          project={selectedBuyProject}
          isOpen={true}
          onClose={() => setSelectedBuyProject(null)}
        />
      )}

    </div>
  );
};

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

