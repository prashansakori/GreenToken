import React, { useEffect, useState } from 'react';
import type { UserHolding } from '../../types';
import { useGreenToken } from '../../context/GreenTokenContext';
import {
  CARBON_CREDIT_CONTRACT_ID,
  querySorobanProjectBalance
} from '../../services/soroban';
import { 
  X, 
  Flame, 
  Award, 
  ShieldAlert, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface RetireCreditsModalProps {
  holding?: UserHolding;
  isOpen: boolean;
  onClose: () => void;
}

export const RetireCreditsModal: React.FC<RetireCreditsModalProps> = ({ holding: propHolding, isOpen, onClose }) => {
  const { holdings, projects, retireCredits, navigateTo, wallet, openWalletModal } = useGreenToken();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    propHolding?.projectId ||
    projects.find(project => project.status === 'active' && project.sorobanProjectId)?.id ||
    holdings[0]?.projectId ||
    ''
  );
  const project = projects.find(item => item.id === selectedProjectId);

  const [amountTonnes, setAmountTonnes] = useState<number>(1);
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Verdant Enterprises Inc.');
  const [reason, setReason] = useState<string>('Corporate Scope 1 & 2 Emissions Neutralization Q4 2026');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'signing' | 'pending' | 'success' | 'failed'>('input');
  const [createdCertId, setCreatedCertId] = useState<string>('');
  const [retirementTxHash, setRetirementTxHash] = useState('');
  const [retirementId, setRetirementId] = useState('');
  const [txError, setTxError] = useState<string>('');
  const [balanceSnapshot, setBalanceSnapshot] = useState<{
    key: string;
    balance?: bigint;
    error?: string;
  } | null>(null);
  const balanceKey = `${wallet.address}:${selectedProjectId}:${project?.sorobanProjectId || ''}`;

  useEffect(() => {
    if (!isOpen || !wallet.address || !project?.sorobanProjectId || !CARBON_CREDIT_CONTRACT_ID) return;

    let active = true;
    querySorobanProjectBalance(CARBON_CREDIT_CONTRACT_ID, wallet.address, project.sorobanProjectId)
      .then(balance => {
        if (active) setBalanceSnapshot({ key: balanceKey, balance });
      })
      .catch(error => {
        if (active) {
          setBalanceSnapshot({
            key: balanceKey,
            error: error instanceof Error ? error.message : 'Could not load the Soroban balance.'
          });
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, wallet.address, project?.id, project?.sorobanProjectId, balanceKey]);

  if (!isOpen) return null;

  const currentBalance = balanceSnapshot?.key === balanceKey ? balanceSnapshot.balance : undefined;
  const balanceError = balanceSnapshot?.key === balanceKey ? balanceSnapshot.error : undefined;
  const isLoadingBalance = !!wallet.address && !!project?.sorobanProjectId &&
    !!CARBON_CREDIT_CONTRACT_ID && currentBalance === undefined && !balanceError;
  const canReview = !!wallet.isConnected && !!project && project.status === 'active' &&
    !!project.sorobanProjectId && !!CARBON_CREDIT_CONTRACT_ID &&
    currentBalance !== undefined && Number.isSafeInteger(amountTonnes) &&
    amountTonnes > 0 && BigInt(amountTonnes) <= currentBalance;

  const handleReview = () => {
    setTxError('');
    setStep('confirm');
  };

  const handleRetire = async () => {
    if (!project || !canReview) return;

    try {
      setIsProcessing(true);
      setTxError('');
      setStep('signing');

      const res = await retireCredits(
        project.id,
        amountTonnes,
        beneficiaryName,
        reason
      );

      if (res.success && res.certificateId) {
        setCreatedCertId(res.certificateId);
        setRetirementTxHash(res.txHash);
        setRetirementId(res.retirementId || '');
        setStep('success');
      } else if (res.status === 'PENDING' && res.txHash) {
        setRetirementTxHash(res.txHash);
        setTxError(res.error || 'Transaction submitted but not yet confirmed.');
        setStep('pending');
      } else {
        setTxError(res.error || 'Retirement transaction was rejected or failed.');
        setStep('failed');
      }
    } catch (e: any) {
      console.error(e);
      setTxError(e?.message || 'Retirement transaction failed on Stellar.');
      setStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAndReset = () => {
    setStep('input');
    setIsProcessing(false);
    setCreatedCertId('');
    setRetirementTxHash('');
    setRetirementId('');
    setTxError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (step !== 'pending' && !isProcessing) handleCloseAndReset();
        }}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#071d10] border border-emerald-500/30 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] text-emerald-100 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Permanent Carbon Credit Retirement
              </h3>
              <p className="text-xs text-emerald-400/70 font-mono">Soroban • Stellar Testnet</p>
            </div>
          </div>
          <button 
            onClick={handleCloseAndReset}
            disabled={step === 'pending' || isProcessing}
            className="p-1.5 rounded-lg text-emerald-400/60 hover:text-white hover:bg-emerald-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Input */}
        {step === 'input' && (
          <div className="py-5 space-y-4">
            
            {!wallet.isConnected && (
              <button
                type="button"
                onClick={openWalletModal}
                className="w-full p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-left text-xs text-amber-200"
              >
                Connect Freighter on Testnet to load your Soroban-owned balance.
              </button>
            )}

            {/* Project Selection */}
            {!propHolding && projects.filter(item => item.status === 'active').length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-emerald-300">Select approved project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setAmountTonnes(1);
                  }}
                  className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                >
                  {projects.filter(item => item.status === 'active').map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.sorobanProjectId ? ` (Soroban #${item.sorobanProjectId})` : ' (not linked on-chain)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {project && (
              <div className="p-3.5 rounded-xl bg-[#041209] border border-emerald-800/40 flex items-center gap-3">
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className="w-14 h-14 rounded-lg object-cover border border-emerald-800/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {project.stellarAsset.code}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/70">
                      {project.sorobanProjectId ? `Soroban #${project.sorobanProjectId}` : 'Not linked'}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate mt-1">
                    {project.name}
                  </h4>
                  <p className="text-[11px] font-mono text-emerald-400/80">
                    Contract balance:{' '}
                    <strong className="text-emerald-300">
                      {isLoadingBalance ? 'Loading…' : currentBalance !== undefined ? `${currentBalance.toString()} tCO2e` : 'Unavailable'}
                    </strong>
                  </p>
                </div>
              </div>
            )}
            {balanceError && <p role="alert" className="text-xs text-amber-300 break-words">{balanceError}</p>}

            {(!CARBON_CREDIT_CONTRACT_ID || !project?.sorobanProjectId) && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200">
                {!CARBON_CREDIT_CONTRACT_ID
                  ? 'Soroban contract is not configured. Set VITE_GREEN_TOKEN_CONTRACT_ID after deployment.'
                  : 'This project has no registered Soroban project ID.'}
              </div>
            )}

            {/* Quantity to Retire */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-300">Amount to Permanently Retire</span>
                <span className="text-emerald-400/70">Max: {currentBalance?.toString() || '0'} tCO2e</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={currentBalance === undefined
                    ? 1
                    : currentBalance > BigInt(Number.MAX_SAFE_INTEGER)
                      ? Number.MAX_SAFE_INTEGER
                      : Number(currentBalance)}
                  value={amountTonnes}
                  onChange={(e) => setAmountTonnes(Number(e.target.value))}
                  className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-4 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (currentBalance !== undefined) {
                      setAmountTonnes(currentBalance > BigInt(Number.MAX_SAFE_INTEGER)
                        ? Number.MAX_SAFE_INTEGER
                        : Number(currentBalance));
                    }
                  }}
                  disabled={currentBalance === undefined || currentBalance === 0n}
                  className="text-xs font-mono bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 px-3 py-2 rounded-xl hover:bg-emerald-900/40 shrink-0 disabled:opacity-40"
                >
                  Max All
                </button>
              </div>
            </div>

            {/* Beneficiary Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-emerald-300">
                Official Beneficiary Name (Printed on Certificate)
              </label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="e.g. Acme Global Industries Inc. or Johnathan Smith"
                className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-3.5 py-2 text-xs font-sans text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Offsetting Purpose / Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-emerald-300">
                Retirement Statement / Scope
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Net-zero corporate milestone 2026, air travel offset"
                className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-3.5 py-2 text-xs font-sans text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Permanent retirement notice */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Permanent Soroban retirement:</strong> the contract removes these credits from your project balance and writes an immutable retirement record. This cannot be undone.
              </span>
            </div>

            <button
              onClick={handleReview}
              disabled={!canReview || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              Review Retirement
            </button>
          </div>
        )}

        {/* Step: Signing / Burning */}
        {step === 'confirm' && project && (
          <div className="py-5 space-y-4">
            <div className="rounded-xl bg-[#041209] border border-emerald-800/40 p-4 space-y-3 text-xs font-mono">
              <div className="flex justify-between gap-4">
                <span className="text-emerald-400/70">Project</span>
                <span className="text-white text-right">{project.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-emerald-400/70">Amount</span>
                <span className="text-white">{amountTonnes} tCO2e</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-emerald-400/70">Owner wallet</span>
                <span className="text-white break-all text-right">{wallet.address}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-emerald-400/70">Beneficiary</span>
                <span className="text-white text-right">{beneficiaryName.trim() || wallet.address}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-emerald-400/70">Reason</span>
                <span className="text-white text-right">{reason.trim()}</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-950/30 border border-amber-800/40 p-3 text-xs text-amber-200">
              Confirming will permanently remove these credits from your Soroban balance. This action cannot be undone.
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-mono"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleRetire}
                disabled={!canReview || isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs font-mono"
              >
                <Flame className="w-4 h-4" />
                Confirm & sign in Freighter
              </button>
            </div>
          </div>
        )}

        {/* Step: Signing */}
        {step === 'signing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-25"></div>
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Awaiting Freighter Wallet Approval...
              </h4>
              <p className="text-xs text-emerald-400/70 font-mono mt-1 max-w-xs mx-auto">
                Review and sign the Soroban retirement invocation in Freighter.
              </p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <Award className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">
                Retirement Confirmed on Soroban
              </h4>
              <p className="text-xs text-emerald-300/80 max-w-sm">
                Permanently removed <strong>{amountTonnes} tCO2e</strong> from the project balance on behalf of <em>{beneficiaryName}</em>.
              </p>
            </div>

            {/* Cert details preview */}
            <div className="w-full p-3.5 rounded-xl bg-[#041209] border border-emerald-800/50 text-left space-y-1 font-mono text-xs">
              <div className="flex justify-between text-emerald-400/70">
                <span>Soroban Retirement ID:</span>
                <span className="text-emerald-300 font-bold">{retirementId}</span>
              </div>
              <div className="flex justify-between text-emerald-400/70">
                <span>Certificate ID:</span>
                <span className="text-emerald-300 font-bold">{createdCertId}</span>
              </div>
              <div className="flex justify-between text-emerald-400/70">
                <span>Stellar Testnet TX:</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${retirementTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-200 truncate max-w-[200px] flex items-center gap-1"
                >
                  {retirementTxHash.substring(0, 10)}...{retirementTxHash.substring(retirementTxHash.length - 8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  handleCloseAndReset();
                  navigateTo('certificate', createdCertId);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-semibold text-xs font-mono transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Sparkles className="w-4 h-4" />
                View & Save Certificate PDF →
              </button>
              <button
                onClick={handleCloseAndReset}
                className="py-2.5 px-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50 hover:bg-emerald-900/40 text-emerald-300 text-xs font-mono transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {step === 'pending' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-300">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Retirement Submitted; Awaiting Confirmation</h4>
              <p className="text-xs text-amber-200/90 max-w-sm">
                Do not submit another retirement for this amount. No certificate or dashboard total is updated until the transaction confirms.
              </p>
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${retirementTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-xs font-mono text-emerald-300 hover:text-white"
            >
              {retirementTxHash} <ExternalLink className="inline w-3 h-3" />
            </a>
            {txError && <p className="text-xs text-amber-200/80">{txError}</p>}
            <button
              onClick={handleCloseAndReset}
              className="w-full py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-mono"
            >
              Close
            </button>
          </div>
        )}

        {/* Step: Failed */}
        {step === 'failed' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)]">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">
                Soroban Retirement Failed
              </h4>
              <p className="text-xs text-rose-300/90 max-w-sm">
                The retirement was not confirmed. No certificate or portfolio update was recorded.
              </p>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-left text-xs font-mono text-rose-200/90 space-y-1">
              <span className="text-[10px] uppercase text-rose-400/70 block">Failure Reason</span>
              <p className="break-words">{txError}</p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleCloseAndReset}
                className="py-2.5 px-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-mono transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
