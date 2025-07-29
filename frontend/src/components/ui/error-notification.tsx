'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { useErrorHandler, type AppError, getDisplayMessage, getRecoverySuggestion, ERROR_CODES } from '@/lib/error-handling';

interface ErrorNotificationProps {
  maxVisible?: number;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ErrorNotification({ 
  maxVisible = 3, 
  autoHideDelay = 5000,
  position = 'top-right' 
}: ErrorNotificationProps) {
  const { errors, removeError } = useErrorHandler();
  const [visibleErrors, setVisibleErrors] = useState<AppError[]>([]);

  // Show only recent errors
  useEffect(() => {
    const recentErrors = errors.slice(-maxVisible);
    setVisibleErrors(recentErrors);
  }, [errors, maxVisible]);

  // Auto-hide non-critical errors
  useEffect(() => {
    if (autoHideDelay > 0) {
      visibleErrors.forEach(error => {
        if (error.recoverable && error.code !== ERROR_CODES.NETWORK_ERROR) {
          const timer = setTimeout(() => {
            removeError(error.timestamp);
          }, autoHideDelay);
          
          return () => clearTimeout(timer);
        }
      });
    }
  }, [visibleErrors, autoHideDelay, removeError]);

  if (visibleErrors.length === 0) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-sm`}>
      {visibleErrors.map((error) => (
        <ErrorCard
          key={error.timestamp.toISOString()}
          error={error}
          onDismiss={() => removeError(error.timestamp)}
        />
      ))}
    </div>
  );
}

interface ErrorCardProps {
  error: AppError;
  onDismiss: () => void;
}

function ErrorCard({ error, onDismiss }: ErrorCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    setIsRetrying(true);
    // Basic retry logic - in real app, this would trigger the failed action
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRetrying(false);
    onDismiss();
  };

  const getErrorIcon = (code: string) => {
    switch (code) {
      case ERROR_CODES.NETWORK_ERROR:
        return <Wifi className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorColor = (code: string) => {
    switch (code) {
      case ERROR_CODES.NETWORK_ERROR:
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case ERROR_CODES.VALIDATION_ERROR:
      case ERROR_CODES.INVALID_INPUT:
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case ERROR_CODES.API_ERROR:
      case ERROR_CODES.PROCESSING_ERROR:
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const displayMessage = getDisplayMessage(error);
  const recoverySuggestion = getRecoverySuggestion(error);

  return (
    <Card className={`${getErrorColor(error.code)} shadow-lg border animate-in slide-in-from-right-5`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon(error.code)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {displayMessage}
            </p>
            
            {recoverySuggestion && (
              <p className="text-xs mt-1 opacity-80">
                {recoverySuggestion}
              </p>
            )}
            
            {error.recoverable && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="text-xs h-7 px-2"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    'Tentar Novamente'
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for showing errors programmatically
export function useShowError() {
  const { errors } = useErrorHandler();
  
  return {
    showError: (code: string, message: string, details?: any, recoverable = true) => {
      // This would integrate with your error handler
      console.error(`[${code}] ${message}`, details);
    },
    hasErrors: errors.length > 0,
    errorCount: errors.length,
  };
}