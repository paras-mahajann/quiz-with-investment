const BASE_HEADERS = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...BASE_HEADERS,
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const participantApi = {
  register: (payload) => request("/api/participant/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/participant/login", { method: "POST", body: payload }),
  getCurrentQuestion: () => request("/api/participant/current-question"),
  submitAnswer: (payload) => request("/api/participant/submit-answer", { method: "POST", body: payload }),
  getDashboard: () => request("/api/participant/dashboard")
};

export const adminApi = {
  login: (payload) => request("/api/admin/login", { method: "POST", body: payload }),
  addQuestion: (payload) => request("/api/admin/add-question", { method: "POST", body: payload }),
  getQuestions: () => request("/api/admin/get-questions"),
  pushQuestion: (payload) => request("/api/admin/push-question", { method: "POST", body: payload }),
  revealAnswer: () => request("/api/admin/reveal-answer", { method: "POST" }),
  getDashboard: () => request("/api/admin/dashboard"),
  resetGame: () => request("/api/admin/game-reset", { method: "POST" }),
  setDefaultBalance: (payload) => request("/api/admin/set-default-balance", { method: "POST", body: payload }),
  getCurrentQuestion: () => request("/api/admin/current-question"),
  createParticipant: (payload) => request("/api/admin/register-participant", { method: "POST", body: payload })
};
