import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Clapperboard,
  Mic,
  Download,
  Lock,
  Unlock,
  Clock,
  Layers,
  Sparkles,
  Menu,
  X,
  Check,
  Edit2,
  Coins,
  Crown,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { ActiveTab, Project } from '../types/creator';
import { User } from '../types/auth';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  project: Project;
  saveStatus: 'saved' | 'unsaved' | 'saving';
  onSave: () => void;
  onRename: (newTitle: string) => void;
  onOpenNewModal: () => void;
  credits: number;
  maxCredits: number;
  isPro: boolean;
  onOpenPaywall: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  project,
  saveStatus,
  onSave,
  onRename,
  onOpenNewModal,
  credits,
  maxCredits,
  isPro,
  onOpenPaywall,
  user,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);

  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const formattedDuration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const handleTitleSubmit = () => {
    if (titleDraft.trim()) {
      onRename(titleDraft.trim());
    } else {
      setTitleDraft(project.title);
    }
    setIsEditingTitle(false);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'script', label: 'Script Studio', icon: FileText, badge: project.script.isLocked ? 'Locked' : undefined },
    { id: 'scenes', label: 'Scene Control', icon: Clapperboard, badge: project.scenes.length },
    { id: 'voiceover', label: 'Voice & Subtitles', icon: Mic },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
      {/* Top project info bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="hidden xs:block">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                CreatorKit
                <span className="text-[10px] font-medium uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                  Studio
                </span>
              </span>
              <p className="text-[11px] text-zinc-400 hidden md:block">From Idea to Editable Video Plan</p>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-800 hidden sm:block shrink-0" />

          {/* Project Title inline editor */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setTitleDraft(project.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="bg-zinc-800 text-sm font-medium text-white px-2 py-1 rounded border border-purple-500 focus:outline-none w-44 sm:w-64"
                />
                <button
                  type="button"
                  onClick={handleTitleSubmit}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                  title="Save title"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(project.title);
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-1.5 text-left text-xs sm:text-sm font-medium text-zinc-200 hover:text-white truncate max-w-[120px] sm:max-w-xs md:max-w-sm transition-colors"
                title="Click to rename project"
              >
                <span className="truncate">{project.title}</span>
                <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Status badges, Credits, User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Lock badge */}
          {project.script.isLocked ? (
            <div
              className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full"
              title="Script is locked against automated rewrites"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Locked</span>
            </div>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/60 border border-zinc-700/60 px-2 py-0.5 rounded-full"
              title="Script is unlocked"
            >
              <Unlock className="w-3 h-3 text-zinc-400" />
              <span>Unlocked</span>
            </div>
          )}

          {/* Scene count badge */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>{project.scenes.length} Scenes</span>
          </div>

          {/* Estimated duration badge */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{formattedDuration}</span>
          </div>

          {/* Save status */}
          <button
            type="button"
            onClick={onSave}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border transition-all ${
              saveStatus === 'unsaved'
                ? 'bg-amber-950/40 border-amber-700 text-amber-300 hover:bg-amber-900/50'
                : saveStatus === 'saving'
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                : 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:border-zinc-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'unsaved'
                  ? 'bg-amber-400 animate-pulse'
                  : saveStatus === 'saving'
                  ? 'bg-zinc-400 animate-spin'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{saveStatus === 'unsaved' ? 'Save' : saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
          </button>

          {/* Daily Credits Badge: Credits: 3/3 */}
          <button
            type="button"
            onClick={onOpenPaywall}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-zinc-900 border-zinc-700/80 hover:border-purple-500/60 transition-colors cursor-pointer group"
            title={isPro ? 'Pro Member: Unlimited video plans' : `${credits} of ${maxCredits} daily credits available. Click for plans.`}
          >
            {isPro ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-purple-300 font-bold">Pro</span>
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className={credits === 0 ? 'text-red-400 font-bold' : 'text-zinc-200'}>
                  Credits: {credits}/{maxCredits}
                </span>
              </>
            )}
          </button>

          {/* New Project Quick Button */}
          <button
            type="button"
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white px-2.5 sm:px-3 py-1.5 rounded-lg shadow-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Plan</span>
            <span className="sm:hidden">+ New</span>
          </button>

          {/* User Email & Logout Button */}
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700/60 text-xs text-zinc-300 max-w-[130px] sm:max-w-[180px] md:max-w-[220px]"
                title={`Signed in as ${user.email}`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-purple-500/50"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                )}
                <span className="truncate font-medium">{user.email}</span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-lg border border-zinc-700/70 hover:border-red-500/40 transition-colors cursor-pointer"
                title="Log out of CreatorKit Studio"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline font-medium">Logout</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-md bg-zinc-800 border border-zinc-700"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Desktop Main Navigation Tabs */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-purple-500 text-white bg-purple-500/10'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    item.badge === 'Locked'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-3 space-y-2">
          {user && (
            <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <UserIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs text-zinc-300 truncate font-medium">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium pl-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onSave();
                setMobileMenuOpen(false);
              }}
              className="flex-1 text-center text-xs py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium"
            >
              Manual Save ({saveStatus})
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
