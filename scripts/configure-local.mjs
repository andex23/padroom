import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
if (existsSync(".env.local")) {
  console.log(".env.local already exists; preserving it.");
  process.exit(0);
}
const output = execFileSync(".tools/supabase", ["status", "-o", "env"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const config = Object.fromEntries(
  output
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);
if (!config.API_URL || !config.ANON_KEY)
  throw new Error("Local Supabase URL or anonymous key not reported.");
writeFileSync(
  ".env.local",
  `NEXT_PUBLIC_SUPABASE_URL=${config.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${config.ANON_KEY}\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Created ignored .env.local from local Supabase. No credential values printed.",
);
