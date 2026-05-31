import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const preferredPort = Number(process.argv[2] || process.env.PORT || 4174);
const host = "127.0.0.1";
const sassCli = path.join(process.cwd(), "node_modules", "sass", "sass.js");

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(
    `No available port found from ${startPort} to ${startPort + 19}`,
  );
}

const port = await findAvailablePort(preferredPort);

if (port !== preferredPort) {
  console.warn(
    `[dev] Port ${preferredPort} is in use; using http://${host}:${port}/`,
  );
}

const tasks = [
  {
    name: "scss",
    command: process.execPath,
    args: [
      sassCli,
      "--watch",
      "--no-source-map",
      "scss/index.scss:src/skins/base.css",
    ],
  },
  {
    name: "server",
    command: process.execPath,
    args: ["scripts/live-server.mjs", String(port)],
  },
];

const children = new Set();
let stopping = false;

function prefixStream(stream, label, target) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.trim()) target.write(`[${label}] ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer.trim()) target.write(`[${label}] ${buffer}\n`);
  });
}

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (child.killed) continue;

    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
    } else {
      child.kill();
    }
  }

  setTimeout(() => process.exit(code), 100);
}

for (const task of tasks) {
  let child;
  try {
    child = spawn(task.command, task.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (error) {
    console.error(`[dev] Failed to start ${task.name}: ${error.message}`);
    stopAll(1);
    break;
  }

  children.add(child);
  prefixStream(child.stdout, task.name, process.stdout);
  prefixStream(child.stderr, task.name, process.stderr);

  child.on("error", (error) => {
    console.error(`[dev] ${task.name} failed to start: ${error.message}`);
    stopAll(1);
  });

  child.on("exit", (code, signal) => {
    children.delete(child);
    if (!stopping) {
      const status = signal ? `signal ${signal}` : `exit code ${code}`;
      console.error(`[dev] ${task.name} stopped with ${status}`);
      stopAll(code || 1);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

console.log(`[dev] Live server will use http://127.0.0.1:${port}/`);
