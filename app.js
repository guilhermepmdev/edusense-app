// ---------------------- Chamadas à API (Atualizado para DeepSeek) ----------------------

async function gerarConteudo(contents, systemInstruction) {
  // Agora não checamos mais o modo "google", apenas usamos a chave que o usuário colou
  const chaveEmUso = localStorage.getItem("matriz_chave_gemini");
  
  if (!chaveEmUso) {
    throw new Error("Chave da API não encontrada. Por favor, cole sua chave do DeepSeek.");
  }

  let mensagensFormatadas = [];
  if (systemInstruction) {
    mensagensFormatadas.push({ role: "system", content: systemInstruction });
  }

  for (const c of contents) {
    let papel = c.role === "model" ? "assistant" : "user";
    let textoMsg = c.parts?.map(p => p.text || "").join("") || "";
    mensagensFormatadas.push({ role: papel, content: textoMsg });
  }

  try {
    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chaveEmUso}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: mensagensFormatadas,
        temperature: 0.7,
        stream: false
      })
    });

    if (!resp.ok) {
      throw new Error("Erro na API: " + resp.status);
    }

    const dados = await resp.json();
    return dados.choices[0].message.content.trim();

  } catch (e) {
    throw new Error("Erro ao conectar no DeepSeek: " + e.message);
  }
}

  // 2. Se estiver usando Chave Própria, agora usamos o DeepSeek[cite: 4]
  const chaveEmUso = estado.chave || localStorage.getItem("matriz_chave_gemini");
  
  if (!chaveEmUso) {
    throw new Error("Chave da API não encontrada. Configure sua chave do DeepSeek.");
  }

  // Transforma o formato de contents do Gemini para o formato messages do DeepSeek[cite: 4]
  let mensagensFormatadas = [];
  if (systemInstruction) {
    mensagensFormatadas.push({ role: "system", content: systemInstruction });
  }

  for (const c of contents) {
    let papel = c.role === "model" ? "assistant" : "user";
    let textoMsg = c.parts?.map(p => p.text || "").join("") || "";
    mensagensFormatadas.push({ role: papel, content: textoMsg });
  }

  try {
    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chaveEmUso}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Modelo padrão do DeepSeek para conversas e código[cite: 4]
        messages: mensagensFormatadas,
        temperature: 0.7,
        stream: false
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error("HTTP " + resp.status + ": " + errText.slice(0, 300));
    }

    const dados = await resp.json();
    const texto = dados?.choices?.[0]?.message?.content || "";
    if (!texto) throw new Error("Resposta vazia do modelo.");
    return texto.trim();

  } catch (e) {
    throw new Error("Erro na requisição: " + e.message);
  }
}
