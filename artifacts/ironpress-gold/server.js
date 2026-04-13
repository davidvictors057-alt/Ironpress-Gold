import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
// Ironpress-Gold Deployment Trigger: 2026-04-13
import 'dotenv/config';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- BUNKER DE SEGURANÇA IRONSIDE v5.1 ---

// Middleware de Logs de Operação
app.use((req, res, next) => {
  console.log(`[BUNKER.agente] Incoming: ${req.method} ${req.url}`);
  next();
});

// 1. Proxy Seguro para Anthropic (Sonnet 3.5 / 4.6)
app.post('/api/ai/architect', async (req, res) => {
  const anthropicKey = process.env.VITE_ANTHROPIC_API_KEY;
  
  if (!anthropicKey) {
    return res.status(500).json({ error: "Bunker Error: Chave Anthropic ausente no servidor." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[BUNKER.fail] Erro na ponte Anthropic:", error);
    res.status(500).json({ error: "Erro de comunicação no Bunker Anthropic" });
  }
});

// 2. Proxy Seguro para Gemini (Google 3.1 Pro/Flash)
app.post('/api/ai/executor', async (req, res) => {
  const geminiKey = process.env.VITE_AI_API_KEY;
  const { modelId } = req.query;

  if (!geminiKey) {
    return res.status(500).json({ error: "Bunker Error: Chave Gemini ausente no servidor." });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-1.5-flash-lite-preview'}:generateContent?key=${geminiKey}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[BUNKER.fail] Erro na ponte Gemini:", error);
    res.status(500).json({ error: "Erro de comunicação no Bunker Gemini" });
  }
});

// 3. Servir arquivos estáticos do Vite (App Ironside)
const publicPath = path.join(__dirname, 'dist');
app.use(express.static(publicPath));

// 4. Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`--- IRONSIDE BUNKER ONLINE ---`);
  console.log(`🚀 Porta de Operação: ${PORT}`);
  console.log(`🔒 Blindagem de Chaves: ATIVADA`);
});
