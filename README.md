# 🔍 Caso Aberto

Jogo de detetive para Android, para jogar com amigos, cada um no seu celular e cada um na sua casa.
Um dos jogadores é, em segredo, o **Cúmplice**: ele sabe a verdade e tenta enganar o grupo com pistas falsas.

- 3 a 7 jogadores (modo treino a partir de 1)
- 3 casos: *O Último Brinde* (fácil), *O Malote da Quermesse* (médio) e *Noite de Temporal* (difícil)
- Sala com código de 4 letras, quadro de pistas compartilhado, caderno secreto, conversa e votação final
- **Jogar sozinho** (sem internet): você investiga com 3 detetives robôs, e um deles é o Cúmplice
- **Casos gerados por IA** (Google Gemini): em Som e efeitos → Casos por IA, cole sua chave grátis do Google AI Studio. A chave fica só no celular, nunca no código.
- **Cenas em 3D (piloto)**: no caso *O Último Brinde*, cada local abre em 3D; gire a câmera e toque na 🔍 dos objetos para examinar. Dá para desligar ou usar o modo leve em Som e efeitos. Visual realista com modelos do Khronos glTF Sample Assets (CC0/CC-BY), iluminação HDRI do Poly Haven (CC0) e Three.js (MIT). Créditos completos em `app/src/main/assets/www/js/3d/CREDITOS-3D.md`.
- **Fotos das cenas**: cada local examinado vira uma polaroide de perícia. O **Fotógrafo** tem uma câmera com 2 fotos para conferir se uma pista do quadro é verdadeira. Com a chave do Gemini, dá para criar fotos das cenas com IA (se o plano permitir).
- **Em dupla**: escolha **🤖 Cúmplice robô** nas regras da mesa.
- Avisos quando alguém cai ou volta, e quando todos já usaram as ações da rodada. Quem cai volta sozinho para onde parou.
- Música de suspense e efeitos sonoros criados pelo próprio app, chuva e lampião na tela, abertura do caso e veredito animados (dá para desligar em **Som e efeitos**)

---

## Como gerar o APK pelo GitHub (sem instalar nada no computador)

### 1. Criar a conta e o repositório
1. Crie uma conta gratuita em **github.com**.
2. Clique no **+** (canto superior direito) → **New repository**.
3. Nome: `caso-aberto`. Deixe **Public** (o download do APK fica mais simples) e clique em **Create repository**.

### 2. Enviar os arquivos
1. Descompacte o `caso-aberto.zip` no computador.
2. Na página do repositório, clique em **uploading an existing file**.
3. Abra a pasta `caso-aberto` descompactada, selecione **tudo o que está dentro dela** (inclusive a pasta `.github`) e arraste para a página.
4. Clique em **Commit changes**.

> Se a pasta `.github` não subir: no repositório clique em **Add file → Create new file**, digite o nome
> `.github/workflows/gerar-apk.yml`, cole o conteúdo do arquivo de mesmo nome e clique em **Commit changes**.

### 3. Esperar a compilação (uns 5 minutos)
- Abra a aba **Actions**. Vai aparecer "Gerar APK" rodando (bolinha amarela).
- Quando ficar com ✅ verde, está pronto.

### 4. Baixar e instalar no celular
1. No celular, abra `github.com/SEU-USUARIO/caso-aberto/releases`.
2. Toque em **CasoAberto.apk** para baixar.
3. Abra o arquivo. O Android vai pedir para **permitir instalar apps desta fonte**: permita e instale.
4. Mande o mesmo link para os amigos instalarem também.

Toda vez que você mudar algum arquivo no GitHub, um APK novo é gerado automaticamente e instala por cima do antigo.

---

## Como jogar
1. Um jogador toca em **Criar sala** e envia o código pelo botão **Convidar amigos**.
2. Os outros digitam o nome, o código e tocam em **Entrar**.
3. O anfitrião escolhe o caso e toca em **Abrir o caso**. Cada um vê seu papel em segredo.
4. São 4 rodadas: examinem locais e interroguem suspeitos. Publiquem no **Quadro** o que quiserem mostrar.
5. **Eu também vi**: se você achou a mesma pista que outra pessoa, confirme. O jogo confere no seu caderno, então pista confirmada é verdadeira. Pista falsa nunca pode ser confirmada.
6. No fim, todos votam: culpado, como, por quê e quem é o Cúmplice.

Dica: joguem numa chamada de voz do WhatsApp.

### Importante
- O anfitrião precisa deixar o app **aberto e com a tela ligada** durante a partida (o app já mantém a tela acesa).
- Se alguém cair, é só abrir o app de novo e tocar em **Voltar**: o caderno continua lá.
- A conexão é direta entre os celulares. Em algumas redes de operadora muito fechadas pode não conectar; nesse caso, tente com alguém no Wi-Fi.

---

## Onde mexer
| O quê | Arquivo |
|---|---|
| Casos, suspeitos, pistas | `app/src/main/assets/www/js/casos.js` |
| Regras (rodadas, pontos, ações) | `app/src/main/assets/www/js/motor.js` |
| Telas | `app/src/main/assets/www/js/app.js` e `css/style.css` |
| Conexão entre celulares | `app/src/main/assets/www/js/rede.js` |
| Música e efeitos sonoros | `app/src/main/assets/www/js/som.js` |
| Chuva, abertura e veredito | `app/src/main/assets/www/js/anim.js` |
| Cenas em 3D | `app/src/main/assets/www/js/3d/cena3d.js` |
| Casos por IA (Gemini) | `app/src/main/assets/www/js/ia.js` |
| Casos por nível | `app/src/main/assets/www/js/casos-faceis.js`, `casos-medios.js`, `casos-dificeis.js` |
| App Android (WebView) | `app/src/main/java/br/casoaberto/jogo/MainActivity.java` |

Para testar no computador sem celular: rode um servidor na pasta `www` e abra
`index.html?local=1&perfil=1`, `index.html?local=1&perfil=2`… em abas diferentes do mesmo navegador.

## Truco do Norte de Minas

Na tela inicial do app, escolha **Truco**. Mesa de 4 em duplas (robôs completam as vagas),
Truco Mineiro ou Paulista, 4 malandros (Mestre Valdo, Morena do Ás, Juninho do Chapéu e Barbudo),
visual "Tavolagem Truco Raiz", baralhos com 4 cores de costas, batida forte, bordões e tento de milho ou feijão.

| O quê | Arquivo |
|---|---|
| Regras do truco e robôs | `app/src/main/assets/www/truco/motor-truco.js` |
| Telas e sala online | `app/src/main/assets/www/truco/app-truco.js` e `css/truco.css` |
| Cartas, baralhos e cenários (desenhos) | `app/src/main/assets/www/truco/arte-truco.js` |
| Efeitos, vozes e viola caipira | `app/src/main/assets/www/truco/som-truco.js` |
| Fotos dos malandros | `app/src/main/assets/www/truco/img/` |
| Falas dos malandros (em português, a gravar) | `app/src/main/assets/www/truco/falas/NOME-PALAVRA.mp3` |

Créditos: fotos enviadas pelo dono do jogo; fontes Anton e Work Sans (SIL Open Font License);
ícones Material Symbols (Google, Apache 2.0). Cartas, cenários e música de viola feitos para este jogo, sem marcas.
