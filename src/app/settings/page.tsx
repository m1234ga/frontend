'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QrCode, RefreshCw, Plug, PlugZap, LogOut } from 'lucide-react';

type SessionStatus = {
  Connected?: boolean;
  connected?: boolean;
  IsConnected?: boolean;
  LoggedIn?: boolean;
  loggedIn?: boolean;
  IsLoggedIn?: boolean;
};

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'connected';
  }
  return false;
}

export default function SettingsPage() {
  const { authenticated, loading, token } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<SessionStatus>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isConnected = useMemo(() => {
    // Accept status key variants from different WUZ API versions/proxies.
    return (
      toBool(status.Connected) ||
      toBool(status.connected) ||
      toBool(status.IsConnected) ||
      toBool(status.LoggedIn) ||
      toBool(status.loggedIn) ||
      toBool(status.IsLoggedIn)
    );
  }, [status]);

  const isLoggedIn = useMemo(() => {
    return (
      toBool(status.LoggedIn) ||
      toBool(status.loggedIn) ||
      toBool(status.IsLoggedIn)
    );
  }, [status]);

  const canShowQr = useMemo(() => isConnected && !isLoggedIn, [isConnected, isLoggedIn]);

  const apiBase = useMemo(() => {
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/').replace(/\/$/, '');
  }, []);

  const authHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/chat/api/settings/session/status`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      setStatus({});
      return;
    }

    const data = await response.json();
    setStatus(data?.data || data || {});
  }, [apiBase, authHeaders]);

  const fetchQrCode = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/chat/api/settings/session/qr`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      setQrCode('');
      return;
    }

    const data = await response.json();
    const qr = data?.data?.QRCode || data?.QRCode || '';
    setQrCode(typeof qr === 'string' ? qr : '');
  }, [apiBase, authHeaders]);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchStatus();
      await fetchQrCode();
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus, fetchQrCode]);

  const refreshStatusSilent = useCallback(async () => {
    try {
      await fetchStatus();
      await fetchQrCode();
    } catch {
      // Silent refresh intentionally ignores transient polling errors.
    }
  }, [fetchStatus, fetchQrCode]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/auth');
      return;
    }

    if (authenticated) {
      refreshStatus();
    }
  }, [authenticated, loading, router, refreshStatus]);

  useEffect(() => {
    if (!authenticated) return;

    const intervalId = setInterval(() => {
      void refreshStatusSilent();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [authenticated, refreshStatusSilent]);

  const handleConnect = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      const response = await fetch(`${apiBase}/api/chat/api/settings/session/connect`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          Subscribe: ['Message', 'ReadReceipt', 'HistorySync', 'ChatPresence'],
          Immediate: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error || `Request failed with status ${response.status}`));
      }

      setMessage('Connect request sent. If not logged in, scan the QR code.');
      await refreshStatus();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to connect session.';
      setErrorMessage(text);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  }, [apiBase, authHeaders, refreshStatus]);

  const runSessionAction = useCallback(async (path: string, successMessage: string) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      const response = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error || `Request failed with status ${response.status}`));
      }

      setMessage(successMessage);
      await refreshStatus();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Session action failed.';
      setErrorMessage(text);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  }, [apiBase, authHeaders, refreshStatus]);

  const handleDisconnect = useCallback(async () => {
    await runSessionAction('/api/chat/api/settings/session/disconnect', 'Session disconnected.');
  }, [runSessionAction]);

  const handleLogout = useCallback(async () => {
    await runSessionAction('/api/chat/api/settings/session/logout', 'Session logged out.');
  }, [runSessionAction]);

  const handleLoadQr = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      await fetchQrCode();
      setMessage('QR refreshed.');
      await fetchStatus();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to load QR.';
      setErrorMessage(text);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchQrCode, fetchStatus]);

  if (loading || isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connect your WUZ session and scan QR when needed.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshStatus}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Connection Status</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isConnected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isLoggedIn
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
            >
              {isLoggedIn ? 'Logged In' : 'Not Logged In'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">WUZ Session</h2>

          <div className="flex flex-wrap items-center gap-3">
            {!isConnected && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Plug className="w-4 h-4" />
                Connect
              </button>
            )}
            <button
              type="button"
              disabled={isSubmitting || !isConnected}
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
            >
              <PlugZap className="w-4 h-4" />
              Disconnect
            </button>
            <button
              type="button"
              disabled={isSubmitting || !isConnected}
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            {canShowQr && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleLoadQr}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <QrCode className="w-4 h-4" />
                Load QR
              </button>
            )}
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
            {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
          </div>

          {canShowQr && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Scan this QR when the session is connected but not logged in.
              </p>
              {qrCode ? (
                <Image
                  src={qrCode}
                  alt="WUZ session QR"
                  width={256}
                  height={256}
                  unoptimized
                  className="w-64 h-64 object-contain border border-gray-200 dark:border-gray-700 rounded-lg bg-white"
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No QR available yet. Click Load QR.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
