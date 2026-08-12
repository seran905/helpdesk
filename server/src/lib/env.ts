const required = ["DATABASE_URL", "BETTER_AUTH_SECRET"] as const;

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
}
