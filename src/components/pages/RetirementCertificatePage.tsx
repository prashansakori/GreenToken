import React, { useState } from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { 
  Award, 
  Printer, 
  ExternalLink, 
  Check, 
  Copy, 
  ShieldCheck, 
  ArrowLeft
} from 'lucide-react';

export const RetirementCertificatePage: React.FC = () => {
  const { 
    certificates, 
    selectedCertificateId, 
    navigateTo, 
    addToast 
  } = useGreenToken();

  const [copiedLink, setCopiedLink] = useState(false);

  // Active certificate lookup or default to first
  const activeCert = certificates.find(c => c.id === selectedCertificateId) || certificates[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast({
      type: 'success',
      title: 'Verification Link Copied',
      message: 'Certificate verification link copied to clipboard.'
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!activeCert) {
    return (
      <div className="min-h-screen bg-[#040d07] text-emerald-100 flex flex-col items-center justify-center p-4">
        <p className="text-sm font-mono text-emerald-400">No retirement certificate found.</p>
        <button
          onClick={() => navigateTo('portfolio')}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs font-mono"
        >
          Go to Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Controls Bar (Hidden during Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
          <button
            onClick={() => navigateTo('portfolio')}
            className="flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portfolio</span>
          </button>

          {/* Certificate Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {certificates.length > 1 && (
              <select
                value={activeCert.id}
                onChange={(e) => navigateTo('certificate', e.target.value)}
                className="bg-[#06180e] border border-emerald-800/60 rounded-xl px-3 py-2 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-400"
              >
                {certificates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.certificateNumber} - {c.amountTonnes} tCO2e ({c.beneficiaryName})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06180e] hover:bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-xs font-mono transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Link</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {activeCert.source !== 'soroban' && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200">
            This is a legacy/local certificate record and has not been verified against a Soroban retirement transaction.
          </div>
        )}

        {/* ================= RETIREMENT CERTIFICATE CONTAINER ================= */}
        <div className="certificate-frame rounded-3xl p-6 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden text-emerald-50">
          
          {/* Subtle guilloche geometric background pattern */}
          <div className="guilloche-pattern absolute inset-0 pointer-events-none"></div>

          {/* Inner ornamental double border */}
          <div className="certificate-border-inner rounded-2xl p-6 sm:p-10 relative z-10 space-y-8 bg-[#041209]/80 backdrop-blur-sm">
            
            {/* Header with Badges & Crest */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-emerald-800/40 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/30 to-emerald-900/40 p-1 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black font-sans tracking-tight text-white print-text-dark">
                    GreenToken <span className="text-emerald-400">Retirement</span>
                  </h3>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/80">
                    Soroban • Stellar Testnet
                  </p>
                </div>
              </div>

              {/* Certificate ID Badge */}
              <div className="text-center sm:text-right font-mono">
                <span className="text-[10px] uppercase text-emerald-400/70 tracking-wider block">
                  Retirement Certificate ID
                </span>
                <span className="text-base font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-700/50 inline-block mt-0.5 select-all">
                  {activeCert.certificateNumber}
                </span>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center space-y-2 py-2">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 inline-block">
                Soroban Contract Retirement Record
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase font-sans print-text-dark">
                Certificate of Carbon Retirement
              </h1>
              <p className="text-xs sm:text-sm text-emerald-300/80 max-w-xl mx-auto">
                This record describes credits permanently removed from the owner's Soroban project balance. It is not a third-party registry certificate.
              </p>
            </div>

            {/* Beneficiary Dedication Statement */}
            <div className="text-center space-y-3 py-4 bg-[#030d06]/60 rounded-2xl border border-emerald-900/50 p-6">
              <p className="text-xs sm:text-sm uppercase font-mono tracking-wider text-emerald-400/80">
                This certifies that
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-200 tracking-tight font-sans print-text-dark">
                {activeCert.beneficiaryName}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-300/80 max-w-2xl mx-auto leading-relaxed">
                the connected owner retired the following quantity of contract-tracked carbon credits for:
              </p>
              <p className="text-xs font-mono italic text-white bg-emerald-950/40 py-1.5 px-4 rounded-lg border border-emerald-900/60 inline-block">
                "{activeCert.reason}"
              </p>
            </div>

            {/* Mass Tonnes Retired Display */}
            <div className="py-6 text-center space-y-1 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-emerald-950/40 rounded-2xl border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400/80 font-bold block">
                Total Environmental Volume Retired
              </span>
              <p className="text-4xl sm:text-6xl font-black font-mono text-emerald-300 print-text-dark">
                {activeCert.amountTonnes.toLocaleString()}.00 <span className="text-xl sm:text-2xl font-bold text-white">tCO2e</span>
              </p>
              <span className="text-xs font-mono text-emerald-400/70">
                (Metric Tonnes of Carbon Dioxide Equivalent Sequestered)
              </span>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60">
                <span className="text-[10px] uppercase text-emerald-400/60 block">Project Name</span>
                <span className="font-bold text-white block truncate">{activeCert.projectName}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60">
                <span className="text-[10px] uppercase text-emerald-400/60 block">Standard & Registry</span>
                <span className="font-bold text-emerald-300">{activeCert.standard} #{activeCert.registryId}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60">
                <span className="text-[10px] uppercase text-emerald-400/60 block">Vintage Year</span>
                <span className="font-bold text-white">{activeCert.vintage}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60">
                <span className="text-[10px] uppercase text-emerald-400/60 block">Project Origin</span>
                <span className="font-bold text-white">{activeCert.projectCountry}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030d06] border border-emerald-900/60 col-span-2 sm:col-span-4">
                <span className="text-[10px] uppercase text-emerald-400/60 block">Owner Wallet</span>
                <span className="font-bold text-white break-all">{activeCert.ownerAddress || activeCert.beneficiaryAddress}</span>
              </div>
            </div>

            {/* Cryptographic Ledger Proof & QR Code Row */}
            <div className="p-5 rounded-2xl bg-[#030d06] border border-emerald-800/40 flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Hashes and Sequence */}
              <div className="space-y-2 text-xs font-mono flex-1 min-w-0">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Soroban Retirement Proof</span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-emerald-400/70">Soroban Retirement ID:</span>
                    <span className="text-emerald-300 font-semibold">{activeCert.retirementId || 'Not available for legacy record'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-emerald-400/70">Stellar Transaction Hash:</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${activeCert.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-300 font-semibold truncate sm:max-w-xs hover:underline flex items-center gap-1"
                    >
                      {activeCert.txHash} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-emerald-400/70">Ledger Sequence Number:</span>
                    <span className="text-white font-bold">{activeCert.ledgerSequence ? `#${activeCert.ledgerSequence}` : 'Not returned'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-emerald-400/70">Retirement Timestamp:</span>
                    <span className="text-white">{new Date(activeCert.timestamp).toUTCString()}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-emerald-400/70">Soroban Contract:</span>
                    <span className="text-emerald-300/90 font-mono break-all sm:max-w-xs">
                      {activeCert.contractId}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={activeCert.qrData}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-xl border border-emerald-700/50 bg-emerald-950/60 p-4 text-center text-xs font-mono text-emerald-300 hover:text-white"
              >
                <ExternalLink className="mx-auto mb-2 h-5 w-5" />
                Open Testnet transaction
              </a>
            </div>

            <div className="pt-6 border-t border-emerald-800/40 text-center text-xs font-mono text-emerald-400/70">
              Testnet contract record • Confirm the transaction hash and retirement ID on Stellar before relying on this certificate.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

