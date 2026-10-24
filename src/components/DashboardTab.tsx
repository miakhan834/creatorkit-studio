import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Clock,
  Globe,
  Film,
  Copy,
  Trash2,
  FolderOpen,
  ArrowRight,
  HardDrive,
  AlertCircle,
  Edit2,
  Check,
  Video,
  FileText,
  Coins,
  Crown,
  Zap
} from 'lucide-react';
import { Project, ActiveTab } from '../types/creator';

interface DashboardTabProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onOpenNewModal: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  credits: number;
  maxCredits: number;
  isPro: boolean;
  onOpenPaywall: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onOpenNewModal,
  onNavigateTab,
  credits,
  maxCredits,
  isPro,
  onOpenPaywall,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const totalRuntime = activeProject.scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const mins = Math.floor(totalRuntime / 60);
  const secs = totalRuntime % 60;
  const runtimeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const handleStartRename = (p: Project) => {
    setEditingId(p.id);
    setEditingTitle(p.title);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameProject(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Freemium Credit Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-purple-950/40 border border-purple-500/30 p-4 sm:p-5 shadow-[0_0_25px_rgba(168,85,247,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
            <Coins className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Daily Credits: {isPro ? 'Unlimited (Pro)' : `${credits}/${maxCredits}`}
              </span>
              {isPro ? (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-300" />
                  PRO
                </span>
              ) : credits === 0 ? (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800">
                  0 Left Today
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  {credits} of {maxCredits} Free Videos Left
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isPro
                ? 'Unlimited video plans active. No watermarks and full 4K visual prompt generation.'
                : '1 credit = 1 video project creation. Resets automatically to 3 free credits every 24 hours at midnight.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {!isPro && (
            <button
              type="button"
              onClick={onOpenPaywall}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Upgrade to Pro ($20/mo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero / Quick Project Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/40 border border-zinc-800 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Active Video Production Plan
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeProject.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
              {activeProject.topic}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 font-medium">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                {activeProject.platform}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {runtimeFormatted} ({activeProject.scenes.length} Scenes)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                {activeProject.language}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 font-medium">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                {activeProject.style}
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('script')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/20 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Open Script Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('scenes')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Manage Scene Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Advisory Card */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
        <HardDrive className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-300 block mb-0.5">Local Browser Storage Persistence</strong>
          Projects are securely stored in your browser's local storage for this MVP. They do not require an account, but they may be lost if you clear your browser site data or cookies. You can export complete project backups as JSON from the Export tab anytime.
        </div>
      </div>

      {/* Projects List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-purple-400" />
            Your Video Projects ({projects.length})
          </h2>
          <p className="text-xs text-zinc-400">Switch between plans or duplicate them for multi-platform versions</p>
        </div>
        <button
          type="button"
          onClick={onOpenNewModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const isActive = p.id === activeProject.id;
          const pDuration = p.scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
          const pMins = Math.floor(pDuration / 60);
          const pSecs = pDuration % 60;
          const pDurationStr = pMins > 0 ? `${pMins}m ${pSecs}s` : `${pSecs}s`;

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-zinc-900/95 border-purple-500/80 shadow-lg shadow-purple-950/20 ring-1 ring-purple-500/30'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {p.platform}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Active
                    </span>
                  )}
                </div>

                {/* Title */}
                {editingId === p.id ? (
                  <div className="flex items-center gap-1.5 my-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(p.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="bg-zinc-950 border border-purple-500 text-white text-sm px-2 py-1 rounded w-full focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(p.id)}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3
                    onClick={() => onSelectProject(p.id)}
                    className="text-sm font-semibold text-white hover:text-purple-300 cursor-pointer line-clamp-1 mb-1 transition-colors"
                  >
                    {p.title}
                  </h3>
                )}

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  {p.topic}
                </p>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60 mb-4">
                  <div>
                    <span className="text-zinc-500 block">Scenes:</span>
                    <span className="text-zinc-200 font-medium">{p.scenes.length} cards</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Est. Duration:</span>
                    <span className="text-zinc-200 font-medium">{pDurationStr}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Language:</span>
                    <span className="text-zinc-200 font-medium">{p.language}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Script Status:</span>
                    <span className={p.script.isLocked ? 'text-amber-400 font-medium' : 'text-zinc-400'}>
                      {p.script.isLocked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/40'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {isActive ? 'Current Plan' : 'Select Plan'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartRename(p)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Rename Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProject(p.id)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Duplicate Project"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(p.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Plans Section */}
      <div className="pt-4 space-y-4">
        <div className="text-center max-w-lg mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent SaaS Pricing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Flexible Plans for Solo & Pro Content Creators
          </h2>
          <p className="text-xs text-zinc-400">
            Start completely free with 3 daily video plans, or level up to Pro for unlimited production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto pt-2">
          {/* Free Plan Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-zinc-700 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Free Plan</h3>
                  <p className="text-xs text-zinc-400">For creators starting out</p>
                </div>
                {!isPro && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Your Current Plan
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-zinc-500">/ forever</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">3 credits recharged daily at midnight</div>
              </div>

              <div className="h-px bg-zinc-800" />

              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>3 video plans per day</strong></span>
                </li>
                <li className="flex items-center gap-2.5 text-zinc-400">
                  <span className="w-4 text-center text-zinc-500 font-bold">•</span>
                  <span>Includes CreatorKit watermark on plans</span>
                </li>
                <li className="flex items-center gap-2.5 text-zinc-400">
                  <span className="w-4 text-center text-zinc-500 font-bold">•</span>
                  <span>Standard export resolutions (TXT, JSON, SRT)</span>
                </li>
                <li className="flex items-center gap-2.5 text-zinc-400">
                  <span className="w-4 text-center text-zinc-500 font-bold">•</span>
                  <span>Standard AI generation priority</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={!isPro}
              onClick={!isPro ? undefined : onOpenPaywall}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                !isPro
                  ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 cursor-default'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              {!isPro ? 'Active Plan' : 'Switch to Free'}
            </button>
          </div>

          {/* Pro Plan Card (Purple Neon Glow) */}
          <div className="relative bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-900 border-2 border-purple-500 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-[0_0_35px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/40">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>POPULAR CREATOR</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Pro Plan</span>
                    <Crown className="w-4 h-4 text-amber-300" />
                  </h3>
                  <p className="text-xs text-purple-300/80">For high-output faceless video channels</p>
                </div>
                {isPro && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Active
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">$20</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>
                <div className="text-xs text-purple-300 font-medium mt-0.5">Cancel or switch anytime</div>
                <div className="mt-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span>Yearly plan $120/year (Save 50%)</span>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              <ul className="space-y-3 text-xs text-zinc-200">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited video production plans</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-white">No Watermark on scripts & documents</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-white">Export in 4K visual generation prompts</span>
                </li>
                <li className="flex items-center gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Priority Gemini 3.8 Flash AI generation queues</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onOpenPaywall}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isPro ? 'Pro Plan Active' : 'Upgrade to Pro - Unlimited Videos ($20/month)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
