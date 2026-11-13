import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { CARBON_CREDIT_CONTRACT_ID } from '../../services/soroban';
import { STELLAR_CONFIG } from '../../services/stellar';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Coins, 
  Award, 
  PlusCircle, 
  Building2, 
  FileText, 
  ExternalLink, 
  Activity, 
  Send,
  Sparkles,
  Lock,
  Layers,
  Database
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { 
    submissions, 
    projects, 
    issueCredits, 
    verifiers, 
    addVerifier, 
    toggleVerifierStatus,
    wallet,
    openWalletModal,
    navigateTo
  } = useGreenToken();

  const [activeTab, setActiveTab] = useState<'pending' | 'verifiers' | 'mint' | 'stats'>('pending');

  // Mint Studio state
  const [mintProjectId, setMintProjectId] = useState<string>(
    projects.find(project => project.status === 'active' && project.sorobanProjectId)?.id || ''
  );
  const [mintAmount, setMintAmount] = useState<number>(1);
  const [mintVintage, setMintVintage] = useState<number>(new Date().getUTCFullYear());
  const [isIssuing, setIsIssuing] = useState(false);

  // New Verifier state
  const [newVerifierOpen, setNewVerifierOpen] = useState(false);
  const [vName, setVName] = useState('');
  const [vCode, setVCode] = useState('');
  const [vRegistryType, setVRegistryType] = useState('AFOLU & Industrial Standards');
  const [vSigningKey, setVSigningKey] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [isSavingVerifier, setIsSavingVerifier] = useState(false);
  const [togglingVerifierId, setTogglingVerifierId] = useState<string | null>(null);

  const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'in_review');
  const issuableProjects = projects.filter(project =>
    project.status === 'active' && Boolean(project.sorobanProjectId)
  );
  const selectedIssuanceProject = issuableProjects.find(project => project.id === mintProjectId);
  const remainingIssuanceLimit = selectedIssuanceProject
    ? Math.max(0, (selectedIssuanceProject.approvedCredits || 0) - selectedIssuanceProject.totalCredits)
    : 0;

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintProjectId || mintAmount <= 0 || isIssuing) return;
    setIsIssuing(true);
    try {
      await issueCredits(mintProjectId, mintAmount, mintVintage);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleCreateVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vCode.trim() || !vSigningKey.trim() || isSavingVerifier) return;
    setIsSavingVerifier(true);
    try {
      const saved = await addVerifier({
        name: vName.trim(),
        code: vCode.trim(),
        registryType: vRegistryType,
        stellarSigningKey: vSigningKey.trim(),
        accreditedSince: new Date().toISOString().split('T')[0],
        status: 'active',
        contactEmail: vEmail || ''
      });
      if (saved) {
        setNewVerifierOpen(false);
        setVName('');
        setVCode('');
        setVSigningKey('');
        setVEmail('');
      }
    } finally {
      setIsSavingVerifier(false);
    }
  };

  const handleToggleVerifier = async (verifierId: string) => {
    if (togglingVerifierId) return;
    setTogglingVerifierId(verifierId);
    try {
      await toggleVerifierStatus(verifierId);
    } finally {
      setTogglingVerifierId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Protocol Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Project issuance controls • approved-amount limits
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Protocol Governance & Verifier Registry
            </h1>
            <p className="text-sm text-emerald-300/80 mt-1">
              Manage accredited verifier addresses and issue credits only after independent project approval.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#06180e] p-1.5 rounded-xl border border-emerald-800/50">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'pending'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Review Queue ({pendingSubmissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('mint')}
              disabled={!CARBON_CREDIT_CONTRACT_ID}
              title={!CARBON_CREDIT_CONTRACT_ID ? 'Configure the deployed Soroban contract first.' : 'Issue credits through Soroban.'}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'mint'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white disabled:text-emerald-500/40 disabled:cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Issue Credits</span>
            </button>

            <button
              onClick={() => setActiveTab('verifiers')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'verifiers'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Authorized Verifiers ({verifiers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Platform Health</span>
            </button>
          </div>
        </div>

        {/* 1. REVIEW QUEUE: PENDING SUBMISSIONS */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400/70 px-1">
              <span>{pendingSubmissions.length} Projects Requiring Independent Review</span>
              <span>Only an authorized, independent verifier can record a decision</span>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#06180e] border border-emerald-800/40 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-white font-bold text-base">Review Queue Is Empty</h4>
                <p className="text-xs text-emerald-300/70">
                  All submitted projects have been processed or moved to live tokenization.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/50 text-emerald-300">
                            {sub.standard}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/70">
                            Category: {sub.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-sans">
                          {sub.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateTo('verification')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/50 text-emerald-200 font-bold text-xs font-mono transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Open verifier review portal
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Developer</span>
                        <span className="text-white font-bold">{sub.developerName}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Country & Coordinates</span>
                        <span className="text-emerald-300">{sub.country} ({sub.coordinates.lat.toFixed(2)}, {sub.coordinates.lng.toFixed(2)})</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Requested Mint Volume</span>
                        <span className="text-white font-bold">{sub.estimatedAnnualCredits.toLocaleString()} tCO2e</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Target Price</span>
                        <span className="text-emerald-300 font-bold">${sub.pricePerTon.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Developer Wallet & Methodology */}
                    <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <div>
                        <span className="text-emerald-400/60 text-[10px] block">Methodology Code:</span>
                        <span className="text-emerald-200">{sub.methodologyId}</span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-emerald-400/60 text-[10px] block">Recipient Stellar Wallet:</span>
                        <span className="text-emerald-300">{sub.developerAddress}</span>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="flex flex-wrap gap-2 items-center text-xs font-mono pt-1">
                      <span className="text-emerald-400/60 text-[11px]">Audit Documents:</span>
                      {sub.documents.map((d, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 flex items-center gap-1.5 text-[11px]">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          {d.name} ({d.size})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. TOKEN MINTING STUDIO */}
        {activeTab === 'mint' && (
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-6">
            {!CARBON_CREDIT_CONTRACT_ID && (
              <p role="alert" className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-200">
                Configure the deployed Soroban contract before issuing credits.
              </p>
            )}
            {CARBON_CREDIT_CONTRACT_ID && !wallet.isConnected && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-200 flex items-center justify-between gap-3">
                <span>Connect the project developer or contract administrator wallet to authorize issuance.</span>
                <button type="button" onClick={openWalletModal} className="shrink-0 underline">Connect wallet</button>
              </div>
            )}
            <div className="pb-3 border-b border-emerald-900/40">
              <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                Stellar Carbon Token Minting & Tranche Issuance
              </h3>
              <p className="text-xs text-emerald-400/70 font-mono mt-1">
                Directly mint new vintage tranches to the accredited project developer's Stellar address.
              </p>
            </div>

            <form onSubmit={handleMintSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-emerald-300">Target Project for Token Issuance</label>
                <select
                  value={mintProjectId}
                  onChange={(e) => setMintProjectId(e.target.value)}
                  className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                >
                  {!issuableProjects.length && <option value="">No Soroban-approved projects</option>}
                  {issuableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.stellarAsset.code} - {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-emerald-300">Metric Tonnes to Mint (tCO2e)</label>
                  <input
                    type="number"
                    min="1"
                    max={remainingIssuanceLimit}
                    value={mintAmount}
                    onChange={(e) => setMintAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Vintage Year</label>
                  <input
                    type="number"
                    min="0"
                    max="4294967295"
                    value={mintVintage}
                    onChange={(e) => setMintVintage(parseInt(e.target.value) || 2025)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1 text-[11px]">
                <p><strong>Operation:</strong> Soroban <code>issue_credits</code>. Credits are assigned to the developer wallet recorded on-chain.</p>
                {selectedIssuanceProject && (
                  <p>Remaining approved limit: {remainingIssuanceLimit.toLocaleString()} tCO₂e · Recipient: <span className="break-all">{selectedIssuanceProject.developer.address}</span></p>
                )}
                <p className="text-emerald-400/80">Freighter authorization and Soroban confirmation are required. No local-only mint is recorded.</p>
              </div>

              <button
                type="submit"
                disabled={
                  isIssuing ||
                  !CARBON_CREDIT_CONTRACT_ID ||
                  !wallet.isConnected ||
                  !selectedIssuanceProject ||
                  mintAmount <= 0 ||
                  mintAmount > remainingIssuanceLimit
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                {isIssuing ? 'Waiting for Soroban confirmation…' : 'Authorize On-Chain Issuance'}
              </button>
            </form>
          </div>
        )}

        {/* 3. AUTHORIZED VERIFIERS MANAGEMENT */}
        {activeTab === 'verifiers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
              <div>
                <h3 className="text-lg font-bold text-white font-sans">
                  Accredited Validation & Verification Bodies (VVBs)
                </h3>
                <p className="text-xs text-emerald-400/70 font-mono">
                  Entities holding authorized multi-sig signing keys for carbon project registration
                </p>
              </div>

              <button
                disabled
                title="Verifier authorization is administered by the Soroban contract."
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Verifier provisioning unavailable</span>
              </button>
            </div>

            {/* Add Verifier Form Modal/Drawer */}
            {newVerifierOpen && (
              <form onSubmit={handleCreateVerifier} className="p-5 rounded-2xl bg-[#071c10] border border-emerald-600/50 space-y-4 max-w-2xl text-xs font-mono">
                <h4 className="text-sm font-bold text-white">Register New Accredited VVB</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-emerald-300 block mb-1">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={vName}
                      onChange={(e) => setVName(e.target.value)}
                      placeholder="e.g. TÜV SÜD Clean Energy"
                      className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-emerald-300 block mb-1">Identifier Code</label>
                    <input
                      type="text"
                      required
                      value={vCode}
                      onChange={(e) => setVCode(e.target.value)}
                      placeholder="e.g. TUV-MUNICH"
                      className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-emerald-300 block mb-1">Stellar Signing Public Key</label>
                  <input
                    type="text"
                    required
                    value={vSigningKey}
                    onChange={(e) => setVSigningKey(e.target.value)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setNewVerifierOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-emerald-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-bold"
                  >
                    Save Verifier
                  </button>
                </div>
              </form>
            )}

            {/* Verifiers Table */}
            <div className="overflow-x-auto rounded-2xl bg-[#06180e] border border-emerald-800/40 p-4 shadow-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-emerald-900/50 text-emerald-400/70 uppercase">
                    <th className="py-2.5 px-3">Verifier / Organization</th>
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3">Stellar Signing Key</th>
                    <th className="py-2.5 px-3">Audits Completed</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/80">
                  {verifiers.map((v) => (
                    <tr key={v.id} className="hover:bg-emerald-950/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{v.name}</span>
                        <span className="text-[10px] text-emerald-400/60">{v.code}</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-300">{v.registryType}</td>
                      <td className="py-3 px-3 text-emerald-400">
                        {v.stellarSigningKey.substring(0, 8)}...{v.stellarSigningKey.substring(v.stellarSigningKey.length - 6)}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{v.auditsCompleted}</td>
                      <td className="py-3 px-3">
                        {v.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          disabled
                          title="Verifier authorization is administered by the Soroban contract."
                          className="text-[11px] underline text-emerald-500/40 cursor-not-allowed"
                        >
                          Managed on-chain
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PLATFORM HEALTH & PROTOCOL AUDIT */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-3">
              <span className="text-xs font-mono uppercase text-emerald-400/70 block">Ethereum Gas Savings</span>
              <p className="text-3xl font-bold font-mono text-emerald-300">$1,420,800</p>
              <p className="text-xs text-emerald-400/70 leading-relaxed">
                Saved in network transaction fees by choosing Stellar over Ethereum L1 ERC-20 carbon wrappers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-3">
              <span className="text-xs font-mono uppercase text-emerald-400/70 block">Buffer Escrow Reserve</span>
              <p className="text-3xl font-bold font-mono text-white">15.4%</p>
              <p className="text-xs text-emerald-400/70 leading-relaxed">
                Tokens automatically locked in decentralized buffer pools to protect against natural forest reversal risks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-3">
              <span className="text-xs font-mono uppercase text-emerald-400/70 block">Active Stellar Nodes</span>
              <p className="text-3xl font-bold font-mono text-cyan-300">24 Validators</p>
              <p className="text-xs text-emerald-400/70 leading-relaxed">
                SDF, DNV, Verra, and university nodes validating environmental asset consensus.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

