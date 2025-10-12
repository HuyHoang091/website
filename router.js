import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer } from "http";

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://localhost:8080";

// --- Proxy API requests ---
app.use("/api", createProxyMiddleware({
  target: BACKEND_URL + "/api",
  changeOrigin: true,
}));

app.use("/images", createProxyMiddleware({
  target: BACKEND_URL + "/images",
  changeOrigin: true,
}));

// --- Proxy frontend ---
app.use("/", createProxyMiddleware({
  target: FRONTEND_URL,
  changeOrigin: true,
}));

// --- WS proxy ---
const wsProxy = createProxyMiddleware({
  target: BACKEND_URL,
  ws: true,
  changeOrigin: true,
  logLevel: "debug",
});

// --- Create server và handle WS upgrade ---
const server = createServer(app);

server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/ws")) {
    wsProxy.upgrade(req, socket, head);
  }
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔹 API -> ${BACKEND_URL}`);
  console.log(`🔹 Frontend -> ${FRONTEND_URL}`);
});
