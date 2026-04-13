import { supabase } from "./supabase";

const LOCAL_STORAGE_KEY = "ironside_profile_offline";

export interface IronsideProfile {
  id?: string;
  name: string;
  weight: string;
  category: string;
  welcome_message: string;
  avatar_url?: string;
  highlights: any[];
  achievements: any[];
  raw_max_bench: number;
  equipped_max_bench: number;
  raw_goal_bench: number;
  equipped_goal_bench: number;
  updated_at?: string;
}

export const persistence = {
  /**
   * Tenta salvar o perfil no Supabase e sempre salva no LocalStorage como backup.
   */
  async saveProfile(profile: IronsideProfile): Promise<{ success: boolean; error?: string }> {
    // 1. Salvar no LocalStorage imediatamente (Cache de Elite)
    const dataToSave = { ...profile, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));

    try {
      // 2. Tentar salvar no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          weight: profile.weight,
          category: profile.category,
          welcome_message: profile.welcome_message,
          avatar_url: profile.avatar_url,
          highlights: profile.highlights,
          achievements: profile.achievements,
          raw_max_bench: profile.raw_max_bench,
          equipped_max_bench: profile.equipped_max_bench,
          raw_goal_bench: profile.raw_goal_bench,
          equipped_goal_bench: profile.equipped_goal_bench
        })
        .eq('id', profile.id);

      if (error) {
        console.warn("Supabase Persistence Error (Falling back to local):", error.message);
        return { success: false, error: error.message };
      }

      // 3. Sucesso na Nuvem: Sincronizar timestamp local para evitar conflitos de "mais recente"
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...dataToSave, updated_at: new Date().toISOString() }));

      return { success: true };
    } catch (err: any) {
      console.warn("Network/Schema error in Supabase:", err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Carrega o perfil do Supabase e mescla com o LocalStorage (priorizando o mais recente).
   */
  async loadProfile(): Promise<IronsideProfile | null> {
    let cloudData: IronsideProfile | null = null;
    let localData: IronsideProfile | null = null;

    // 1. Carregar local
    const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localRaw) {
      try {
        localData = JSON.parse(localRaw);
      } catch (e) {
        console.error("Local Storage Corrupt:", e);
      }
    }

    try {
      // 2. Carregar Cloud
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        cloudData = data as IronsideProfile;
      }
    } catch (e) {
      console.warn("Supabase load failed, using local fallback.");
    }

    // 3. Estratégia de Mesclagem: Ironside Hybrid Sync
    if (!cloudData && !localData) return null;
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    // Se tiver ambos, comparar timestamps
    const cloudTime = new Date(cloudData.updated_at || 0).getTime();
    const localTime = new Date(localData.updated_at || 0).getTime();

    // Mesclar: pegar os dados da nuvem mas preencher lacunas (como avatar_url ou highlights) com o local se o local for mais recente ou a nuvem estiver nula
    const merged = {
      ...cloudData,
      avatar_url: cloudData.avatar_url || localData.avatar_url,
      highlights: (cloudData.highlights && cloudData.highlights.length > 0) ? cloudData.highlights : localData.highlights,
    };

    // Se o local for significativamente mais recente (ex: salvou offline), dar preferência total
    return localTime > cloudTime ? { ...merged, ...localData } : merged;
  }
};
