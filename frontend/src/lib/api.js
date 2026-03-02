import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

async function request(path, options = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method: options.method || "GET",
      data: options.body,
      headers: options.headers || {}
    });
    return response.data ?? null;
  } catch (err) {
    const status = err?.response?.status;
    const message = err?.response?.data?.message || "Request failed";
    const error = new Error(message);
    error.status = status;
    throw error;
  }
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
