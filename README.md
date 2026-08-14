Matriz Etiológica da Personalidade

> **Nota de manutenção (2ª rodada):**
> - O modo "chave própria" agora usa o alias `gemini-flash-latest` em vez de
>   uma versão fixa do modelo. A Google tem aposentado versões específicas do
>   Gemini (como `gemini-2.0-flash` e depois `gemini-2.5-flash`) com poucos
>   meses de vida; o alias evita que o site quebre de novo quando isso
>   acontecer de novo.
> - **Se o login com Google der o erro "This AI Logic Project is inactive.
>   Please complete onboarding and enable App Check"**, isso não é um bug do
>   código — é um passo de configuração que falta no seu projeto Firebase.
>   Resolva assim:
>   1. Acesse https://console.firebase.google.com e abra o projeto `edusense-7b027`.
>   2. No menu lateral, clique em **Firebase AI Logic**.
>   3. Clique em **Get started** e conclua o onboarding, escolhendo o provedor
>      **Gemini Developer API** (plano Spark, gratuito, sem cartão).
>   4. Isso ativa o projeto para receber chamadas de IA. O App Check é
>      opcional (proteção extra contra abuso), mas o "Get started" já resolve
>      o erro "This AI Logic Project is inactive".
>
> **Nota de manutenção (1ª rodada):** o app foi atualizado para usar o SDK
> atual do Firebase AI Logic (`firebase-ai.js`, com `getAI` + `GoogleAIBackend`)
> no lugar do antigo `firebase-vertexai.js`, que foi descontinuado e causava o
> erro "Cannot read properties of undefined (reading 'some')". O modo "chave
> própria" também passou a chamar a API do Gemini diretamente (antes chamava,
> por engano, a API da DeepSeek, incompatível com o texto da interface).
>
> Se o login com Google continuar falhando com um erro citando
> `unauthorized-domain`, o domínio do seu GitHub Pages não está autorizado —
> veja o passo "Authorized domains" abaixo.
Ferramenta web de autoconhecimento que conduz uma entrevista guiada por IA,
organiza as respostas em uma matriz etiológica de seis dimensões (Biológica,
Psicológica, Cognitiva, Social/Cultural, Histórico/Contextual e
Filosófico-Espiritual) e entrega uma premissa de plano de desenvolvimento
com ações, prazos e indicadores.
100% estático — funciona no GitHub Pages sem backend. Nenhuma resposta do
usuário é armazenada pelos autores do site.
Arquivos
Arquivo	Função
`index.html`	Landing page (dor → solução), tela de acesso e as 4 etapas
`style.css`	Identidade visual (Fraunces + Inter, violeta/rosa)
`app.js`	Fluxo da entrevista, chamadas de IA, matriz e plano
`firebase-config.js`	Configuração do login com Google (opcional)
Formas de acesso
Entrar com Google (recomendado) — login com Firebase Auth e chamadas
ao Gemini via Firebase AI Logic. Sem chave no código; a cota gratuita usada
é a do projeto Firebase do administrador (plano Spark, sem cartão).
Chave própria — o usuário cola sua chave gratuita da API Gemini
(aistudio.google.com/apikey); ela fica só no navegador dele e a cota é dele.
Demonstração — roteiro fixo de 12 perguntas processado localmente,
sem login e sem IA. Ideal para avaliação do projeto.
Ativar o "Entrar com Google" (uma única vez)
Acesse https://console.firebase.google.com e crie um projeto (gratuito).
No menu Firebase AI Logic, clique em Get started e escolha o
provedor Gemini Developer API (free tier, plano Spark — não pede cartão).
Em Authentication → Sign-in method, ative o provedor Google.
Em Authentication → Settings → Authorized domains, adicione o domínio
do GitHub Pages (ex.: `seuusuario.github.io`).
Em Configurações do projeto → Seus apps, registre um app Web `</>`
e copie os campos `apiKey`, `authDomain`, `projectId` e `appId` para o
arquivo `firebase-config.js`.
> O `apiKey` do Firebase é um identificador público do projeto (diferente de
> uma chave da API Gemini) e pode ser publicado no repositório. A proteção
> contra abuso é feita pelos domínios autorizados e, se desejado, pelo
> Firebase App Check.
Enquanto o `firebase-config.js` estiver vazio, o botão "Entrar com Google"
exibe um aviso e as outras duas formas de acesso continuam funcionando.
Publicar no GitHub Pages
Coloque os quatro arquivos na raiz do repositório (branch `main`).
Em Settings → Pages, selecione Deploy from a branch → `main` → `/ (root)`.
Acesse `https://seuusuario.github.io/nome-do-repositorio/`.
Aviso
Ferramenta educacional. Os resultados são uma premissa de reflexão e não
constituem diagnóstico psicológico.

link do site:https://edusense-app-rho.vercel.app/
