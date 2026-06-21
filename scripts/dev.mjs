import { execSync, spawn } from "node:child_process";

const PORT = 3000;

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const pids = new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid) && pid !== "0"),
    );

    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // Process may have already exited
      }
    }
  } catch {
    // No process listening on the port
  }
}

killPort(PORT);
console.log(`Starting Next.js dev server on http://localhost:${PORT}`);
console.log("Tip: run npm run clean first if you need a fresh cache.");

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

child.on("exit", (code) => process.exit(code ?? 0));
