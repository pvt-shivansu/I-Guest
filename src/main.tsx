import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { WEDDING_THEMES } from './utils/rsvpLogic.ts';
import './index.css';

if (typeof window !== 'undefined') {
  (window as unknown as { WEDDING_THEMES: typeof WEDDING_THEMES }).WEDDING_THEMES = WEDDING_THEMES;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFAF5] text-[#34251E] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white border border-[#F47B20]/30 shadow-xl text-center space-y-4">
            <h1 className="text-2xl font-serif-display font-bold text-[#34251E]">
              Refreshing I-Guest Session
            </h1>
            <p className="text-xs text-[#8E7A6E]">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('iguest_rsvp_form_draft_v1');
                } catch {
                  // Ignore storage errors
                }
                window.location.reload();
              }}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47B20] text-white text-sm font-semibold cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
