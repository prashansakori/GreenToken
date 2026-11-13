import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Satellite, 
  Cpu, 
  ExternalLink, 
  Calendar, 
  Award, 
  Coins, 
  CheckCircle2, 
  Globe2, 
  Trees, 
  Sparkles,
  ShoppingBag,
  Flame,
  Info
} from 'lucide-react';
import { BuyCreditsModal } from '../common/BuyCreditsModal';
import { RetireCreditsModal } from '../common/RetireCreditsModal';

export const ProjectDetailsPage: React.FC = () => {
  const { 
    projects, 
    selectedProjectId, 
    navigateTo, 
    wallet 
  } = useGreenToken();

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [retireModalOpen, setRetireModalOpen] = useState(false);

  // Active project lookup or fallback to first
  const project = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!project) {
    return (
      <div className="min-h-screen bg-[#040d07] text-emerald-100 flex items-center justify-center">
        <p>Project not found.</p>
      </div>
    );
  }

  const soldPercentage = Math.round(((project.totalCredits - project.availableCredits) / project.totalCredits) * 100);

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('marketplace')}
            className="flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>
          <div className="text-xs font-mono text-emerald-500/80">
            Stellar Core Asset Code: <strong className="text-emerald-300">{project.stellarAsset.code}</strong>
          </div>
        </div>

        {/* Hero Banner with Imagery */}
        <div className="relative rounded-3xl overflow-hidden border border-emerald-800/40 shadow-2xl h-80 sm:h-96">
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040d07] via-[#040d07]/40 to-transparent"></div>

          {/* Badges Overlay */}
          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              {project.standard} #{project.registryId}
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-700/50 text-xs font-mono">
              Vintage {project.vintage}
            </span>
            {project.status === 'active' ? (
              <span className="px-3 py-1 rounded-xl bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-600/50 text-xs font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Independently Verified
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-amber-950/80 backdrop-blur-md text-amber-200 border border-amber-700/50 text-xs font-mono">
                {project.status === 'pending' ? 'Verification Pending' : 'Not Approved'}
              </span>
            )}
          </div>

          <div className="absolute top-6 right-6">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#040e07]/90 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-sm shadow-xl">
              BeZero Rating: {project.rating ?? 'Not rated'}
            </div>
          </div>

          {/* Title and location at bottom */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 mb-1">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{project.location}, {project.country} (Coordinates: {project.coordinates.lat.toFixed(4)}, {project.coordinates.lng.toFixed(4)})</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>
          </div>
        </div>

        {/* Main Content Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Deep Dive Details (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Overview & Narrative */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-4">
              <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Trees className="w-5 h-5 text-emerald-400" />
                Project Description & Ecological Scope
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
                {project.description}
              </p>

              {/* Developer info */}
              <div className="pt-3 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-emerald-400/60 uppercase block text-[10px]">Accredited Project Developer</span>
                  <span className="font-bold text-white">{project.developer.name}</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-emerald-400/60 uppercase block text-[10px]">Stellar Developer Key</span>
                  <span className="text-emerald-300">{project.developer.address.substring(0, 10)}...{project.developer.address.substring(project.developer.address.length - 8)}</span>
                </div>
              </div>
            </div>

            {/* MRV & Verification Telemetry */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-cyan-400" />
                  MRV Remote Sensing & Ground Audit
                </h2>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-800/50">
                  {project.status === 'active' ? 'Approved' : 'Pending Verification'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60 space-y-1">
                  <span className="text-emerald-400/60 text-[10px] uppercase block">Independent Auditor (VVB)</span>
                  <span className="text-white font-bold">{project.mrvData.auditor}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60 space-y-1">
                  <span className="text-emerald-400/60 text-[10px] uppercase block">Approved Methodology</span>
                  <span className="text-white font-bold">{project.mrvData.methodology}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60 space-y-1">
                  <span className="text-emerald-400/60 text-[10px] uppercase block">Monitoring Window</span>
                  <span className="text-emerald-300">{project.mrvData.monitoringPeriod}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60 space-y-1">
                  <span className="text-emerald-400/60 text-[10px] uppercase block">Buffer Pool Escrow</span>
                  <span className="text-emerald-300 font-bold">
                    {project.mrvData.bufferPoolPercent === undefined
                      ? 'Not configured'
                      : `${project.mrvData.bufferPoolPercent}% in Stellar MultiSig`}
                  </span>
                </div>
              </div>

              {project.mrvData.canopyDensity && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="text-white font-semibold">Canopy Density Sensor Health: </span>
                    <span className="text-emerald-300">{project.mrvData.canopyDensity}</span>
                  </div>
                </div>
              )}

              {project.verification && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2 text-xs font-mono">
                  <div className="text-emerald-200">Verifier wallet: <span className="break-all">{project.verification.verifierWallet}</span></div>
                  <div className="text-emerald-200">Reference: <span className="break-all">{project.verification.verificationReference}</span></div>
                  <div className="text-emerald-200">Verified: {new Date(project.verification.verifiedAt).toLocaleString()}</div>
                  <div className="text-emerald-300 break-all">Evidence SHA-256: {project.verification.evidenceHash}</div>
                </div>
              )}
            </div>

            {/* UN Sustainable Development Goals (SDGs) */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-4">
              <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                UN Sustainable Development Goals (SDGs)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {project.sdgGoals.map((sdg) => (
                  <div 
                    key={sdg} 
                    className="p-3 rounded-xl bg-[#030d06] border border-emerald-900/60 flex items-center gap-2.5 text-xs font-mono"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                      #{sdg}
                    </div>
                    <span className="text-emerald-200/90 text-[11px]">
                      {sdg === 13 && 'Climate Action'}
                      {sdg === 14 && 'Life Below Water'}
                      {sdg === 15 && 'Life on Land'}
                      {sdg === 8 && 'Decent Work'}
                      {sdg === 6 && 'Clean Water'}
                      {sdg === 9 && 'Innovation'}
                      {sdg === 12 && 'Responsible Prod'}
                      {sdg === 7 && 'Affordable Energy'}
                      {sdg === 1 && 'No Poverty'}
                      {sdg === 5 && 'Gender Equality'}
                      {sdg === 17 && 'Partnerships'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stellar Blockchain Specifications */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-4">
              <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400" />
                Stellar Smart Contract & Ledger Specifications
              </h2>
              
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-emerald-400/70">Stellar Asset Code</span>
                  <span className="text-white font-bold">{project.stellarAsset.code}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-emerald-400/70">Soroban Contract ID</span>
                  <span className="text-emerald-300 truncate max-w-xs">{project.stellarAsset.contractId}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-emerald-400/70">Issuing Account Public Key</span>
                  <span className="text-emerald-300 truncate max-w-xs">{project.stellarAsset.issuer}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Settlement Widget (4 cols) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            
            <div className="p-6 rounded-2xl bg-[#071f11] border border-emerald-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                    Spot Price per Tonne
                  </span>
                  <span className="text-3xl font-extrabold text-white font-mono">
                    ${project.pricePerTon.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400/70 block">XLM Est.</span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    ≈ {(project.pricePerTon / 0.115).toFixed(1)} XLM
                  </span>
                </div>
              </div>

              {/* Inventory meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-300">Remaining Inventory</span>
                  <span className="text-white font-bold">{project.availableCredits.toLocaleString()} tCO2e</span>
                </div>
                <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/40">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                    style={{ width: `${soldPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-emerald-400/60">
                  <span>{soldPercentage}% Sold</span>
                  <span>{project.totalCredits.toLocaleString()} Total Minted</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setBuyModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Acquire & Hold in Wallet
                </button>

                <button
                  onClick={() => setRetireModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono transition-colors"
                >
                  <Flame className="w-4 h-4 text-emerald-400" />
                  Direct Permanent Retirement Flow
                </button>
              </div>

              {/* Guarantees */}
              <div className="pt-4 border-t border-emerald-800/40 space-y-2 text-[11px] font-mono text-emerald-300/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Settles in ~3.2 seconds on Stellar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Article 6 & Paris Agreement aligned</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Soroban retirement record after confirmed transaction</span>
                </div>
              </div>

            </div>

            {/* Official Registry Deep Link */}
            {project.registryUrl && (
              <a
                href={project.registryUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full p-4 rounded-xl bg-[#06180e] border border-emerald-800/40 hover:border-emerald-600/60 flex items-center justify-between text-xs font-mono text-emerald-300 hover:text-white transition-all group"
              >
                <span>View on Official {project.standard} Registry</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}

          </div>

        </div>

      </div>

      {/* Modals */}
      {buyModalOpen && (
        <BuyCreditsModal
          project={project}
          isOpen={true}
          onClose={() => setBuyModalOpen(false)}
        />
      )}

      {retireModalOpen && (
        <RetireCreditsModal
          isOpen={true}
          onClose={() => setRetireModalOpen(false)}
        />
      )}
    </div>
  );
};

