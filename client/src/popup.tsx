import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ExtensionPopup from './components/ExtensionPopup';
import './index.css';

// Direct render of the ExtensionPopup component for the browser extension popup
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="min-h-full w-full flex items-center justify-center bg-neutral-50">
        <ExtensionPopup />
      </div>
    </QueryClientProvider>
  </React.StrictMode>
);