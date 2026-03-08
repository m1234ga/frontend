'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QrCode, Plug, PlugZap, LogOut, RefreshCw, Save, Shield } from 'lucide-react';

type SessionStatus = {
  Connected?: boolean;
  LoggedIn?: boolean;
};

type WuzUserOption = {
  id: string;
  name: string;
  jid?: string;
  connected?: number | boolean;
};

const AVAILABLE_EVENTS = ['Message', 'ReadReceipt', 'HistorySync', 'ChatPresence'];

export default function SettingsPage() {
  const { authenticated, loading, token, user } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<SessionStatus>({});
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [subscribe, setSubscribe] = useState<string[]>(['Message', 'ReadReceipt', 'HistorySync', 'ChatPresence']);
  const [immediate, setImmediate] = useState(true);
  const [webhookURL, setWebhookURL] = useState('');
  const [hmacKey, setHmacKey] = useState('');
  const [hasHmacConfigured, setHasHmacConfigured] = useState(false);
  const [wuzUsers, setWuzUsers] = useState<WuzUserOption[]>([]);
  const [mappedWuzUserId, setMappedWuzUserId] = useState<string>('');

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
      throw new Error(`Failed to fetch status: ${response.status}`);
    }

    const data = await response.json();
    setStatus(data?.data || data || {});
  }, [apiBase, authHeaders]);

  const fetchQr = useCallback(async () => {
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

  const fetchWebhook = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/chat/api/settings/webhook`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) return;

    const data = await response.json();
    const webhook = data?.data?.webhook || data?.webhook || '';
    const subscribeData = data?.data?.subscribe || data?.subscribe || [];

    setWebhookURL(String(webhook || ''));
    if (Array.isArray(subscribeData) && subscribeData.length > 0) {
      setSubscribe(subscribeData.map((e: unknown) => String(e)));
    }
  }, [apiBase, authHeaders]);

  const fetchHmacStatus = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/chat/api/settings/hmac`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      setHasHmacConfigured(false);
      return;
    }

    const data = await response.json();
    const masked = data?.hmac_key || data?.data?.hmac_key || '';
    setHasHmacConfigured(Boolean(masked));
  }, [apiBase, authHeaders]);

  const fetchWuzUsers = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/chat/api/settings/wuz-users`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      setWuzUsers([]);
      setMappedWuzUserId('');
      return;
    }

    const data = await response.json();
    const list: unknown[] = Array.isArray(data?.users) ? data.users : [];
    setWuzUsers(list.map((item: unknown) => {
      const entry = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
      return {
        id: String(entry.id || ''),
        name: String(entry.name || ''),
        jid: entry.jid ? String(entry.jid) : undefined,
        connected: entry.connected as number | boolean | undefined,
      };
    }).filter((u: WuzUserOption) => !!u.id));
    setMappedWuzUserId(String(data?.mappedWuzUserId || ''));
  }, [apiBase, authHeaders]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchStatus(), fetchWebhook(), fetchHmacStatus(), fetchWuzUsers()]);
      await fetchQr();
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus, fetchWebhook, fetchHmacStatus, fetchWuzUsers, fetchQr]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/auth');
      return;
    }

    if (authenticated) {
      refreshAll();
    }
  }, [authenticated, loading, router, refreshAll]);

  const runAction = async (path: string, method: 'POST' | 'DELETE', body?: unknown) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}${path}`, {
        method,
        headers: authHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      await refreshAll();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubscribe = (eventName: string) => {
    setSubscribe((prev) => {
      if (prev.includes(eventName)) {
        return prev.filter((item) => item !== eventName);
      }
      return [...prev, eventName];
    });
  };

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
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage connect/disconnect and configuration for current logged-in contact: <span className="font-semibold">{user?.username || 'Unknown'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Connected</p>
            <p className={`text-2xl font-bold ${status.Connected ? 'text-emerald-600' : 'text-red-500'}`}>{status.Connected ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Logged In</p>
            <p className={`text-2xl font-bold ${status.LoggedIn ? 'text-emerald-600' : 'text-red-500'}`}>{status.LoggedIn ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">HMAC</p>
            <p className={`text-2xl font-bold ${hasHmacConfigured ? 'text-emerald-600' : 'text-amber-500'}`}>{hasHmacConfigured ? 'Configured' : 'Not Set'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">WUZ User Mapping</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Link this logged-in app user to the correct WUZ API user instance.
          </p>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <select
              value={mappedWuzUserId}
              onChange={(e) => setMappedWuzUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select WUZ user...</option>
              {wuzUsers.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name} {instance.connected ? '(connected)' : '(disconnected)'}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isSubmitting || !mappedWuzUserId}
              onClick={() => runAction('/api/chat/api/settings/wuz-mapping', 'POST', { wuzUserId: mappedWuzUserId })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              Save Mapping
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => runAction('/api/chat/api/settings/wuz-mapping', 'DELETE')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60"
            >
              Unlink
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connection Controls</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => runAction('/api/chat/api/settings/session/connect', 'POST', { Subscribe: subscribe, Immediate: immediate })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Plug className="w-4 h-4" />
              Connect
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => runAction('/api/chat/api/settings/session/disconnect', 'POST')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
            >
              <PlugZap className="w-4 h-4" />
              Disconnect
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => runAction('/api/chat/api/settings/session/logout', 'POST')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              Logout Session
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="immediate"
              type="checkbox"
              checked={immediate}
              onChange={(e) => setImmediate(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="immediate" className="text-sm text-gray-700 dark:text-gray-300">Immediate connect check</label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Subscribe Events</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((eventName) => (
                <button
                  key={eventName}
                  type="button"
                  onClick={() => toggleSubscribe(eventName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${subscribe.includes(eventName)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                >
                  {eventName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Webhook Configuration</h2>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL</label>
            <input
              type="text"
              value={webhookURL}
              onChange={(e) => setWebhookURL(e.target.value)}
              placeholder="https://your-server/webhook"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => runAction('/api/chat/api/settings/webhook', 'POST', {
                webhookURL,
                subscribe,
              })}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              Save Webhook
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">HMAC Configuration</h2>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HMAC Key (min 32 chars)</label>
            <input
              type="password"
              value={hmacKey}
              onChange={(e) => setHmacKey(e.target.value)}
              placeholder="Enter HMAC key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSubmitting || hmacKey.length < 32}
                onClick={() => runAction('/api/chat/api/settings/hmac', 'POST', { hmac_key: hmacKey })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Shield className="w-4 h-4" />
                Save HMAC
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => runAction('/api/chat/api/settings/hmac', 'DELETE')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60"
              >
                Clear HMAC
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 inline-flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code
          </h2>
          {!status.LoggedIn && qrCode ? (
            <Image
              src={qrCode}
              alt="WhatsApp QR Code"
              width={256}
              height={256}
              unoptimized
              className="w-64 h-64 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">QR is available only when session is connected but not logged in.</p>
          )}
        </div>
      </div>
    </div>
  );
}
