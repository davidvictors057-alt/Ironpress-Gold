// Serviço de backup e persistência
// Futuramente: integração com Supabase para backup em nuvem

const BACKUP_KEYS = [
  "ironside_trainings_raw",
  "ironside_trainings_equipped",
  "ironside_health_data",
  "ironside_competitions",
  "ironside_supplements",
  "ironside_hormonal_cycles",
  "ironside_achievements",
  "ironside_athlete_profile",
];

export async function requestPersistentStorage(): Promise<boolean> {
  if ("storage" in navigator && "persist" in navigator.storage) {
    const persisted = await navigator.storage.persisted();
    if (!persisted) {
      return await navigator.storage.persist();
    }
    return true;
  }
  return false;
}

export function exportBackup(): void {
  const backup: Record<string, unknown> = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    app: "IRONPRESS GOLD",
    athlete: "Leonardo Rodrigues - Ironside",
    data: {},
  };

  for (const key of BACKUP_KEYS) {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        (backup.data as Record<string, unknown>)[key] = JSON.parse(val);
      } catch {
        (backup.data as Record<string, unknown>)[key] = val;
      }
    }
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ironside-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        if (!backup.data) throw new Error("Arquivo inválido");
        for (const [key, value] of Object.entries(backup.data)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function seedInitialData(): void {
  const existing = localStorage.getItem("ironside_athlete_profile");
  if (existing) return; // Already seeded

  // Athlete profile
  localStorage.setItem("ironside_athlete_profile", JSON.stringify({
    name: "Leonardo Rodrigues",
    nickname: "Ironside",
    weight: 95,
    category: 100,
    rawMax: 190,
    rawGoal: 210,
    equippedMax: 280,
    equippedGoal: 300,
  }));

  // Competitions
  localStorage.setItem("ironside_competitions", JSON.stringify([
    { id: 1, name: "Arnold Classic Brasil", date: "2025-04-26", modality: "EQUIPADO F8", goal: 280, location: "São Paulo, Brasil", currentEstimate: 275 },
    { id: 2, name: "Olympia Brasil 2026", date: "2026-10-15", modality: "EQUIPADO F8", goal: 300, location: "Rio de Janeiro, Brasil", currentEstimate: 285 },
  ]));

  // Supplements
  localStorage.setItem("ironside_supplements", JSON.stringify([
    { id: 1, name: "Creatina", dose: "5g", unit: "g/dia", schedule: "Pós-treino", stock: 25 },
    { id: 2, name: "Ômega-3", dose: "2g", unit: "g/dia", schedule: "Com almoço", stock: 18 },
    { id: 3, name: "Vitamina D", dose: "2000UI", unit: "UI/dia", schedule: "Manhã", stock: 30 },
  ]));

  // Trainings
  const rawTrainings = [
    { id: 1, date: "26/03/2025", target: 185, actual: 185, rpe: 8, modality: "raw" },
    { id: 2, date: "28/03/2025", target: 187, actual: 186, rpe: 8.5, modality: "raw" },
    { id: 3, date: "30/03/2025", target: 185, actual: 185, rpe: 7.5, modality: "raw" },
    { id: 4, date: "01/04/2025", target: 188, actual: 187, rpe: 8, modality: "raw" },
    { id: 5, date: "02/04/2025", target: 190, actual: 190, rpe: 9, modality: "raw" },
    { id: 6, date: "03/04/2025", target: 185, actual: 183, rpe: 8, modality: "raw" },
    { id: 7, date: "04/04/2025", target: 187, actual: 187, rpe: 8, modality: "raw" },
  ];
  localStorage.setItem("ironside_trainings_raw", JSON.stringify(rawTrainings));

  const equippedTrainings = [
    { id: 1, date: "25/03/2025", target: 270, actual: 270, rpe: 8, modality: "equipped" },
    { id: 2, date: "27/03/2025", target: 275, actual: 274, rpe: 8.5, modality: "equipped" },
    { id: 3, date: "29/03/2025", target: 270, actual: 268, rpe: 8, modality: "equipped" },
    { id: 4, date: "31/03/2025", target: 278, actual: 278, rpe: 9, modality: "equipped" },
    { id: 5, date: "02/04/2025", target: 280, actual: 280, rpe: 9.5, modality: "equipped" },
    { id: 6, date: "03/04/2025", target: 275, actual: 272, rpe: 8, modality: "equipped" },
    { id: 7, date: "04/04/2025", target: 278, actual: 277, rpe: 8.5, modality: "equipped" },
  ];
  localStorage.setItem("ironside_trainings_equipped", JSON.stringify(equippedTrainings));

  // Achievements
  localStorage.setItem("ironside_achievements", JSON.stringify([
    { id: "ach1", label: "Campeão Mundial GPC Brasil", date: "2024-06-15", location: "São Paulo", weight: 280, notes: "Primeiro título mundial na categoria F8 100kg", mediaId: null },
    { id: "ach2", label: "Recordista Brasileiro F8 - 280kg", date: "2025-03-28", location: "São Paulo", weight: 280, notes: "Recorde absoluto brasileiro na categoria equipado F8", mediaId: null },
    { id: "ach3", label: "Múltiplas Medalhas Internacionais", date: "2024-01-01", location: "Internacional", weight: 0, notes: "Diversas medalhas em competições internacionais", mediaId: null },
  ]));
}
