import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { participantApi } from "../lib/api";

const EMPTY_FORM = { teamId: "", password: "" };

function ParticipantAuthPage() {
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
      const data = await participantApi.login(form);
      loginAsParticipant(data.participant);
      navigate("/participant/game");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Participant Access" subtitle="Login with credentials shared by admin.">
      <div className="auth-wrapper">
        <form className="auth-card" onSubmit={onSubmit}>
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
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export default ParticipantAuthPage;
