/* ==========================================================================
   Matriz Etiológica da Personalidade — lógica da aplicação
   Três formas de acesso:
     1) "google": login com conta Google (Firebase Auth) e chamadas ao Gemini
        via Firebase AI Logic (SDK "firebase/ai", backend Gemini Developer API)
     2) "chave": o usuário informa a própria chave da API Gemini e o app
        chama a Generative Language API (generativelanguage.googleapis.com)
        diretamente do navegador.
     3) "demo": roteiro fixo de perguntas + processamento local.
   ========================================================================== */

"use strict";

/* ---------------------- Configuração ---------------------- */

const VERSAO_FIREBASE = "12.17.1";
// Usamos o alias "gemini-flash-latest" (em vez de uma versão fixa como
// "gemini-2.5-flash") porque a Google tem aposentado versões específicas do
// Gemini com poucos meses de vida — o alias é redirecionado automaticamente
// pela Google para o Flash estável mais recente, evitando que o site quebre
// de novo quando isso acontecer.
const MODELO_GEMINI = "gemini-flash-latest";
const API_GEMINI_GENERATE =
  "https://generativelanguage.googleapis.com/v1beta/models/" + MODELO_GEMINI + ":generateContent";
const CHAVE_LOCALSTORAGE = "matriz_chave_gemini";
// Chave de site do reCAPTCHA v3, usada pelo Firebase App Check para provar que
// as chamadas ao Gemini vêm do seu site de verdade. Sem isso, o Firebase AI
// Logic rejeita as chamadas com "This AI Logic Project is inactive" — a
// aplicação do App Check é hoje obrigatória para liberar o projeto, mesmo
// que o painel do console mostre "somente monitoramento".
// Obtenha essa chave em: Firebase Console → App Check → aba "Apps" → seu app
// Web → "Registrar" com o provedor reCAPTCHA v3.
const APP_CHECK_SITE_KEY = "COLE_AQUI_SUA_CHAVE_DE_SITE_DO_RECAPTCHA_V3";
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
  modo: null,
  chave: null,
  firebase: null,
  usuario: null,
  transcricao: [],
  respostasDemo: {},
  indiceDemo: 0,
  respostasUsuario: 0,
  resultado: null
};

/* ---------------------- Utilidades ---------------------- */

const $ = (sel) => document.querySelector(sel);

