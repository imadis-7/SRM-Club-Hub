
'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      // Use functional updates to avoid triggering re-renders if state is already correct
      setLoading(prev => prev === false ? prev : false);
      setData(prev => prev === null ? prev : null);
      return;
    }

    setLoading(prev => prev === true ? prev : true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as T : null);
        setLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        });

        errorEmitter.emit('permission-error', permissionError);
        
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [ref]);

  return { data, loading, error };
}
