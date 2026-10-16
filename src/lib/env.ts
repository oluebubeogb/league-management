import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  APP_URL: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECURE: z.string().optional(),
  PRIMARY_ADMIN_USERNAME: z.string().optional(),
  PRIMARY_ADMIN_PASSWORD: z.string().optional(),
  PRIMARY_ADMIN_PHONE: z.string().optional(),
  LLM_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_TIMEOUT_SECONDS: z.string().optional(),
  LLM_MAX_OUTPUT_TOKENS: z.string().optional(),
  AI_ENABLED: z.string().optional(),
  AI_AUTO_PUBLISH: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid environment variables. See .env.example");
  }
  cached = parsed.data;
  return cached;
}

export function isAIEnabled(): boolean {
  const e = process.env;
  return e.AI_ENABLED === "true" && !!e.LLM_API_KEY && !!e.LLM_BASE_URL;
}
