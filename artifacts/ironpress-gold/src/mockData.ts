export const athlete = {
  name: "Leonardo Rodrigues",
  nickname: "Ironside",
  weight: 95,
  category: 100,
  rawMax: 190,
  rawGoal: 210,
  equippedMax: 280,
  equippedGoal: 300,
  achievements: [
    { label: "Campeão Mundial GPC Brasil", icon: "trophy" },
    { label: "Recordista Brasileiro F8 - 280kg", icon: "crown" },
    { label: "Múltiplas Medalhas Internacionais", icon: "medal" },
  ],
};

export const competitions = [
  {
    id: 1,
    name: "Arnold Classic Brasil",
    date: "2025-04-26",
    modality: "RAW",
    goal: 210,
    location: "São Paulo, Brasil",
    status: "upcoming",
    currentEstimate: 205,
  },
  {
    id: 2,
    name: "Olympia Brasil 2026",
    date: "2026-10-15",
    modality: "EQUIPADO F8",
    goal: 300,
    location: "Rio de Janeiro, Brasil",
    status: "upcoming",
    currentEstimate: 285,
  },
];

export const rawTrainings = [
  { date: "26/03/2025", target: 185, actual: 185, rpe: 8 },
  { date: "28/03/2025", target: 187, actual: 186, rpe: 8.5 },
  { date: "30/03/2025", target: 185, actual: 185, rpe: 7.5 },
  { date: "01/04/2025", target: 188, actual: 187, rpe: 8 },
  { date: "02/04/2025", target: 190, actual: 190, rpe: 9 },
  { date: "03/04/2025", target: 185, actual: 183, rpe: 8 },
  { date: "04/04/2025", target: 187, actual: 187, rpe: 8 },
];

export const equippedTrainings = [
  { date: "25/03/2025", target: 270, actual: 270, rpe: 8 },
  { date: "27/03/2025", target: 275, actual: 274, rpe: 8.5 },
  { date: "29/03/2025", target: 270, actual: 268, rpe: 8 },
  { date: "31/03/2025", target: 278, actual: 278, rpe: 9 },
  { date: "02/04/2025", target: 280, actual: 280, rpe: 9.5 },
  { date: "03/04/2025", target: 275, actual: 272, rpe: 8 },
  { date: "04/04/2025", target: 278, actual: 277, rpe: 8.5 },
];

export const evolutionData = [
  { week: "Sem 1", raw: 180, equipped: 265 },
  { week: "Sem 2", raw: 182, equipped: 268 },
  { week: "Sem 3", raw: 183, equipped: 270 },
  { week: "Sem 4", raw: 185, equipped: 272 },
  { week: "Sem 5", raw: 186, equipped: 274 },
  { week: "Sem 6", raw: 187, equipped: 276 },
  { week: "Sem 7", raw: 188, equipped: 278 },
  { week: "Sem 8", raw: 190, equipped: 280 },
];

export const arnoldProgressData = [
  { week: "Sem 1", real: 183, meta: 210 },
  { week: "Sem 2", real: 185, meta: 210 },
  { week: "Sem 3", real: 186, meta: 210 },
  { week: "Sem 4", real: 187, meta: 210 },
  { week: "Sem 5", real: 188, meta: 210 },
  { week: "Sem 6", real: 190, meta: 210 },
  { week: "Sem 7", real: 202, meta: 210 },
  { week: "Sem 8", real: 205, meta: 210 },
];

export const olympiaProgressData = [
  { week: "Sem 1", real: 270, meta: 300 },
  { week: "Sem 2", real: 272, meta: 300 },
  { week: "Sem 3", real: 274, meta: 300 },
  { week: "Sem 4", real: 276, meta: 300 },
  { week: "Sem 5", real: 278, meta: 300 },
  { week: "Sem 6", real: 280, meta: 300 },
  { week: "Sem 7", real: 282, meta: 300 },
  { week: "Sem 8", real: 285, meta: 300 },
];

export const videos = [
  {
    id: 1,
    title: "Supino RAW - 190kg (recorde)",
    date: "01/04/2025",
    modality: "RAW",
    isRecord: true,
    thumbnail: null,
  },
  {
    id: 2,
    title: "Supino Equipado F8 - 280kg (recorde brasileiro)",
    date: "28/03/2025",
    modality: "EQUIPADO F8",
    isRecord: true,
    thumbnail: null,
  },
  {
    id: 3,
    title: "Treino Técnico - Pegada e Setup",
    date: "25/03/2025",
    modality: "RAW",
    isRecord: false,
    thumbnail: null,
  },
  {
    id: 4,
    title: "Preparação F8 - 275kg",
    date: "20/03/2025",
    modality: "EQUIPADO F8",
    isRecord: false,
    thumbnail: null,
  },
];

export const medications = [
  { id: 1, name: "Creatina", dose: "5g/dia", stock: 25, unit: "dias" },
  { id: 2, name: "Ômega-3", dose: "2g/dia", stock: 18, unit: "dias" },
  { id: 3, name: "Vitamina D", dose: "2000UI/dia", stock: 30, unit: "dias" },
];

export const healthCorrelation = [
  { session: "S1", pain: 2, performance: 99 },
  { session: "S2", pain: 3, performance: 97 },
  { session: "S3", pain: 5, performance: 88 },
  { session: "S4", pain: 1, performance: 100 },
  { session: "S5", pain: 4, performance: 93 },
  { session: "S6", pain: 2, performance: 98 },
  { session: "S7", pain: 6, performance: 84 },
];

export const coachLog = [
  {
    id: 1,
    date: "15/03/2025",
    coach: "Treinador João",
    action: "Acessou e comentou vídeo",
  },
  {
    id: 2,
    date: "20/03/2025",
    coach: "Treinador João",
    action: "Atualizou plano de treino",
  },
  {
    id: 3,
    date: "28/03/2025",
    coach: "Treinador João",
    action: "Analisou supino equipado 280kg",
  },
];

export const aiChatResponses: Record<string, string> = {
  "devo arriscar 210kg":
    "Seu recorde é 210kg em treino, mas em competição a adrenalina ajuda. Vá com confiança, Ironside! 💪",
  "qual abertura recomendada":
    "Com base no seu histórico, uma abertura de 195kg tem 98% de acerto. Seguro e estratégico.",
  "como está minha progressão":
    "Sua progressão está excelente! Você está 97% do caminho para os 210kg no Arnold. Continue assim!",
  default:
    "Análise em desenvolvimento. Em breve teremos insights personalizados baseados no seu histórico completo, Ironside!",
};
