import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { participantApi } from "../lib/api";
import { subscribeToGameUpdates } from "../lib/socket";

const TIER_OPTIONS = [
  { value: 1, label: "Tier 1 (x2 / -25%)" },
  { value: 2, label: "Tier 2 (x3 / -50%)" },
  { value: 3, label: "Tier 3 (x4 / -75%)" },
  { value: 4, label: "Tier 4 (x5 / -100%)" }
];
const SHORT_TIME_ALERT_SECONDS = 5;

function ParticipantGamePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [tier, setTier] = useState(null);
  const [tierLocked, setTierLocked] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [questionKey, setQuestionKey] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const lastTickSecondRef = useRef(null);
  const hasPlayedTimeOverRef = useRef(false);
  const audioCtxRef = useRef(null);

  const balance = useMemo(() => {
    if (dashboard?.participant?.balance !== undefined) {
      return dashboard.participant.balance;
    }
    return user?.balance || 0;
  }, [dashboard, user]);
  const hasSubmittedCurrentQuestion = useMemo(() => {
    if (!user?.teamId || !dashboard?.participants) {
      return false;
    }
    return dashboard.participants.some((item) => item.teamId === user.teamId);
  }, [dashboard, user]);
  const timeLeftSeconds = useMemo(() => {
    if (!question?.startTime) {
      return 0;
    }
    const submissionWindowSeconds =
      Number.isFinite(question.durationSeconds) && question.durationSeconds > 0
        ? question.durationSeconds
        : 30;
    const startedAt = new Date(question.startTime).getTime();
    if (Number.isNaN(startedAt)) {
      return 0;
    }
    const elapsed = Math.floor((nowTick - startedAt) / 1000);
    return Math.max(0, submissionWindowSeconds - elapsed);
  }, [question, nowTick]);
  const isTimeOver = Boolean(question) && timeLeftSeconds <= 0;
  const totalDurationSeconds =
    Number.isFinite(question?.durationSeconds) && question.durationSeconds > 0
      ? question.durationSeconds
      : 30;

  const loadData = async () => {
    setError("");

    try {
      const [qData, dData] = await Promise.all([
        participantApi.getCurrentQuestion().catch((err) => {
          if (err.status === 404) {
            return { question: null };
          }
          throw err;
        }),
        participantApi.getDashboard()
      ]);

      setQuestion(qData?.question || null);
      setDashboard(dData || null);

      if (dData?.participant?.balance !== undefined) {
        updateUser({ balance: dData.participant.balance });
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/participant");
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextKey = question?._id || "";
    if (nextKey !== questionKey) {
      setQuestionKey(nextKey);
      setTier(null);
      setTierLocked(false);
      setSelectedOption("");
      setInvestmentAmount("");
      setMessage("");
      setError("");
      lastTickSecondRef.current = null;
      hasPlayedTimeOverRef.current = false;
    }
  }, [question, questionKey]);

  useEffect(() => {
    loadData();

    const timer = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToGameUpdates(() => {
      loadData();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          return;
        }
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
      } catch {
        // Ignore audio setup errors.
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const playBeep = (frequency, durationSeconds, type = "sine", gainValue = 0.04) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        return;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gainNode.gain.value = gainValue;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const start = ctx.currentTime;
      oscillator.start(start);
      oscillator.stop(start + durationSeconds);
    } catch {
      // Ignore audio errors so gameplay is not impacted.
    }
  };

  useEffect(() => {
    if (!question || hasSubmittedCurrentQuestion) {
      return;
    }

    if (timeLeftSeconds > 0 && timeLeftSeconds <= SHORT_TIME_ALERT_SECONDS) {
      if (lastTickSecondRef.current !== timeLeftSeconds) {
        lastTickSecondRef.current = timeLeftSeconds;
        playBeep(880, 0.07, "square", 0.035);
      }
    }

    if (isTimeOver && !hasPlayedTimeOverRef.current) {
      hasPlayedTimeOverRef.current = true;
      playBeep(220, 0.35, "sawtooth", 0.06);
    }
  }, [question, hasSubmittedCurrentQuestion, timeLeftSeconds, isTimeOver]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const parsedAmount = Number(investmentAmount);

    if (!selectedOption) {
      setError("Please choose an answer option.");
      return;
    }

    if (isTimeOver) {
      setError("Time over for this question.");
      return;
    }

    if (hasSubmittedCurrentQuestion) {
      setError("Already submitted for this question.");
      return;
    }

    if (!tierLocked || !tier) {
      setError("Please select and lock an investment tier first.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Investment amount must be a positive number.");
      return;
    }

    if (parsedAmount > balance) {
      setError("Investment exceeds available balance.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await participantApi.submitAnswer({
        selectedOption,
        tier,
        investmentAmount: parsedAmount
      });

      setMessage(data?.message || "Answer submitted.");
      setInvestmentAmount("");
      setSelectedOption("");
      await loadData();
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/participant");
        return;
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Participant Game" subtitle="Answer active question and manage your investment risk.">
      <div className="grid two-col">
        <section className="card">
          <h2>Balance</h2>
          <p className="metric">{balance}</p>
          {message ? <p className="ok-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="card">
          <h2>Game Pulse</h2>
          <p>
            Current Question: {dashboard?.currentQuestion?.questionId || "Not active"}
          </p>
          <p>Total Invested: {dashboard?.totalMoneyInvested || 0}</p>
          <button className="btn btn-soft" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>
      </div>

      <section className="card">
        <h2>Answer Submission</h2>
        {loading ? <p>Loading question...</p> : null}

        {!loading && !question ? (
          <p>No active question yet. Wait for admin to push one.</p>
        ) : null}

        {question ? (
          <form onSubmit={onSubmit} className="stack-form">
            <p className="question-text">{question.question}</p>
            <p className={isTimeOver ? "error-text" : ""}>
              Time Left: {timeLeftSeconds}s / {totalDurationSeconds}s
            </p>
            {hasSubmittedCurrentQuestion ? (
              <p className="ok-text">Already submitted for this question.</p>
            ) : null}
            {isTimeOver && !hasSubmittedCurrentQuestion ? (
              <p className="error-text">Submission window closed.</p>
            ) : null}

            <label>
              Investment Tier
              {!tierLocked ? (
                <div className="options-grid">
                  {TIER_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className="btn btn-soft"
                      disabled={hasSubmittedCurrentQuestion || isTimeOver}
                      onClick={() => {
                        setTier(item.value);
                        setTierLocked(true);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="inline-actions">
                  <span className="pill">
                    {TIER_OPTIONS.find((item) => item.value === tier)?.label}
                  </span>
                </div>
              )}
            </label>

            {tierLocked ? (
              <div className="options-grid">
                {question.options?.map((option) => (
                  <label key={option} className="option-item">
                    <input
                      type="radio"
                      name="option"
                      value={option}
                      disabled={hasSubmittedCurrentQuestion || isTimeOver}
                      checked={selectedOption === option}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p>Select tier first to unlock answer options.</p>
            )}

            <label>
              Investment Amount
              <input
                type="number"
                min="1"
                disabled={hasSubmittedCurrentQuestion || isTimeOver}
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </label>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting || hasSubmittedCurrentQuestion || isTimeOver}
            >
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Top 5 Participants</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.top5Participants || []).map((item) => (
                <tr key={item.teamId}>
                  <td>{item.teamId}</td>
                  <td>{item.balance}</td>
                </tr>
              ))}
              {(dashboard?.top5Participants || []).length === 0 ? (
                <tr>
                  <td colSpan="2">No leaderboard entries yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

export default ParticipantGamePage;
