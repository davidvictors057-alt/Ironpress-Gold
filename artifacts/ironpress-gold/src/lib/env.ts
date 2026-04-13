/**
 * utilitário de elite para carregar variáveis de ambiente
 *prioriza window.ENV (injetado pelo Bunker) com fallback para import.meta.env (build-time)
 */
export const getEnv = (key: string): string => {
  const env = (window as any).ENV || {};
  return env[key] || import.meta.env[key] || '';
};
