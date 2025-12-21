'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, Plus, Trash2, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Role {
  id?: string;
  name: string;
  description?: string;
}

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  token: string;
}

export const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  token,
}) => {
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's current roles
      const userRolesResponse = await fetch(`http://localhost:5000/api/users/${user?.id}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userRolesResponse.ok) {
        throw new Error('Failed to fetch user roles');
      }

      const userRolesData = await userRolesResponse.json();
      setUserRoles(userRolesData.roles || []);

      // Fetch available roles
      const availableRolesResponse = await fetch(`http://localhost:5000/api/users/${user?.id}/available-roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!availableRolesResponse.ok) {
        throw new Error('Failed to fetch available roles');
      }

      const availableRolesData = await availableRolesResponse.json();
      setAvailableRoles(availableRolesData.roles || []);
    } catch (err) {
      const getErrorMessage = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (err instanceof Error) return err.message;
        try { return JSON.stringify(err); } catch { return String(err); }
      };
      const message = getErrorMessage(err);
      setError(message || 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    if (isOpen && user) {
      fetchRoles();
    }
  }, [isOpen, user, fetchRoles]);

  const handleAddRoles = async () => {
    if (selectedRoles.size === 0) {
      setError('Please select at least one role to add');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rolesToAdd = availableRoles.filter(role => selectedRoles.has(role.name));

      const response = await fetch(`http://localhost:5000/api/users/${user?.id}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: rolesToAdd }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add roles');
      }

      setSelectedRoles(new Set());
      await fetchRoles();
      if (onSuccess) onSuccess();
    } catch (err) {
      const getErrorMessage = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (err instanceof Error) return err.message;
        try { return JSON.stringify(err); } catch { return String(err); }
      };
      const message = getErrorMessage(err);
      setError(message || 'An error occurred');
      console.error('Error adding roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to remove the "${role.name}" role from this user?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/users/${user?.id}/roles`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: [role] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove role');
      }

      await fetchRoles();
    } catch (err) {
      const getErrorMessage = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (err instanceof Error) return err.message;
        try { return JSON.stringify(err); } catch { return String(err); }
      };
      const message = getErrorMessage(err);
      setError(message || 'An error occurred');
      console.error('Error removing role:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleSelection = (roleName: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleName)) {
      newSelected.delete(roleName);
    } else {
      newSelected.add(roleName);
    }
    setSelectedRoles(newSelected);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Roles
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                for {user.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Current Roles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Roles
              </h3>
              <button
                onClick={fetchRoles}
                disabled={loading}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-2">
              {userRoles.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No roles assigned
                </div>
              ) : (
                userRoles.map((role) => (
                  <div
                    key={role.name}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {role.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveRole(role)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                      title="Remove role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Roles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Add Roles
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableRoles.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No available roles to add
                </div>
              ) : (
                availableRoles.map((role) => (
                  <label
                    key={role.name}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.has(role.name)}
                      onChange={() => toggleRoleSelection(role.name)}
                      disabled={loading}
                      className="w-4 h-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            {availableRoles.length > 0 && (
              <button
                onClick={handleAddRoles}
                disabled={loading || selectedRoles.size === 0}
                className="mt-3 w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Selected Roles ({selectedRoles.size})
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