function irParaEtapa(nome) {
  document.querySelectorAll(".etapa").forEach(e => e.classList.remove("visivel"));
  $("#etapa-" + nome).classList.add("visivel");
  const mapa = { acesso: "inicio" };
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

function firebaseConfigurado() {
  return typeof FIREBASE_CONFIG !== "undefined" &&
         FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId;
}

/* ---------------------- Login Google (mantido para Gemini) ---------------------- */

async function entrarComGoogle() {
  if (!firebaseConfigurado()) {
    $("#aviso-firebase").textContent =
      "O login com Google ainda não foi configurado neste site. Use uma das outras opções abaixo.";
    return;
  }
  overlay(true, "Abrindo login do Google…");
  try {
    const base = "https://www.gstatic.com/firebasejs/" + VERSAO_FIREBASE + "/";
    // "firebase-vertexai.js" foi descontinuado pelo Firebase; o SDK atual de
    // IA generativa vive em "firebase-ai.js" (getAI + GoogleAIBackend).
    const [{ initializeApp }, auth, aiSdk, appCheckSdk] = await Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-auth.js"),
      import(base + "firebase-ai.js"),
      import(base + "firebase-app-check.js")
    ]);
    const app = initializeApp(FIREBASE_CONFIG);

    // O Firebase App Check precisa estar ativo ANTES da primeira chamada ao
    // Gemini. Sem um token de App Check válido, o Firebase AI Logic recusa
    // as chamadas com "This AI Logic Project is inactive" — mesmo que a
    // aplicação (enforcement) apareça como "somente monitoramento" no
    // console, a liberação real do projeto exige uma chamada com token.
    if (APP_CHECK_SITE_KEY && !APP_CHECK_SITE_KEY.startsWith("COLE_AQUI")) {
      try {
        appCheckSdk.initializeAppCheck(app, {
          provider: new appCheckSdk.ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
      } catch (eAppCheck) {
        console.log("Aviso: falha ao iniciar o App Check:", eAppCheck.message);
      }
    }

    const resultado = await auth.signInWithPopup(auth.getAuth(app), new auth.GoogleAuthProvider());
    estado.usuario = { nome: resultado.user.displayName, email: resultado.user.email };
    estado.firebase = {
      app,
      ai: aiSdk.getAI(app, { backend: new aiSdk.GoogleAIBackend() }),
      getGenerativeModel: aiSdk.getGenerativeModel
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
    if (msg.includes("unauthorized-domain")) {
      $("#aviso-firebase").textContent =
        "Este domínio não está autorizado no Firebase Authentication. Adicione-o em " +
        "Authentication → Settings → Authorized domains no console do Firebase.";
      return;
    }
    $("#aviso-firebase").textContent = "Não foi possível entrar: " + msg;
  }
}

/* ================================================================
   FUNÇÃO PRINCIPAL - GERAÇÃO DE CONTEÚDO COM GEMINI
   (via Firebase AI Logic no login Google, ou via chave própria)
   ================================================================ */

async function gerarConteudo(contents, systemInstruction) {
  // Caso 1: Login com Google → usa Gemini via Firebase AI Logic
  if (estado.modo === "google" && estado.firebase) {
    try {
      const { ai, getGenerativeModel } = estado.firebase;
      const model = getGenerativeModel(ai, {
        model: MODELO_GEMINI,
        systemInstruction: systemInstruction
      });
      const resp = await model.generateContent({ contents });
      const texto = resp.response.text();
      if (!texto) throw new Error("Resposta vazia da IA.");
      return texto.trim();
    } catch (e) {
      const msg = String(e && e.message || e);
      if (msg.includes("AI Logic Project is inactive")) {
        const semChave = !APP_CHECK_SITE_KEY || APP_CHECK_SITE_KEY.startsWith("COLE_AQUI");
        throw new Error(
          (semChave
            ? "Falta configurar o Firebase App Check para o Gemini funcionar. "
            : "O Firebase ainda não recebeu uma chamada válida com App Check para liberar o projeto. ") +
          "Segundo a documentação oficial do Firebase, esse erro só some depois que o App Check é " +
          "aplicado (enforced) para o Firebase AI Logic e uma chamada com token válido é enviada. " +
          (semChave
            ? "Configure em: App Check → aba Apps → registre seu app Web com o provedor reCAPTCHA v3, " +
              "cole a chave de site na constante APP_CHECK_SITE_KEY do app.js e aplique (enforce) a " +
              "'Firebase AI Logic API' na aba 'APIs' do App Check."
            : "Aguarde alguns minutos após aplicar (enforce) o App Check e tente de novo.") +
          " Enquanto isso, use o modo 'Usar minha chave Gemini', que não depende disso."
        );
      }
      throw new Error("Erro no Firebase AI: " + msg);
    }
  }

  // Caso 2: Chave própria → chama a API do Gemini diretamente
  const chaveEmUso = estado.chave || (() => {
    try { return localStorage.getItem(CHAVE_LOCALSTORAGE); } catch (_) { return null; }
  })();

  if (!chaveEmUso) {
    throw new Error("❌ Chave da API Gemini não encontrada. Obtenha uma gratuitamente em https://aistudio.google.com/apikey");
  }

  return chamarGeminiComChave(contents, systemInstruction, chaveEmUso);
}

async function chamarGeminiComChave(contents, systemInstruction, chave) {
  const corpo = { contents };
  if (systemInstruction) {
    corpo.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let ultimoErro = null;

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      console.log("🟢 Tentativa " + tentativa + " - Enviando para o Gemini...");

      const resp = await fetch(API_GEMINI_GENERATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": chave.trim()
        },
        body: JSON.stringify(corpo)
      });

      console.log("🟡 Status:", resp.status);

      if (!resp.ok) {
        let mensagem = "HTTP " + resp.status;
        try {
          const errJson = await resp.json();
          if (errJson?.error?.message) mensagem = errJson.error.message;
        } catch (_) {}
        console.log("🔴 Erro:", mensagem);

        if (resp.status === 429 && tentativa < 3) {
          await new Promise(res => setTimeout(res, 3000 * tentativa));
          continue;
        }
        if (resp.status === 400 || resp.status === 403) {
          throw new Error("❌ Chave da API Gemini inválida ou sem permissão: " + mensagem);
        }
        throw new Error("HTTP " + resp.status + ": " + mensagem);
      }

      const dados = await resp.json();
      console.log("🟢 Resposta recebida!");

      const partes = dados?.candidates?.[0]?.content?.parts || [];
      const texto = partes.map(p => p.text || "").join("").trim();
      if (!texto) {
        const motivo = dados?.candidates?.[0]?.finishReason;
        throw new Error("Resposta vazia do modelo" + (motivo ? " (motivo: " + motivo + ")" : "") + ".");
      }
      return texto;

    } catch (e) {
      console.log("🔴 Erro na tentativa", tentativa, ":", e.message);
      ultimoErro = e;
      if (tentativa < 3 && !String(e.message).startsWith("❌")) {
        await new Promise(res => setTimeout(res, 2000 * tentativa));
        continue;
      }
      break;
    }
  }

  throw ultimoErro || new Error("Falha ao comunicar com a API Gemini.");
}

