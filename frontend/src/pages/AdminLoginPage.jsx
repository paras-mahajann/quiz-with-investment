import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../lib/api";

function AdminLoginPage() {
  const [form, setForm] = useState({ adminId: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await adminApi.login(form);
      loginAsAdmin(data.admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Admin Login" subtitle="Use your admin credentials.">
      <div className="auth-wrapper">
        <form className="auth-card" onSubmit={onSubmit}>
          <label>
            Admin ID
            <input
              value={form.adminId}
              onChange={(e) => setForm((prev) => ({ ...prev, adminId: e.target.value }))}
              placeholder="admin"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export default AdminLoginPage;
