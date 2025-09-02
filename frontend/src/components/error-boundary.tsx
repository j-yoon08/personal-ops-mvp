'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription className="mt-2">
            애플리케이션에서 예상치 못한 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-2">
          <Button onClick={reset} className="w-full">
            다시 시도
          </Button>
          
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              기술적 세부사항
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}