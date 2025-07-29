import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WorkflowPersistence, 
  AutoSave, 
  PreferencesManager,
  type WorkflowState, 
  type Project, 
  type UploadResult, 
  type AnalysisResult, 
  type StrategicAnalysis,
  type UserPreferences
} from '@/lib/persistence';

export function useWorkflowState() {
  const [state, setState] = useState<WorkflowState>(() => WorkflowPersistence.getWorkflowState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load state from storage on mount
  useEffect(() => {
    try {
      const persistedState = WorkflowPersistence.getWorkflowState();
      setState(persistedState);
    } catch (err) {
      console.error('Failed to load workflow state:', err);
      setError('Falha ao carregar dados salvos');
    }
  }, []);

  // Auto-save with debouncing
  const scheduleAutoSave = useCallback((updatedState: Partial<WorkflowState>) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const preferences = PreferencesManager.getPreferences();
    if (preferences.autoSave) {
      AutoSave.markDirty(updatedState);
    }
  }, []);

  // Update state and persist
  const updateState = useCallback((updates: Partial<WorkflowState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Persist immediately for critical data, schedule auto-save for others
      const isCritical = 'selectedProject' in updates || 'currentStep' in updates;
      
      if (isCritical) {
        WorkflowPersistence.saveWorkflowState(updates);
      } else {
        scheduleAutoSave(updates);
      }
      
      return newState;
    });
  }, [scheduleAutoSave]);

  // Project management
  const createProject = useCallback((name: string) => {
    const newProject: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    if (WorkflowPersistence.saveProject(newProject)) {
      updateState({ 
        projects: [...state.projects, newProject],
        selectedProject: newProject,
        currentStep: 1
      });
      return newProject;
    }
    return null;
  }, [state.projects, updateState]);

  const selectProject = useCallback((project: Project | null) => {
    if (WorkflowPersistence.setSelectedProject(project)) {
      updateState({ selectedProject: project });
    }
  }, [updateState]);

  const deleteProject = useCallback((projectId: string) => {
    if (WorkflowPersistence.deleteProject(projectId)) {
      const updatedProjects = state.projects.filter(p => p.id !== projectId);
      const updatedSelectedProject = state.selectedProject?.id === projectId ? null : state.selectedProject;
      
      updateState({ 
        projects: updatedProjects,
        selectedProject: updatedSelectedProject,
      });
      return true;
    }
    return false;
  }, [state.projects, state.selectedProject, updateState]);

  // Workflow steps
  const setCurrentStep = useCallback((step: number) => {
    if (WorkflowPersistence.setCurrentStep(step)) {
      updateState({ currentStep: step });
    }
  }, [updateState]);

  const saveUploadResult = useCallback((result: UploadResult) => {
    if (WorkflowPersistence.saveUploadResult(result)) {
      updateState({ 
        uploadResult: result,
        currentStep: Math.max(state.currentStep, 2)
      });
    }
  }, [state.currentStep, updateState]);

  const saveAnalysisResult = useCallback((result: AnalysisResult) => {
    if (WorkflowPersistence.saveAnalysisResult(result)) {
      updateState({ 
        analysisResult: result,
        currentStep: Math.max(state.currentStep, 3)
      });
    }
  }, [state.currentStep, updateState]);

  const saveStrategicAnalysis = useCallback((analysis: StrategicAnalysis) => {
    if (WorkflowPersistence.saveStrategicAnalysis(analysis)) {
      updateState({ 
        strategicAnalysis: analysis,
        currentStep: Math.max(state.currentStep, 4)
      });
    }
  }, [state.currentStep, updateState]);

  // Navigation helpers
  const canProceedToStep = useCallback((targetStep: number): boolean => {
    switch (targetStep) {
      case 1:
        return true;
      case 2:
        return !!state.selectedProject;
      case 3:
        return !!state.selectedProject && !!state.uploadResult;
      case 4:
        return !!state.selectedProject && !!state.uploadResult && !!state.analysisResult;
      default:
        return false;
    }
  }, [state.selectedProject, state.uploadResult, state.analysisResult]);

  const resetWorkflow = useCallback(() => {
    if (WorkflowPersistence.clearWorkflowState()) {
      const freshState = WorkflowPersistence.getWorkflowState();
      setState(freshState);
    }
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Manual save/load
  const forceSave = useCallback(() => {
    try {
      AutoSave.flush();
      WorkflowPersistence.saveWorkflowState(state);
      return true;
    } catch (err) {
      console.error('Failed to force save:', err);
      setError('Falha ao salvar dados');
      return false;
    }
  }, [state]);

  const forceLoad = useCallback(() => {
    try {
      const persistedState = WorkflowPersistence.getWorkflowState();
      setState(persistedState);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to force load:', err);
      setError('Falha ao carregar dados');
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      AutoSave.flush();
    };
  }, []);

  return {
    // State
    state,
    isLoading,
    error,
    
    // Project management
    createProject,
    selectProject,
    deleteProject,
    
    // Workflow steps
    setCurrentStep,
    saveUploadResult,
    saveAnalysisResult,
    saveStrategicAnalysis,
    
    // Navigation
    canProceedToStep,
    
    // Utilities
    resetWorkflow,
    clearError,
    forceSave,
    forceLoad,
    
    // Direct state updates (for complex scenarios)
    updateState,
  };
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => 
    PreferencesManager.getPreferences()
  );

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    if (PreferencesManager.savePreferences(updates)) {
      setPreferences(newPreferences);
      
      // Restart auto-save if interval changed
      if ('autoSave' in updates || 'autoSaveInterval' in updates) {
        AutoSave.stop();
        if (newPreferences.autoSave) {
          AutoSave.start();
        }
      }
    }
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    if (PreferencesManager.resetPreferences()) {
      const defaultPrefs = PreferencesManager.getPreferences();
      setPreferences(defaultPrefs);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
}