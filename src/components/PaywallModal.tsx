import React from 'react';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Coins
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradePro: () => void;
  isPro?: boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUpgradePro,
  isPro = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-purple-500/40 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden my-6 text-zinc-100">
        {/* Glow ambient background element */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800/80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2.5 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.35)]">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>CreatorKit Pro Tier</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              You've used all 3 free videos for today! Come back tomorrow or Upgrade to Pro
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Free plans refresh automatically with 3 new project credits every 24 hours at midnight. Need to produce more videos right now? Unlock unlimited plans with Pro.
            </p>
          </div>

          {/* Pricing Plans Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Free Plan Card */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Free Plan
                  </span>
                  <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">$0</div>
                  <div className="text-[11px] text-zinc-500">Free forever • Daily allowance</div>
                </div>

                <ul className="space-y-2 text-xs text-zinc-300 pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>3 video plans / day</strong></span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <span className="w-4 text-center text-zinc-500 font-bold">•</span>
                    <span>Includes CreatorKit watermark</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <span className="w-4 text-center text-zinc-500 font-bold">•</span>
                    <span>Standard export resolution</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <span className="w-4 text-center text-zinc-500 font-bold">•</span>
                    <span>Resets every 24h at midnight</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-zinc-700/80"
              >
                Wait for Tomorrow (Free)
              </button>
            </div>

            {/* Pro Plan Card (Purple Neon Highlight) */}
            <div className="relative bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-900 border-2 border-purple-500 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              {/* Badge */}
              <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-md">
                Unlimited Access
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Pro Plan
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">$20</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>
                  <div className="text-[11px] text-purple-300 font-medium">Billed monthly • Cancel anytime</div>
                  <div className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span>Yearly plan $120/year (Save 50%)</span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-zinc-200 pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-semibold text-white">Unlimited video plans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-semibold text-white">No Watermark on scripts & plans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-semibold text-white">Export in 4K visual prompts</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Priority Gemini AI generation speed</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onUpgradePro}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Upgrade to Pro - Unlimited Videos ($20/month)</span>
              </button>
            </div>
          </div>

          {/* Footnote banner */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Next 3 free credits will recharge automatically at midnight.</span>
            </div>
            <span className="text-zinc-500 hidden sm:inline">No credit card required for Free Plan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