/* ---------------------- Funções auxiliares ---------------------- */

function transcricaoParaContents() {
  return estado.transcricao.map(t => ({
    role: t.papel === "ia" ? "model" : "user",
    parts: [{ text: t.texto }]
  }));
}

/* ---------------------- Fluxo: entrevista com IA ---------------------- */

async function iniciarEntrevistaIA() {
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
    adicionarBalao("ia", "❌ Não consegui conectar ao serviço de IA.\n\n" + e.message + "\n\nVerifique sua chave ou tente o modo Demonstração.");
  }
}

function iniciarModoChave() {
  const chave = $("#chave-api").value.trim();
  if (!chave) { 
    alert("Cole sua chave da API Gemini ou escolha outra forma de acesso."); 
    return; 
  }
  estado.modo = "chave";
  estado.chave = chave;
  try { 
    localStorage.setItem(CHAVE_LOCALSTORAGE, chave);
  } catch (_) {}
  $("#coleta-modo-info").textContent = "✅ Acesso com chave própria · entrevista conduzida por IA (Gemini).";
  iniciarEntrevistaIA();
}

async function responderIA(textoUsuario) {
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
    adicionarBalao("ia", "❌ Falha de conexão: " + e.message + "\n\nTente novamente ou conclua a coleta.");
  }
}

async function processarIA() {
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
    alert("❌ Não foi possível processar com a IA: " + e.message);
  }
}

function extrairJSON(texto) {
  const limpo = texto.replace(/```json|```/g, "").trim();
  const ini = limpo.indexOf("{"), fim = limpo.lastIndexOf("}");
  if (ini === -1 || fim === -1) return null;
  try { return JSON.parse(limpo.slice(ini, fim + 1)); } catch (_) { return null; }
}

/* ---------------------- Modo Demonstração ---------------------- */

function iniciarModoDemo() {
  estado.modo = "demo";
  $("#coleta-modo-info").textContent = "📋 Modo Demonstração · roteiro fixo de 12 perguntas, processado localmente.";
  irParaEtapa("coleta");
  adicionarBalao("ia", "Olá! Vou conduzir uma entrevista de 12 perguntas para montarmos a sua Matriz Etiológica da Personalidade. Responda com sinceridade e no seu ritmo — não há respostas certas ou erradas.");
  fazerPerguntaDemo();
}

function fazerPerguntaDemo() {
  if (estado.indiceDemo < ROTEIRO_DEMO.length) {
    adicionarBalao("ia", ROTEIRO_DEMO[estado.indiceDemo][1]);
  } else {
    adicionarBalao("ia", "✅ Coleta concluída! Clique em \"Concluir coleta e gerar matriz\" para ver sua análise.");
  }
  atualizarProgresso();
}

function responderDemo(textoUsuario) {
  if (estado.indiceDemo >= ROTEIRO_DEMO.length) return;
  adicionarBalao("usuario", textoUsuario);
  estado.respostasDemo[ROTEIRO_DEMO[estado.indiceDemo][0]] = textoUsuario;
  estado.indiceDemo++;
  estado.respostasUsuario++;
  setTimeout(fazerPerguntaDemo, 350);
}

function listar(texto) {
  return String(texto || "")
    .split(/\n|;|,| e (?=[a-záéíóúâêôãõç])/gi)
    .map(s => s.trim())
    .filter(s => s.length > 2)
    .slice(0, 6);
}

