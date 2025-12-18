// hooks/useAuthMigration.ts
import { useEffect } from 'react';
import { migrateMockToken } from '@/lib/auth';

export const useAuthMigration = (): void => {
  useEffect(() => {
    // Добавьте проверку
    if (typeof window !== 'undefined') {
      migrateMockToken().catch(error => {
        console.error('Migration error:', error);
      });
    }
  }, []);
};