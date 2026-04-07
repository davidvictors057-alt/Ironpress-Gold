import { BenchMetrics } from "../biomech/benchMetrics";

export async function getCoachIAFeedback(
  metrics: BenchMetrics, 
  videoTitle: string,
  modality: string = "EQUIPADO F8",
  customApiKey?: string,
  modelId: string = "gemini-1.5-flash-latest"
): Promise<string> {
  const apiKey = customApiKey || import.meta.env.VITE_AI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  if (!apiKey || apiKey === "SUA_CHAVE_AQUI") {
    return "⚠️ Configuração Necessária: Adicione sua VITE_AI_API_KEY no arquivo .env para receber o feedback real do treinador via IA.";
  }

  const prompt = `
    Você é o Treinador Oficial do Ironside, um atleta de Powerlifting de elite, bicampeão mundial. 
    Sua missão é analisar os dados biomecânicos de um treino de Supino e dar um feedback curto, motivador e extremamente técnico.

    DADOS DA EXECUÇÃO:
    - Vídeo: ${videoTitle}
    - Modalidade: ${modality}
    - Ângulo Cotovelo Esquerdo: ${metrics.avgLeftElbow.toFixed(1)}°
    - Ângulo Cotovelo Direito: ${metrics.avgRightElbow.toFixed(1)}°
    - Simetria (Diferença): ${metrics.symmetry.toFixed(1)}°
    - Pausa Detectada: ${metrics.pauseDetected ? "SIM" : "NÃO"}
    - Duração da Pausa: ${(metrics.pauseDurationMs / 1000).toFixed(2)}s
    - Repetições detectadas: ${metrics.repCount}

    REGRAS GPC (Global Powerlifting Committee):
    - Pausa obrigatória com barra imóvel no peito.
    - Cotovelos devem estar em ângulo eficiente para a camisa F8 (se equipado).

    INSTRUÇÕES PARA O FEEDBACK:
    1. Seja direto. Comece com uma saudação como "Ironside," ou "Campeão,".
    2. Comente sobre a simetria (especialmente se for > 8°).
    3. Comente sobre a pausa (essencial para não levar 'red lights').
    4. Se for recorde, comemore.
    5. Termine com uma frase de impacto sobre o bicampeonato mundial.
    6. Máximo de 4-5 linhas. Use emojis moderadamente.
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API Error details:", data.error);
      return `Erro Gemini: ${data.error.message || "Erro desconhecido"}`;
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini Response Empty:", data);
      return "O Gemini não retornou feedback (pode ter sido bloqueado por filtros de segurança ou limite de uso).";
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("AI Coach Fetch Error:", error);
    return "O treinador IA está indisponível (Erro de Conexão).";
  }
}
export async function listAvailableModels(customApiKey?: string): Promise<string[]> {
  const apiKey = customApiKey || import.meta.env.VITE_AI_API_KEY;
  if (!apiKey || apiKey === "SUA_CHAVE_AQUI") return ["⚠️ Chave não configurada"];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.models
      .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => m.name.replace("models/", ""));
  } catch (err: any) {
    console.error("List Models Error:", err);
    return [`Erro: ${err.message}`];
  }
}

export async function getGeneralTrainingFeedback(
  history: any[],
  query: string,
  modality: string = "RAW",
  customApiKey?: string,
  modelId: string = "gemini-1.5-flash-latest"
): Promise<string> {
  const apiKey = customApiKey || import.meta.env.VITE_AI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  if (!apiKey || apiKey === "SUA_CHAVE_AQUI") {
    return "⚠️ Configuração Necessária: Adicione sua API Key para usar o Coach Neural.";
  }

  const prompt = `
    Você é o Coach de Biomecânica Analítica do Ironside, um atleta de elite (Bicampeão Mundial).
    Dados atuais de treino (${modality}):
    ${JSON.stringify(history.slice(0, 10), null, 2)}

    O Ironside perguntou: "${query}"

    REGRAS DE RESPOSTA:
    1. Seja extremamente técnico (fale de RPE, intensidade, progressão linear/ondulada, biomecânica).
    2. Linguagem de "treinador de elite" para um "atleta de elite". Sem rodeios.
    3. Use os dados do histórico para provar seu ponto (mencione datas e cargas).
    4. Mantenha o foco no Bicampeonato Mundial.
    5. Máximo 4 parágrafos curtos.
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (data.error) return `Erro IA: ${data.error.message}`;
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return "O Coach Neural está offline no momento.";
  }
}

export async function getChampionshipSimulatorInsight(
  history: any[],
  compName: string,
  targetWeight: number,
  attempts: number[],
  modality: string = "RAW",
  customApiKey?: string,
  modelId: string = "gemini-1.5-flash-latest"
): Promise<{ probability: number, comment: string }> {
  const apiKey = customApiKey || import.meta.env.VITE_AI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  if (!apiKey || apiKey === "SUA_CHAVE_AQUI") {
    return { probability: 0, comment: "Erro: API Key não configurada." };
  }

  const prompt = `
    Você é o Estrategista de Campeonato do Ironside.
    Campeonato: ${compName}
    Modalidade: ${modality}
    Meta do Bloco: ${targetWeight}kg
    Pedidas simuladas: ${attempts.join("kg, ")}kg

    Histórico Recente de Treino:
    ${JSON.stringify(history.slice(0, 10), null, 2)}

    TAREFA:
    Analise se as pedidas são realistas com base nas cargas levantadas e RPEs relatados.
    Retorne OBRIGATORIAMENTE um JSON estrito no formato:
    { "probability": número_de_0_a_100, "comment": "texto curto e técnico de 2-3 linhas" }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return result;
  } catch (error) {
    console.error("Simulator AI error:", error);
    return { probability: 50, comment: "IA offline. Baseado em cálculos matemáticos simples, suas chances são moderadas." };
  }
}
