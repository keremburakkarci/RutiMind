// App.tsx - Main entry point with Navigation and Providers

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from './firebaseConfig';
import RootNavigator from './src/navigation/RootNavigator';
import './src/i18n';
import { initDatabase } from './src/services/database';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

const App: React.FC = () => {
  const [persistenceReady, setPersistenceReady] = useState(false);

  useEffect(() => {
    // Ensure Firebase uses persistent local persistence on web so refresh doesn't require re-login
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.debug('[App] setPersistence(browserLocalPersistence) succeeded');
      } catch (e) {
        console.warn('Could not set browserLocalPersistence for Firebase auth:', e);
      } finally {
        setPersistenceReady(true);
      }
    })();

    // Initialize database on app start
    initDatabase().catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  if (!persistenceReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <></>
        </GestureHandlerRootView>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootNavigator />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
};

export default App;
