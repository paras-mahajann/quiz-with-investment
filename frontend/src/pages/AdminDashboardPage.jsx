import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../lib/api";

const EMPTY_FORM = {
  questionId: "",
  question: "",
  options: "",
  correctAnswer: "",
  difficulty: "",
  durationSeconds: "30"
};

function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activePanel, setActivePanel] = useState("dashboard");
  const [defaultBalanceInput, setDefaultBalanceInput] = useState("1000");

  const parsedOptions = useMemo(
    () => form.options.split("\n").map((s) => s.trim()).filter(Boolean),
    [form.options]
  );
  const sortedQuestions = useMemo(
    () =>
      [...(questions || [])].sort((a, b) => {
        if (a.isActive === b.isActive) {
          return String(a.questionId || "").localeCompare(String(b.questionId || ""), undefined, {
            numeric: true
          });
        }
        return a.isActive ? -1 : 1;
      }),
    [questions]
  );

  const loadData = async () => {
    setError("");
    try {
      const [dashboardData, questionData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getQuestions()
      ]);
      setDashboard(dashboardData);
      setQuestions(questionData.questions || []);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/admin");
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const withAction = async (callback) => {
    setActionLoading(true);
    setMessage("");
    setError("");
    try {
      await callback();
      await loadData();
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/admin");
        return;
      }
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    const normalizedDuration = Number(form.durationSeconds || 30);

    if (parsedOptions.length < 2) {
      setError("Enter at least 2 options, one per line.");
      return;
    }

    if (!parsedOptions.includes(form.correctAnswer.trim())) {
      setError("Correct answer must match one of the options exactly.");
      return;
    }

    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      setError("Duration must be a positive number.");
      return;
    }

    await withAction(async () => {
      const payload = {
        questionId: form.questionId.trim() || undefined,
        question: form.question.trim(),
        options: parsedOptions,
        correctAnswer: form.correctAnswer.trim(),
        difficulty: form.difficulty.trim() || undefined,
        durationSeconds: Math.floor(normalizedDuration)
      };
      const data = await adminApi.addQuestion(payload);
      setMessage(data.message || "Question added.");
      setForm(EMPTY_FORM);
    });
  };

  const activateQuestion = async (questionId) => {
    await withAction(async () => {
      const data = await adminApi.pushQuestion({ questionId });
      setMessage(data.message || "Question activated.");
    });
  };

  const revealAnswer = async () => {
    await withAction(async () => {
      const data = await adminApi.revealAnswer();
      setMessage(`${data.message}. Correct: ${data.correctAnswer}`);
    });
  };

  const resetGame = async () => {
    await withAction(async () => {
      const data = await adminApi.resetGame();
      setMessage(data.message || "Game reset done.");
    });
  };

  const applyDefaultBalance = async () => {
    const normalizedBalance = Number(defaultBalanceInput);
    if (!Number.isFinite(normalizedBalance) || normalizedBalance < 0) {
      setError("Default balance must be a non-negative number.");
      return;
    }

    await withAction(async () => {
      const data = await adminApi.setDefaultBalance({
        defaultBalance: normalizedBalance
      });
      setMessage(
        `${data.message} (updated ${data.modifiedCount}/${data.matchedCount}, online <= ${data.onlineWindowSeconds}s)`
      );
    });
  };

  return (
    <AppShell title="Admin Dashboard" subtitle="Manage questions, game state, and leaderboard.">
      {message ? <p className="ok-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="switch-row" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={`switch-btn ${activePanel === "dashboard" ? "active" : ""}`}
          onClick={() => setActivePanel("dashboard")}
        >
          Dashboard Panel
        </button>
        <button
          type="button"
          className={`switch-btn ${activePanel === "management" ? "active" : ""}`}
          onClick={() => setActivePanel("management")}
        >
          Management Panel
        </button>
      </div>

      {activePanel === "dashboard" ? (
        <>
          <div className="grid three-col">
            <section className="card">
              <h2>Current Question</h2>
              <p>ID: {dashboard?.currentQuestion?.questionId || "Not active"}</p>
              <p>Timer: {dashboard?.currentQuestion?.durationSeconds || 30}s</p>
              <p>Total Invested: {dashboard?.totalMoneyInvested || 0}</p>
              <div className="inline-actions">
                <button className="btn btn-soft" onClick={loadData} disabled={loading || actionLoading}>
                  Refresh
                </button>
                <button className="btn btn-danger" onClick={resetGame} disabled={actionLoading}>
                  Reset Game
                </button>
              </div>
            </section>

            <section className="card">
              <h2>All Participant Rankings</h2>
              <div className="table-wrap compact">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.rankedParticipants || []).map((item, index) => (
                      <tr key={item.teamId}>
                        <td>{index + 1}</td>
                        <td>{item.teamId}</td>
                        <td>{item.balance}</td>
                      </tr>
                    ))}
                    {(dashboard?.rankedParticipants || []).length === 0 ? (
                      <tr>
                        <td colSpan="3">No data yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2>Question Controls</h2>
              <button className="btn btn-primary" onClick={revealAnswer} disabled={actionLoading}>
                Reveal Current Answer
              </button>
              <div className="stack-form" style={{ marginTop: "0.75rem" }}>
                <label>
                  Default Balance For Online Participants
                  <input
                    type="number"
                    min="0"
                    value={defaultBalanceInput}
                    onChange={(e) => setDefaultBalanceInput(e.target.value)}
                    placeholder="1000"
                  />
                </label>
                <button
                  className="btn btn-soft"
                  type="button"
                  onClick={applyDefaultBalance}
                  disabled={actionLoading}
                >
                  Apply Balance
                </button>
              </div>
            </section>
          </div>

          <section className="card">
            <h2>Participants List</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Balance</th>
                    <th>Current Investment</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.participants || []).map((item) => (
                    <tr key={item.teamId}>
                      <td>{item.teamId}</td>
                      <td>{item.balance}</td>
                      <td>{item.currentInvestment || 0}</td>
                    </tr>
                  ))}
                  {(dashboard?.participants || []).length === 0 ? (
                    <tr>
                      <td colSpan="3">No participants submitted for active question.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="card">
            <h2>Add Question</h2>
            <form className="stack-form" onSubmit={submitQuestion}>
              <div className="grid two-col">
                <label>
                  Question ID (optional)
                  <input
                    value={form.questionId}
                    onChange={(e) => setForm((prev) => ({ ...prev, questionId: e.target.value }))}
                    placeholder="Auto if empty"
                  />
                </label>

                <label>
                  Difficulty (optional)
                  <input
                    value={form.difficulty}
                    onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                    placeholder="easy / medium / hard"
                  />
                </label>
              </div>

              <label>
                Duration (seconds)
                <input
                  type="number"
                  min="1"
                  value={form.durationSeconds}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationSeconds: e.target.value }))}
                  placeholder="30"
                  required
                />
              </label>

              <label>
                Question
                <input
                  value={form.question}
                  onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter quiz question"
                  required
                />
              </label>

              <label>
                Options (one per line)
                <textarea
                  rows="4"
                  value={form.options}
                  onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))}
                  placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                  required
                />
              </label>

              <label>
                Correct Answer
                <input
                  value={form.correctAnswer}
                  onChange={(e) => setForm((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                  placeholder="Must match one option exactly"
                  required
                />
              </label>

              <button className="btn btn-primary" type="submit" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Add Question"}
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Questions (Push To All Participants)</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Question ID</th>
                    <th>Question</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuestions.map((item) => (
                    <tr key={item._id}>
                      <td>{item.questionId}</td>
                      <td>{item.question}</td>
                      <td>{item.durationSeconds || 30}s</td>
                      <td>{item.isActive ? "Active" : "Idle"}</td>
                      <td>
                        <button
                          className="btn btn-soft"
                          disabled={actionLoading || item.isActive}
                          onClick={() => activateQuestion(item._id)}
                        >
                          {item.isActive ? "Pushed" : "Push"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="5">No questions found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

export default AdminDashboardPage;
