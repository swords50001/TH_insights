import React, { useEffect, useState } from "react";
import { api } from "../api";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "user";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

type FormState = {
  email: string;
  name: string;
  role: "admin" | "user";
  password: string;
  confirmPassword: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  email: "",
  name: "",
  role: "user",
  password: "",
  confirmPassword: "",
  is_active: true,
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<User[]>("/admin/users");
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingUser && !form.password) {
      return setError("Password is required for new users");
    }
    if (form.password && form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setSaving(true);
      if (editingUser) {
        const payload: any = {
          name: form.name,
          role: form.role,
          is_active: form.is_active,
        };
        if (form.password) payload.password = form.password;
        const { data } = await api.put<User>(`/admin/users/${editingUser.id}` , payload);
        setUsers(users.map(u => u.id === data.id ? data : u));
      } else {
        const payload = {
          email: form.email,
          name: form.name,
          role: form.role,
          password: form.password,
        };
        const { data } = await api.post<User>("/admin/users", payload);
        setUsers([...users, data]);
      }
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      name: user.name || "",
      role: user.role,
      password: "",
      confirmPassword: "",
      is_active: user.is_active,
    });
  };

  const toggleActive = async (user: User) => {
    setError(null);
    try {
      const { data } = await api.put<User>(`/admin/users/${user.id}`, { is_active: !user.is_active });
      setUsers(users.map(u => u.id === data.id ? data : u));
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update user");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>User Management</h1>
      {error && (
        <div style={{ marginBottom: "12px", padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 1fr" }}>
        <form onSubmit={handleSubmit} style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>{editingUser ? "Edit User" : "Create User"}</h2>

          {!editingUser && (
            <label style={{ display: "block", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>Email</div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }}
              />
            </label>
          )}

          <label style={{ display: "block", marginBottom: "10px" }}>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>Name</div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Optional"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>Role</div>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "user" })}
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>{editingUser ? "New Password (optional)" : "Password"}</div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingUser ? "Leave blank to keep current" : "Set a password"}
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }}
              required={!editingUser}
            />
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>Confirm Password</div>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Retype password"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }}
              required={!!form.password}
            />
          </label>

          {editingUser && (
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span style={{ fontSize: "14px" }}>Active</span>
            </label>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                style={{ padding: "10px 16px", background: "#e5e7eb", color: "#111827", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Users</h2>
          {loading ? (
            <div>Loading users...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "8px" }}>Email</th>
                    <th style={{ padding: "8px" }}>Name</th>
                    <th style={{ padding: "8px" }}>Role</th>
                    <th style={{ padding: "8px" }}>Status</th>
                    <th style={{ padding: "8px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{u.email}</td>
                      <td style={{ padding: "8px" }}>{u.name || "—"}</td>
                      <td style={{ padding: "8px" }}>{u.role}</td>
                      <td style={{ padding: "8px", color: u.is_active ? "#065f46" : "#92400e" }}>
                        {u.is_active ? "Active" : "Inactive"}
                      </td>
                      <td style={{ padding: "8px", display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => startEdit(u)}
                          style={{ padding: "6px 10px", border: "1px solid #d1d5db", background: "#f9fafb", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          style={{ padding: "6px 10px", border: "1px solid #d1d5db", background: u.is_active ? "#fff7ed" : "#ecfdf3", borderRadius: "6px", cursor: "pointer" }}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>
                        No users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
