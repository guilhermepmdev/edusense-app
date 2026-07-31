/* ==========================================================================
   Matriz Etiológica da Personalidade — lógica da aplicação
   Três formas de acesso:
     1) "google": login com conta Google (Firebase Auth) e chamadas ao Gemini
        via Firebase AI Logic — sem chave no código; requer firebase-config.js.
     2) "chave": o usuário informa a própria chave da API Gemini; chamadas
        vão do navegador direto para a API do Google.
     3) "demo": roteiro fixo de perguntas + processamento local.
   Nenhum dado passa por servidores dos autores do site.
   ========================================================================== */

"use strict";

/* ---------------------- Configuração ---------------------- */

const VERSAO_FIREBASE = "11.4.0"; // Versão v11 estável do CDN do Firebase
const MODELO_IA = "gemini-2.0-flash";

// Fallback no modo chave: sem duplicações
const MODELOS_REST = ["gemini-2.0-flash"];
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const MIN_RESPOSTAS_IA = 6;

const DIMENSOES = [
  { id: "biologica", nome: "Biológica / Genética",
    desc: "Herança genética, temperamento inato, predisposições neuroquímicas e hormonais." },
  { id: "psicologica", nome: "Psicológica",
    desc: "Experiências de infância, vínculos afetivos, traumas, mecanismos de defesa." },
  { id: "cognitiva", nome: "Cognitiva",
    desc: "Desenvolvimento intelectual, estilo de pensamento, memória, percepção do mundo." },
  { id: "social", nome: "Social / Cultural",
    desc: "Família, grupo social, cultura, religião, mídia, valores e crenças coletivas." },
  { id: "historica", nome: "Histórico / Contextual",
    desc: "Eventos de vida (crises, conquistas, perdas), condições socioeconômicas, contexto histórico." },
  { id: "espiritual", nome: "Filosófico-Espiritual",
    desc: "Busca de sentido, crenças existenciais, espiritualidade." }
];

const ROTEIRO_DEMO = [
  ["biologica",   "Vamos começar pela dimensão Biológica. Que características você acredita ter \"de nascença\"? Pense em temperamento, nível de energia, tendência à calma ou à ansiedade."],
  ["psicologica", "Agora a dimensão Psicológica. Que experiências da sua infância ou vínculos afetivos marcaram sua forma de sentir e reagir?"],
  ["cognitiva",   "Sobre a dimensão Cognitiva: como você costuma pensar, aprender e tomar decisões? Você se considera mais analítico(a), intuitivo(a), criativo(a)?"],
  ["social",      "Na dimensão Social/Cultural: como sua família, cultura, religião ou grupos sociais moldaram suas crenças e valores?"],
  ["historica",   "Dimensão Histórico/Contextual: quais eventos de vida (crises, conquistas, perdas, mudanças) mais influenciaram quem você é hoje?"],
  ["espiritual",  "Dimensão Filosófico-Espiritual: o que dá sentido à sua vida? Há crenças existenciais ou espiritualidade que orientam suas escolhas?"],
  ["certezas",    "Agora o Canvas. Certezas: o que você tem plena convicção de que é? Liste traços que não mudam com a situação."],
  ["suposicoes",  "Suposições: que características você acha que tem, mas que aparecem apenas às vezes ou em situações específicas?"],
  ["duvidas",     "Dúvidas: o que os outros dizem que você é, mas você mesmo(a) questiona ou não tem clareza?"],
  ["positivas",   "Influências positivas: quem ou o que ajudou você a se tornar quem é? Pessoas, experiências, contextos."],
  ["negativas",   "Influências negativas: quais vivências geraram bloqueios ou dificultaram seu desenvolvimento?"],
  ["objetivo",    "Para fechar: o que você mais gostaria de desenvolver ou transformar em si nos próximos meses?"]
];

