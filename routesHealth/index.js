import express from "express";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import { protectHealth } from "../middlewares/protectHealth.js";

const router = express.Router();

// Liveness: process is up. Unauthenticated so load balancers / uptime monitors
// can probe it. Returns no sensitive data.
router.get("/live", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Readiness: app can serve traffic (DB connected). 503 when not ready so
// orchestrators can hold traffic until Mongo is up.
router.get("/ready", (req, res) => {
  const ready = mongoose.connection?.readyState === 1; // 1 = connected
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    db: ready ? "connected" : "disconnected",
  });
});

router.get("/",protectHealth, (req, res) => {
  const endpoints = listEndpoints(req.app);

  const rows = endpoints
    .map((route, index) => {
      const methods = route.methods
        .map(
          (method) =>
            `<span class="method method-${method.toLowerCase()}">${method}</span>`
        )
        .join(" ");

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${methods}</td>
          <td><code>${route.path}</code></td>
          <td>${route.middlewares?.join(", ") || "-"}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Health & Routes</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f7fb;
      color: #1f2937;
    }

    .container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
    }

    .header {
      background: linear-gradient(135deg, #111827, #1f2937);
      color: white;
      padding: 28px;
      border-radius: 18px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0 0 10px;
      font-size: 28px;
    }

    .header p {
      margin: 0;
      opacity: 0.85;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      border: 1px solid #e5e7eb;
    }

    .card .label {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .card .value {
      font-size: 28px;
      font-weight: bold;
      color: #111827;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #16a34a;
      font-weight: bold;
    }

    .dot {
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
    }

    .table-wrapper {
      background: white;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      border: 1px solid #e5e7eb;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #111827;
      color: white;
    }

    th, td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      vertical-align: top;
    }

    tbody tr:hover {
      background: #f9fafb;
    }

    code {
      background: #f3f4f6;
      padding: 5px 8px;
      border-radius: 8px;
      color: #111827;
      font-size: 13px;
    }

    .method {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      color: white;
      font-size: 12px;
      font-weight: bold;
      margin: 2px;
    }

    .method-get {
      background: #2563eb;
    }

    .method-post {
      background: #16a34a;
    }

    .method-put {
      background: #f59e0b;
    }

    .method-patch {
      background: #8b5cf6;
    }

    .method-delete {
      background: #dc2626;
    }

    .method-options {
      background: #64748b;
    }

    .footer {
      text-align: center;
      color: #6b7280;
      margin-top: 24px;
      font-size: 13px;
    }

    @media (max-width: 768px) {
      .container {
        margin: 20px auto;
      }

      .header h1 {
        font-size: 22px;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      table {
        min-width: 800px;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1>API Health & Routes</h1>
      <p>Live overview of all registered Express endpoints.</p>
    </div>

    <div class="stats">
      <div class="card">
        <div class="label">Server Status</div>
        <div class="value status">
          <span class="dot"></span>
          Healthy
        </div>
      </div>

      <div class="card">
        <div class="label">Total Routes</div>
        <div class="value">${endpoints.length}</div>
      </div>

      <div class="card">
        <div class="label">Generated At</div>
        <div class="value" style="font-size: 16px;">
          ${new Date().toLocaleString()}
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Methods</th>
            <th>Path</th>
            <th>Middlewares</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Hala Job Backend Health Page
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

export default router;