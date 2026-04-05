// Rule engine heurístico local – futuramente substituído por Gemini API

interface TrainingRecord {
  date: string;
  target: number;
  actual: number;
  rpe: number;
  modality?: "raw" | "equipped";
}

interface HealthData {
  shoulder: number;
  elbow: number;
  wrist: number;
  fatigue: number;
}

interface CompetitionRecord {
  name: string;
  date: string;
  modality: string;
  goal: number;
  currentEstimate?: number;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function loadTrainings(): { raw: TrainingRecord[]; equipped: TrainingRecord[] } {
  try {
    const raw = JSON.parse(localStorage.getItem("ironside_trainings_raw") || "[]");
    const equipped = JSON.parse(localStorage.getItem("ironside_trainings_equipped") || "[]");
    return { raw, equipped };
  } catch {
    return { raw: [], equipped: [] };
  }
}

function loadHealth(): HealthData {
  try {
    return JSON.parse(localStorage.getItem("ironside_health_data") || "{}");
  } catch {
    return { shoulder: 0, elbow: 0, wrist: 0, fatigue: 0 };
  }
}

function loadCompetitions(): CompetitionRecord[] {
  try {
    return JSON.parse(localStorage.getItem("ironside_competitions") || "[]");
  } catch {
    return [];
  }
}

function getAvgPct(trainings: TrainingRecord[], last = 3): number {
  if (trainings.length === 0) return 0;
  const recent = trainings.slice(-last);
  return recent.reduce((acc, t) => acc + (t.actual / t.target) * 100, 0) / recent.length;
}

export function runRuleEngine(query: string): string {
  const q = query.toLowerCase().trim();
  const { raw, equipped } = loadTrainings();
  const health = loadHealth();
  const competitions = loadCompetitions();

  // Nearest upcoming competition
  const upcoming = competitions
    .filter(c => getDaysUntil(c.date) > 0)
    .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))[0];

  const f8Pct = getAvgPct(equipped, 3);
  const rawPct = getAvgPct(raw, 3);
  const daysToComp = upcoming ? getDaysUntil(upcoming.date) : 999;
  const f8Goal = upcoming?.modality?.toLowerCase().includes("equip") ? upcoming.goal : 300;
  const f8Estimate = upcoming?.currentEstimate ?? 280;
  const gapToGoal = f8Goal - f8Estimate;

  // --- REGRAS ---

  // Performance F8 alta
  if (f8Pct > 98) {
    return `🔥 Ironside, seus últimos treinos F8 estão em ${f8Pct.toFixed(1)}% do alvo – consistência de bicampeão! Mantenha o foco na pausa e na técnica. O bicampeonato mundial está ao seu alcance. Não mude o que está funcionando.`;
  }

  // Dor no cotovelo + queda de performance
  if (health.elbow > 4 && (f8Pct < 95 || rawPct < 95)) {
    return `⚠️ Ironside, detecto dor no cotovelo (${health.elbow}/10) combinada com queda de performance. Recomendo reduzir o volume temporariamente e fortalecer os extensores (tríceps, anconeu). Gelo pós-treino e anti-inflamatório tópico. Não comprometa o bicampeonato por falta de recuperação.`;
  }

  // Perto da competição e longe da meta
  if (daysToComp < 28 && gapToGoal > 10) {
    return `🎯 Ironside, faltam ${daysToComp} dias e a meta de ${f8Goal}kg ainda está ${gapToGoal}kg à frente. Priorize AGORA: treinos de força máxima com a camisa F8, técnica de pausa impecável e descanso adequado. Reduza volume, aumente intensidade. O bicampeonato exige pico no dia certo.`;
  }

  // Pergunta sobre abertura
  if (q.includes("abertura") || q.includes("1ª tentativa") || q.includes("primeira tentativa")) {
    return `📊 Ironside, para o ${upcoming?.name ?? "próximo campeonato"}, recomendo abrir com ${Math.round((f8Estimate ?? 280) * 0.93)}kg (~93% da estimativa atual). Segurança na primeira tentativa é essencial para o bicampeonato. Com a adrenalina de competição, seu segundo será mais forte. Vá com confiança!`;
  }

  // Pergunta sobre pausa
  if (q.includes("pausa") || q.includes("pause")) {
    return `⏱ Ironside, a pausa no supino é regra obrigatória GPC (START → barra no peito → PRESS → RACK). Treine sempre com pausa de 1-2 segundos. Em competição, a adrenalina pode fazer você antecipar. Grave seus treinos e use a análise biomecânica para verificar.`;
  }

  // Pergunta sobre protocolo hormonal
  if (q.includes("hormonal") || q.includes("protocolo") || q.includes("ciclo")) {
    return `💊 Para seu ciclo de preparação, lembre-se: registre tudo na seção 'Protocolo Hormonal' da aba Saúde. O cálculo de mg/semana é automático. Consulte sempre seu médico esportivo antes de ajustes. O protocolo deve estar estabilizado pelo menos 8 semanas antes do campeonato.`;
  }

  // Progressão geral
  if (q.includes("progressão") || q.includes("como estou") || q.includes("evolução")) {
    return `📈 Ironside, análise atual: F8 ${f8Pct > 0 ? f8Pct.toFixed(1) + "% de alcance" : "280kg (recorde)"}, RAW ${rawPct > 0 ? rawPct.toFixed(1) + "% de alcance" : "190kg (recorde)"}. ${daysToComp < 999 ? `Faltam ${daysToComp} dias para o ${upcoming?.name}. ` : ""}Continue a progressão e o bicampeonato será seu!`;
  }

  // Fadiga alta
  if (health.fatigue > 6) {
    return `😴 Ironside, sua fadiga está em ${health.fatigue}/10 – sinal de sobrecarga. Priorize recuperação: sono 9h, nutrição em superávit calórico moderado, massagem e frio. Um campeão mundial sabe que o descanso é parte do treino.`;
  }

  // Default contextual
  return `💪 Ironside, com base no seu histórico atual: mantenha a consistência nos treinos F8, priorize a técnica da camisa e o descanso. Você é bicampeão em formação – cada treino é um tijolo na construção do título. Tem algo específico sobre treino, biomecânica ou estratégia de campeonato que posso analisar?`;
}