const INSTRUCAO_ENTREVISTA = `Você é um entrevistador empático e profissional conduzindo uma coleta de dados para a "Matriz Etiológica da Personalidade" (etiologia = estudo das causas e origens).
Objetivo: explorar, UMA PERGUNTA POR VEZ, as origens da personalidade da pessoa nestas áreas:
1) Biológica/Genética (temperamento inato); 2) Psicológica (infância, vínculos, marcos emocionais); 3) Cognitiva (forma de pensar/aprender/decidir); 4) Social/Cultural (família, cultura, religião, grupos); 5) Histórico/Contextual (eventos de vida marcantes); 6) Filosófico-Espiritual (sentido, propósito).
Depois, colete: Certezas (o que a pessoa tem convicção de ser), Suposições (traços situacionais), Dúvidas (o que os outros dizem e ela questiona), Influências positivas e negativas, e um objetivo de desenvolvimento.
Regras: escreva em português do Brasil; seja acolhedor e breve (2 a 4 frases por vez); faça UMA pergunta por mensagem; aprofunde quando a resposta for vaga; não dê diagnósticos; após cobrir todos os temas (cerca de 12 perguntas), agradeça e diga que a pessoa pode clicar em "Concluir coleta e gerar matriz".`;

const INSTRUCAO_ANALISE = `Você é um analista que preenche a "Matriz Etiológica da Personalidade" a partir de uma entrevista.
Responda SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, exatamente nesta estrutura:
{
 "dimensoes": {
  "biologica":  {"fatores": "...", "impacto": "..."},
  "psicologica":{"fatores": "...", "impacto": "..."},
  "cognitiva":  {"fatores": "...", "impacto": "..."},
  "social":     {"fatores": "...", "impacto": "..."},
  "historica":  {"fatores": "...", "impacto": "..."},
  "espiritual": {"fatores": "...", "impacto": "..."}
 },
 "certezas": ["..."],
 "suposicoes": ["..."],
 "duvidas": ["..."],
 "influencias_positivas": ["..."],
 "influencias_negativas": ["..."],
 "plano": {
   "premissa": "parágrafo-síntese que conecta as causas identificadas ao potencial de desenvolvimento",
   "pontos_fortes": ["..."],
   "pontos_a_desenvolver": ["..."],
   "acoes": [{"acao": "...", "prazo": "...", "indicador": "..."}]
 }
}
Baseie-se apenas no que a pessoa disse; onde faltar informação, escreva "Não explorado na entrevista". Use linguagem acolhedora, em português do Brasil. Inclua de 3 a 5 ações concretas. Não faça diagnósticos clínicos.`;

/* ---------------------- Estado ---------------------- */

const estado = {
  modo: null,            // "google" | "chave" | "demo"
  chave: null,
  modeloRest: MODELOS_REST[0],
  firebase: null,        // { app, ai, getGenerativeModel }
  usuario: null,         // dados do login Google
  transcricao: [],
  respostasDemo: {},
  indiceDemo: 0,
  respostasUsuario: 0,
  resultado: null,
  processandoIA: false     // Trava de concorrência para evitar chamadas duplicadas (Erro 429)
};

/* ---------------------- Utilidades de interface ---------------------- */

const $ = (sel) => document.querySelector(sel);

function irParaEtapa(nome) {
  document.querySelectorAll(".etapa").forEach(e => e.classList.remove("visivel"));
  $("#etapa-" + nome).classList.add("visivel");
  const mapa = { acesso: "inicio" }; // tela de acesso pertence ao passo "Início"
  const efetiva = mapa[nome] || nome;
  const ordem = ["inicio", "coleta", "matriz", "plano"];
  document.querySelectorAll(".passo").forEach(p => {
    const alvo = p.dataset.etapa;
    p.classList.toggle("ativo", alvo === efetiva);
    p.classList.toggle("feito", ordem.indexOf(alvo) < ordem.indexOf(efetiva));
    if (alvo === efetiva) p.disabled = false;
  });
  window.scrollTo({ top: 0 });
}

function adicionarBalao(papel, texto) {
  const chat = $("#chat");
  const div = document.createElement("div");
  div.className = "balao " + (papel === "usuario" ? "balao-usuario" : "balao-ia");
  div.textContent = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  estado.transcricao.push({ papel, texto });
}

