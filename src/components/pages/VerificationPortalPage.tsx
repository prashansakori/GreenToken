import React, { useEffect, useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import type { ProjectCategory, VerificationStandard } from '../../types';
import { hashEvidenceFile, hashEvidenceDocuments } from '../../services/verification';
import { downloadEvidenceFile, storeEvidenceFile } from '../../services/evidenceStorage';
import { CARBON_CREDIT_CONTRACT_ID, simulateContractCall, SorobanTypes } from '../../services/soroban';
import { STELLAR_CONFIG } from '../../services/stellar';
import { 
  FileCheck2, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PlusCircle, 
  AlertCircle, 
  Trash2, 
  Building2, 
  Satellite, 
  ShieldCheck,
  Fingerprint,
  History
} from 'lucide-react';

export const VerificationPortalPage: React.FC = () => {
  const {
    submissions,
    submitProject,
    reviewProject,
    verificationAuditTrail,
    wallet,
    addToast
  } = useGreenToken();

  const [activeTab, setActiveTab] = useState<'submit' | 'tracker' | 'review'>('submit');

  // Form states
  const [name, setName] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [country, setCountry] = useState('Indonesia');
  const [biome, setBiome] = useState('Tropical Rainforest');
  const [lat, setLat] = useState<number>(-1.5);
  const [lng, setLng] = useState<number>(115.0);
  const [standard, setStandard] = useState<VerificationStandard>('Verra VCS');
  const [methodologyId, setMethodologyId] = useState('VM0007 Tropical Forest Conservation v1.7');
  const [estimatedAnnualCredits, setEstimatedAnnualCredits] = useState<number>(100000);
  const [vintageStart, setVintageStart] = useState<number>(2025);
  const [vintageEnd, setVintageEnd] = useState<number>(2035);
  const [pricePerTon, setPricePerTon] = useState<number>(18.50);
  const [category, setCategory] = useState<ProjectCategory>('forestry');

  // Uploaded docs list
  const [documents, setDocuments] = useState<Array<{ name: string; size: string; type: string; uploadedAt: string; sha256?: string }>>([]);
  const [verificationReferences, setVerificationReferences] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [checkedEvidence, setCheckedEvidence] = useState<Record<string, Record<string, boolean>>>({});
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifierAccess, setVerifierAccess] = useState<{
    address: string;
    status: 'checking' | 'authorized' | 'unauthorized' | 'error';
    name?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (!wallet.address || !CARBON_CREDIT_CONTRACT_ID) {
      setVerifierAccess(null);
      return;
    }

    let active = true;
    setVerifierAccess({ address: wallet.address, status: 'checking' });
    simulateContractCall({
      contractId: CARBON_CREDIT_CONTRACT_ID,
      method: 'get_verifier',
      args: [SorobanTypes.address(wallet.address)],
      sourcePublicKey: wallet.address
    }).then(result => {
      if (!active) return;
      const record = result.returnValue as Record<string, unknown> | null;
      if (result.success && record?.active === true) {
        setVerifierAccess({
          address: wallet.address,
          status: 'authorized',
          name: typeof record.name === 'string' ? record.name : undefined
        });
      } else {
        setVerifierAccess({
          address: wallet.address,
          status: 'unauthorized',
          message: result.error
        });
      }
    }).catch(error => {
      if (active) {
        setVerifierAccess({
          address: wallet.address,
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not query verifier authorization.'
        });
      }
    });

    return () => {
      active = false;
    };
  }, [wallet.address]);

  const activeVerifier = verifierAccess?.address === wallet.address &&
    verifierAccess.status === 'authorized';

  const handleAddEvidenceFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          addToast({ type: 'error', title: 'Evidence File Too Large', message: `${file.name} exceeds the 100 MB limit.` });
          continue;
        }
        try {
          const sha256 = await hashEvidenceFile(file);
          await storeEvidenceFile(sha256, file);
          const newDoc = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type || 'application/octet-stream',
            uploadedAt: new Date().toISOString().split('T')[0],
            sha256
          };
          setDocuments(prev => [...prev, newDoc]);
        } catch (error) {
          addToast({
            type: 'error',
            title: 'Evidence Hashing Failed',
            message: error instanceof Error ? error.message : `The file "${file.name}" could not be hashed.`
          });
        }
      }
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected || !wallet.address) {
      addToast({ type: 'warning', title: 'Connect Developer Wallet', message: 'Connect a Stellar wallet before submitting a project.' });
      return;
    }
    if (!name || !developerName || estimatedAnnualCredits <= 0 || documents.length === 0) {
      addToast({ type: 'error', title: 'Submission Incomplete', message: 'Add project details and at least one evidence file before submitting.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const evidenceHash = await hashEvidenceDocuments(documents);
      const submitted = await submitProject({
        name,
        developerName,
        developerAddress: wallet.address,
        country,
        biome,
        coordinates: { lat, lng },
        standard,
        methodologyId,
        estimatedAnnualCredits,
        vintageStart,
        vintageEnd,
        pricePerTon,
        category,
        documents,
        evidenceHash
      });

      if (!submitted) return;
      setActiveTab('tracker');
      setName('');
      setDocuments([]);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Project evidence could not be processed.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (submissionId: string, decision: 'approved' | 'rejected') => {
    setReviewingSubmissionId(submissionId);
    try {
      const completed = await reviewProject(
        submissionId,
        decision,
        verificationReferences[submissionId] || '',
        rejectionReasons[submissionId] || ''
      );
      if (completed) {
        setVerificationReferences(prev => ({ ...prev, [submissionId]: '' }));
        setRejectionReasons(prev => ({ ...prev, [submissionId]: '' }));
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Review Failed',
        message: error instanceof Error ? error.message : 'The verification decision was not recorded.'
      });
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  const handleInspectSubmissionEvidence = async (submissionId: string, sha256: string | undefined, fileName: string) => {
    if (!sha256) {
      addToast({ type: 'error', title: 'Evidence Digest Missing', message: 'This evidence file has no SHA-256 digest.' });
      return;
    }
    try {
      await downloadEvidenceFile(sha256, fileName);
      setCheckedEvidence(prev => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], [sha256]: true }
      }));
      addToast({ type: 'success', title: 'Evidence Integrity Confirmed', message: `${fileName} matches its recorded SHA-256 digest. Inspect the downloaded evidence before deciding.` });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Evidence Integrity Check Failed',
        message: error instanceof Error ? error.message : 'Could not verify the stored evidence file.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-900/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Independent verifier workflow • Wallet-authorized decisions
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Carbon Project Verification & Developer Portal
            </h1>
            <p className="text-sm text-emerald-300/80 mt-1">
              Submit carbon projects, bind evidence digests, and track independent verification decisions before issuance.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-2 bg-[#06180e] p-1.5 rounded-xl border border-emerald-800/50">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'submit'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Project</span>
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'tracker'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Audit Pipeline ({submissions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'review'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'text-emerald-400/60 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifier Review</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SUBMISSION FORM */}
        {activeTab === 'submit' && (
          <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            
            {/* Step 1: Project Identity */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base pb-3 border-b border-emerald-900/40">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>1. Project Identity & Geographical Coordinates</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-emerald-300">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Borneo Peatland Bio-Shield Protection"
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Developer Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    placeholder="e.g. EarthCare Conservation Trust Ltd."
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Country of Execution</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Biome Classification</label>
                  <input
                    type="text"
                    value={biome}
                    onChange={(e) => setBiome(e.target.value)}
                    placeholder="e.g. Tropical Peat Swamp Forest, Coastal Mangrove"
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Methodology & Impact */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base pb-3 border-b border-emerald-900/40">
                <Satellite className="w-5 h-5 text-cyan-400" />
                <span>2. Standard, Methodology & Issuance Parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-emerald-300">Verification Standard</label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value as VerificationStandard)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Verra VCS">Verra VCS (Verified Carbon Standard)</option>
                    <option value="Gold Standard">Gold Standard for Global Goals</option>
                    <option value="Puro.earth">Puro.earth CORC</option>
                    <option value="Plan Vivo">Plan Vivo Foundation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Project Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="forestry">Forestry & REDD+</option>
                    <option value="blue-carbon">Blue Carbon (Coastal)</option>
                    <option value="direct-air-capture">Direct Air Capture (DAC)</option>
                    <option value="biochar">Biochar Pyrolysis</option>
                    <option value="renewable">Renewable Displacement</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-emerald-300">Methodology Identifier</label>
                  <input
                    type="text"
                    value={methodologyId}
                    onChange={(e) => setMethodologyId(e.target.value)}
                    placeholder="e.g. VM0007 Tropical Forest Conservation v1.7"
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Estimated Annual Yield (tCO2e)</label>
                  <input
                    type="number"
                    min="100"
                    value={estimatedAnnualCredits}
                    onChange={(e) => setEstimatedAnnualCredits(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-300">Target Spot Price ($ / tCO2e)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={pricePerTon}
                    onChange={(e) => setPricePerTon(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: MRV Evidence & Document Upload */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base pb-3 border-b border-emerald-900/40">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span>3. MRV Evidence & Telemetry Document Uploads</span>
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-emerald-800/60 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-[#030d06]/60">
                <input
                  type="file"
                  multiple
                  onChange={handleAddEvidenceFiles}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Upload audit document"
                />
                <UploadCloud className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">
                  Drop PDD Reports, Shapefiles, or Third-Party Audits
                </h4>
                <p className="text-xs text-emerald-400/60 font-mono mt-1">
                  SHA-256 hashed in your browser • Up to 100MB per file
                </p>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-mono text-emerald-400/70">Attached MRV Files ({documents.length})</span>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#030d06] border border-emerald-900/60 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-white truncate">{doc.name}</span>
                          <span className="text-emerald-500/70 text-[10px]">({doc.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="text-rose-400 hover:text-rose-200 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Stellar Developer Payout Wallet */}
            <div className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base pb-3 border-b border-emerald-900/40">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>4. Stellar Developer Wallet & Issuance Custody</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <label className="text-emerald-300">Stellar Developer Public Address</label>
                <input
                  type="text"
                  required
                  value={wallet.address}
                  readOnly
                  className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                />
                <p className="text-[11px] text-emerald-500/70">
                  This connected wallet is recorded as the developer. It cannot verify its own submission.
                </p>
                {!wallet.isConnected && (
                  <p className="text-[11px] text-amber-300">Connect a wallet before submitting a project.</p>
                )}
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting || !wallet.isConnected}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileCheck2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Hashing and registering submission...' : 'Submit project for independent review'}</span>
            </button>

          </form>
        )}

        {/* TAB 2: ACTIVE SUBMISSION TRACKER */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400/80 px-1">
              <span>Auditing Pipeline: {submissions.length} Submissions</span>
              <span>Decisions require an authorized verifier wallet</span>
            </div>

            <div className="space-y-4">
              {submissions.map((sub) => {
                let statusBadge = (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Pending Initial Audit
                  </span>
                );

                if (sub.status === 'in_review') {
                  statusBadge = (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 text-xs font-mono">
                      <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                      In Review
                    </span>
                  );
                } else if (sub.status === 'approved') {
                  statusBadge = (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Independently Verified
                    </span>
                  );
                } else if (sub.status === 'rejected') {
                  statusBadge = (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs font-mono">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      Returned with Guidance
                    </span>
                  );
                }

                return (
                  <div
                    key={sub.id}
                    className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/40 text-emerald-300">
                            {sub.standard}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/60">
                            Project ID: {sub.projectId || sub.id}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-sans">
                          {sub.name}
                        </h3>
                      </div>
                      {statusBadge}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Developer</span>
                        <span className="text-white font-bold">{sub.developerName}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Location / Biome</span>
                        <span className="text-emerald-200">{sub.biome}, {sub.country}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Est. Annual Credits</span>
                        <span className="text-emerald-300 font-bold">{sub.estimatedAnnualCredits.toLocaleString()} tCO2e</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Submitted Timestamp</span>
                        <span className="text-emerald-400/80">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="pt-2 flex flex-wrap gap-2 items-center text-xs font-mono">
                      <span className="text-emerald-400/60 text-[11px]">Audit Attachments:</span>
                      {sub.documents.map((d, i) => (
                        <div key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 flex items-center gap-1.5 text-[11px]">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          <span>{d.name}</span>
                          {d.sha256 && <span className="text-emerald-500/70">SHA-256 {d.sha256.slice(0, 12)}…</span>}
                        </div>
                      ))}
                    </div>

                    {sub.verificationReference && (
                      <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
                        <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                          <span className="text-emerald-400/60 text-[10px] uppercase block">Verification reference</span>
                          <span className="text-emerald-200 break-all">{sub.verificationReference}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                          <span className="text-emerald-400/60 text-[10px] uppercase block">Verifier wallet • timestamp</span>
                          <span className="text-emerald-200 break-all">{sub.verifierWallet} • {sub.verifiedAt && new Date(sub.verifiedAt).toLocaleString()}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950 sm:col-span-2">
                          <span className="text-emerald-400/60 text-[10px] uppercase block">Evidence bundle SHA-256</span>
                          <span className="text-emerald-200 break-all">{sub.evidenceHash}</span>
                        </div>
                      </div>
                    )}

                    {/* Rejection notice if any */}
                    {sub.rejectionReason && (
                      <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 font-mono flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Verifier Feedback: </strong>
                          {sub.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-8">
            <section className="p-5 rounded-2xl bg-[#06180e] border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Independent verifier workspace</h2>
                <p className="text-xs text-emerald-300/70 mt-1">
                  Decisions are wallet-bound, evidence-hash-bound, and cannot be made by the project developer.
                </p>
                <p className="text-[11px] text-amber-300/70 mt-1">
                  Prototype evidence is stored in this browser; production reviews need shared, registry-backed evidence storage.
                </p>
              </div>
              <div className={`px-3 py-2 rounded-xl border text-xs font-mono ${activeVerifier ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300' : 'bg-amber-950/40 border-amber-700/50 text-amber-300'}`}>
                {activeVerifier
                  ? `${verifierAccess?.name || 'Verifier'} • Soroban Authorized`
                  : verifierAccess?.status === 'checking'
                    ? 'Checking Soroban verifier authorization…'
                    : verifierAccess?.status === 'error'
                      ? verifierAccess.message || 'Could not check verifier authorization'
                      : 'Connected wallet is not an active Soroban verifier'}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white">Pending project reviews</h2>
              {submissions.filter((submission) => submission.status === 'pending' || submission.status === 'in_review').length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#06180e] border border-emerald-800/40 text-sm text-emerald-300/70">
                  No projects are waiting for review.
                </div>
              ) : submissions.filter((submission) => submission.status === 'pending' || submission.status === 'in_review').map((sub) => {
                const hasEvidence = sub.documents.length > 0 && sub.documents.every((document) => Boolean(document.sha256));
                const isOwnProject = Boolean(wallet.address) && wallet.address.toUpperCase() === sub.developerAddress.toUpperCase();
                const hasInspectedEvidence = hasEvidence && sub.documents.every((document) => Boolean(document.sha256 && checkedEvidence[sub.id]?.[document.sha256]));
                const canReview = Boolean(activeVerifier) &&
                  !isOwnProject &&
                  hasInspectedEvidence &&
                  sub.registrationStatus === 'confirmed' &&
                  Boolean(sub.sorobanProjectId) &&
                  sub.verificationStatus !== 'pending';

                return (
                  <article key={sub.id} className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-emerald-400/70">
                          {sub.sorobanProjectId ? `Soroban project #${sub.sorobanProjectId}` : 'No confirmed Soroban project ID'} • {sub.standard}
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">{sub.name}</h3>
                        <p className="text-xs text-emerald-300/70 mt-1">
                          Developer wallet: <span className="font-mono break-all">{sub.developerAddress}</span>
                        </p>
                        {sub.registrationTxHash && (
                          <a
                            href={STELLAR_CONFIG.explorerTxUrl(sub.registrationTxHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-cyan-300 hover:text-white break-all"
                          >
                            Registration transaction: {sub.registrationTxHash}
                          </a>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-950/50 border border-amber-700/50 text-amber-300 text-xs font-mono">
                        PENDING
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Methodology</span>
                        <span className="text-emerald-200">{sub.methodologyId}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#030d06] border border-emerald-950">
                        <span className="text-emerald-400/60 text-[10px] uppercase block">Submission time</span>
                        <span className="text-emerald-200">{new Date(sub.submittedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono text-emerald-400/70">Evidence files and SHA-256 digests</span>
                      {sub.documents.map((document) => (
                        <div key={`${sub.id}-${document.name}`} className="p-3 rounded-xl bg-[#030d06] border border-emerald-950 flex items-start gap-2">
                          <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-white break-all">{document.name} <span className="text-emerald-500/60">({document.size})</span></div>
                            <div className="text-[10px] text-emerald-300/70 break-all mt-1">{document.sha256 || 'Legacy sample: no retained file or SHA-256 digest'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInspectSubmissionEvidence(sub.id, document.sha256, document.name)}
                            disabled={!document.sha256}
                            className="shrink-0 text-[10px] font-mono text-cyan-300 hover:text-white disabled:opacity-40"
                          >
                            {document.sha256 && checkedEvidence[sub.id]?.[document.sha256] ? 'Digest confirmed' : 'Inspect & verify'}
                          </button>
                        </div>
                      ))}
                      {sub.evidenceHash && <p className="text-[10px] font-mono text-cyan-300 break-all">Evidence bundle: {sub.evidenceHash}</p>}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-emerald-400/70">Verification reference *</label>
                        <input
                          value={verificationReferences[sub.id] || ''}
                          onChange={(event) => setVerificationReferences(prev => ({ ...prev, [sub.id]: event.target.value }))}
                          placeholder="Independent registry or audit report reference"
                          className="w-full bg-[#030d06] border border-emerald-900/70 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-rose-300/70">Rejection reason (required to reject)</label>
                        <input
                          value={rejectionReasons[sub.id] || ''}
                          onChange={(event) => setRejectionReasons(prev => ({ ...prev, [sub.id]: event.target.value }))}
                          placeholder="Reason and actionable feedback"
                          className="w-full bg-[#030d06] border border-rose-900/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>

                    {!hasEvidence && (
                      <p className="text-xs text-amber-300">This legacy sample cannot be approved because its original files and digests are unavailable. Submit a new project with evidence files to enable review.</p>
                    )}
                    {hasEvidence && !hasInspectedEvidence && (
                      <p className="text-xs text-cyan-300">Inspect each stored evidence file and confirm its digest before recording a decision.</p>
                    )}
                    {isOwnProject && (
                      <p className="text-xs text-rose-300">This wallet submitted the project and is barred from reviewing it.</p>
                    )}
                    {sub.registrationStatus === 'pending' && (
                      <p className="text-xs text-amber-300">
                        Registration is awaiting Testnet confirmation. This submission cannot be reviewed yet; do not register it again.
                      </p>
                    )}
                    {!sub.sorobanProjectId && sub.registrationStatus !== 'pending' && (
                      <p className="text-xs text-amber-300">
                        This local or legacy submission is not registered in Soroban and cannot be approved on-chain.
                      </p>
                    )}
                    {sub.verificationStatus === 'pending' && sub.verificationTxHash && (
                      <p className="text-xs text-amber-300 break-all">
                        A verification transaction is pending. Do not retry:{' '}
                        <a
                          href={STELLAR_CONFIG.explorerTxUrl(sub.verificationTxHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 hover:text-white"
                        >
                          {sub.verificationTxHash}
                        </a>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        disabled={!canReview || !verificationReferences[sub.id]?.trim() || !rejectionReasons[sub.id]?.trim() || reviewingSubmissionId === sub.id}
                        onClick={() => handleReview(sub.id, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-200 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {reviewingSubmissionId === sub.id ? 'Recording…' : 'Reject with reason'}
                      </button>
                      <button
                        disabled={!canReview || !verificationReferences[sub.id]?.trim() || reviewingSubmissionId === sub.id}
                        onClick={() => handleReview(sub.id, 'approved')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {reviewingSubmissionId === sub.id ? 'Recording…' : 'Approve project'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Verification audit trail</h2>
              </div>
              {verificationAuditTrail.length === 0 ? (
                <p className="text-xs text-emerald-400/60">No project or verification events have been recorded yet.</p>
              ) : verificationAuditTrail.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl bg-[#06180e] border border-emerald-900/50 grid gap-2 sm:grid-cols-2 text-xs font-mono">
                  <span className={entry.action === 'rejected' ? 'text-rose-300' : entry.action === 'approved' ? 'text-emerald-300' : 'text-cyan-300'}>
                    {entry.action.toUpperCase()} • {entry.projectId}
                  </span>
                  <span className="text-emerald-400/70 sm:text-right">{new Date(entry.timestamp).toLocaleString()}</span>
                  {entry.actorWallet && <span className="text-emerald-200 break-all">Wallet: {entry.actorWallet}</span>}
                  {entry.verificationReference && <span className="text-emerald-200 break-all">Reference: {entry.verificationReference}</span>}
                  {entry.evidenceHash && <span className="text-emerald-300 break-all sm:col-span-2">Evidence SHA-256: {entry.evidenceHash}</span>}
                  {entry.reason && <span className="text-rose-200 sm:col-span-2">Reason: {entry.reason}</span>}
                </div>
              ))}
            </section>
          </div>
        )}

      </div>
    </div>
  );
};

