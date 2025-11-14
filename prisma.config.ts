import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Fallback URL für prisma generate (wird nur für Code-Generierung verwendet)
    // Die echte DATABASE_URL wird zur Laufzeit verwendet
    url: env("DATABASE_URL", "postgresql://dummy:dummy@localhost:5432/dummy"),
  },
});
