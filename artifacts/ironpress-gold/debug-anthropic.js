const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function debugAnthropic() {
  console.log("--- DIAGNÓSTICO BRUTAL IRONSIDE v3.2 ---");
  
  // 1. Carregar chave do .env manual para evitar falhas de contexto
  const envPath = path.resolve(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_ANTHROPIC_API_KEY=(.+)/);
  const apiKey = match ? match[1].trim() : null;

  if (!apiKey || apiKey.includes("SUA_CHAVE")) {
    console.error("❌ ERRO: Chave Anthropic não encontrada no arquivo .env");
    return;
  }

  console.log(`📡 Testando conexão com Claude Sonnet 3.5 (v2/4.6)...`);
  console.log(`🔑 Chave detectada: ${apiKey.substring(0, 10)}...`);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", { 
      method: "POST", 
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": apiKey, 
        "anthropic-version": "2023-06-01" 
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }]
      })
    });

    const status = response.status;
    const data = await response.json();

    console.log(`\n📊 STATUS HTTP: ${status}`);
    
    if (status === 200) {
      console.log("✅ SUCESSO! O Sonnet 4.6 está operacional.");
      console.log("Resposta:", data.content[0].text);
    } else {
      console.log("❌ FALHA DETECTADA PELA ANTHROPIC:");
      console.log(JSON.stringify(data, null, 2));
      
      if (data.error?.type === "insufficient_funds") {
        console.log("\n⚠️ CONCLUSÃO: Sua conta Anthropic está sem créditos (Saldo $0).");
        console.log("Acesse https://console.anthropic.com/ para adicionar fundos.");
      } else if (status === 401) {
        console.log("\n⚠️ CONCLUSÃO: Sua Chave de API é inválida ou expirou.");
      }
    }
  } catch (e) {
    console.error("\n❌ ERRO DE REDE/CORS:", e.message);
  }
}

debugAnthropic();