function mostrarDigitando(mostrar) {
  let d = $("#digitando");
  if (mostrar && !d) {
    d = document.createElement("div");
    d.id = "digitando";
    d.className = "balao balao-ia balao-digitando";
    d.textContent = "escrevendo…";
    $("#chat").appendChild(d);
    $("#chat").scrollTop = $("#chat").scrollHeight;
  } else if (!mostrar && d) d.remove();
}

function atualizarProgresso() {
  const total = estado.modo === "demo" ? ROTEIRO_DEMO.length : 12;
  const pct = Math.min(100, Math.round((estado.respostasUsuario / total) * 100));
  $("#progresso-texto").textContent = pct + "%";
  const circ = 2 * Math.PI * 19;
  $("#anel-frente").style.strokeDashoffset = circ * (1 - pct / 100);
  const pronto = estado.modo === "demo"
    ? estado.indiceDemo >= ROTEIRO_DEMO.length
    : estado.respostasUsuario >= MIN_RESPOSTAS_IA;
  $("#btn-concluir").disabled = !pronto;
}

function overlay(mostrar, texto) {
  const o = $("#overlay");
  o.hidden = !mostrar;
  if (texto) $("#overlay-texto").textContent = texto;
}

/* ---------------------- Acesso: login com Google (Firebase) ---------------------- */

function firebaseConfigurado() {
  return typeof FIREBASE_CONFIG !== "undefined" &&
         FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId;
}

async function entrarComGoogle() {
  if (!firebaseConfigurado()) {
    $("#aviso-firebase").textContent =
      "O login com Google ainda não foi configurado neste site (arquivo firebase-config.js vazio). Use uma das outras opções abaixo.";
    return;
  }
  overlay(true, "Abrindo login do Google…");
  try {
    const base = "https://www.gstatic.com/firebasejs/" + VERSAO_FIREBASE + "/";
    const [{ initializeApp }, auth, vertexai] = await Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-auth.js"),
      import(base + "firebase-vertexai.js")
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    const resultado = await auth.signInWithPopup(auth.getAuth(app), new auth.GoogleAuthProvider());
    estado.usuario = { nome: resultado.user.displayName, email: resultado.user.email };
    estado.firebase = {
      app,
      ai: vertexai.getVertexAI(app),
      getGenerativeModel: vertexai.getGenerativeModel
    };
    estado.modo = "google";
    overlay(false);
    $("#coleta-modo-info").textContent =
      "Conectado como " + (estado.usuario.nome || estado.usuario.email) + " · entrevista conduzida por IA (Gemini).";
    iniciarEntrevistaIA();
  } catch (e) {
    overlay(false);
    const msg = String(e && e.message || e);
    if (msg.includes("popup-closed")) return;
    $("#aviso-firebase").textContent = "Não foi possível entrar: " + msg;
  }
}

/* ---------------------- Chamadas ao Gemini ---------------------- */

// Uma única porta de entrada: recebe o histórico e a instrução de sistema,
// devolve o texto — independentemente do modo de acesso.
async function gerarConteudo(contents, systemInstruction) {
  const chaveEmUso = estado.chave || localStorage.getItem("matriz_chave_gemini");
 
  if (!chaveEmUso) {
    throw new Error("Chave da API Gemini não encontrada. Configure uma chave do Google AI Studio.");
  }

  let ultimoErro = null;
  for (const m of [estado.modeloRest, ...MODELOS_REST.filter(x => x !== estado.modeloRest)]) {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        const resp = await fetch(API_BASE + m + ":generateContent?key=" + encodeURIComponent(chaveEmUso), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        });

        if (!resp.ok) {
          const errText = await resp.text();
          // Se for 429 (Too Many Requests), aguarda 4s e tenta novamente na primeira tentativa
          if (resp.status === 429 && tentativa === 1) {
            await new Promise(res => setTimeout(res, 4000));
            continue;
          }
          throw new Error("HTTP " + resp.status + ": " + errText.slice(0, 300));
        }

        const dados = await resp.json();
        const texto = dados?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
        if (!texto) throw new Error("Resposta vazia do modelo.");
        estado.modeloRest = m;
        return texto.trim();
      } catch (e) {
        ultimoErro = e;
        // 503 ou 429 temporário: espera 3s e tenta de novo
        if ((String(e.message).includes("503") || String(e.message).includes("429")) && tentativa === 1) {
          await new Promise(res => setTimeout(res, 3000));
          continue;
        }
        break; // outros erros: passa para o próximo modelo
      }
    }
  }
  throw ultimoErro;
}

