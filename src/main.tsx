import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import './index.css';

const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const SpeechCoachPage = lazy(() => import('./pages/SpeechCoachPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const AlphabetsPage = lazy(() => import('./pages/AlphabetsPage'));
const HubPage = lazy(() => import('./pages/HubPage'));

function SuspenseFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
        Đang nạp mô-đun ARUKAS 2...
      </span>
    </div>
  );
}

// ── Error Boundary to catch UI crashes ──
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ARUKAS 2] ErrorBoundary Caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 600, margin: '40px auto' }}>
          <h1 style={{ color: '#e11d48', fontSize: 24, fontWeight: 'bold' }}>⚠️ ARUKAS 2 Error</h1>
          <p style={{ marginTop: 8, color: '#444' }}>Ứng dụng gặp sự cố:</p>
          <pre style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: 16, borderRadius: 12, overflow: 'auto', fontSize: 12, marginTop: 12 }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route
                index
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <AnalyzePage />
                  </Suspense>
                }
              />
              <Route
                path="speech"
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <SpeechCoachPage />
                  </Suspense>
                }
              />
              <Route
                path="media"
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <MediaPage />
                  </Suspense>
                }
              />
              <Route
                path="alphabets"
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <AlphabetsPage />
                  </Suspense>
                }
              />
              <Route
                path="hub"
                element={
                  <Suspense fallback={<SuspenseFallback />}>
                    <HubPage />
                  </Suspense>
                }
              />
              {/* Fallback to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
