import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeftRight, CheckCircle2, ExternalLink, Loader2, X } from 'lucide-react';
import type { CarbonProject } from '../../types';
import { useGreenToken } from '../../context/GreenTokenContext';
import {
  CARBON_CREDIT_CONTRACT_ID,
  getSorobanTransactionStatus,
  querySorobanProjectBalance
} from '../../services/soroban';

interface TransferCreditsModalProps {
  project: CarbonProject;
  isOpen: boolean;
  onClose: () => void;
}

export const TransferCreditsModal: React.FC<TransferCreditsModalProps> = ({ project, isOpen, onClose }) => {
  const { wallet, transferCredits } = useGreenToken();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(1);
  const [balanceSnapshot, setBalanceSnapshot] = useState<{
    key: string;
    balance?: bigint;
    error?: string;
  } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');
  const [confirmedTxHash, setConfirmedTxHash] = useState('');
  const [pendingTxHash, setPendingTxHash] = useState('');
  const [isCheckingPending, setIsCheckingPending] = useState(false);
  const balanceKey = `${wallet.address}:${project.id}:${project.sorobanProjectId || ''}`;

  useEffect(() => {
    if (!isOpen || !wallet.address || !project.sorobanProjectId || !CARBON_CREDIT_CONTRACT_ID) {
      return;
    }

    let active = true;
    querySorobanProjectBalance(CARBON_CREDIT_CONTRACT_ID, wallet.address, project.sorobanProjectId)
      .then(value => {
        if (active) setBalanceSnapshot({ key: balanceKey, balance: value });
      })
      .catch(reason => {
        if (active) {
          setBalanceSnapshot({
            key: balanceKey,
            error: reason instanceof Error ? reason.message : 'Could not load the Soroban balance.'
          });
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, wallet.address, project.id, project.sorobanProjectId, balanceKey]);

  if (!isOpen) return null;

  const currentBalance = balanceSnapshot?.key === balanceKey ? balanceSnapshot.balance : undefined;
  const balanceError = balanceSnapshot?.key === balanceKey ? balanceSnapshot.error : undefined;
  const isLoadingBalance = isOpen && !!wallet.address && !!project.sorobanProjectId &&
    !!CARBON_CREDIT_CONTRACT_ID && currentBalance === undefined && !balanceError;
  const configurationError = !CARBON_CREDIT_CONTRACT_ID
    ? 'Soroban contract is not configured. Set VITE_GREEN_TOKEN_CONTRACT_ID to enable transfers.'
    : !project.sorobanProjectId
      ? 'This project is not linked to a registered Soroban project ID.'
      : '';
  const canTransfer = !configurationError && project.status === 'active' && wallet.isConnected && !isTransferring;

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setConfirmedTxHash('');
    setIsTransferring(true);
    try {
      const result = await transferCredits(project.id, recipient.trim(), amount);
      if (!result.success || !result.txHash) {
        setError(result.error || 'The transfer was not confirmed on Stellar Testnet.');
        if (result.status === 'PENDING' && result.txHash) setPendingTxHash(result.txHash);
        return;
      }

      setConfirmedTxHash(result.txHash);
      setPendingTxHash('');
      setRecipient('');
      if (wallet.address && project.sorobanProjectId) {
        try {
          const refreshedBalance = await querySorobanProjectBalance(
            CARBON_CREDIT_CONTRACT_ID,
            wallet.address,
            project.sorobanProjectId
          );
          setBalanceSnapshot({ key: balanceKey, balance: refreshedBalance });
        } catch (reason) {
          setBalanceSnapshot({
            key: balanceKey,
            error: reason instanceof Error ? reason.message : 'Could not refresh the Soroban balance.'
          });
        }
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const checkPendingTransfer = async () => {
    if (!pendingTxHash) return;
    setIsCheckingPending(true);
    setError('');
    try {
      const status = await getSorobanTransactionStatus(pendingTxHash);
      if (status === 'SUCCESS') {
        setConfirmedTxHash(pendingTxHash);
        setPendingTxHash('');
        if (wallet.address && project.sorobanProjectId) {
          try {
            const refreshedBalance = await querySorobanProjectBalance(
              CARBON_CREDIT_CONTRACT_ID,
              wallet.address,
              project.sorobanProjectId
            );
            setBalanceSnapshot({ key: balanceKey, balance: refreshedBalance });
          } catch (reason) {
            setBalanceSnapshot({
              key: balanceKey,
              error: reason instanceof Error ? reason.message : 'Could not refresh the Soroban balance.'
            });
          }
        }
      } else if (status === 'FAILED') {
        setPendingTxHash('');
        setError('Soroban reports that this transaction failed on-chain. You may retry after reviewing the failure.');
      } else {
        setError('The transaction is not confirmed yet. Do not retry while it is pending.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not check the Soroban transaction status.');
    } finally {
      setIsCheckingPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close transfer dialog"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => { if (!pendingTxHash) onClose(); }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#071d10] border border-emerald-500/30 p-6 text-emerald-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Transfer Carbon Credits</h3>
              <p className="text-xs text-emerald-400/70 font-mono">Soroban • Stellar Testnet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!!pendingTxHash}
            aria-label="Close"
            className="p-1.5 rounded-lg text-emerald-400/60 hover:text-white hover:bg-emerald-900/40 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="rounded-xl bg-[#041209] border border-emerald-800/40 p-3">
            <p className="text-sm font-semibold text-white">{project.name}</p>
            <p className="text-xs text-emerald-400/70 font-mono mt-1">
              {project.sorobanProjectId ? `Soroban project #${project.sorobanProjectId}` : 'No Soroban project mapping'}
            </p>
            <p className="text-xs text-emerald-300 mt-2">
              Your on-chain balance:{' '}
              {isLoadingBalance ? 'Loading…' : currentBalance !== undefined ? `${currentBalance.toString()} tCO2e` : 'Unavailable'}
            </p>
            {balanceError && <p className="text-xs text-amber-300 mt-1 break-words">{balanceError}</p>}
          </div>

          <div className="rounded-xl bg-amber-950/30 border border-amber-700/40 p-3 text-xs text-amber-200">
            This transfers credits only. Purchases and payment settlement are unavailable until an atomic sale flow is configured.
          </div>

          {configurationError && (
            <div className="flex gap-2 rounded-xl bg-rose-950/30 border border-rose-800/40 p-3 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{configurationError}</span>
            </div>
          )}

          {pendingTxHash ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-200">
                Submitted but not confirmed. Do not submit another transfer until this transaction resolves.
              </p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${pendingTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 break-all text-xs font-mono text-emerald-300 hover:text-white"
              >
                {pendingTxHash} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              {error && <p role="status" className="text-xs text-amber-200 break-words">{error}</p>}
              <button
                type="button"
                onClick={checkPendingTransfer}
                disabled={isCheckingPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold text-xs font-mono"
              >
                {isCheckingPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCheckingPending ? 'Checking transaction…' : 'Check transaction status'}
              </button>
            </div>
          ) : confirmedTxHash ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                Transfer confirmed on Stellar Testnet.
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${confirmedTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 break-all text-xs font-mono text-emerald-300 hover:text-white"
              >
                {confirmedTxHash} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          ) : (
            <form onSubmit={submitTransfer} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-mono text-emerald-300">Recipient Stellar public address</span>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={event => setRecipient(event.target.value)}
                  placeholder="G..."
                  autoComplete="off"
                  className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-emerald-700 focus:outline-none focus:border-emerald-400"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-mono text-emerald-300">Whole credits to transfer</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={event => setAmount(Number(event.target.value))}
                  className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </label>
              {error && <p role="alert" className="text-xs text-rose-300 break-words">{error}</p>}
              <button
                type="submit"
                disabled={!canTransfer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-xs font-mono"
              >
                {isTransferring && <Loader2 className="w-4 h-4 animate-spin" />}
                {isTransferring ? 'Waiting for Soroban confirmation…' : 'Review and transfer in Freighter'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