function processarDemo() {
  overlay(true, "Organizando suas respostas na matriz…");
  const r = estado.respostasDemo;
  const naoInformado = "Não informado nesta demonstração.";

  const impactos = {
    biologica:  "Base do temperamento: influencia energia, reatividade emocional e disposição natural.",
    psicologica:"Molda padrões emocionais, autoestima e a forma de se vincular às pessoas.",
    cognitiva:  "Define flexibilidade mental, criatividade e o estilo de resolver problemas.",
    social:     "Constrói identidade social, valores morais e papéis assumidos nos grupos.",
    historica:  "Gera adaptações, visão de mundo e atitudes diante de novos desafios.",
    espiritual: "Sustenta propósito, resiliência existencial e coerência entre valores e ações."
  };
  const dims = {};
  for (const d of DIMENSOES) dims[d.id] = { fatores: r[d.id] || naoInformado, impacto: impactos[d.id] };

  const objetivo = (r.objetivo || "desenvolver os pontos identificados").trim();
  const duvidas = listar(r.duvidas);
  const negativas = listar(r.negativas);

  const acoes = [
    { acao: "Registrar semanalmente situações em que o objetivo \"" + objetivo + "\" foi exercitado, anotando o que funcionou.",
      prazo: "30 dias", indicador: "Mínimo de 4 registros no mês" },
    { acao: "Pedir feedback a duas pessoas de confiança sobre " + (duvidas[0] ? "a dúvida \"" + duvidas[0] + "\"" : "os traços em que você tem dúvida") + ", comparando com a sua autopercepção.",
      prazo: "45 dias", indicador: "2 conversas de feedback realizadas" },
    { acao: "Definir uma estratégia concreta para reduzir o impacto de " + (negativas[0] ? "\"" + negativas[0] + "\"" : "uma influência negativa identificada") + " (limite, apoio ou nova rotina).",
      prazo: "60 dias", indicador: "Estratégia escrita e em prática" },
    { acao: "Revisar esta matriz e atualizar Certezas, Suposições e Dúvidas com o que foi aprendido.",
      prazo: "90 dias", indicador: "Matriz revisada com pelo menos 3 atualizações" }
  ];

  estado.resultado = {
    dimensoes: dims,
    certezas: listar(r.certezas).length ? listar(r.certezas) : [naoInformado],
    suposicoes: listar(r.suposicoes).length ? listar(r.suposicoes) : [naoInformado],
    duvidas: duvidas.length ? duvidas : [naoInformado],
    influencias_positivas: listar(r.positivas).length ? listar(r.positivas) : [naoInformado],
    influencias_negativas: negativas.length ? negativas : [naoInformado],
    plano: {
      premissa: "Sua personalidade resulta da interação entre predisposições de base, experiências emocionais e o contexto social e histórico em que você se formou. O ponto de partida do seu desenvolvimento é o objetivo declarado — " + objetivo + " — apoiado nas suas influências positivas e nas certezas que você já reconhece em si. As dúvidas e influências negativas mapeadas indicam onde concentrar atenção. (Análise demonstrativa gerada localmente; o acesso com login ou chave produz uma síntese personalizada por IA.)",
      pontos_fortes: listar(r.certezas).concat(listar(r.positivas)).slice(0, 5),
      pontos_a_desenvolver: duvidas.concat(negativas).slice(0, 5),
      acoes
    }
  };
  setTimeout(() => {
    overlay(false);
    renderizarMatriz();
    renderizarPlano();
    irParaEtapa("matriz");
  }, 600);
}

/* ---------------------- Renderização ---------------------- */

