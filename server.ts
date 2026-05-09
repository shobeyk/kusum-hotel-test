import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Wait, if the frontend calls this backend, how do we verify Supabase auth?
  // We can just verify if a request bears the right token, or just rely on RLS on the frontend.
  // Actually, wait, the instructions ask:
  // "Store credentials securely using Supabase environment variables or backend functions."
  // If we just serve API routes, we can store our Razorpay Keys in our backend memory 
  // or inside Supabase and retrieve them securely.
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example API to get razorpay settings securely (if needed by backend to process payments)
  // For the admin dashboard, they can just update it here and we save it securely in DB.

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      // Don't forward /api to index.html
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