/* ---------------------- Fluxo: entrevista com IA (google ou chave) ---------------------- */

async function iniciarEntrevistaIA() {
  if (estado.processandoIA) return;
  estado.processandoIA = true;

  irParaEtapa("coleta");
  mostrarDigitando(true);
  try {
    const abertura = await gerarConteudo(
      [{ role: "user", parts: [{ text: "Inicie a entrevista se apresentando brevemente e fazendo a primeira pergunta." }] }],
      INSTRUCAO_ENTREVISTA
    );
    mostrarDigitando(false);
    adicionarBalao("ia", abertura);
  } catch (e) {
    mostrarDigitando(false);
    adicionarBalao("ia", "Não consegui conectar ao serviço de IA. Verifique a conexão ou aguarde 1 minuto devido ao limite de requisições (429).\n\nDetalhe técnico: " + e.message);
  } finally {
    estado.processandoIA = false;
  }
}

function iniciarModoChave() {
  const chave = $("#chave-api").value.trim();
  if (!chave) { alert("Cole sua chave da API Gemini ou escolha outra forma de acesso."); return; }
  estado.modo = "chave";
  estado.chave = chave;
  try { localStorage.setItem("matriz_chave_gemini", chave); } catch (_) {}
  $("#coleta-modo-info").textContent = "Acesso com chave própria · entrevista conduzida por IA (Gemini).";
  iniciarEntrevistaIA();
}

async function responderIA(textoUsuario) {
  if (estado.processandoIA) return;
  estado.processandoIA = true;

  const campo = $("#campo-resposta");
  if (campo) campo.disabled = true;

  adicionarBalao("usuario", textoUsuario);
  estado.respostasUsuario++;
  atualizarProgresso();
  mostrarDigitando(true);
  try {
    const resposta = await gerarConteudo(transcricaoParaContents(), INSTRUCAO_ENTREVISTA);
    mostrarDigitando(false);
    adicionarBalao("ia", resposta);
  } catch (e) {
    mostrarDigitando(false);
    adicionarBalao("ia", "Houve uma falha de conexão ou limite excedido (429). Aguarde um instante e tente enviar novamente. (" + e.message + ")");
  } finally {
    estado.processandoIA = false;
    if (campo) {
      campo.disabled = false;
      campo.focus();
    }
  }
}

async function processarIA() {
  if (estado.processandoIA) return;
  estado.processandoIA = true;

  overlay(true, "A IA está organizando suas respostas na matriz…");
  const contents = [
    ...transcricaoParaContents(),
    { role: "user", parts: [{ text: "A entrevista terminou. Gere agora o JSON da matriz conforme as instruções." }] }
  ];
  try {
    let texto = await gerarConteudo(contents, INSTRUCAO_ANALISE);
    estado.resultado = extrairJSON(texto);
    if (!estado.resultado) {
      texto = await gerarConteudo(
        [...contents, { role: "model", parts: [{ text: texto }] },
         { role: "user", parts: [{ text: "Sua resposta anterior não era JSON puro. Responda novamente SOMENTE com o objeto JSON." }] }],
        INSTRUCAO_ANALISE
      );
      estado.resultado = extrairJSON(texto);
    }
    if (!estado.resultado) throw new Error("O modelo não retornou um JSON válido.");
    overlay(false);
    renderizarMatriz();
    renderizarPlano();
    irParaEtapa("matriz");
  } catch (e) {
    overlay(false);
    alert("Não foi possível processar com a IA: " + e.message + "\nVocê pode tentar novamente clicando em Concluir.");
  } finally {
    estado.processandoIA = false;
  }
}

function extrairJSON(texto) {
  const limpo = texto.replace(/```json|```/g, "").trim();
  
  try {
    return JSON.parse(limpo);
  } catch (e) {
    return null; 
  }
}
