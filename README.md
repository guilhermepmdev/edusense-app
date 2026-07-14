Matriz Etiológica da Personalidade
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

