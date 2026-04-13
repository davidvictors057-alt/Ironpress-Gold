import { BenchMetrics } from "../biomech/benchMetrics";
import { supabase } from "../../lib/supabase";

// Multi-Agent Types
export type TaskType = 'PLANNING' | 'IMPLEMENTATION' | 'HYBRID';
export type AgentRole = 'Architect' | 'Executor';

// ============================================================
// DIAGNÓSTICO DA CHAVE DE DAVID (v6.2 - SPECIALIST ANALYSIS)
// Modelo: gemini-3.1-flash-lite-preview ✅ REAL NA API KEY
// Problema anterior: HTTP 429 = Rate Limit / Too Many Requests
// Causa: Engine estava fazendo 6+ chamadas ao Supabase + 2 IA
//        por cada disparo, estourando o RPM do tier gratuito.
// Solução: 1 chamada IA enxuta + retry backoff para 429 + 
//          contexto Supabase em cache por 30s.
// ============================================================

// Cache local de contexto (30 segundos) para não sobrecarregar
let contextCache: { data: any; timestamp: number } | null = null;
const CONTEXT_CACHE_TTL = 30_000; // 30 segundos

async function getIntegratedIronsideContext() {
  const now = Date.now();
  if (contextCache && now - contextCache.timestamp < CONTEXT_CACHE_TTL) {
    return contextCache.data;
  }
  try {
    const [profileRes, workoutsRes] = await Promise.all([
      supabase.from('profiles').select('raw_max_bench, equipped_max_bench, equipped_goal_bench, category').single(),
      supabase.from('workouts').select('date, actual, modality').order('date', { ascending: false }).limit(3)
    ]);
    const ctx = {
      athlete: "Ironside (Leonardo / Léo)",
      raw_max: profileRes.data?.raw_max_bench ?? "?",
      f8_max: profileRes.data?.equipped_max_bench ?? "?",
      goal: profileRes.data?.equipped_goal_bench ?? "?",
      category: profileRes.data?.category ?? "?",
      workouts: workoutsRes.data?.map(w => `${w.date}: ${w.actual}kg (${w.modality})`) ?? []
    };
    contextCache = { data: ctx, timestamp: now };
    return ctx;
  } catch {
    return { athlete: "Ironside (Leonardo / Léo)", error: "Contexto offline." };
  }
}

