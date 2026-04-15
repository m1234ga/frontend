'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pencil, Save, Trash2, X, Loader2, FileText, Plus, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatApi } from '@/hooks/useChatData';

type TemplateItem = {
  id: number | string;
  name: string;
  content: string;
  imagePath?: string | null;
  mediaPath?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedat?: string;
};

export default function TemplatesPage() {
  const { authenticated, loading, user } = useAuth();
  const router = useRouter();
  const chatApi = useChatApi();

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const normalizedTemplates = useMemo(() => {
    return templates.map((template) => ({
      ...template,
      id: String(template.id)
    }));
  }, [templates]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await chatApi.GetMessageTemplates();
      setTemplates(Array.isArray(data) ? (data as TemplateItem[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load templates';
      setErrorMessage(message);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatApi]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/auth');
      return;
    }

    if (authenticated) {
      void fetchTemplates();
    }
  }, [authenticated, loading, router, fetchTemplates]);

  const startEdit = (template: TemplateItem) => {
    setEditingId(String(template.id));
    setEditName(template.name || '');
    setEditContent(template.content || '');
    setErrorMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditContent('');
  };

  const handleSave = async (id: string) => {
    if (!editName.trim() || !editContent.trim()) {
      setErrorMessage('Name and content are required.');
      return;
    }

    setBusyId(id);
    setErrorMessage('');
    try {
      await chatApi.UpdateMessageTemplate(id, editName.trim(), editContent.trim());
      setTemplates((prev) => prev.map((template) => (
        String(template.id) === id
          ? { ...template, name: editName.trim(), content: editContent.trim() }
          : template
      )));
      cancelEdit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template';
      setErrorMessage(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this template?');
    if (!confirmed) return;

    setBusyId(id);
    setErrorMessage('');
    try {
      await chatApi.DeleteMessageTemplate(id);
      setTemplates((prev) => prev.filter((template) => String(template.id) !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete template';
      setErrorMessage(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim() || !createContent.trim()) {
      setErrorMessage('Name and content are required.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('User is not available. Please re-login.');
      return;
    }

    setIsCreating(true);
    setErrorMessage('');
    try {
      const created = await chatApi.CreateMessageTemplate(
        createName.trim(),
        createContent.trim(),
        user.id,
        createImageFile || undefined
      );
      const createdTemplate = (created && typeof created === 'object') ? (created as TemplateItem) : null;

      if (createdTemplate?.id !== undefined) {
        setTemplates((prev) => [createdTemplate, ...prev]);
      } else {
        await fetchTemplates();
      }

      setCreateName('');
      setCreateContent('');
      setCreateImageFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template';
      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Templates</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create, edit, or delete templates from one screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchTemplates()}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Create New Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Welcome Message"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Content</label>
              <textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                placeholder="Type template content..."
                className="w-full min-h-[90px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Image (Optional)</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60">
                  <ImageIcon className="w-4 h-4" />
                  <span>{createImageFile ? 'Change image' : 'Choose image'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setCreateImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                {createImageFile && (
                  <>
                    <span className="text-xs text-gray-600 dark:text-gray-300 break-all">{createImageFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setCreateImageFile(null)}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Template
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
            <div className="col-span-3">Name</div>
            <div className="col-span-7">Content</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {normalizedTemplates.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No templates found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {normalizedTemplates.map((template) => {
                const isEditing = editingId === template.id;
                const isBusy = busyId === template.id;

                return (
                  <div key={template.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-start">
                    <div className="col-span-12 md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100 break-words">{template.name}</p>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-7">
                      {isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full min-h-[90px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{template.content}</p>
                          {(template.imagePath || template.mediaPath) && (
                            <div className="inline-block rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                              <Image
                                src={template.imagePath || template.mediaPath || ''}
                                alt="Template"
                                width={384}
                                height={96}
                                className="max-w-xs max-h-24 object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-2 flex md:justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleSave(template.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(template)}
                            disabled={isBusy || editingId !== null}
                            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold border border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20 disabled:opacity-60"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(template.id)}
                            disabled={isBusy || editingId !== null}
                            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-60"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
