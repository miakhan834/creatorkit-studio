import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { ScriptStudioTab } from './components/ScriptStudioTab';
import { SceneControlTab } from './components/SceneControlTab';
import { VoiceoverSubtitlesTab } from './components/VoiceoverSubtitlesTab';
import { ExportTab } from './components/ExportTab';
import { NewProjectModal } from './components/NewProjectModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PaywallModal } from './components/PaywallModal';
import { AuthPage } from './components/AuthPage';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  ActiveTab,
  Project,
  Scene,
  SubtitleSegment,
  VideoScript,
} from './types/creator';
import { User } from './types/auth';
import {
  getActiveProjectId,
  getSavedProjects,
  saveProjects,
  setActiveProjectId,
} from './utils/storage';
import { syncSubtitleTimings } from './utils/subtitles';
import { getCreditsState, deductCredit, setProPlan } from './utils/credits';
import { getCurrentUser, logoutUser } from './utils/auth';
import { sampleProject } from './data/sampleProject';
import {
  LayoutDashboard,
  FileText,
  Clapperboard,
  Mic,
  Download,
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());

  const [projects, setProjects] = useState<Project[]>(() => getSavedProjects());
  const [activeProjectId, setActiveId] = useState<string>(() =>
    getActiveProjectId(projects)
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Freemium Credit State per user
  const [creditsState, setCreditsState] = useState(() =>
    getCreditsState(currentUser?.id)
  );

  // Sync credits if current user changes
  useEffect(() => {
    if (currentUser?.id) {
      setCreditsState(getCreditsState(currentUser.id));
    }
  }, [currentUser]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (msg: {
    type: 'success' | 'error' | 'info';
    title?: string;
    message: string;
    action?: { label: string; onClick: () => void };
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { id, ...msg };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 5500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Logout handler
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out of CreatorKit Studio.',
    });
  };

  // Resolve active project
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || sampleProject;

  // Persist to storage whenever projects change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      setSaveStatus('saving');
      saveProjects(projects);
      setActiveProjectId(activeProjectId);
      setSaveStatus('saved');
    }, 700);

    return () => clearTimeout(timer);
  }, [projects, activeProjectId]);

  // Manual save handler
  const handleManualSave = () => {
    setSaveStatus('saving');
    saveProjects(projects);
    setActiveProjectId(activeProjectId);
    setTimeout(() => {
      setSaveStatus('saved');
      addToast({
        type: 'success',
        title: 'Project Saved',
        message: 'All scenes, script, and subtitle timings saved to local browser storage.',
      });
    }, 250);
  };

  // Switch Project
  const handleSelectProject = (id: string) => {
    setActiveId(id);
    setActiveProjectId(id);
    setSaveStatus('saved');
  };

  // Add freshly generated plan
  const handlePlanGenerated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveId(newProject.id);
    setActiveProjectId(newProject.id);
    setActiveTab('script');
    addToast({
      type: 'success',
      title: 'Production Plan Generated!',
      message: `Created "${newProject.title}" with ${newProject.scenes.length} scenes.`,
    });
  };

  // Attempt to open New Project flow with Freemium Credit verification
  const handleAttemptCreateProject = () => {
    // Re-check credits in case date changed past midnight
    const current = getCreditsState(currentUser?.id);
    setCreditsState(current);

    if (current.isPro) {
      setIsNewModalOpen(true);
      return;
    }

    if (current.credits > 0) {
      const allowed = deductCredit(currentUser?.id);
      if (allowed) {
        const updated = getCreditsState(currentUser?.id);
        setCreditsState(updated);
        setIsNewModalOpen(true);
        addToast({
          type: 'info',
          title: 'Daily Credit Deducted',
          message: `1 credit used. ${updated.credits} of ${updated.maxCredits} free video plans remaining today.`,
        });
      } else {
        setIsPaywallOpen(true);
      }
    } else {
      // 0 credits remaining: block and present paywall
      setIsPaywallOpen(true);
    }
  };

  // Upgrade user to Pro plan with unlimited credits
  const handleUpgradeToPro = () => {
    setProPlan(true, currentUser?.id);
    const updated = getCreditsState(currentUser?.id);
    setCreditsState(updated);
    setIsPaywallOpen(false);
    addToast({
      type: 'success',
      title: 'Upgraded to Pro!',
      message: 'Unlimited video plans unlocked with no watermarks and 4K prompt exports.',
    });
  };

  // Rename Project
  const handleRenameProject = (id: string, newTitle: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, title: newTitle, updatedAt: Date.now() } : p
      )
    );
    addToast({
      type: 'success',
      title: 'Project Renamed',
      message: `Updated title to "${newTitle}".`,
    });
  };

  // Duplicate Project
  const handleDuplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    const duplicated: Project = {
      ...target,
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${target.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      scenes: target.scenes.map((s) => ({
        ...s,
        id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
      subtitles: target.subtitles.map((sub) => ({
        ...sub,
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      })),
    };

    setProjects((prev) => [duplicated, ...prev]);
    setActiveId(duplicated.id);
    setActiveProjectId(duplicated.id);
    addToast({
      type: 'success',
      title: 'Project Duplicated',
      message: `Created duplicate: "${duplicated.title}".`,
    });
  };

  // Delete Project initiation
  const handleDeleteProjectClick = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      setProjectToDelete(target);
    }
  };

  // Confirm delete project
  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    const remaining = projects.filter((p) => p.id !== projectToDelete.id);
    const finalProjects = remaining.length > 0 ? remaining : [sampleProject];
    setProjects(finalProjects);
    const nextActive = finalProjects[0].id;
    setActiveId(nextActive);
    setActiveProjectId(nextActive);
    addToast({
      type: 'info',
      title: 'Project Deleted',
      message: `Deleted "${projectToDelete.title}".`,
    });
    setProjectToDelete(null);
  };

  // Update Script
  const handleUpdateScript = (updatedScript: VideoScript) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, script: updatedScript, updatedAt: Date.now() }
          : p
      )
    );
  };

  // Update Scenes with duration and subtitle synchronization
  const handleUpdateScenes = (updatedScenes: Scene[]) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProject.id) return p;
        const totalDuration = updatedScenes.reduce(
          (acc, s) => acc + (s.durationSeconds || 0),
          0
        );
        return {
          ...p,
          scenes: updatedScenes,
          script: {
            ...p.script,
            estimatedDurationSeconds: totalDuration,
          },
          subtitles: syncSubtitleTimings(p.subtitles, updatedScenes),
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Update Subtitles
  const handleUpdateSubtitles = (updatedSubtitles: SubtitleSegment[]) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, subtitles: updatedSubtitles, updatedAt: Date.now() }
          : p
      )
    );
  };

  // Update Voiceover Instructions
  const handleUpdateVoiceoverInstructions = (instructions: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, voiceoverInstructions: instructions, updatedAt: Date.now() }
          : p
      )
    );
  };

  // If user is not logged in, render only the Login/Signup page
  if (!currentUser) {
    return (
      <>
        <AuthPage
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setCreditsState(getCreditsState(user.id));
            addToast({
              type: 'success',
              title: `Welcome, ${user.name}!`,
              message: `Signed in as ${user.email}. You have 3 video plan credits available today.`,
            });
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Mobile Bottom Nav items
  const mobileNavItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'scenes', label: 'Scenes', icon: Clapperboard },
    { id: 'voiceover', label: 'Voice/Subs', icon: Mic },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-purple-600 selection:text-white pb-16 md:pb-8">
      {/* Top Navigation Bar with User Email, Credits, and Logout */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        project={activeProject}
        saveStatus={saveStatus}
        onSave={handleManualSave}
        onRename={(newTitle) => handleRenameProject(activeProject.id, newTitle)}
        onOpenNewModal={handleAttemptCreateProject}
        credits={creditsState.credits}
        maxCredits={creditsState.maxCredits}
        isPro={creditsState.isPro}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-7">
        {activeTab === 'dashboard' && (
          <DashboardTab
            projects={projects}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProjectClick}
            onRenameProject={handleRenameProject}
            onOpenNewModal={handleAttemptCreateProject}
            onNavigateTab={setActiveTab}
            credits={creditsState.credits}
            maxCredits={creditsState.maxCredits}
            isPro={creditsState.isPro}
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {activeTab === 'script' && (
          <ScriptStudioTab
            project={activeProject}
            onUpdateScript={handleUpdateScript}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'scenes' && (
          <SceneControlTab
            project={activeProject}
            onUpdateScenes={handleUpdateScenes}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'voiceover' && (
          <VoiceoverSubtitlesTab
            project={activeProject}
            onUpdateScenes={handleUpdateScenes}
            onUpdateSubtitles={handleUpdateSubtitles}
            onUpdateVoiceoverInstructions={handleUpdateVoiceoverInstructions}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab project={activeProject} onShowToast={addToast} />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around py-1.5 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-purple-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-purple-400' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onPlanGenerated={handlePlanGenerated}
      />

      {/* Delete Project Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!projectToDelete}
        title="Delete Project Plan"
        message={
          projectToDelete
            ? `Are you sure you want to delete "${projectToDelete.title}"? All associated scenes, script edits, and subtitle files will be deleted from your browser.`
            : ''
        }
        confirmLabel="Delete Project"
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />

      {/* Paywall Upgrade Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUpgradePro={handleUpgradeToPro}
        isPro={creditsState.isPro}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