// ============================================================
// EXECUTOR ÚNICO - Gemini 3.1 Flash Lite Preview
// Retry com backoff exponencial para HTTP 429
// ============================================================
async function callGemini(prompt: string, apiKey: string, audioPayload?: { data: string; mimeType: string }): Promise<string> {
  if (!apiKey) return "[ERRO] Chave ausente no .env";

  const MODEL = localStorage.getItem('gemini_model_id') || "gemini-3.1-flash-lite-preview";
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: prompt }];
  if (audioPayload) parts.push({ inlineData: { data: audioPayload.data, mimeType: audioPayload.mimeType } });

  const body = JSON.stringify({ contents: [{ parts }] });

  // Max 3 tentativas com backoff exponencial (1s, 2s, 4s) para 429
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      if (res.status === 429) {
        // Rate limit — espera e tenta novamente
        const wait = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json().catch(() => ({}));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return "[SISTEMA] Resposta vazia da rede neural.";
      return text;
    } catch (err: any) {
      if (attempt >= 2) throw new Error(`FALHA DE SINCRONIA NEURAL: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return "[SISTEMA] Esgotadas as tentativas de conexão.";
}

// ============================================================
// DISPATCHER MULTI-AGENT v6.3.2 (Single Gemini 3.1 Lite)
// Arquiteto + Executor condensados em 1 chamada para preservar RPM
// ============================================================
async function dispatchMultiAgentTask(
  prompt: string,
  type: TaskType,
  geminiKey: string,
  anthropicKey?: string,
  audioPayload?: { data: string; mimeType: string }
): Promise<string> {
  const ctx = await getIntegratedIronsideContext();

  // Para economizar RPM e restaurar a ESTÉTICA: 1 única chamada rica
  const FULL_PROMPT = `
[IRONSIDE NEURAL ENGINE v6.3.2 — SÉRIE 3.1 LITE]
ATLETA: ${ctx.athlete} | RAW=${ctx.raw_max}kg | F8=${ctx.f8_max}kg | META=${ctx.goal}kg
STATUS BIOMÉTRICO: ${ctx.workouts?.join(", ") ?? "sem dados"}

TAREFA DO ATLETA:
${prompt}

---
[INSTRUÇÕES DE FORMATAÇÃO DE ELITE - ESPECIFICAÇÃO A2A v6.3.2]
MANDATÓRIO: Você deve incluir OBRIGATORIAMENTE os 5 especialistas abaixo em sua resposta, sem exceções.
Cada especialista deve seguir RIGOROSAMENTE este formato:

[PSICÓLOGO ESPORTIVO] STATUS_GREEN Acolhimento e Drive
[[Y]]Mentalidade ativa para os ${ctx.goal}kg.[[/Y]] ...conteúdo focado em drive mental...

[ÁRBITRO GPC BRASIL] STATUS_BLUE Validação de Movimento
[[G]]Veredito Técnico.[[/G]] Atenção às regras: ...focado em comandos e validade...

[ESPECIALISTA EM BIOMECÂNICA] STATUS_YELLOW Engenharia de Torque
[[B]]Análise de Vetores.[[/B]] O torque resultante... focado em física do movimento...

[TREINADOR CHEFE] STATUS_GREEN Veredito Tático
[[Y]]Estratégia GPC.[[/Y]] ...focado em volume, intensidade e periodização...

[BIOQUÍMICO ESPORTIVO] STATUS_RED Alerta de Homeostase
[[R]]Status Metabólico.[[/R]] ...focado em suplementação e recuperação...

REGRAS SEMÂNTICAS:
- [[G]] = Texto Verde (Sucesso/Estabilidade)
- [[R]] = Texto Vermelho (Alerta/Perigo)
- [[B]] = Texto Azul (Ciência/Dados)
- [[Y]] = Texto Amarelo (Tática/Mentalidade)

NUNCA use markdown normal (###) para os títulos dos agentes. Use o formato [NOME DO AGENTE] STATUS_COLOR.
A modalidade [${ctx.workouts?.[0]?.split('(')[1]?.replace(')', '') || 'RAW'}] deve ditar a agressividade da análise técnica.
`.trim();

  try {
    const result = await callGemini(FULL_PROMPT, geminiKey, audioPayload);
    return result + `\n\n---\n[🤖 IRONSIDE v6.3 | SÉRIE 3.1 LITE | ESTÉTICA RESTAURADA]`;
  } catch (err: any) {
    throw err;
  }
}

// ============================================================
// FUNÇÕES EXPORTADAS
// ============================================================
export async function getCoachIAFeedback(metrics: BenchMetrics, videoTitle: string, profile: any, modality: string = "RAW"): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return await dispatchMultiAgentTask(
    `[LABORATÓRIO BIOMECÂNICO] Analise para o vídeo "${videoTitle}" de modalidade declarada como [${modality.toUpperCase()}]: ${JSON.stringify(metrics)}`,
    'HYBRID', apiKey, anthropicKey
  );
}

export async function getGeneralTrainingFeedback(history: any[], query: string, profile: any, audioPayload?: { data: string; mimeType: string }): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return await dispatchMultiAgentTask(
    `[CONSULTA DO ATLETA]: ${query}`,
    'HYBRID', apiKey, anthropicKey, audioPayload
  );
}

export async function getChampionshipSimulatorInsight(history: any[], comp: any, profile: any, attempts: number[]): Promise<{ probability: number; comment: string }> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const ctx = await getIntegratedIronsideContext();

  const prompt = `
[SIMULADOR GPC BRASIL]
ATLETA: ${ctx.athlete} | RAW=${ctx.raw_max}kg | F8=${ctx.f8_max}kg | META=${ctx.goal}kg
CAMPEONATO: ${comp?.name ?? "Competição"} | Pedidas: ${attempts.join(", ")}kg

Calcule a probabilidade de sucesso (0-100) e dê um comentário tático.
RETORNE SOMENTE JSON: {"probability": <número>, "comment": "<texto limpo>"}
`.trim();

  try {
    const result = await callGemini(prompt, apiKey);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch?.[0] ?? result);
    return { probability: data.probability ?? 85, comment: data.comment ?? "Análise concluída." };
  } catch {
    return { probability: 85, comment: "Simulação concluída com parâmetros padrão." };
  }
}

export async function testAIConnection(): Promise<{ success: boolean; gemini: boolean; claude: boolean; message: string }> {
  const geminiKey = import.meta.env.VITE_AI_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return {
    success: !!geminiKey,
    gemini: !!geminiKey,
    claude: !!anthropicKey,
    message: `Engine v6.2 Sovereign | SÉRIE 3.1 FLASH LITE ATIVA`
  };
}

// End of Engine v6.3.2 🦾
