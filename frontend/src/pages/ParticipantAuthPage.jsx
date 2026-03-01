import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { participantApi } from "../lib/api";

const EMPTY_FORM = { teamId: "", password: "" };

function ParticipantAuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginAsParticipant } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const api = mode === "login" ? participantApi.login : participantApi.register;
      const data = await api(form);
      loginAsParticipant(data.participant);
      navigate("/participant/game");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Participant Access" subtitle="Login or create a team account.">
      <div className="auth-wrapper">
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="switch-row">
            <button
              className={`switch-btn ${mode === "login" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`switch-btn ${mode === "register" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <label>
            Team ID
            <input
              value={form.teamId}
              onChange={(e) => setForm((prev) => ({ ...prev, teamId: e.target.value }))}
              placeholder="team-01"
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
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Team"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export default ParticipantAuthPage;
