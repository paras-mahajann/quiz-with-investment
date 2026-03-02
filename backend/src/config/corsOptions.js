const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];
const allowVercelPreviews = String(process.env.ALLOW_VERCEL_PREVIEWS || "").toLowerCase() === "true";

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS || "";
  const extra = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra])];
};

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = String(origin).trim();
  if (allowVercelPreviews && normalizedOrigin.endsWith(".vercel.app")) {
    return true;
  }

  return parseAllowedOrigins().includes(normalizedOrigin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
};

module.exports = {
  corsOptions,
  isAllowedOrigin
};
