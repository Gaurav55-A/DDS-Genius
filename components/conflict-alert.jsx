'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ConflictAlert({ title, conflicts }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <Alert className="border-2 border-bright-rose bg-bright-rose/5 dark:bg-bright-rose/10">
      <div className="flex items-start gap-3">
        <div className="icon-glow-rose h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-bright-rose" />
        </div>
        <div className="flex-1">
          <AlertTitle className="text-bright-rose font-heading font-bold mb-2">
            {title || 'Critical Data Conflicts Detected'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-bright-rose font-bold mt-0.5">•</span>
                <p className="text-foreground font-body">
                  {typeof conflict === 'string' ? conflict : (
                    <>
                      <span className="font-semibold">{conflict.area}:</span> {conflict.description}
                      {conflict.visualData && conflict.thermalData && (
                        <span className="block mt-1 text-muted-foreground">
                          Visual: {conflict.visualData} vs Thermal: {conflict.thermalData}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            ))}
          </AlertDescription>
          <div className="mt-3 text-xs text-muted-foreground italic">
            ⚠️ These discrepancies may indicate sub-surface issues not visible to the naked eye. Manual verification recommended.
          </div>
        </div>
      </div>
    </Alert>
  );
}
