import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { handleMCPPaymentRequest } from "./api/mcp-payment-handler";

// Load environment variables
configDotenv();

const app = express();
const PORT = process.env.PAYMENT_SERVER_PORT || 3002;

// CORS Configuration
const corsOptions = {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  
  // Middleware
  app.use(cors(corsOptions as any));
  app.use(express.json());
  
  // Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "x402-payment-server" });
});

async function tryHandleCawMcp(req: express.Request, res: express.Response): Promise<boolean> {
  const body = req.body || {};
  const method = body.method;
  const id = body.id ?? null;

  if (method !== "tools/call") {
    return false;
  }

  const toolName = body.params?.name;
  const args = body.params?.arguments || {};

  if (toolName !== "make_payment" && toolName !== "get_balance") {
    return false;
  }

  const { cawService } = await import("./services/cobo-caw.js");

  if (toolName === "get_balance") {
    const balance = await cawService.getBalance();
    res.status(200).json({
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify({ success: true, balance, currency: "SETH" }, null, 2) }],
      },
    });
    return true;
  }

  const recipientAddress = args.recipientAddress;
  const amount = args.amount;
  if (!recipientAddress || !amount) {
    res.status(200).json({
      jsonrpc: "2.0",
      id,
      result: {
        content: [{
          type: "text",
          text: JSON.stringify({ success: false, error: "Missing required parameter: recipientAddress or amount" }, null, 2),
        }],
      },
    });
    return true;
  }

  try {
    const result = await cawService.transferTokens(
      recipientAddress,
      amount,
      "SETH",
      "SETH",
      `payment-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    res.status(200).json({
      jsonrpc: "2.0",
      id,
      result: {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, transaction_hash: result.transaction_hash, status: "submitted" }, null, 2),
        }],
      },
    });
    return true;
  } catch (error: any) {
    if (error?.status === 403) {
      res.status(200).json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              status: "BLOCKED",
              reason: error.details?.reason || error.message,
              policy: "Buyer Policy",
            }, null, 2),
          }],
        },
      });
      return true;
    }

    throw error;
  }
}

// MCP Payment Server
app.post("/mcp", async (req, res) => {
  if (process.env.WALLET_MODE === "caw") {
    const handled = await tryHandleCawMcp(req, res);
    if (handled) {
      return;
    }
  }
  return handleMCPPaymentRequest(req, res);
});
  
  // Start server
  app.listen(PORT, () => {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🚀 x402 Payment Server running on port ${PORT}`);
    console.log(`📍 Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - MCP: http://localhost:${PORT}/mcp`);
    console.log(`${"=".repeat(80)}\n`);
  });
