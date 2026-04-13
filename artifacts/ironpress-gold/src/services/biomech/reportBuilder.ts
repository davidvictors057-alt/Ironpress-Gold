import type { BenchMetrics } from "./benchMetrics";

export interface BiomechReport {
  score: number;
  flags: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
  metrics: BenchMetrics;
}

export function buildReport(metrics: BenchMetrics, framesAnalyzed: number): BiomechReport {
  const flags: string[] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const { avgLeftElbow, avgRightElbow, symmetry, pauseDetected, pauseDurationMs, repCount } = metrics;

  // Symmetry check
  if (symmetry > 12) {
    flags.push(`Assimetria crítica: ${symmetry.toFixed(1)}° entre cotovelos`);
    suggestions.push("Corrija a posição das mãos – verifique alinhamento com pegada equiparada.");
    score -= 15;
  } else if (symmetry > 8) {
    flags.push(`Assimetria moderada: ${symmetry.toFixed(1)}° entre cotovelos`);
    suggestions.push("Atenção ao posicionamento dos cotovelos – pequeno desvio detectado.");
    score -= 5;
  } else {
    strengths.push(`Excelente simetria bilateral: ${symmetry.toFixed(1)}°`);
  }

  // Elbow angle at bottom (GPC standard: ~75-90° for equipped)
  const avgElbow = (avgLeftElbow + avgRightElbow) / 2;
  if (avgElbow < 65) {
    flags.push(`Cotovelos muito fechados: ${avgElbow.toFixed(0)}° médio`);
    suggestions.push("Abra um pouco mais os cotovelos para melhor recrutamento peitoral.");
    score -= 5;
  } else if (avgElbow > 100) {
    flags.push(`Cotovelos muito abertos: ${avgElbow.toFixed(0)}°`);
    suggestions.push("Cotovelos excessivamente abertos aumentam risco no ombro. Ajuste o arco.");
    score -= 5;
  } else {
    strengths.push(`Ângulo de cotovelo adequado: ${avgElbow.toFixed(0)}°`);
  }

  // Pause check (GPC rule: obrigatório pausa no peito)
  if (!pauseDetected) {
    flags.push("Pausa no peito não detectada (regra GPC)");
    suggestions.push("Regra GPC exige pausa imóvel no peito. Treine com pausa controlada.");
    score -= 15;
  } else if (pauseDurationMs < 800) {
    flags.push(`Pausa curta: ${(pauseDurationMs / 1000).toFixed(2)}s (ideal >1s)`);
    suggestions.push("Aumente a duração da pausa. O árbitro precisa ver imobilidade clara.");
    score -= 5;
  } else {
    strengths.push(`Pausa boa: ${(pauseDurationMs / 1000).toFixed(2)}s detectada`);
  }

  // Rep count
  if (repCount > 0) {
    strengths.push(`${repCount} repetição(ões) detectada(s) na análise`);
  }

  // Frame quality
  if (framesAnalyzed < 10) {
    flags.push("Poucos frames capturados – posicione câmera lateral para melhor precisão");
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  const summary = score >= 85
    ? `🏆 Excelente execução, Ironside! Score ${score}/100. ${strengths[0] || "Continue assim."}${suggestions.length > 0 ? " " + suggestions[0] : ""}`
    : score >= 65
    ? `✅ Boa execução com pontos de atenção. Score ${score}/100. Foco em: ${flags[0] || "técnica geral"}.`
    : `⚠️ Execução requer correções. Score ${score}/100. Prioridade: ${flags[0] || "revisar técnica com treinador"}.`;

  return { score, flags, strengths, suggestions, summary, metrics };
}
