
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      // In development, this will also hit the Next.js error overlay if thrown
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "You don't have permission to perform this action. Check Security Rules.",
      });
    });

    return unsubscribe;
  }, [toast]);

  return null;
}
