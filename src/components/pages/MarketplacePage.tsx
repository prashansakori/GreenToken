import React, { useState, useMemo } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import type { CarbonProject, ProjectCategory, VerificationStandard } from '../../types';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ShoppingBag, 
  ShieldCheck, 
  Coins, 
  MapPin, 
  ExternalLink, 
  Check, 
  Sparkles,
  TreePine,
  Waves,
  Wind,
  Flame,
  Zap,
  Tag,
  ArrowLeftRight
} from 'lucide-react';
import { BuyCreditsModal } from '../common/BuyCreditsModal';
import { TransferCreditsModal } from '../common/TransferCreditsModal';

export const MarketplacePage: React.FC = () => {
  const { projects, navigateTo, wallet, openWalletModal } = useGreenToken();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'available' | 'vintage'>('price-asc');
  const [selectedBuyProject, setSelectedBuyProject] = useState<CarbonProject | null>(null);
  const [selectedTransferProject, setSelectedTransferProject] = useState<CarbonProject | null>(null);

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Biomes', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'forestry', label: 'Forestry & REDD+', icon: <TreePine className="w-3.5 h-3.5" /> },
    { id: 'blue-carbon', label: 'Blue Carbon (Coastal)', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'direct-air-capture', label: 'Direct Air Capture (DAC)', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'biochar', label: 'Biochar Pyrolysis', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'renewable', label: 'Renewable Displacement', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const standards: string[] = ['all', 'Verra VCS', 'Gold Standard', 'Puro.earth', 'Plan Vivo'];

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Status filter
      if (p.status !== 'active') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCountry = p.country.toLowerCase().includes(q);
        const matchCode = p.stellarAsset.code.toLowerCase().includes(q);
        const matchRegistry = p.registryId.toLowerCase().includes(q);
        if (!matchName && !matchCountry && !matchCode && !matchRegistry) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Standard filter
      if (selectedStandard !== 'all' && p.standard !== selectedStandard) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerTon - b.pricePerTon;
      if (sortBy === 'price-desc') return b.pricePerTon - a.pricePerTon;
      if (sortBy === 'available') return b.availableCredits - a.availableCredits;
      if (sortBy === 'vintage') return b.vintage - a.vintage;
      return 0;
    });
  }, [projects, searchQuery, selectedCategory, selectedStandard, sortBy]);

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GreenToken Soroban Marketplace • Stellar Testnet
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Institutional Carbon Credit Marketplace
          </h1>
          <p className="text-sm text-emerald-300/80 max-w-2xl">
            Review approved carbon projects and transfer contract-tracked credits through Freighter. Purchases remain disabled until an atomic payment-and-delivery flow is configured.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            {wallet.isConnected ? (
              <span className="rounded-lg border border-emerald-800/50 bg-[#06180e] px-3 py-2 text-emerald-300">
                {wallet.publicKeyFormatted || wallet.address} • {wallet.xlmBalance.toFixed(2)} Testnet XLM
              </span>
            ) : (
              <button
                onClick={openWalletModal}
                className="rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-3 py-2 text-emerald-300 hover:text-white"
              >
                Connect Freighter to view Testnet balance
              </button>
            )}
            <span className="text-emerald-400/60">Listing metadata and prices are off-chain; transfers are enforced by Soroban.</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-5 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
          
          {/* Top row: Search input & Sorting */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name, country, asset code (e.g. GRN-RIMBA), or registry ID..."
                className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-emerald-600/60 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Standard Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="bg-[#030d06] border border-emerald-900/70 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">All Standards (Verra, GS, Puro)</option>
                <option value="Verra VCS">Verra VCS</option>
                <option value="Gold Standard">Gold Standard</option>
                <option value="Puro.earth">Puro.earth CORC</option>
                <option value="Plan Vivo">Plan Vivo</option>
              </select>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#030d06] border border-emerald-900/70 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="available">Most Available Stock</option>
                <option value="vintage">Newest Vintage</option>
              </select>
            </div>
          </div>

          {/* Bottom row: Category Pills */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-900/40">
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-[#030d06] text-emerald-400/70 border border-emerald-900/60 hover:text-white hover:border-emerald-800'
                  }`}
                >
                  {c.icon}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs font-mono text-emerald-400/70 px-1">
          <span>Showing {filteredProjects.length} Verified Carbon Assets</span>
          <span>Credit transfers: Soroban • Purchases: unavailable</span>
        </div>

        {/* Grid of Projects */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-3">
            <p className="text-emerald-300 text-sm font-mono">No carbon projects match your active search filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedStandard('all'); }}
              className="text-xs font-mono text-emerald-400 underline hover:text-emerald-200"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => {
              const soldPercentage = Math.round(((p.totalCredits - p.availableCredits) / p.totalCredits) * 100);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-[#071c10] border border-emerald-800/40 hover:border-emerald-500/50 overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <div>
                    {/* Cover image & badges */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071c10] via-transparent to-transparent"></div>
                      
                      {/* Top badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        {p.status === 'active' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                          {p.standard}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-800/40">
                          Vintage {p.vintage}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#040e07]/90 text-emerald-400 border border-emerald-500/40 shadow-md">
                          Rating: {p.rating ?? 'Not rated'}
                        </span>
                      </div>

                      {/* Stellar Asset Code Overlay */}
                      <div className="absolute bottom-2 left-3">
                        <span className="text-xs font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-emerald-500/20">
                          {p.stellarAsset.code}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div className="text-[11px] font-mono text-emerald-400/80 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{p.location}, {p.country}</span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {p.name}
                      </h3>

                      <p className="text-xs text-emerald-300/70 line-clamp-2 leading-relaxed">
                        {p.shortDescription}
                      </p>

                      {/* Stock & Progress bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px] font-mono text-emerald-400/80">
                          <span>Listed: <strong>{p.availableCredits.toLocaleString()} tCO2e</strong></span>
                          <span>{soldPercentage}% Listed inventory</span>
                        </div>
                        <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-900/50">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
                            style={{ width: `${soldPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Price row */}
                      <div className="pt-2 border-t border-emerald-900/50 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400/60 uppercase block">
                            Price per Tonne
                          </span>
                          <span className="text-lg font-bold font-mono text-white">
                            ${p.pricePerTon.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-emerald-400/60 block">
                            Indicative XLM equivalent
                          </span>
                          <span className="text-xs font-mono font-semibold text-emerald-300">
                            ≈ {(p.pricePerTon / 0.115).toFixed(1)} XLM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-5 pt-0 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigateTo('project-details', p.id)}
                      className="flex-1 min-w-[92px] py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-mono transition-colors"
                    >
                      Audit Details
                    </button>
                    <button
                      onClick={() => setSelectedBuyProject(p)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 font-bold text-xs font-mono transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Buy Credits
                    </button>
                    <button
                      onClick={() => setSelectedTransferProject(p)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Transfer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Buy Modal */}
      {selectedBuyProject && (
        <BuyCreditsModal
          project={selectedBuyProject}
          isOpen={true}
          onClose={() => setSelectedBuyProject(null)}
        />
      )}
      {selectedTransferProject && (
        <TransferCreditsModal
          project={selectedTransferProject}
          isOpen={true}
          onClose={() => setSelectedTransferProject(null)}
        />
      )}
    </div>
  );
};