function escapar(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function celulaHTML(classe, rotulo, titulo, corpoHTML) {
  return `<article class="celula ${classe}">
    <span class="rotulo">${rotulo}</span>
    <h4>${titulo}</h4>
    ${corpoHTML}
  </article>`;
}

function listaHTML(itens) {
  return "<ul>" + (itens || []).map(i => `<li>${escapar(i)}</li>`).join("") + "</ul>";
}

function renderizarMatriz() {
  const r = estado.resultado;
  let html = '<div class="matriz-grade">';
  for (const d of DIMENSOES) {
    const c = r.dimensoes?.[d.id] || {};
    html += celulaHTML("", "Dimensão", d.nome,
      `<p><strong>Fatores causais:</strong> ${escapar(c.fatores)}</p>
       <p><strong>Impacto na personalidade:</strong> ${escapar(c.impacto)}</p>`);
  }
  html += "</div>";

  html += '<h3 class="grupo-titulo">Autopercepção — Canvas C · S · D</h3><div class="matriz-grade">';
  html += celulaHTML("celula-verde", "C", "Certezas", listaHTML(r.certezas));
  html += celulaHTML("celula-ambar", "S", "Suposições", listaHTML(r.suposicoes));
  html += celulaHTML("celula-rosa", "D", "Dúvidas", listaHTML(r.duvidas));
  html += "</div>";

  html += '<h3 class="grupo-titulo">Influências</h3><div class="matriz-grade">';
  html += celulaHTML("celula-verde", "+", "Influências positivas", listaHTML(r.influencias_positivas));
  html += celulaHTML("celula-rosa", "−", "Influências negativas", listaHTML(r.influencias_negativas));
  html += "</div>";

  $("#matriz-conteudo").innerHTML = html;
}

function renderizarPlano() {
  const p = estado.resultado.plano || {};
  $("#plano-conteudo").innerHTML = `<div class="plano-premissa">
    <h3>Premissa de desenvolvimento</h3>
    <p>${escapar(p.premissa)}</p>
  </div>
  <div class="plano-colunas">
    ${celulaHTML("celula-verde", "Potencializar", "Pontos fortes", listaHTML(p.pontos_fortes))}
    ${celulaHTML("celula-rosa", "Atenção", "Pontos a desenvolver", listaHTML(p.pontos_a_desenvolver))}
  </div>
  <table class="tabela-acoes">
    <thead><tr><th>Ação</th><th>Prazo</th><th>Indicador de progresso</th></tr></thead>
    <tbody>
      ${(p.acoes || []).map(a => `<tr>
        <td>${escapar(a.acao)}</td><td>${escapar(a.prazo)}</td><td>${escapar(a.indicador)}</td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

/* ---------------------- Exportação ---------------------- */

function baixarJSON() {
  const blob = new Blob([JSON.stringify({
    gerado_em: new Date().toISOString(),
    modo: estado.modo,
    matriz: estado.resultado
  }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "matriz-etiologica.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------------- Inicialização ---------------------- */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 App.js carregado com sucesso!");
  overlay(false);

  $("#dim-resumo").innerHTML = DIMENSOES.map(d =>
    `<div class="dim-item"><strong>${d.nome}</strong><em>${d.desc}</em></div>`).join("");

  try {
    const salva = localStorage.getItem(CHAVE_LOCALSTORAGE);
    if (salva) $("#chave-api").value = salva;
  } catch (_) {}

  document.querySelectorAll("[data-iniciar]").forEach(b =>
    b.addEventListener("click", () => irParaEtapa("acesso")));
  $("#btn-voltar-inicio").addEventListener("click", () => irParaEtapa("inicio"));

  $("#btn-login-google").addEventListener("click", entrarComGoogle);
  $("#btn-modo-chave").addEventListener("click", iniciarModoChave);
  $("#btn-modo-demo").addEventListener("click", iniciarModoDemo);
  if (!firebaseConfigurado()) {
    $("#aviso-firebase").textContent = "Disponível quando o administrador do site configurar o Firebase.";
  }

  $("#form-chat").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const campo = $("#campo-resposta");
    const texto = campo.value.trim();
    if (!texto) return;
    campo.value = "";
    if (estado.modo === "demo") responderDemo(texto);
    else responderIA(texto);
  });
  $("#campo-resposta").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      $("#form-chat").requestSubmit();
    }
  });

  $("#btn-concluir").addEventListener("click", () => {
    if (estado.modo === "demo") processarDemo();
    else processarIA();
  });

  $("#btn-ver-plano").addEventListener("click", () => irParaEtapa("plano"));
  $("#btn-imprimir").addEventListener("click", () => window.print());
  $("#btn-baixar-json").addEventListener("click", baixarJSON);
  $("#btn-recomecar").addEventListener("click", () => location.reload());

  document.querySelectorAll(".passo").forEach(p =>
    p.addEventListener("click", () => { if (!p.disabled) irParaEtapa(p.dataset.etapa); }));
});
