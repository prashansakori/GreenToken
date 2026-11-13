import React, { useState } from 'react';
import type { CarbonProject } from '../../types';
import { useGreenToken } from '../../context/GreenTokenContext';
import { 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  Coins, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface BuyCreditsModalProps {
  project: CarbonProject;
  isOpen: boolean;
  onClose: () => void;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ project, isOpen, onClose }) => {
  const { wallet, buyCredits, navigateTo, openWalletModal, faucetFund } = useGreenToken();

  const [quantity, setQuantity] = useState<number>(10);
  const [paymentAsset, setPaymentAsset] = useState<'USDC' | 'XLM'>('USDC');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'input' | 'signing' | 'broadcasting' | 'success' | 'failed'>('input');
  const [txResultHash, setTxResultHash] = useState<string>('');
  const [txError, setTxError] = useState<string>('');

  if (!isOpen) return null;

  const totalUSD = quantity * project.pricePerTon;
  const xlmRate = 0.115;
  const totalXLM = totalUSD / xlmRate;

  const hasEnoughUSDC = wallet.usdcBalance >= totalUSD;
  const hasEnoughXLM = wallet.xlmBalance >= totalXLM;
  const hasEnoughBalance = paymentAsset === 'USDC' ? hasEnoughUSDC : hasEnoughXLM;

  const handlePurchase = async () => {
    if (!wallet.isConnected) {
      openWalletModal();
      return;
    }

    if (!hasEnoughBalance) return;

    try {
      setIsProcessing(true);
      setTxError('');
      setStep('signing');

      // Real blockchain execution through Freighter and Stellar Testnet Horizon
      const res = await buyCredits(project.id, quantity, paymentAsset);

      if (res.success && res.txHash) {
        setTxResultHash(res.txHash);
        setStep('success');
      } else {
        setTxError(res.error || 'Transaction was rejected or cancelled on Stellar.');
        setStep('failed');
      }
    } catch (e: any) {
      console.error(e);
      setTxError(e?.message || 'Transaction submission failed on Stellar Testnet.');
      setStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('input');
    setIsProcessing(false);
    setTxResultHash('');
    setTxError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={handleResetAndClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#071d10] border border-emerald-500/30 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] text-emerald-100 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Acquire Verified Carbon Credits
              </h3>
              <p className="text-xs text-emerald-400/70 font-mono">
                Asset: {project.stellarAsset.code} • Stellar Testnet
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-emerald-400/60 hover:text-white hover:bg-emerald-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Content */}
        {step === 'input' && (
          <div className="py-5 space-y-5">
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-200">
              Preview only. Purchases are disabled because this prototype cannot atomically deliver credits on-chain with payment. Displayed amounts and balances are not a settlement quote.
            </div>
            {/* Project Summary Card */}
            <div className="p-3.5 rounded-xl bg-[#041209] border border-emerald-800/40 flex items-center gap-3.5">
              <img
                src={project.imageUrl}
                alt={project.name}
                className="w-16 h-16 rounded-lg object-cover border border-emerald-800/50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {project.standard}
                </span>
                <h4 className="text-xs font-semibold text-white truncate mt-1">
                  {project.name}
                </h4>
                <p className="text-[11px] text-emerald-400/70 font-mono">
                  ${project.pricePerTon.toFixed(2)} / tCO2e • {project.availableCredits.toLocaleString()} available
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-300">Quantity to Tokenize</span>
                <span className="font-mono text-emerald-400/70">
                  Available: {project.availableCredits.toLocaleString()} tCO2e
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={project.availableCredits}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(project.availableCredits, parseInt(e.target.value) || 1)))}
                  className="w-full bg-[#05140b] border border-emerald-800/50 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-emerald-400"
                />
                <span className="font-mono text-xs text-emerald-400 font-semibold shrink-0">
                  tCO2e (Tonnes)
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 pt-1">
                {[10, 25, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono border transition-colors ${
                      quantity === preset
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400/70 hover:text-white'
                    }`}
                  >
                    {preset}t
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-emerald-300">Payment Stellar Asset</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentAsset('USDC')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    paymentAsset === 'USDC'
                      ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-[#05140b] border-emerald-900/60 hover:border-emerald-700/60'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Circle USDC</span>
                    <span className="text-[10px] font-mono text-emerald-400/70">
                      Balance lookup not configured
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    ${totalUSD.toFixed(2)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentAsset('XLM')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    paymentAsset === 'XLM'
                      ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-[#05140b] border-emerald-900/60 hover:border-emerald-700/60'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Native XLM</span>
                    <span className="text-[10px] font-mono text-emerald-400/70">
                      {wallet.isConnected ? `Horizon balance: ${wallet.xlmBalance.toFixed(1)} XLM` : 'Connect wallet to view balance'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {totalXLM.toFixed(1)} XLM
                  </span>
                </button>
              </div>
            </div>

            {/* Balance Warning */}
            {!hasEnoughBalance && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-between text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Insufficient {paymentAsset} balance.</span>
                </div>
                <button
                  onClick={faucetFund}
                  className="underline text-emerald-300 font-mono hover:text-white"
                >
                  Fund with Faucet
                </button>
              </div>
            )}

            {/* Order Summary */}
            <div className="p-3.5 rounded-xl bg-[#041209] border border-emerald-800/30 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-emerald-400/70">
                <span>Transaction signing</span>
                <span className="text-emerald-300">Unavailable</span>
              </div>
              <div className="flex justify-between text-emerald-400/70">
                <span>Signing provider</span>
                <span className="text-emerald-300">
                  None — purchases disabled
                </span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-emerald-900/40 text-sm">
                <span>Total Settlement Amount</span>
                <span className="text-emerald-400">
                  {paymentAsset === 'USDC' ? `$${totalUSD.toFixed(2)} USDC` : `${totalXLM.toFixed(1)} XLM`}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={handlePurchase}
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Coins className="w-4 h-4" />
              Purchases unavailable
            </button>
          </div>
        )}

        {/* Processing State: Loading and Freighter prompt */}
        {step === 'signing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-25"></div>
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Awaiting Freighter Approval...
              </h4>
              <p className="text-xs text-emerald-400/70 font-mono mt-1 max-w-xs mx-auto">
                Please check your Freighter wallet pop-up window and confirm the transaction signature.
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">
                Stellar Transaction Confirmed on Testnet!
              </h4>
              <p className="text-xs text-emerald-300/80 max-w-sm">
                Successfully acquired {quantity} tCO2e of <span className="font-mono font-semibold text-emerald-300">{project.stellarAsset.code}</span> on the Stellar ledger.
              </p>
            </div>

            {/* Real Hash preview */}
            <div className="w-full p-3 rounded-xl bg-[#041209] border border-emerald-800/50 text-left">
              <span className="text-[10px] uppercase font-mono text-emerald-400/60 block">
                Stellar Testnet Transaction Hash
              </span>
              <p className="font-mono text-xs text-emerald-300 truncate select-all mt-0.5">
                {txResultHash}
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-900/40 flex justify-between items-center text-xs">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txResultHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-200 flex items-center gap-1 font-mono text-[11px]"
                >
                  View on Stellar Expert <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-emerald-500/80 font-mono text-[11px]">Consensus: Final</span>
              </div>
            </div>

            {/* Next buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { handleResetAndClose(); navigateTo('portfolio'); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-colors"
              >
                View in Portfolio →
              </button>
              <button
                onClick={handleResetAndClose}
                className="py-2.5 px-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50 hover:bg-emerald-900/40 text-emerald-300 text-xs font-mono transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Failure State */}
        {step === 'failed' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)]">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">
                Transaction Rejected or Failed
              </h4>
              <p className="text-xs text-rose-300/90 max-w-sm">
                The transaction could not be completed on the Stellar blockchain.
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
                onClick={handleResetAndClose}
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
