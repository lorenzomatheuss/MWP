'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, Check, Lock, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/lib/responsive-utils';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isAccessible: boolean;
  validationErrors?: string[];
}

interface WorkflowBreadcrumbsProps {
  currentStep: number;
  steps: Omit<WorkflowStep, 'isCompleted' | 'isAccessible'>[];
  onStepClick?: (step: number) => void;
  className?: string;
  compact?: boolean;
  validationState?: {
    [stepId: number]: {
      isValid: boolean;
      errors: string[];
    };
  };
}

export function WorkflowBreadcrumbs({
  currentStep,
  steps,
  onStepClick,
  className,
  compact = false,
  validationState = {},
}: WorkflowBreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useDeviceDetection();

  // Calculate step states
  const enrichedSteps = useMemo<WorkflowStep[]>(() => {
    return steps.map((step, index) => {
      const stepNumber = index + 1;
      const isCompleted = stepNumber < currentStep;
      const isCurrent = stepNumber === currentStep;
      const isAccessible = stepNumber <= currentStep || isCompleted;
      
      const validation = validationState[stepNumber];
      const validationErrors = validation?.errors || [];

      return {
        ...step,
        id: stepNumber,
        isCompleted,
        isAccessible,
        validationErrors,
      };
    });
  }, [steps, currentStep, validationState]);

  const handleStepClick = (step: WorkflowStep) => {
    if (!step.isAccessible) return;
    
    if (onStepClick) {
      onStepClick(step.id);
    } else {
      router.push(step.path);
    }
  };

  const getStepStatus = (step: WorkflowStep) => {
    if (step.isCompleted) return 'completed';
    if (step.id === currentStep) return 'current';
    if (step.isAccessible) return 'accessible';
    return 'locked';
  };

  const getStepIcon = (step: WorkflowStep) => {
    const status = getStepStatus(step);
    const hasErrors = step.validationErrors && step.validationErrors.length > 0;
    
    if (hasErrors && status === 'current') {
      return <AlertCircle className="h-4 w-4" />;
    }
    
    if (status === 'completed') {
      return <Check className="h-4 w-4" />;
    }
    
    if (status === 'locked') {
      return <Lock className="h-4 w-4" />;
    }
    
    return <step.icon className="h-4 w-4" />;
  };

  const getStepClassName = (step: WorkflowStep) => {
    const status = getStepStatus(step);
    const hasErrors = step.validationErrors && step.validationErrors.length > 0;
    
    const baseClasses = 'transition-all duration-200';
    
    switch (status) {
      case 'completed':
        return cn(
          baseClasses,
          'bg-green-100 text-green-800 border-green-200',
          'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        );
      case 'current':
        return cn(
          baseClasses,
          hasErrors 
            ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        );
      case 'accessible':
        return cn(
          baseClasses,
          'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
          'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
        );
      case 'locked':
        return cn(
          baseClasses,
          'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed',
          'dark:bg-gray-900 dark:text-gray-600 dark:border-gray-800'
        );
      default:
        return baseClasses;
    }
  };

  if (isMobile && compact) {
    // Compact mobile view - show only current step with navigation
    const currentStepData = enrichedSteps.find(s => s.id === currentStep);
    const canGoBack = currentStep > 1;
    const canGoForward = currentStep < steps.length && enrichedSteps[currentStep - 1]?.isCompleted;

    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepClick(enrichedSteps[currentStep - 2])}
              disabled={!canGoBack}
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Voltar
            </Button>
            
            <div className="text-center flex-1 mx-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                {currentStepData && getStepIcon(currentStepData)}
                <span className="font-medium text-sm">
                  Etapa {currentStep} de {steps.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentStepData?.title}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepClick(enrichedSteps[currentStep])}
              disabled={!canGoForward}
              className="flex items-center gap-2"
            >
              Avançar
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className={cn('p-6', isMobile && 'p-4')}>
        <div className="flex items-center justify-between">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 flex-1">
            {enrichedSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step button */}
                <Button
                  variant="outline"
                  size={isMobile ? 'sm' : 'default'}
                  onClick={() => handleStepClick(step)}
                  disabled={!step.isAccessible}
                  className={cn(
                    'flex items-center gap-2 min-w-0',
                    isMobile ? 'px-3 py-2' : 'px-4 py-3',
                    getStepClassName(step)
                  )}
                  aria-label={`${step.title}${step.validationErrors?.length ? ' - Com erros' : ''}${step.isCompleted ? ' - Concluída' : ''}${!step.isAccessible ? ' - Bloqueada' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {getStepIcon(step)}
                    {!isMobile && (
                      <div className="text-left">
                        <div className="font-medium text-sm">{step.title}</div>
                        {!compact && (
                          <div className="text-xs opacity-75">{step.description}</div>
                        )}
                      </div>
                    )}
                    {isMobile && (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Validation errors indicator */}
                  {step.validationErrors && step.validationErrors.length > 0 && (
                    <div className="ml-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </Button>

                {/* Connector */}
                {index < enrichedSteps.length - 1 && (
                  <ChevronRight 
                    className={cn(
                      'h-4 w-4 mx-2 flex-shrink-0',
                      'text-gray-400 dark:text-gray-600'
                    )} 
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step counter for mobile */}
          {isMobile && (
            <div className="ml-4 text-sm text-muted-foreground">
              {currentStep}/{steps.length}
            </div>
          )}
        </div>

        {/* Validation errors display */}
        {!compact && (
          <div className="mt-4">
            {enrichedSteps
              .filter(step => step.id === currentStep && step.validationErrors && step.validationErrors.length > 0)
              .map(step => (
                <div key={step.id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        Ação necessária para continuar:
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {step.validationErrors!.map((error, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-red-500 mt-1">•</span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default workflow steps for the brand copilot
export const DEFAULT_WORKFLOW_STEPS: Omit<WorkflowStep, 'isCompleted' | 'isAccessible'>[] = [
  {
    id: 1,
    title: 'Briefing',
    description: 'Upload e análise do documento',
    path: '/',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Galáxia',
    description: 'Exploração de conceitos visuais',
    path: '/galaxy',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Curadoria',
    description: 'Seleção e refinamento',
    path: '/curation',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Kit de Marca',
    description: 'Entregáveis finais',
    path: '/brand-kit',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];