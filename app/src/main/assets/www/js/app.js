/* =========================================================
   CASO ABERTO — Interface e controle
   ========================================================= */
(function () {
  "use strict";

  var $app = document.getElementById("app");
  var $modal = document.getElementById("modal");
  var $toasts = document.getElementById("toasts");

  /* ---------------- Utilidades ---------------- */
  // ?perfil=N separa os dados de vários "celulares" abertos no mesmo navegador (só para testes)
  var PERFIL = (/[?&]perfil=(\w+)/.exec(location.search) || [])[1] || "";
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(PERFIL + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(PERFIL + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(PERFIL + k); } catch (e) {} }
  };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function gerarCodigo() {
    var L = "ABCDEFGHJKLMNPQRSTUVWXYZ", s = "";
    for (var i = 0; i < 4; i++) s += L[Math.floor(Math.random() * L.length)];
    return s;
  }
  function gerarToken() { return "t" + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  var CORES = ["#d6a548", "#6d9fd1", "#e08a78", "#7fbf8a", "#b493d6", "#e6c27a", "#6ccbc4"];
  function corDe(id) {
    if (!V) return CORES[0];
    var idx = 0;
    V.jogadores.forEach(function (j, i) { if (j.id === id) idx = i; });
    return CORES[idx % CORES.length];
  }
  function avatar(j) {
    return '<div class="avatar' + (j.robo ? " robo" : "") + '" style="background:' + corDe(j.id) + '">' + (j.robo ? "🤖" : esc(j.nome.charAt(0).toUpperCase())) + "</div>";
  }
  function iniciais(nome) {
    var p = nome.replace(/^(Dr\.|Dona|Seu)\s+/i, "").split(" ");
    return (p[0].charAt(0) + (p[1] ? p[1].charAt(0) : "")).toUpperCase();
  }
  function vibrar(ms) {
    try { if (window.Android && Android.vibrar) Android.vibrar(ms || 60); else if (navigator.vibrate) navigator.vibrate(ms || 60); } catch (e) {}
  }
  function som(n) { try { if (window.Som) Som.fx(n); } catch (e) {} }
  function marcarDepois(mapa, ids) { if (ids.length) setTimeout(function () { ids.forEach(function (i) { mapa[i] = true; }); }, 1200); }
  function infoDesfecho(d) {
    return {
      total: ["verde", "Caso resolvido", "Os detetives acertaram o culpado e desmascararam o Cúmplice!"],
      parcial: ["verde", "Caso resolvido", "Acertaram o culpado, mas o Cúmplice escapou sem ser descoberto."],
      empate: ["latao", "Empate", "O Cúmplice foi preso, mas o verdadeiro culpado escapou."],
      cumplice: ["vermelho", "Caso arquivado", "O Cúmplice venceu! O culpado ficou impune."],
      resolvido: ["verde", "Caso resolvido", "Bom trabalho, detetives!"],
      fracasso: ["vermelho", "Caso arquivado", "O culpado escapou desta vez."]
    }[d];
  }
  var NIVEIS = [
    ["Fácil", "🟢", "Pistas diretas. Ótimo para começar."],
    ["Médio", "🟡", "É preciso cruzar as pistas para ver a verdade."],
    ["Difícil", "🔴", "Álibis falsos, horários enganosos e pistas que mentem."]
  ];
  function casosDoNivel(lista, nivel) { return lista.filter(function (c) { return c.dificuldade === nivel; }); }
  function nivelAtual() { return (V && V.config.nivel) || (V && V.casos.filter(function (c) { return c.id === V.config.casoId; })[0] || {}).dificuldade || "Fácil"; }
  /* ---------- Cenas em 3D (piloto) ---------- */
  var CASOS_3D = { brinde: true };
  function pref3d() { var p = LS.get("ca_3d", null) || {}; return { ativo: p.ativo !== false, leve: !!p.leve }; }
  function tem3D(casoId) { return !!CASOS_3D[casoId] && pref3d().ativo; }
  var c3Carregando = null;
  function carregar3D() {
    if (window.Cena3D) return Promise.resolve(window.Cena3D);
    if (!c3Carregando) c3Carregando = import(new URL("js/3d/cena3d.js", document.baseURI).href).then(function () { return window.Cena3D; });
    return c3Carregando;
  }
  function acoes3D() {
    if (!ui.c3 || !V) return;
    var n = V.minhasAcoes || 0;
    ui.c3.acoes(V.fase !== "rodada" ? "Só dá para examinar durante as rodadas" : n > 0 ? "🔍 " + n + (n === 1 ? " ação" : " ações") + " nesta rodada" : "Sem ações nesta rodada: só dá para olhar");
  }
  function abrir3D(localId) {
    var lc = V.caso.locais.filter(function (x) { return x.id === localId; })[0];
    if (!lc) return;
    toast("Abrindo a cena em 3D…");
    carregar3D().then(function (C3) {
      if (!V || !V.caso) return;
      var chave = "l:" + localId, vistas = (V.vistosIdx && V.vistosIdx[chave]) || [];
      if (!vistas.length) for (var k = 0; k < ((V.vistos && V.vistos[chave]) || 0); k++) vistas.push(k);
      var p = pref3d();
      ui.c3 = C3.abrir({
        casoId: V.caso.id, localId: localId, nome: lc.nome, icone: lc.icone, vistas: vistas, leve: p.leve,
        aoTocar: function (indice, nome, visto) {
          if (visto) { toast("Você já examinou: " + nome + ". A pista está no seu caderno."); return; }
          if (V.fase !== "rodada") { toast("Só dá para examinar durante as rodadas.", true); return; }
          if ((V.minhasAcoes || 0) <= 0) { toast("Suas ações desta rodada acabaram. Espere a próxima.", true); return; }
          enviarAcao({ tipo: "investigar", alvo: "local", id: localId, indice: indice }, function (r) {
            if (!r || !r.ok || !r.nova) return;
            if (ui.c3) ui.c3.marcar(indice);
            mostrarPista("local", localId, r.nova, nome);
          });
        },
        aoFoto: function (url) { if (url && window.Fotos && V && V.caso) Fotos.usarSeVazio(V.caso.id + ":" + localId, url); },
        aoFechar: function () { ui.c3 = null; window._cena3dAtual = null; }
      });
      window._cena3dAtual = ui.c3;
      acoes3D();
    }).catch(function () {
      toast("Este celular não conseguiu abrir o 3D. Usando o modo normal.", true);
      investigar("local", localId);
    });
  }
  function climaMusical() {
    if (!window.Som) return;
    if (!V) Som.clima("calmo");
    else if (V.fase === "votacao") Som.clima("climax");
    else if (V.fase === "rodada") Som.clima(V.rodada >= 3 ? "tenso" : "calmo");
    else if (V.fase === "resultado") Som.clima("silencio");
    else Som.clima("calmo");
  }
  function toast(txt, erro) {
    var d = document.createElement("div");
    d.className = "toast" + (erro ? " erro" : "");
    d.textContent = txt;
    $toasts.appendChild(d);
    var dur = Math.min(6500, Math.max(2600, String(txt).length * 55));
    setTimeout(function () { d.style.opacity = "0"; d.style.transition = "opacity .3s"; }, dur);
    setTimeout(function () { d.remove(); }, dur + 400);
  }
  var SITE_CONVITE = "https://rhmwmdjg-wq.github.io/caso-aberto/entrar.html";
  function textoConvite() {
    return "🔍 Bora jogar CASO ABERTO comigo! Toque no link para entrar direto na minha sala:\n" + SITE_CONVITE + "?c=" + V.codigo +
      "\n\n(Se não abrir, abra o jogo e digite o código " + V.codigo + ")";
  }
  function compartilhar(texto) {
    try {
      if (window.Android && Android.compartilhar) { Android.compartilhar(texto); return; }
      if (navigator.share) { navigator.share({ text: texto }).catch(function () {}); return; }
      navigator.clipboard.writeText(texto).then(function () { toast("Convite copiado!"); });
    } catch (e) { toast("Código da sala: " + (V && V.codigo)); }
  }
  function abrirModal(html) {
    $modal.innerHTML = '<div class="folha"><div class="alca"></div>' + html + "</div>";
    $modal.hidden = false;
  }
  function fecharModal() { $modal.hidden = true; $modal.innerHTML = ""; }
  $modal.addEventListener("click", function (e) { if (e.target === $modal) fecharModal(); });

  /* ---------------- Estado ---------------- */
  var token = LS.get("ca_token", null);
  if (!token) { token = gerarToken(); LS.set("ca_token", token); }
  var meuNome = LS.get("ca_nome", "");

  var V = null;              // visão atual recebida do anfitrião
  var modo = null;           // 'host' | 'cliente'
  var conectado = true;
  var offsetRelogio = 0;
  var ui = {
    shell: null, aba: "investigar", segredo: false, voto: {}, falsa: { idx: null, texto: "", origem: "" },
    vistosQuadro: 0, vistosChat: 0, faseAnterior: null, rodadaAnterior: 0, cartaRevelada: false, carregando: "",
    animarCarta: false, animQ: {}, animC: {}
  };

  /* ================= ANFITRIÃO ================= */
  var H = null;

  function iniciarHost(codigo, estadoSalvo, tentativa) {
    tentativa = tentativa || 0;
    modo = "host";
    ui.carregando = estadoSalvo ? "Reabrindo a sala " + codigo + "…" : "Criando a sala…";
    render();
    var motor = new Motor({ casos: CASOS, especialidades: ESPECIALIDADES, codigo: codigo, estado: estadoSalvo || null });
    motor.s.codigo = codigo;
    var meu = motor.entrar(token, meuNome, true);
    motor.s.hostId = meu.id;
    if (!estadoSalvo && ui.nivelInicial) motor.definirNivel(ui.nivelInicial);
    // ao retomar, todos começam offline até reconectarem
    if (estadoSalvo) motor.s.ordem.forEach(function (id) { if (id !== meu.id) motor.s.jogadores[id].online = false; });
    if (estadoSalvo) motor.cancelarPerguntasPendentes();

    H = { motor: motor, meuId: meu.id, conns: {}, visto: {}, codigo: codigo, rede: null, salvarEm: 0 };
    H.rede = Rede.criarHost(codigo, {
      pronto: function () {
        conectado = true;
        LS.set("ca_host", { codigo: codigo, ts: Date.now() });
        LS.del("ca_cliente");
        hostDifundir();
      },
      conexao: function (cid) { H.visto[cid] = Date.now(); },
      mensagem: function (cid, m) { H.visto[cid] = Date.now(); hostMensagem(cid, m); },
      sinal: function (ok) { if (!H) return; if (conectado !== ok) { conectado = ok; if (ok && V) toast("Sala no ar de novo!"); render(); } },
      fechou: function (cid) { hostFechou(cid); },
      erro: function (tipo) {
        if (tipo === "ocupado") {
          H.rede.fechar();
          if (estadoSalvo && tentativa < 12) {
            ui.carregando = "Recuperando a sala " + codigo + "… (" + (tentativa + 1) + ")";
            render();
            setTimeout(function () { iniciarHost(codigo, estadoSalvo, tentativa + 1); }, 3000);
          } else if (!estadoSalvo) {
            iniciarHost(gerarCodigo(), null, 0);
          } else { sairParaInicio("Não foi possível recuperar a sala. Crie uma nova."); }
        } else if (tipo === "rede") {
          if (!V) sairParaInicio("Sem conexão com a internet. Verifique e tente de novo.");
          else { conectado = false; render(); }
        } else if (tipo === "incompativel") {
          sairParaInicio("Este celular não suporta o modo multijogador.");
        }
      }
    });
  }

  function hostMensagem(cid, m) {
    if (!m || !m.t) return;
    var motor = H.motor;
    if (m.t === "pong") return;
    if (m.t === "entrar") {
      var r = motor.entrar(m.token, m.nome, false);
      if (!r.ok) { H.rede.enviar(cid, { t: "recusado", erro: r.erro }); setTimeout(function () { H.rede.derrubar(cid); }, 400); return; }
      // derruba conexão antiga do mesmo jogador
      for (var c in H.conns) if (H.conns[c] === r.id && c !== cid) { delete H.conns[c]; H.rede.derrubar(c); }
      H.conns[cid] = r.id;
      motor.s.jogadores[r.id].online = true;
      hostDifundir();
      return;
    }
    var jid = H.conns[cid];
    if (!jid) return;
    if (m.t === "foto") {
      Fotos.obter(String(m.chave || "")).then(function (d) { if (H) H.rede.enviar(cid, { t: "foto", chave: m.chave, data: d || null }); });
      return;
    }
    if (m.t === "acao") {
      var res = hostProcessar(jid, m.a);
      if (m.rid) H.rede.enviar(cid, { t: "res", rid: m.rid, r: res });
    }
  }

  function hostFechou(cid) {
    var jid = H.conns[cid];
    delete H.conns[cid];
    delete H.visto[cid];
    if (!jid) return;
    for (var c in H.conns) if (H.conns[c] === jid) return; // ainda conectado por outra via
    H.motor.desconectar(jid);
    hostDifundir();
  }

  function hostProcessar(jid, a) {
    var r = H.motor.acao(jid, a);
    if (r && r.removido) {
      for (var c in H.conns) if (H.conns[c] === r.removido) {
        H.rede.enviar(c, { t: "removido" });
        (function (cc) { setTimeout(function () { H.rede.derrubar(cc); }, 300); })(c);
        delete H.conns[c];
      }
    }
    if (r && r.ok) hostDifundir();
    if (r && r.ok && r.pergunta) hostResponderPergunta(r.pergunta);
    return r;
  }

  // A IA (Gemini do anfitrião) responde no lugar do suspeito
  function hostResponderPergunta(pg) {
    var motor = H.motor;
    var hist = ((motor.s.partida && motor.s.partida.perguntas) || []).filter(function (q) { return q.sus === pg.sus && q.resposta != null; });
    function fim(txt, erro) {
      if (!H || H.motor !== motor) return;
      motor.responder(pg.id, txt, erro);
      hostDifundir();
    }
    if (!window.IA) { fim(null, "IA indisponível"); return; }
    IA.responderSuspeito({ caso: motor.caso(), susId: pg.sus, pergunta: pg.pergunta, historico: hist, jogador: motor.nome(pg.jid) })
      .then(function (t) { fim(t); }, function (e) { fim(null, (e && e.message) || "falha na IA"); });
  }

  function hostDifundir() {
    if (!H) return;
    var iaOk = !!(window.IA && IA.config().chave);
    function comFotos(v) { if (v.caso && window.Fotos) v.fotosIA = Fotos.temIA(v.caso.id); v.iaPerguntas = iaOk; return v; }
    for (var cid in H.conns) H.rede.enviar(cid, { t: "estado", v: comFotos(H.motor.visao(H.conns[cid])) });
    receberVisao(comFotos(H.motor.visao(H.meuId)));
    var agora = Date.now(), chave = H.solo ? "ca_solo" : "ca_host";
    if (agora - H.salvarEm > 800) {
      H.salvarEm = agora;
      LS.set(chave, { codigo: H.codigo, ts: agora, estado: H.motor.exportar() });
    } else {
      clearTimeout(H.tSalvar);
      H.tSalvar = setTimeout(function () { if (H) LS.set(chave, { codigo: H.codigo, ts: Date.now(), estado: H.motor.exportar() }); }, 900);
    }
    agendarRobos();
  }

  /* ================= MODO SOLO (sem internet) ================= */
  function iniciarSolo(casoId, estadoSalvo) {
    modo = "host";
    conectado = true;
    var motor = new Motor({ casos: CASOS, especialidades: ESPECIALIDADES, codigo: "SOLO", estado: estadoSalvo || null });
    motor.s.codigo = "SOLO";
    motor.s.config.solo = true;
    if (estadoSalvo) motor.cancelarPerguntasPendentes();
    var meu = motor.entrar(token, meuNome || "Detetive", true);
    motor.s.hostId = meu.id;
    H = {
      motor: motor, meuId: meu.id, conns: {}, visto: {}, codigo: "SOLO", solo: true, salvarEm: 0, tRobo: null,
      rede: { enviar: function () {}, derrubar: function () {}, fechar: function () {} }
    };
    LS.del("ca_cliente");
    if (!estadoSalvo) {
      motor.acao(meu.id, { tipo: "config", casoId: casoId });
      var r = motor.iniciar();
      if (!r.ok) { sairParaInicio(r.erro || "Não foi possível abrir o caso."); return; }
    }
    hostDifundir();
    if (!estadoSalvo) {
      try { var idx = 0; CASOS.forEach(function (c, i) { if (c.id === motor.s.partida.casoId) idx = i; }); Anim.abertura(V.caso, idx + 1); } catch (e) {}
    }
  }

  // Os colegas robôs agem um de cada vez, com pausas, para parecer gente de verdade.
  // Robôs agem no ritmo de gente: devagar enquanto alguém ainda está investigando,
  // um pouco mais rápido quando só faltam eles (para ninguém ficar esperando à toa).
  function atrasoRobo() {
    var m = H.motor, p = m.s.partida;
    var humanosAgindo = m.s.ordem.some(function (id) { return !m.ehRobo(id) && m.s.jogadores[id].online && p && (p.acoes[id] || 0) > 0; });
    return humanosAgindo ? 12000 + Math.random() * 16000 : 5000 + Math.random() * 6000;
  }
  function agendarRobos() {
    if (!H || H.tRobo) return;
    if (!H.motor.robosPendentes().length) return;
    H.tRobo = setTimeout(function () {
      if (!H) return;
      H.tRobo = null;
      var pend = H.motor.robosPendentes();
      if (!pend.length) return;
      var id = pend[Math.floor(Math.random() * pend.length)];
      if (!H.motor.agirRobo(id)) H.motor.s.partida.acoes[id] = 0;
      hostDifundir();
    }, atrasoRobo());
  }
  function soloAdiantarRobos() {
    if (!H) return;
    clearTimeout(H.tRobo); H.tRobo = null;
    var pend, guarda = 0;
    while ((pend = H.motor.robosPendentes()).length && guarda++ < 50) {
      pend.forEach(function (id) { if (!H.motor.agirRobo(id)) H.motor.s.partida.acoes[id] = 0; });
    }
  }

  /* ================= CONVIDADO ================= */
  var C = null;

  function conectarCliente(codigo, reconectando, retomando) {
    modo = "cliente";
    if (!C || C.codigo !== codigo) C = { codigo: codigo, rede: null, tentativas: 0, ultimo: Date.now(), pend: {}, rid: 1, entrou: false, retomando: !!retomando, desde: Date.now() };
    if (!reconectando) { ui.carregando = "Procurando a sala " + codigo + "…"; render(); }
    if (C.rede) C.rede.fechar();
    var esta = C;
    C.rede = Rede.conectar(codigo, {
      aberto: function () {
        if (C !== esta) return;
        C.ultimo = Date.now();
        C.rede.enviar({ t: "entrar", token: token, nome: meuNome });
      },
      mensagem: function (m) {
        if (C !== esta) return;
        C.ultimo = Date.now();
        if (m.t === "ping") { C.rede.enviar({ t: "pong" }); return; }
        if (m.t === "estado") {
          C.entrou = true; C.tentativas = 0; C.perdeuEm = 0; C.retomando = false;
          if (!conectado) toast("Conectado de novo!");
          conectado = true;
          LS.set("ca_cliente", { codigo: codigo, ts: Date.now() });
          LS.del("ca_host");
          receberVisao(m.v);
        } else if (m.t === "foto") {
          Fotos.receber(m.chave, m.data);
        } else if (m.t === "res") {
          var cb = C.pend[m.rid]; delete C.pend[m.rid];
          if (cb) cb(m.r);
        } else if (m.t === "recusado") {
          sairParaInicio(m.erro || "Não foi possível entrar.");
        } else if (m.t === "removido") {
          sairParaInicio("O anfitrião removeu você da sala.");
        }
      },
      fechou: function () { if (C === esta) clientePerdeu(); },
      erro: function (tipo) {
        if (C !== esta) return;
        if (!C.entrou && !C.retomando) {
          if (tipo === "sala") sairParaInicio("Sala " + codigo + " não encontrada. Confira o código (o anfitrião precisa estar com o app aberto).");
          else if (tipo === "tempo") sairParaInicio("Não deu para conectar à sala " + codigo + ". Tentem os dois no Wi-Fi ou confiram a internet.");
          else sairParaInicio("Sem conexão com a internet.");
        } else clientePerdeu();
      }
    });
  }

  function clientePerdeu() {
    if (!C) return;
    conectado = false;
    render();
    C.tentativas++;
    if (!C.perdeuEm) C.perdeuEm = Date.now();
    // tenta por até 15 minutos, com pausas cada vez maiores
    if (Date.now() - C.perdeuEm > 30 * 60e3) {
      sairParaInicio("Não deu para voltar à sala. Se o anfitrião ainda estiver jogando, toque em Voltar na tela inicial.");
      return;
    }
    clearTimeout(C.tRecon);
    var cod = C.codigo, espera = Math.min(10000, 2000 + C.tentativas * 1000);
    C.tRecon = setTimeout(function () { if (C && C.codigo === cod) conectarCliente(cod, true); }, espera);
  }

  /* ================= Comum ================= */
  function enviarAcao(a, cb) {
    if (modo === "host" && H) {
      var r = hostProcessar(H.meuId, a);
      if (r && !r.ok && r.erro) toast(r.erro, true);
      if (cb) cb(r);
    } else if (C && C.rede) {
      if (!conectado) { toast("Sem conexão. Tentando reconectar…", true); return; }
      var rid = C.rid++;
      C.pend[rid] = function (r) { if (r && !r.ok && r.erro) toast(r.erro, true); if (cb) cb(r); };
      C.rede.enviar({ t: "acao", a: a, rid: rid });
    }
  }

  function sairParaInicio(msg) {
    if (H) { try { H.rede.fechar(); } catch (e) {} clearTimeout(H.tSalvar); clearTimeout(H.tRobo); }
    if (C) { clearTimeout(C.tRecon); try { C.rede.fechar(); } catch (e) {} }
    H = null; C = null; V = null; modo = null; conectado = true; ui.carregando = "";
    try { Anim.fechar(); } catch (e) {}
    if (ui.c3) { try { ui.c3.fechar(); } catch (e) {} ui.c3 = null; }
    climaMusicalDepois();
    ui.shell = null;
    fecharModal();
    render();
    if (msg) setTimeout(function () { toast(msg, true); }, 50);
  }

  function climaMusicalDepois() { setTimeout(climaMusical, 0); }

  function sairDaSala() {
    if (H && H.solo) LS.del("ca_solo"); else if (modo === "host") LS.del("ca_host"); else LS.del("ca_cliente");
    sairParaInicio();
  }

  function nomeSuspDe(v, id) { var x = v.caso && v.caso.suspeitos.filter(function (y) { return y.id === id; })[0]; return x ? x.nome : ""; }
  function receberVisao(v) {
    var antes = V;
    V = v;
    if (v.caso && window.Fotos) {
      Fotos.marcarRemoto(v.caso.id, !!v.fotosIA);
      if (!antes || !antes.caso || antes.caso.id !== v.caso.id || (v.fotosIA && !antes.fotosIA)) Fotos.carregarCaso(v.caso.id);
    }
    offsetRelogio = v.agora - Date.now();
    ui.carregando = "";
    // notificações
    if (antes && antes.fase !== v.fase) {
      vibrar(120);
      if (v.fase === "intro") {
        ui.animQ = {}; ui.animC = {};
        try { var idx = 0; v.casos.forEach(function (c, i) { if (c.id === v.caso.id) idx = i; }); Anim.abertura(v.caso, idx + 1); } catch (e) {}
      }
      if (v.fase === "resultado" && v.resultado) {
        try {
          var Dx = infoDesfecho(v.resultado.desfecho), euCump = v.resultado.cumpliceId === v.meuId;
          var verde = Dx[0] === "verde", verm = Dx[0] === "vermelho";
          Anim.desfecho(Dx[1], Dx[0], Dx[2], euCump ? (verm ? true : verde ? false : null) : (verde ? true : verm ? false : null));
        } catch (e) {}
      }
      if (v.fase === "votacao") som("martelo");
      if (v.fase === "intro") { ui.cartaRevelada = false; ui.aba = "investigar"; ui.voto = {}; ui.segredo = false; ui.falsa = { idx: null, texto: "", origem: "" }; ui.vistosQuadro = 0; }
      if (v.fase === "votacao") { ui.aba = "acusar"; toast("⚖️ Hora da acusação!"); }
      if (v.fase === "resultado") fecharModal();
      if (v.fase === "lobby") { ui.vistosChat = v.chat.length; }
    }
    if (v.fase === "rodada" && antes && antes.rodada !== v.rodada) {
      toast("🔎 Rodada " + v.rodada + " de " + v.totalRodadas);
      if (ui.aba === "acusar") ui.aba = "investigar";
    }
    if (antes && antes.quadro && v.quadro) {
      var novos = v.quadro.slice(antes.quadro.length);
      novos.forEach(function (q) {
        if (q.autorId === v.meuId) return;
        if (q.novidade) { vibrar(200); toast("🚨 Novidade no caso!"); som("novidade"); }
        else { som("alfinete"); if (ui.aba !== "quadro") toast("📌 " + q.autor + " publicou uma pista"); }
      });
      // alguém carimbou "Eu também vi"
      var confAntes = {};
      antes.quadro.forEach(function (q) { confAntes[q.id] = q.confirmados.length; });
      if (v.quadro.some(function (q) { return confAntes[q.id] != null && q.confirmados.length > confAntes[q.id]; })) som("carimbo");
    }
    if (v.prisao && !(antes && antes.prisao)) {
      vibrar(300); som("martelo");
      if (v.prisao.possoVotar && ui.aba !== "investigar") toast("⚖️ " + v.prisao.autor + " pediu uma prisão! Vote no topo da tela.");
      var cp = document.getElementById("corpo"); if (cp) cp.scrollTop = 0;
    }
    if (antes && antes.prisao && !v.prisao && v.fase === "rodada") {
      if (v.afastado && !antes.afastado) { vibrar(400); toast("❌ Prisão errada. Você foi afastado do caso.", true); }
      else if (!v.quadro.some(function (q, i) { return i >= antes.quadro.length && q.origem === "Prisão errada"; })) toast("O grupo recusou o pedido de prisão.");
    }
    if (v.prisaoFinal && !(antes && antes.prisaoFinal)) { vibrar(200); som("carimbo"); toast("⚖️ Prisão aprovada! " + nomeSuspDe(v, v.prisaoFinal.culpado) + " foi preso."); }
    if (antes && antes.caderno && v.caderno && v.caderno.length > antes.caderno.length) {
      var respostas = v.caderno.slice(antes.caderno.length).filter(function (e) { return e.tipo === "pergunta"; });
      if (respostas.length) setTimeout(function () { mostrarResposta(respostas[respostas.length - 1]); }, 50);
    }
    if (antes && antes.chat && ui.aba !== "chat" && v.fase !== "lobby") {
      var ult = v.chat[v.chat.length - 1], ultAntes = antes.chat[antes.chat.length - 1];
      if (ult && (!ultAntes || ult.id !== ultAntes.id) && !ult.sistema && ult.autorId !== v.meuId) { toast("💬 " + ult.autor + ": " + ult.texto.slice(0, 40)); som("sino"); }
    }
    if (v.fase === "rodada" && antes && antes.rodada !== v.rodada && v.rodada > 1) som("papel");
    // alguém caiu ou voltou
    if (antes && antes.fase !== "lobby" && v.fase !== "lobby" && antes.jogadores) {
      var eraOnline = {};
      antes.jogadores.forEach(function (j) { eraOnline[j.id] = j.online; });
      v.jogadores.forEach(function (j) {
        if (j.id === v.meuId || j.robo || eraOnline[j.id] == null) return;
        if (eraOnline[j.id] && !j.online) { vibrar(250); som("novidade"); toast("📵 " + j.nome + " perdeu a conexão. Esperando voltar…", true); }
        else if (!eraOnline[j.id] && j.online) { vibrar(60); som("sino"); toast("✅ " + j.nome + " voltou para a sala!"); }
      });
    }
    // todos usaram as ações da rodada
    if (v.fase === "rodada" && antes && antes.fase === "rodada" && antes.rodada === v.rodada) {
      var faltavam = antes.jogadores.some(function (j) { return j.online && j.acoes > 0; });
      var faltam = v.jogadores.some(function (j) { return j.online && j.acoes > 0; });
      if (faltavam && !faltam) {
        vibrar(150); som("carimbo");
        toast("✅ Todos já usaram suas ações nesta rodada! " + (v.souHost ? "Conversem e toquem em ▶ para avançar." : "Conversem e aguardem o anfitrião avançar."));
      }
    }
    render();
    climaMusical();
    if (ui.c3) { if (v.fase !== "rodada" && v.fase !== "votacao") { ui.c3.fechar(); ui.c3 = null; } else acoes3D(); }
  }

  /* ================= Renderização ================= */
  function shell(nome, html) {
    if (ui.shell !== nome) {
      $app.innerHTML = html; ui.shell = nome;
      var t = $app.firstElementChild;
      if (t) { t.classList.add("entrar"); setTimeout(function () { t.classList.remove("entrar"); }, 450); }
      return true;
    }
    return false;
  }
  function campoFocado(el) {
    var a = document.activeElement;
    return a && el.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
  }
  function pinta(id, html) {
    var el = document.getElementById(id);
    if (!el || el._h === html) return;
    if (campoFocado(el)) { el._pendente = true; return; }
    var st = el.scrollTop;
    el.innerHTML = html;
    el._h = html;
    el.scrollTop = st;
  }
  function faixa() {
    if (conectado) return "";
    if (modo === "host") return '<div class="faixa-conexao">📡 Sem internet: reconectando a sala… Os amigos voltam sozinhos quando a conexão voltar.</div>';
    if (C && C.rede && C.rede.servidorOk && C.rede.servidorOk())
      return '<div class="faixa-conexao espera">⏳ Esperando o anfitrião voltar. O app dele precisa estar aberto. Você volta sozinho para a partida.</div>';
    return '<div class="faixa-conexao">📡 Conexão perdida: reconectando' + (C && C.tentativas > 1 ? " (tentativa " + C.tentativas + ")" : "") + '… <button class="link" data-a="reconectarAgora" style="color:#fff;text-decoration:underline;padding:0 4px">Tentar agora</button></div>';
  }

  function render() {
    if (!V && !ui.carregando && ui.hub) { renderHub(); return; }
    if (!V) {
      if (ui.carregando) {
        shell("carregando", '<div class="tela"><div class="carregando"><div class="girando"></div><div id="msgcarr"></div><button class="link" data-a="cancelar">Cancelar</button></div></div>');
        pinta("msgcarr", esc(ui.carregando));
      } else renderInicio();
      return;
    }
    if (V.fase === "lobby") renderLobby();
    else if (V.fase === "intro") renderIntro();
    else if (V.fase === "rodada" || V.fase === "votacao") renderJogo();
    else if (V.fase === "resultado") renderResultado();
  }

  /* ---------------- Tela inicial: escolher o jogo ---------------- */
  function sufixoUrl() { var p = []; if (PERFIL) p.push("perfil=" + PERFIL); if (/[?&]local=1/.test(location.search)) p.push("local=1"); return p.length ? "?" + p.join("&") : ""; }
  function renderHub() {
    shell("hub", '<div class="tela"><div class="rolagem"><div class="conteudo hub">' +
      '<div class="hub-cab"><h1 class="titulo">Bora jogar?</h1><div class="mudo">Escolha o jogo da vez</div></div>' +
      '<button class="hub-jogo caso" data-a="hubCaso"><span class="emoji">🔍</span><span class="txt"><b>Caso Aberto</b><span>Jogo de detetive com os amigos. Um de vocês está mentindo.</span></span></button>' +
      '<button class="hub-jogo truco" data-a="hubTruco"><span class="emoji">🃏</span><span class="txt"><b>Truco do Norte de Minas</b><span>Mineiro ou paulista, em duplas, com cerveja na mesa e tento de milho.</span></span></button>' +
      '<div class="centro mudo pequeno" id="versao" style="margin-top:18px"></div><div id="atualizar"></div>' +
      "</div></div></div>");
    pinta("atualizar", avisoAtualizacao());
    pinta("versao", versaoInstalada() ? "Versão 1." + versaoInstalada() + ' · <button class="link" data-a="procurarVersao">procurar atualização</button>' : "");
  }

  /* ---------------- Início ---------------- */
  function renderInicio() {
    var host = LS.get("ca_host", null), cli = LS.get("ca_cliente", null), solo = LS.get("ca_solo", null);
    var seisH = 6 * 3600 * 1000, agora = Date.now();
    var retomar = "";
    if (host && host.estado && agora - host.ts < seisH) {
      retomar = '<div class="retomar"><div style="font-weight:700">Você estava com uma sala aberta</div><div class="mudo pequeno" style="margin:2px 0 10px">Sala <b class="maquina">' + esc(host.codigo) + "</b> como anfitrião</div>" +
        '<div class="linha-flex"><button class="btn latao pequeno" data-a="retomarHost">Reabrir sala</button><button class="btn fantasma pequeno" data-a="esquecer">Descartar</button></div></div>';
    } else if (solo && solo.estado && solo.estado.fase !== "lobby" && solo.estado.fase !== "resultado") {
      retomar = '<div class="retomar"><div style="font-weight:700">Continuar seu caso solo?</div><div class="mudo pequeno" style="margin:2px 0 10px">Você e os detetives robôs pararam no meio da investigação.</div>' +
        '<div class="linha-flex"><button class="btn latao pequeno" data-a="retomarSolo">Continuar</button><button class="btn fantasma pequeno" data-a="esquecerSolo">Descartar</button></div></div>';
    } else if (cli && agora - cli.ts < seisH) {
      retomar = '<div class="retomar"><div style="font-weight:700">Voltar para a partida?</div><div class="mudo pequeno" style="margin:2px 0 10px">Sala <b class="maquina">' + esc(cli.codigo) + "</b></div>" +
        '<div class="linha-flex"><button class="btn latao pequeno" data-a="retomarCliente">Voltar</button><button class="btn fantasma pequeno" data-a="esquecer">Descartar</button></div></div>';
    }
    var ok = shell("inicio",
      '<div class="tela"><div class="rolagem"><div class="conteudo">' +
      '<button class="link voltar-hub" data-a="hub">← Jogos</button>' +
      '<div class="logo"><span class="lupa">🔍</span><h1 class="titulo">CASO<span>.</span>ABERTO</h1><div><span class="slogan digita">um de vocês está mentindo</span></div></div>' +
      '<div id="atualizar"></div><div id="retomar"></div>' +
      '<label class="campo"><span>Seu nome de detetive</span><input id="nome" class="entrada" maxlength="18" autocomplete="off" placeholder="Ex.: Ruan"></label>' +
      '<div class="pilha"><button class="btn prim" data-a="criar">🕵️ Criar sala</button><button class="btn fantasma" data-a="solo">🕯️ Jogar sozinho <span class="mudo pequeno">(sem internet)</span></button></div>' +
      '<div class="ou">ou entre com um código</div>' +
      '<div class="linha-flex" style="align-items:stretch"><input id="codigo" class="entrada codigo" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="····" style="flex:1.4"><button class="btn latao" data-a="entrar" style="width:auto">Entrar</button></div>' +
      '<div class="centro" style="margin-top:22px"><button class="link" data-a="regras">📖 Como jogar</button> · <button class="link" data-a="config">🎵 Som e efeitos</button></div>' +
      '<div class="centro mudo pequeno" id="versao" style="margin-top:14px"></div>' +
      "</div></div></div>");
    if (ok) {
      var n = document.getElementById("nome");
      n.value = meuNome;
      n.addEventListener("input", function () { meuNome = n.value.trim(); LS.set("ca_nome", meuNome); });
      var c = document.getElementById("codigo");
      c.addEventListener("input", function () { c.value = c.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4); });
      c.addEventListener("keydown", function (e) { if (e.key === "Enter") acoes.entrar(); });
      var cod = /[?&]sala=([A-Za-z]{4})/.exec(location.search);
      if (cod) c.value = cod[1].toUpperCase();
    }
    pinta("retomar", retomar);
    pinta("atualizar", avisoAtualizacao());
    pinta("versao", versaoInstalada() ? 'Versão 1.' + versaoInstalada() + ' · <button class="link" data-a="procurarVersao">procurar atualização</button>'
      : (/Android/i.test(navigator.userAgent) && !window.Android && !/[?&]local=1/.test(location.search) ? '🌐 Você está jogando pelo navegador. <a href="https://github.com/rhmwmdjg-wq/caso-aberto/releases/latest/download/CasoAberto.apk" target="_blank" rel="noopener" style="color:var(--latao)">Baixar o aplicativo</a>' : ""));
  }

  function precisaNome() {
    var n = document.getElementById("nome");
    meuNome = (n ? n.value : meuNome).trim();
    if (!meuNome) { toast("Digite seu nome primeiro.", true); if (n) n.focus(); return true; }
    LS.set("ca_nome", meuNome);
    return false;
  }

  /* ---------------- Lobby ---------------- */
  function renderLobby() {
    shell("lobby", '<div class="tela"><div id="faixa"></div><div class="rolagem" id="corpo"></div><div class="base" id="base"></div></div>');
    pinta("faixa", faixa());
    var h = '<div class="conteudo">' + avisoAtualizacao();
    h += '<div class="cartao codigo-sala"><div class="rot">CÓDIGO DA SALA</div><div class="cod">' + esc(V.codigo) + '</div>' +
      '<button class="btn latao" data-a="convidar">📨 Convidar amigos</button></div>';

    h += '<h2 class="secao">Detetives na sala · ' + V.jogadores.length + "/" + V.maximo + "</h2><div class=\"cartao\">";
    V.jogadores.forEach(function (j) {
      h += '<div class="jogador">' + avatar(j) + '<div class="nome">' + esc(j.nome) + (j.id === V.meuId ? ' <span class="mudo pequeno">(você)</span>' : "") +
        '<div class="tag">' + (j.id === V.hostId ? "👑 Anfitrião" : "Convidado") + (j.pontos ? " · " + j.pontos + " pts" : "") + "</div></div>" +
        (V.souHost && j.id !== V.meuId ? '<button class="x" data-a="remover" data-id="' + j.id + '" aria-label="Remover">×</button>' : "") + "</div>";
    });
    if (V.jogadores.length < V.minimo) h += '<div class="mudo pequeno" style="padding-top:10px">Esperando mais jogadores… (mínimo ' + V.minimo + ")</div>";
    h += "</div>";

    var nivel = nivelAtual();
    if (V.souHost) {
      h += '<h2 class="secao">Nível do jogo</h2><div class="segmento niveis">' + NIVEIS.map(function (n) {
        return '<button data-a="nivel" data-v="' + n[0] + '" class="' + (n[0] === nivel ? "sel" : "") + '">' + n[1] + " " + n[0] + "</button>";
      }).join("") + "</div>";
      h += '<div class="mudo pequeno" style="margin-top:6px">' + esc(NIVEIS.filter(function (n) { return n[0] === nivel; })[0][2]) + "</div>";
    }
    h += '<h2 class="secao">Caso' + (V.souHost ? " · " + esc(nivel) : "") + '</h2><div class="casos">';
    V.casos.forEach(function (c) {
      var sel = c.id === V.config.casoId;
      if (!V.souHost && !sel) return;
      if (V.souHost && c.dificuldade !== nivel) return;
      h += '<button class="caso-opcao' + (sel ? " sel" : "") + '" data-a="caso" data-id="' + c.id + '"' + (V.souHost ? "" : " disabled") + '><div class="capa">' + c.capa +
        '</div><div><div class="t">' + esc(c.titulo) + '<span class="dif">' + (c.ia ? "✨ IA" : esc(c.dificuldade)) + '</span></div><div class="s">' + esc(c.subtitulo) + "</div></div></button>";
    });
    h += "</div>";
    if (V.souHost) h += '<button class="btn fantasma btn-ia" data-a="iaGerar" data-origem="sala" style="margin-top:10px">✨ Gerar caso novo com IA</button>' +
      '<button class="btn fantasma btn-ia" data-a="iaFotos" style="margin-top:8px">📷 ' + (window.Fotos && Fotos.temIA(V.config.casoId) ? "Refazer as fotos da IA deste caso" : "Criar fotos das cenas com IA") + "</button>";

    h += '<h2 class="secao">Regras da mesa</h2>';
    if (V.souHost) {
      var md = V.config.treino ? "treino" : V.config.robos ? "robos" : "cumplice";
      h += '<div class="segmento modos" style="margin-bottom:6px">' + [["cumplice", "🎭 Cúmplice"], ["robos", "🤖 Cúmplice robô"], ["treino", "🧩 Treino"]].map(function (m) {
        return '<button data-a="modo" data-v="' + m[0] + '" class="' + (md === m[0] ? "sel" : "") + '">' + m[1] + "</button>";
      }).join("") + "</div>";
      h += '<div class="mudo pequeno" style="margin-bottom:10px">' + ({
        cumplice: "Um dos jogadores será o Cúmplice, em segredo. Precisa de 3 ou mais pessoas.",
        robos: "Detetives robôs entram na mesa, e um deles é o Cúmplice. Ótimo para jogar em dupla.",
        treino: "Ninguém mente. Todos investigam juntos."
      })[md] + "</div>";
      if (md === "cumplice" && V.jogadores.length < 3) h += '<div class="cartao pequeno dica-dupla">💡 Vocês são ' + V.jogadores.length + '. Com menos de 3, escolha <b>🤖 Cúmplice robô</b> para jogar com alguém mentindo.</div>';
      h += '<div class="mudo pequeno" style="margin:12px 0 6px">Tempo por rodada</div><div class="segmento">';
      [[0, "Livre"], [180, "3 min"], [300, "5 min"], [480, "8 min"]].forEach(function (t) {
        h += '<button data-a="tempo" data-v="' + t[0] + '" class="' + (V.config.tempoRodada === t[0] ? "sel" : "") + '">' + t[1] + "</button>";
      });
      h += "</div>";
    } else {
      h += '<div class="cartao pequeno">' + (V.config.treino ? "🧩 Modo treino: sem Cúmplice" : V.config.robos ? "🤖 Cúmplice robô: detetives robôs na mesa, um deles mente" : "🎭 Um dos jogadores será o Cúmplice") +
        "<br>⏱️ " + (V.config.tempoRodada ? Math.round(V.config.tempoRodada / 60) + " min por rodada" : "Rodadas sem limite de tempo") + "</div>";
    }
    h += '<div class="centro" style="margin-top:18px"><button class="link" data-a="regras">📖 Como jogar</button> · <button class="link" data-a="sair">Sair da sala</button></div>';
    h += "</div>";
    pinta("corpo", h);

    var b = '<div class="conteudo">';
    if (V.souHost) {
      var pode = V.jogadores.length >= V.minimo && V.jogadores.length <= V.maximo;
      b += '<button class="btn prim" data-a="iniciar"' + (pode ? "" : " disabled") + ">🔎 Abrir o caso</button>";
    } else b += '<div class="centro mudo" style="padding:8px">Aguardando o anfitrião abrir o caso…</div>';
    b += "</div>";
    pinta("base", b);
  }

  /* ---------------- Intro ---------------- */
  function textoPapel() {
    var p = V.papel; if (!p) return "";
    var e = p.esp;
    if (p.tipo === "cumplice") {
      var s = V.segredo, c = V.caso;
      var cul = c.suspeitos.filter(function (x) { return x.id === s.culpado; })[0];
      var met = c.metodos.filter(function (x) { return x.id === s.metodo; })[0];
      var mot = c.motivos.filter(function (x) { return x.id === s.motivo; })[0];
      return '<div class="carta-papel cumplice"><div class="grande">🎭</div><div class="papel-nome">Você é o CÚMPLICE</div>' +
        '<div class="pequeno" style="opacity:.9">Seu disfarce: <b>' + e.icone + " " + esc(e.nome) + '</b>. Finja ser detetive.</div>' +
        '<div class="papel" style="margin-top:14px;text-align:left"><div class="origem">A verdade (só você sabe)</div><div class="texto">Culpado: <b>' + esc(cul.nome) +
        "</b><br>Como: " + esc(met.nome) + "<br>Por quê: " + esc(mot.nome) + '</div></div>' +
        '<div class="pequeno" style="margin-top:12px;text-align:left;opacity:.9">Você pode plantar até 2 pistas falsas no quadro e votar para incriminar outra pessoa. Você vence se o grupo acusar o suspeito errado e ninguém descobrir você.</div></div>';
    }
    return '<div class="carta-papel detetive"><div class="grande">' + e.icone + '</div><div class="papel-nome">' + esc(e.nome) + "</div>" +
      '<div class="pequeno" style="opacity:.9">' + esc(e.desc) + " Esse dossiê já está no seu caderno.</div>" +
      (e.id === "fotografo" ? '<div class="pequeno camera-dica">📷 <b>Sua câmera tem 2 fotos.</b> No Quadro, toque em <b>Fotografar</b> numa pista que veio de um local: a foto mostra se ela existe mesmo lá. Cada foto gasta 1 ação.</div>' : "") +
      (V.solo || V.robos ? '<div class="pequeno" style="margin-top:12px;opacity:.85">🤖 ' + (V.solo ? "Seus colegas são detetives robôs" : "Há detetives robôs na mesa") + ', e <b>um dos robôs é o Cúmplice</b>: ele vai plantar pistas falsas no quadro. Use <b>Eu também vi</b>, leia a Conversa e descubra quem está mentindo.</div>'
        : V.treino ? '<div class="pequeno" style="margin-top:12px;opacity:.85">Modo treino: ninguém está mentindo. Trabalhem juntos!</div>'
        : '<div class="pequeno" style="margin-top:12px;opacity:.85">⚠️ Um dos seus colegas é o <b>Cúmplice</b>: conhece a verdade e pode plantar pistas falsas. Desconfie de pistas que ninguém mais consegue confirmar.</div>') + "</div>";
  }

  function renderIntro() {
    shell("intro", '<div class="tela"><div id="faixa"></div><div class="rolagem" id="corpo"></div><div class="base" id="base"></div></div>');
    pinta("faixa", faixa());
    var c = V.caso, eu = meuJogador();
    var h = '<div class="conteudo"><div class="dossie-capa"><div class="emoji">' + c.capa + '</div><h1 class="titulo">' + esc(c.titulo) + '</h1><div class="sub">' + esc(c.subtitulo) + "</div>" +
      (c.ia ? '<div class="selo-ia">✨ Caso criado por IA: pode ter pequenas falhas de lógica</div>' : "") + "</div>";
    if (V.souHost && window.Fotos && !Fotos.temIA(c.id)) h += '<div class="centro"><button class="link" data-a="iaFotos">📷 Criar fotos das cenas com IA</button></div>';
    h += '<h2 class="secao">O caso</h2><div class="historia">' + c.intro.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
    h += '<h2 class="secao">Suspeitos</h2>' + listaSuspeitos(false);
    h += '<h2 class="secao">Seu papel</h2>';
    if (!ui.cartaRevelada) h += '<button class="carta-papel oculta" data-a="revelar" style="width:100%"><div class="grande">🂠</div><div class="papel-nome">Toque para ver</div><div class="pequeno mudo">Não deixe ninguém olhar sua tela!</div></button>';
    else if (ui.animarCarta) h += '<div class="flip"><div class="flip-in"><div class="carta-papel oculta frente"><div class="grande">🂠</div><div class="papel-nome">&nbsp;</div></div><div class="verso">' +
      textoPapel().replace('class="carta-papel ', 'class="carta-papel brilha ') + "</div></div></div>";
    else h += textoPapel();
    h += '<h2 class="secao">Prontos</h2><div class="cartao">' + V.jogadores.map(function (j) {
      return '<div class="jogador">' + avatar(j) + '<div class="nome">' + esc(j.nome) + '</div><div class="pequeno">' + (j.pronto ? "✅ pronto" : '<span class="mudo">lendo…</span>') + "</div></div>";
    }).join("") + "</div></div>";
    pinta("corpo", h);
    var todos = V.jogadores.every(function (j) { return j.pronto || !j.online; });
    var b = '<div class="conteudo">';
    if (!eu.pronto) b += '<button class="btn prim" data-a="pronto"' + (ui.cartaRevelada ? "" : " disabled") + ">" + (ui.cartaRevelada ? "Estou pronto" : "Veja seu papel antes") + "</button>";
    if (V.souHost) b += '<button class="btn ' + (eu.pronto ? "prim" : "fantasma") + '" data-a="avancar">' + (todos ? "▶ Começar a investigação" : "▶ Começar sem esperar") + "</button>";
    else if (eu.pronto) b += '<div class="centro mudo" style="padding:8px">Aguardando o anfitrião começar…</div>';
    b += "</div>";
    pinta("base", b);
  }

  function meuJogador() {
    for (var i = 0; i < V.jogadores.length; i++) if (V.jogadores[i].id === V.meuId) return V.jogadores[i];
    return {};
  }

  function listaSuspeitos(clicavel) {
    var c = V.caso;
    return c.suspeitos.map(function (s) {
      var info = "";
      if (clicavel) {
        var n = (V.vistos && V.vistos["d:" + s.id]) || 0;
        info = '<div class="seta">' + (n >= 2 ? "✓ tudo ouvido" : "🗣️ " + n + "/2") + "</div>";
      }
      if (clicavel && V.iaPerguntas) info = '<div class="seta">' + (((V.vistos && V.vistos["d:" + s.id]) || 0) >= 2 ? "✓" : "🗣️ " + ((V.vistos && V.vistos["d:" + s.id]) || 0) + "/2") + " · 💬</div>";
      return '<' + (clicavel ? 'button data-a="interrogar" data-id="' + s.id + '"' : "div") + ' class="suspeito-linha' + (clicavel && !V.iaPerguntas && ((V.vistos["d:" + s.id] || 0) >= 2) ? " esgotado" : "") + '"><div class="retrato">' + iniciais(s.nome) + '</div><div><div class="n">' + esc(s.nome) + ' <span class="mudo pequeno">· ' + s.idade + ' anos</span></div><div class="d">' + esc(s.ocupacao) + ". " + esc(s.descricao) + "</div></div>" + info + "</" + (clicavel ? "button" : "div") + ">";
    }).join("");
  }

  /* ---------------- Jogo ---------------- */
  function renderJogo() {
    shell("jogo", '<div class="tela"><div id="faixa"></div><div class="topo" id="topo"></div><div class="rolagem" id="corpo"></div><div class="chat-barra" id="chatbarra" hidden>' +
      '<input id="chatin" class="entrada" maxlength="300" placeholder="Escreva para o grupo…" autocomplete="off"><button class="btn prim" data-a="enviarChat" aria-label="Enviar">➤</button></div><div class="abas" id="abas"></div></div>');
    var cin = document.getElementById("chatin");
    if (cin && !cin._ok) { cin._ok = true; cin.addEventListener("keydown", function (e) { if (e.key === "Enter") acoes.enviarChat(); }); }
    pinta("faixa", faixa());
    if (V.fase === "votacao" && ui.aba === "investigar") ui.aba = "acusar";
    if (V.fase === "rodada" && ui.aba === "acusar") ui.aba = "investigar";

    // topo
    var t = '<div class="info"><div class="caso-nome">' + V.caso.capa + " " + esc(V.caso.titulo) + '</div><div class="meta">';
    if (V.fase === "rodada") t += "<span>Rodada <b>" + V.rodada + "/" + V.totalRodadas + "</b></span>" + '<span class="relogio" id="relogio"></span>';
    else if (V.solo) t += "<span><b>⚖️ Acusação final</b></span>";
    else t += "<span><b>⚖️ Acusação</b></span><span>" + V.jogadores.filter(function (j) { return j.votou && !j.robo; }).length + "/" + V.jogadores.filter(function (j) { return !j.robo; }).length + " votaram</span>";
    var fora = V.jogadores.filter(function (j) { return !j.online && !j.robo; }).map(function (j) { return j.nome; });
    if (fora.length) t += '<span class="fora">📵 ' + esc(fora.join(", ")) + " fora</span>";
    t += "</div></div>";
    if (V.souHost) {
      var rot = V.fase === "votacao" ? "Encerrar" : (V.rodada < V.totalRodadas ? "Rodada " + (V.rodada + 1) + " ▶" : "Acusar ▶");
      var todosAgiram = V.fase === "rodada" && !V.jogadores.some(function (j) { return j.online && j.acoes > 0; });
      if (!(V.solo && V.fase === "votacao")) t += '<button class="btn latao pequeno' + (todosAgiram ? " chama" : "") + '" data-a="avancarJogo">' + rot + "</button>";
    }
    t += '<button class="x" data-a="menu" aria-label="Menu">⋮</button>';
    pinta("topo", t);
    atualizarRelogio();

    // conteúdo
    var html = "";
    if (ui.aba === "investigar") html = abaInvestigar();
    else if (ui.aba === "acusar") html = abaAcusar();
    else if (ui.aba === "quadro") { html = abaQuadro(); ui.vistosQuadro = V.quadro.length; }
    else if (ui.aba === "caderno") html = abaCaderno();
    else if (ui.aba === "chat") { html = abaChat(); ui.vistosChat = V.chat.length; }
    else if (ui.aba === "ficha") html = abaFicha();
    if (V.prisao) html = blocoPrisaoPendente() + html;
    if (!ui.arrastando) pinta("corpo", '<div class="conteudo">' + html + "</div>");
    document.getElementById("chatbarra").hidden = ui.aba !== "chat";
    if (ui.aba === "chat") { var cp = document.getElementById("corpo"); if (cp._fimChat !== V.chat.length) { cp._fimChat = V.chat.length; cp.scrollTop = cp.scrollHeight; } }

    // abas
    var novosQ = V.quadro.filter(function (q, i) { return i >= ui.vistosQuadro && q.autorId !== V.meuId; }).length;
    var novosC = V.chat.slice(ui.vistosChat).filter(function (m) { return !m.sistema && m.autorId !== V.meuId; }).length;
    var abas = [
      V.fase === "votacao" ? ["acusar", "⚖️", "Acusar", 0] : ["investigar", "🔎", "Investigar", 0],
      ["quadro", "📌", "Quadro", ui.aba === "quadro" ? 0 : novosQ],
      ["caderno", "📓", "Caderno", 0],
      ["chat", "💬", "Conversa", ui.aba === "chat" ? 0 : novosC],
      ["ficha", "🗂️", "Ficha", 0]
    ];
    pinta("abas", abas.map(function (a) {
      return '<button class="aba' + (ui.aba === a[0] ? " ativa" : "") + '" data-a="aba" data-id="' + a[0] + '"><span class="ic">' + a[1] + "</span>" + a[2] +
        (a[3] ? '<span class="selo">' + a[3] + "</span>" : "") + "</button>";
    }).join(""));
  }

  function atualizarRelogio() {
    var pt = document.getElementById("ppTempo");
    if (pt && V && V.prisao) { var rs = Math.max(0, Math.round((V.prisao.ate - (Date.now() + offsetRelogio)) / 1000)); pt.textContent = "⏱ " + rs + "s"; }
    var el = document.getElementById("relogio");
    if (!el || !V) return;
    if (!V.fimRodadaEm) { el.textContent = ""; return; }
    var resta = Math.max(0, Math.round((V.fimRodadaEm - (Date.now() + offsetRelogio)) / 1000));
    el.textContent = "⏱ " + Math.floor(resta / 60) + ":" + ("0" + (resta % 60)).slice(-2);
    el.className = "relogio" + (resta <= 30 ? " urgente" : "");
  }

  function nomeSusp(id) { var x = V.caso.suspeitos.filter(function (y) { return y.id === id; })[0]; return x ? x.nome : "—"; }
  function nomeMetodo(id) { var x = V.caso.metodos.filter(function (y) { return y.id === id; })[0]; return x ? x.nome : "—"; }
  function nomeMotivo(id) { var x = V.caso.motivos.filter(function (y) { return y.id === id; })[0]; return x ? x.nome : "—"; }

  // faixa do pedido de prisão em votação (aparece em todas as abas)
  function blocoPrisaoPendente() {
    var pr = V.prisao;
    if (!pr) return "";
    var h = '<div class="prisao-pendente"><div class="pp-cab"><span>⚖️ <b>' + esc(pr.autor) + "</b> pediu a prisão de</span>" + '<span class="pp-tempo" id="ppTempo"></span></div>' +
      '<div class="pp-alvo">' + esc(nomeSusp(pr.culpado)) + '</div><div class="pequeno">' + esc(nomeMetodo(pr.metodo)) + " · " + esc(nomeMotivo(pr.motivo)) + "</div>" +
      '<div class="pp-placar">👍 ' + pr.apoios + " apoio" + (pr.apoios === 1 ? "" : "s") + " · 👎 " + pr.recusas + " · precisa de mais da metade de " + pr.total + "</div>";
    if (pr.possoVotar) {
      h += '<div class="linha-flex"><button class="btn ' + (pr.meuVoto === true ? "prim" : "fantasma") + ' pequeno" data-a="votarPrisao" data-v="1">👍 Apoio</button>' +
        '<button class="btn ' + (pr.meuVoto === false ? "prim" : "fantasma") + ' pequeno" data-a="votarPrisao" data-v="0">👎 Recuso</button></div>' +
        '<div class="pequeno" style="opacity:.8;margin-top:6px">Se a prisão estiver errada, quem apoiou perde 1 ponto. E se for o Cúmplice pedindo?</div>';
    } else if (pr.autorId === V.meuId) h += '<div class="pequeno" style="opacity:.85">Esperando o grupo decidir…</div>';
    return h + "</div>";
  }
  function blocoPedirPrisao() {
    if (V.fase !== "rodada") return "";
    if (V.afastado) return '<div class="cartao afastado">🚫 <b>Você foi afastado do caso</b> depois da prisão errada. Não pode mais investigar, mas continua conversando e vota na acusação final.</div>';
    if (V.prisao) return "";
    if (V.rodada < 2) return '<div class="mudo pequeno" style="margin-top:14px">⚖️ A partir da rodada 2, se você já souber quem foi, poderá <b>pedir uma prisão</b>.</div>';
    if (V.prisaoUsada) return '<div class="mudo pequeno" style="margin-top:14px">⚖️ Você já fez seu pedido de prisão nesta partida.</div>';
    return '<div class="cartao pedir-prisao"><div><b>⚖️ Já sabe quem foi?</b><div class="pequeno mudo">Peça a prisão agora. ' + (V.solo ? "Se acertar, o caso fecha na hora com bônus. Se errar, você é afastado." : "O grupo vota. Se acertar, o caso fecha com bônus. Se errar, você é afastado.") + '</div></div><button class="btn latao pequeno" data-a="pedirPrisao">Pedir prisão</button></div>';
  }

  function abaInvestigar() {
    if (V.afastado) return blocoPedirPrisao();
    var c = V.caso, n = V.minhasAcoes, tot = V.acoesPorRodada;
    var lupas = "";
    for (var i = 0; i < tot; i++) lupas += '<span class="' + (i < n ? "" : "gasta") + '">🔍</span>';
    var h = '<div class="aviso-acoes"><div class="lupas">' + lupas + '</div><div style="flex:1">' +
      (n > 0 ? "<b>" + n + (n === 1 ? " ação" : " ações") + "</b> nesta rodada. Escolha um local ou interrogue alguém."
        : "Você já agiu nesta rodada. Compartilhe o que achou e converse com o grupo.") + "</div></div>";
    var aguard = V.jogadores.filter(function (j) { return j.acoes > 0 && j.online; }).map(function (j) { return j.nome; });
    if (aguard.length && n === 0) h += '<div class="mudo pequeno" style="margin-top:8px">Ainda investigando: ' + esc(aguard.join(", ")) + "</div>";
    if (!aguard.length) h += '<div class="cartao pequeno todos-agiram">✅ <b>Todos já usaram suas ações nesta rodada.</b> ' + (V.souHost ? "Quando terminarem de conversar, toque no botão ▶ lá em cima para avançar." : "Conversem pelo Quadro e pela Conversa. O anfitrião vai avançar a rodada.") + "</div>";
    h += '<h2 class="secao">Examinar um local</h2><div class="grade-locais">';
    c.locais.forEach(function (l) {
      var v = V.vistos["l:" + l.id] || 0;
      h += '<button class="local' + (v >= l.total ? " esgotado" : "") + '" data-a="examinar" data-id="' + l.id + '">' + (tem3D(V.caso.id) ? '<span class="selo3d">3D</span>' : "") + '<span class="ic">' + l.icone + '</span><span class="n">' + esc(l.nome) +
        '</span><span class="p">' + (v >= l.total ? "✓ examinado" : v + "/" + l.total + " pistas") + "</span></button>";
    });
    h += '</div><h2 class="secao">Interrogar um suspeito</h2>';
    if (V.iaPerguntas) h += '<div class="mudo pequeno" style="margin:-4px 0 8px">💬 Toque num suspeito para ouvir o depoimento ou fazer uma <b>pergunta livre</b>.</div>';
    else if (V.souHost && !V.solo) h += '<div class="mudo pequeno" style="margin:-4px 0 8px">💬 Quer fazer perguntas livres aos suspeitos? <button class="link" data-a="iaConfig">Ative a IA (Gemini)</button></div>';
    else if (V.souHost) h += '<div class="mudo pequeno" style="margin:-4px 0 8px">💬 Para fazer perguntas livres aos suspeitos, <button class="link" data-a="iaConfig">ative a IA (Gemini)</button>.</div>';
    if (V.perguntando && V.perguntando.length) h += '<div class="cartao pequeno pensando">⏳ Esperando a resposta da sua pergunta…</div>';
    h += listaSuspeitos(true);
    h += blocoPedirPrisao();
    return h;
  }

  function cartaoPista(q, i) {
    var chegando = !ui.animQ[q.id];
    var cls = "papel" + (q.novidade ? " novidade" : "") + (q.minhaFalsa ? " minha-falsa" : "") + (chegando ? " chegando" : "");
    var r = '<div class="' + cls + '"' + (chegando ? ' style="animation-delay:' + Math.min(i || 0, 6) * 90 + 'ms"' : "") + ">";
    if (q.confirmados.length) r += '<div class="selo-conf' + (ui.animC[q.id] ? "" : " carimbar") + '"' + (ui.animC[q.id] ? "" : ' style="animation-delay:' + (chegando ? 700 + Math.min(i || 0, 6) * 90 : 0) + 'ms"') + ">CONFIRMADA</div>";
    r += '<span class="alfinete"></span><div class="origem">' + esc(q.origem) + '</div><div class="texto">' + esc(q.texto) + '</div><div class="rodape"><span class="esp">' +
      (q.novidade ? "📢 Delegacia · rodada " + q.rodada : "por <b>" + esc(q.autor) + "</b> · rodada " + q.rodada) + "</span>";
    if (q.podeConfirmar) r += '<button class="btn pequeno" data-a="confirmar" data-id="' + q.id + '">👁️ Eu também vi</button>';
    var hq = V.mural && V.mural.tempo && V.mural.tempo[q.id];
    r += '<button class="btn pequeno hora-btn" data-a="cartaoMural" data-id="' + q.id + '">🕐 ' + (hq ? esc(hq) : "Hora") + "</button>";
    if (V.fotosRestantes > 0 && V.fase === "rodada" && !q.novidade && q.autorId !== V.meuId && localDaOrigem(q.origem))
      r += '<button class="btn pequeno camera" data-a="fotografar" data-id="' + q.id + '">📷 Fotografar</button>';
    r += "</div>";
    if (q.confirmados.length) r += '<div class="rodape confirmado">✔ Também visto por: ' + esc(q.confirmados.join(", ")) + "</div>";
    if (q.minhaFalsa) r += '<div class="rodape" style="color:var(--vermelho-escuro)"><span class="carimbo-mini">sua pista falsa</span></div>';
    return r + "</div>";
  }

  function localDaOrigem(origem) {
    return V.caso.locais.filter(function (l) { return origem === l.icone + " " + l.nome || origem === l.nome; })[0] || null;
  }
  function abaQuadro() {
    var vista = ui.vistaQuadro || "pistas";
    var h = '<div class="segmento vistas-quadro">' + [["pistas", "📋 Pistas"], ["mural", "🧵 Mural"], ["tempo", "🕐 Linha do tempo"]].map(function (x) {
      return '<button data-a="vistaQuadro" data-v="' + x[0] + '" class="' + (vista === x[0] ? "sel" : "") + '">' + x[1] + "</button>";
    }).join("") + "</div>";
    if (vista === "mural") return h + abaMural();
    if (vista === "tempo") return h + abaTempo();
    h += '<div class="mudo pequeno" style="margin:12px 0">Pistas que o grupo compartilhou. Se você encontrou a mesma pista, toque em <b>Eu também vi</b>: o jogo confere no seu caderno, então pista confirmada é pista verdadeira.</div>';
    if (!V.quadro.length) return h + '<div class="quadro-mural"><div class="vazio">O quadro está vazio.<br>Publique suas descobertas pelo Caderno.</div></div>';
    var html = V.quadro.slice().reverse().map(cartaoPista).join("");
    marcarDepois(ui.animQ, V.quadro.filter(function (q) { return !ui.animQ[q.id]; }).map(function (q) { return q.id; }));
    marcarDepois(ui.animC, V.quadro.filter(function (q) { return q.confirmados.length && !ui.animC[q.id]; }).map(function (q) { return q.id; }));
    return h + '<div class="quadro-mural">' + html + "</div>";
  }

  /* ---------- Mural do detetive: cartões que todos arrastam, fios vermelhos e linha do tempo ---------- */
  var MURAL_ALT = 1200, CARTAO_ALT = 92;
  function itensMural() {
    var l = [{ id: "vitima", tit: "🕯️ Vítima", txt: V.caso.vitima, cls: "vitima" }];
    V.caso.suspeitos.forEach(function (x) { l.push({ id: "s:" + x.id, tit: "👤 " + x.nome, txt: x.ocupacao, cls: "suspeito", ini: iniciais(x.nome) }); });
    V.quadro.forEach(function (q) { l.push({ id: q.id, tit: q.origem, txt: q.texto, cls: q.novidade ? "novidade" : (q.confirmados.length ? "conf" : ""), autor: q.novidade ? "Delegacia" : q.autor }); });
    var m = V.mural || { pos: {} };
    l.forEach(function (it, i) {
      var p = m.pos[it.id];
      if (!p) {
        var col = i % 3, lin = Math.floor(i / 3);
        p = [col / 2, Math.min(1, lin * 0.1 + (col === 1 ? 0.02 : 0))];
      }
      it.x = p[0]; it.y = p[1];
      it.hora = (m.tempo || {})[it.id] || "";
    });
    return l;
  }
  function itemMural(id) { return itensMural().filter(function (x) { return x.id === id; })[0] || null; }
  function pino(it) { return [it.x * 690 + 155, it.y * (MURAL_ALT - CARTAO_ALT) + 9]; }
  function abaMural() {
    var itens = itensMural(), porId = {};
    itens.forEach(function (it) { porId[it.id] = it; });
    var fios = ((V.mural && V.mural.fios) || []).filter(function (f) { return porId[f[0]] && porId[f[1]]; });
    var h = '<div class="mural-barra"><button class="btn pequeno' + (ui.ligando ? " latao" : "") + '" data-a="modoFio">🧵 ' + (ui.ligando ? "Ligando… (toque para parar)" : "Ligar com fio") + "</button>" +
      '<span class="mudo pequeno">' + (ui.ligando ? (ui.fioDe ? "Agora toque no 2º cartão." : "Toque no 1º cartão.") : "Arraste os cartões. Toque num cartão para ver, marcar a hora ou cortar fios.") + "</span></div>";
    h += '<div class="mural' + (ui.ligando ? " ligando" : "") + '" id="mural" style="height:' + MURAL_ALT + 'px">';
    h += '<svg class="mfios" viewBox="0 0 1000 ' + MURAL_ALT + '" preserveAspectRatio="none">' + fios.map(function (f) {
      var a = pino(porId[f[0]]), b = pino(porId[f[1]]);
      var mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 30 + Math.abs(a[0] - b[0]) * 0.06;
      return '<path data-f="' + esc(f[0]) + "|" + esc(f[1]) + '" d="M' + a[0] + " " + a[1] + " Q" + mx + " " + my + " " + b[0] + " " + b[1] + '" vector-effect="non-scaling-stroke"/>';
    }).join("") + "</svg>";
    itens.forEach(function (it) {
      h += '<div class="mcartao ' + it.cls + (ui.fioDe === it.id ? " sel" : "") + '" data-mid="' + esc(it.id) + '" style="left:' + (it.x * 69).toFixed(2) + "%;top:" + Math.round(it.y * (MURAL_ALT - CARTAO_ALT)) + 'px">' +
        '<span class="pino"></span>' + (it.hora ? '<span class="mhora">' + esc(it.hora) + "</span>" : "") +
        '<div class="mt">' + esc(it.tit) + '</div><div class="mx">' + esc(it.txt) + "</div></div>";
    });
    return h + "</div>";
  }
  function minutos(h) { var p = h.split(":"), m = +p[0] * 60 + +p[1]; return m < 6 * 60 ? m + 1440 : m; }
  function abaTempo() {
    var itens = itensMural().filter(function (it) { return it.hora; }).sort(function (a, b) { return minutos(a.hora) - minutos(b.hora); });
    var h = '<div class="mudo pequeno" style="margin:12px 0">A linha do tempo do grupo. Toque num cartão do <b>Mural</b> ou no botão 🕐 de uma pista para marcar a hora em que aconteceu. Horários da madrugada ficam depois da noite.</div>';
    if (!itens.length) return h + '<div class="vazio">Nenhum horário marcado ainda.</div>';
    h += '<div class="linha-tempo">';
    itens.forEach(function (it) {
      h += '<button class="lt-item" data-a="cartaoMural" data-id="' + esc(it.id) + '"><span class="lt-hora">' + esc(it.hora) + '</span><span class="lt-ponto"></span><span class="lt-txt"><b>' + esc(it.tit) + "</b><br>" + esc(it.txt) + "</span></button>";
    });
    return h + "</div>";
  }
  function abrirCartaoMural(id) {
    var it = itemMural(id);
    if (!it) return;
    var fios = ((V.mural && V.mural.fios) || []).filter(function (f) { return f[0] === id || f[1] === id; });
    var h = '<div class="papel ' + it.cls + '"><span class="alfinete"></span><div class="origem">' + esc(it.tit) + '</div><div class="texto">' + esc(it.txt) + "</div>" + (it.autor ? '<div class="rodape"><span class="esp">por <b>' + esc(it.autor) + "</b></span></div>" : "") + "</div>";
    h += '<h2 class="secao">🕐 Na linha do tempo</h2><div class="linha-flex"><input id="horaMural" class="entrada" type="time" value="' + esc(it.hora) + '" style="flex:1"><button class="btn latao" data-a="salvarHora" data-id="' + esc(id) + '" style="width:auto">Marcar</button>' +
      (it.hora ? '<button class="btn fantasma" data-a="tirarHora" data-id="' + esc(id) + '" style="width:auto">Tirar</button>' : "") + "</div>";
    if (fios.length) {
      h += '<h2 class="secao">🧵 Ligado a</h2>';
      fios.forEach(function (f) {
        var outro = itemMural(f[0] === id ? f[1] : f[0]);
        if (outro) h += '<div class="fio-linha"><span><b>' + esc(outro.tit) + '</b> <span class="mudo pequeno">· fio de ' + esc(f[2] || "?") + '</span></span><button class="btn pequeno" data-a="cortarFio" data-a1="' + esc(f[0]) + '" data-a2="' + esc(f[1]) + '">✂️ Cortar</button></div>';
      });
    }
    h += '<div class="pilha" style="margin-top:14px"><button class="btn" data-a="fioDaqui" data-id="' + esc(id) + '">🧵 Ligar a outro cartão</button><button class="btn fantasma" data-a="fechar">Fechar</button></div>';
    abrirModal(h);
  }
  function enviarMural(a, cb) { enviarAcao(Object.assign({ tipo: "mural" }, a), cb); }

  // arrastar cartões (toque ou mouse)
  (function () {
    var arr = null;
    document.addEventListener("pointerdown", function (e) {
      var c = e.target.closest && e.target.closest(".mcartao");
      if (!c || !V || !V.mural && !V.quadro) return;
      var mural = document.getElementById("mural");
      if (!mural) return;
      arr = { c: c, id: c.dataset.mid, x0: e.clientX, y0: e.clientY, l0: c.offsetLeft, t0: c.offsetTop, mov: false, pid: e.pointerId, mural: mural };
      try { c.setPointerCapture(e.pointerId); } catch (x) {}
    });
    document.addEventListener("pointermove", function (e) {
      if (!arr || e.pointerId !== arr.pid) return;
      var dx = e.clientX - arr.x0, dy = e.clientY - arr.y0;
      if (!arr.mov && Math.abs(dx) + Math.abs(dy) < 8) return;
      if (!arr.mov) { arr.mov = true; ui.arrastando = true; arr.c.classList.add("arrastando"); }
      var W = arr.mural.clientWidth, cw = arr.c.offsetWidth;
      var l = Math.max(0, Math.min(W - cw, arr.l0 + dx)), t = Math.max(0, Math.min(MURAL_ALT - CARTAO_ALT, arr.t0 + dy));
      arr.c.style.left = l + "px"; arr.c.style.top = t + "px";
      arr.fx = W - cw > 0 ? l / (W - cw) : 0; arr.fy = t / (MURAL_ALT - CARTAO_ALT);
      // fios acompanham o cartão
      var it = { x: arr.fx, y: arr.fy };
      arr.mural.querySelectorAll("path[data-f]").forEach(function (pth) {
        var par = pth.getAttribute("data-f").split("|");
        if (par[0] !== arr.id && par[1] !== arr.id) return;
        var outro = itemMural(par[0] === arr.id ? par[1] : par[0]); if (!outro) return;
        var a = pino(it), b = pino(outro), mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 30 + Math.abs(a[0] - b[0]) * 0.06;
        pth.setAttribute("d", "M" + a[0] + " " + a[1] + " Q" + mx + " " + my + " " + b[0] + " " + b[1]);
      });
      e.preventDefault();
    }, { passive: false });
    function soltar(e) {
      if (!arr || e.pointerId !== arr.pid) return;
      var a = arr; arr = null;
      ui.arrastando = false;
      a.c.classList.remove("arrastando");
      if (a.mov) {
        if (e.type === "pointercancel") { render(); return; }
        enviarMural({ op: "mover", id: a.id, x: a.fx, y: a.fy }, function () { render(); });
        return;
      }
      tocarCartaoMural(a.id);
    }
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", soltar);
  })();
  function tocarCartaoMural(id) {
    if (!ui.ligando) { abrirCartaoMural(id); return; }
    if (!ui.fioDe) { ui.fioDe = id; vibrar(20); render(); return; }
    if (ui.fioDe === id) { ui.fioDe = null; render(); return; }
    var de = ui.fioDe;
    ui.fioDe = null;
    enviarMural({ op: "ligar", a: de, b: id }, function (r) {
      if (r && r.ok) { vibrar(30); som("alfinete"); toast(r.removido ? "✂️ Fio cortado" : "🧵 Fio ligado"); }
      render();
    });
  }

  function abaCaderno() {
    var h = "";
    if (V.papel && V.papel.tipo === "cumplice") h += blocoSegredo();
    h += '<h2 class="secao">Minhas anotações</h2>';
    h += '<div class="mudo pequeno" style="margin-bottom:12px">Só você vê o caderno. Publique no quadro o que quiser mostrar ao grupo, ou guarde para usar na hora certa.</div>';
    var lista = (V.caderno || []).slice().reverse();
    if (!lista.length) h += '<div class="vazio">Nada anotado ainda.</div>';
    lista.forEach(function (e) {
      var pub = V.publicadas[e.pid];
      var fotoE = "";
      if (e.tipo === "local") {
        var lid = String(e.pid).split(":")[1], lc = V.caso.locais.filter(function (x) { return x.id === lid; })[0];
        if (lc) fotoE = '<div class="foto-lado">' + Fotos.polaroide({ chave: V.caso.id + ":" + lid, icone: lc.icone, legenda: lc.nome, pequeno: true }) + "</div>";
      } else if (e.tipo === "foto") {
        var lc2 = V.caso.locais.filter(function (x) { return x.id === e.local; })[0] || {};
        fotoE = '<div class="centro" style="margin:4px 0 10px">' + Fotos.polaroide({ chave: V.caso.id + ":" + e.local, icone: lc2.icone, legenda: lc2.nome, selo: e.confere ? "confere" : "nao" }) + "</div>";
      } else if (e.tipo === "dossie" && V.papel && V.papel.esp && V.papel.esp.id === "fotografo") {
        fotoE = '<div class="centro" style="margin:4px 0 10px">' + Fotos.polaroide({ chave: V.caso.id + ":dossie", icone: "📷", legenda: "Foto do seu dossiê" }) + "</div>";
      }
      h += '<div class="papel' + (e.tipo === "novidade" ? " novidade" : "") + (fotoE && e.tipo === "local" ? " com-foto" : "") + '">' + fotoE + '<div class="origem">' + esc(e.origem) + '</div><div class="texto">' + esc(e.texto) + '</div><div class="rodape"><span class="esp">' +
        (e.rodada ? "rodada " + e.rodada : "início do caso") + "</span>" +
        (e.tipo === "novidade" ? "" : pub ? '<span class="confirmado">📌 no quadro (' + esc(pub) + ")</span>" : '<button class="btn pequeno" data-a="publicar" data-id="' + esc(e.pid) + '">📌 Publicar</button>') +
        "</div></div>";
    });
    return h;
  }

  function blocoSegredo() {
    var s = V.segredo, c = V.caso;
    var h = '<div class="segredo"><button class="cab" data-a="segredo">🎭 ' + (ui.segredo ? "Esconder segredo" : "Toque para ver seu segredo") + '<span style="margin-left:auto">' + (ui.segredo ? "▲" : "▼") + "</span></button>";
    if (ui.segredo) {
      var cul = c.suspeitos.filter(function (x) { return x.id === s.culpado; })[0];
      var met = c.metodos.filter(function (x) { return x.id === s.metodo; })[0];
      var mot = c.motivos.filter(function (x) { return x.id === s.motivo; })[0];
      h += '<div class="corpo"><div class="pequeno" style="margin-bottom:10px">A verdade: <b>' + esc(cul.nome) + "</b> · " + esc(met.nome) + " · " + esc(mot.nome) + "</div>";
      if (s.plantadasRestantes > 0 && (V.fase === "rodada" || V.fase === "votacao")) {
        h += '<div style="font-weight:700;color:#f0b3ad">Plantar pista falsa · ' + s.plantadasRestantes + " restante" + (s.plantadasRestantes > 1 ? "s" : "") + "</div>";
        h += '<div class="pequeno" style="opacity:.8">Ela aparece no quadro como se você tivesse encontrado. Ninguém vai conseguir confirmar, então use com esperteza.</div>';
        s.falsas.forEach(function (f, i) {
          h += '<button class="falsa-op' + (ui.falsa.idx === i ? " sel" : "") + '" data-a="escolherFalsa" data-i="' + i + '"><span class="pequeno" style="opacity:.7">' + esc(f.origem) + "</span><br>" + esc(f.texto) + "</button>";
        });
        h += '<button class="falsa-op' + (ui.falsa.idx === -1 ? " sel" : "") + '" data-a="escolherFalsa" data-i="-1">✍️ Escrever a minha própria…</button>';
        if (ui.falsa.idx === -1) {
          h += '<textarea id="falsaTexto" class="entrada" style="margin-top:8px" maxlength="240" placeholder="Ex.: Havia lama nos sapatos de…">' + esc(ui.falsa.texto) + "</textarea>";
        }
        if (ui.falsa.idx !== null) {
          h += '<label class="campo" style="margin-top:10px"><span>Dizer que encontrou em:</span><select id="falsaOrigem" class="entrada">';
          var ops = c.locais.map(function (l) { return l.icone + " " + l.nome; }).concat(c.suspeitos.map(function (x) { return "Depoimento de " + x.nome; }));
          var atual = ui.falsa.origem || (ui.falsa.idx >= 0 ? (function () { var f = s.falsas[ui.falsa.idx]; var l = c.locais.filter(function (x) { return x.nome === f.origem; })[0]; return l ? l.icone + " " + l.nome : ops[0]; })() : ops[0]);
          ui.falsa.origem = atual;
          ops.forEach(function (o) { h += "<option" + (o === atual ? " selected" : "") + ">" + esc(o) + "</option>"; });
          h += '</select></label><button class="btn prim" data-a="plantar">🩸 Plantar no quadro</button>';
        }
      } else if (s.plantadasRestantes <= 0) h += '<div class="pequeno" style="opacity:.8">Você já plantou todas as pistas falsas. Agora é lábia.</div>';
      h += "</div>";
    }
    return h + "</div>";
  }

  function abaChat() {
    var h = '<div class="chat-lista">';
    if (!V.chat.length) h += '<div class="msg sis">Nenhuma mensagem ainda.</div>';
    V.chat.forEach(function (m) {
      if (m.sistema) { h += '<div class="msg sis">' + esc(m.texto) + "</div>"; return; }
      var minha = m.autorId === V.meuId;
      h += '<div class="msg' + (minha ? " minha" : "") + '">' + (minha ? "" : '<div class="autor" style="color:' + corDe(m.autorId) + '">' + esc(m.autor) + "</div>") + esc(m.texto) + "</div>";
    });
    return h + "</div>";
  }

  function abaFicha() {
    var c = V.caso;
    var h = '<div class="dossie-capa"><div class="emoji">' + c.capa + '</div><h1 class="titulo" style="font-size:26px">' + esc(c.titulo) + '</h1><div class="sub">' + esc(c.subtitulo) + "</div></div>";
    h += '<h2 class="secao">Seu papel</h2>' + textoPapel();
    h += '<h2 class="secao">O caso</h2><div class="historia">' + c.intro.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
    h += '<div class="cartao pequeno"><b>Vítima:</b> ' + esc(c.vitima) + "</div>";
    h += '<h2 class="secao">Suspeitos</h2>' + listaSuspeitos(false);
    h += '<h2 class="secao">Como pode ter sido</h2><div class="cartao pequeno">' + c.metodos.map(function (m) { return "• " + esc(m.nome); }).join("<br>") + "</div>";
    h += '<h2 class="secao">Motivos possíveis</h2><div class="cartao pequeno">' + c.motivos.map(function (m) { return "• " + esc(m.nome); }).join("<br>") + "</div>";
    h += '<h2 class="secao">Detetives</h2><div class="cartao">' + V.jogadores.map(function (j) {
      return '<div class="jogador">' + avatar(j) + '<div class="nome">' + esc(j.nome) + '<div class="tag"><span class="ponto' + (j.online ? "" : " off") + '"></span> ' + (j.online ? "online" : "fora") + " · " + j.pontos + " pts</div></div>" +
        '<div class="pequeno mudo">' + (V.fase === "rodada" ? (j.acoes > 0 ? "investigando" : "✓ agiu") : (j.votou ? "✓ votou" : "votando")) + "</div></div>";
    }).join("") + "</div>";
    return h;
  }

  function abaAcusar() {
    var c = V.caso, v = ui.voto;
    if (V.meuVoto && !v._editando) { v.culpado = V.meuVoto.culpado; v.metodo = V.meuVoto.metodo; v.motivo = V.meuVoto.motivo; v.cumplice = V.meuVoto.cumplice; }
    function grupo(titulo, campo, lista, nomeDe) {
      var r = '<h2 class="secao">' + titulo + '</h2><div class="opcoes">';
      lista.forEach(function (x) {
        r += '<button class="opcao' + (v[campo] === x.id ? " sel" : "") + '" data-a="votoOp" data-campo="' + campo + '" data-id="' + x.id + '"><span class="marca"></span><span>' + nomeDe(x) + "</span></button>";
      });
      return r + "</div>";
    }
    if (V.prisaoFinal) {
      var pf = V.prisaoFinal;
      var hp = '<div class="cartao preso"><div class="carimbo-mini certo">PRESO</div><div style="margin-top:6px"><b>' + esc(nomeSusp(pf.culpado)) + "</b> foi preso a pedido de <b>" + esc(pf.autor) + "</b> na rodada " + pf.rodada + '.</div><div class="pequeno mudo">' + esc(nomeMetodo(pf.metodo)) + " · " + esc(nomeMotivo(pf.motivo)) + "</div></div>";
      hp += '<div class="mudo pequeno" style="margin-top:10px">Falta só uma coisa: ' + (V.solo ? "qual robô é o Cúmplice?" : "cada um vota em quem é o Cúmplice.") + "</div>";
      hp += grupo("Quem é o Cúmplice?", "cumplice", V.jogadores.filter(function (j) { return j.id !== V.meuId && (!(V.solo || V.robos) || j.robo); }), function (j) { return (j.robo ? "🤖 " : "") + esc(j.nome); });
      hp += '<div style="margin-top:18px"><button class="btn prim" data-a="votar"' + (v.cumplice ? "" : " disabled") + ">" + (V.meuVoto ? "Atualizar meu voto" : "⚖️ Confirmar") + "</button></div>";
      var falta2 = V.jogadores.filter(function (j) { return !j.votou && !j.robo; }).map(function (j) { return j.nome; });
      if (falta2.length && !V.solo) hp += '<div class="mudo pequeno centro" style="margin-top:10px">Faltam votar: ' + esc(falta2.join(", ")) + "</div>";
      return hp;
    }
    var h = V.solo ? '<div class="mudo pequeno">No modo solo, a acusação é só sua. Escolha o culpado, como, por quê e qual robô é o Cúmplice. Ao confirmar, o caso se encerra.</div>'
      : '<div class="mudo pequeno">Cada um vota em segredo. Vale a acusação mais votada: se houver empate, o caso fica sem solução. Combinem antes!</div>';
    if (V.meuVoto) h += '<div class="cartao pequeno" style="margin-top:10px;border-color:var(--verde)">✅ Seu voto foi registrado. Você pode mudar até todos votarem.</div>';
    h += grupo("Quem é o culpado?", "culpado", c.suspeitos, function (s) { return "<b>" + esc(s.nome) + '</b> <span class="mudo pequeno">· ' + esc(s.ocupacao) + "</span>"; });
    h += grupo("Como foi feito?", "metodo", c.metodos, function (m) { return esc(m.nome); });
    h += grupo("Por quê?", "motivo", c.motivos, function (m) { return esc(m.nome); });
    if (!V.treino) h += grupo("Quem é o Cúmplice?", "cumplice", V.jogadores.filter(function (j) { return j.id !== V.meuId && (!(V.solo || V.robos) || j.robo); }), function (j) { return (j.robo ? "🤖 " : "") + esc(j.nome); });
    var completo = v.culpado && v.metodo && v.motivo && (V.treino || v.cumplice);
    h += '<div style="margin-top:18px"><button class="btn prim" data-a="votar"' + (completo ? "" : " disabled") + ">" + (V.meuVoto ? "Atualizar meu voto" : "⚖️ Confirmar acusação") + "</button></div>";
    var falta = V.jogadores.filter(function (j) { return !j.votou && !j.robo; }).map(function (j) { return j.nome; });
    if (falta.length && !V.solo) h += '<div class="mudo pequeno centro" style="margin-top:10px">Faltam votar: ' + esc(falta.join(", ")) + "</div>";
    return h;
  }

  /* ---------------- Resultado ---------------- */
  function renderResultado() {
    shell("resultado", '<div class="tela"><div id="faixa"></div><div class="rolagem" id="corpo"></div><div class="base" id="base"></div></div>');
    pinta("faixa", faixa());
    var r = V.resultado, c = V.caso, sol = r.solucao;
    function nomeSus(id) { var s = c.suspeitos.filter(function (x) { return x.id === id; })[0]; return s ? s.nome : "—"; }
    function nomeMet(id) { var s = c.metodos.filter(function (x) { return x.id === id; })[0]; return s ? s.nome : "—"; }
    function nomeMot(id) { var s = c.motivos.filter(function (x) { return x.id === id; })[0]; return s ? s.nome : "—"; }
    function nomeJog(id) { var s = V.jogadores.filter(function (x) { return x.id === id; })[0]; return s ? s.nome : "—"; }
    var D = infoDesfecho(r.desfecho);
    var cumplice = r.papeis.filter(function (p) { return p.tipo === "cumplice"; })[0];
    var h = '<div class="conteudo"><div class="revela"><div class="carimbo ' + D[0] + '">' + D[1] + '</div><div style="font-size:16px;margin-bottom:6px">' + D[2] + "</div>";
    h += '<div class="mudo pequeno">' + (r.acusado ? "O grupo acusou <b>" + esc(nomeSus(r.acusado)) + "</b>." : "Os votos empataram: ninguém foi acusado.") + "</div></div>";

    if (r.prisao) h += '<div class="cartao pequeno" style="margin-top:12px">⚖️ <b>Prisão antecipada</b> pedida por <b>' + esc(r.prisao.autor) + "</b> na rodada " + r.prisao.rodada + (r.prisao.completa ? " · bônus de +" + r.prisao.bonus + " pontos" : " · provas fracas (errou o como ou o porquê)") + "</div>";
    (r.prisoesErradas || []).forEach(function (pe) {
      h += '<div class="cartao pequeno" style="margin-top:8px;border-color:var(--vermelho-escuro)">❌ <b>' + esc(pe.autor) + "</b> pediu a prisão errada de " + esc(pe.suspeito) + " (rodada " + pe.rodada + "): afastado e −2 pontos" + (pe.apoiadores.length ? ". Apoiaram: " + esc(pe.apoiadores.join(", ")) + " (−1 cada)" : "") + ".</div>";
    });
    h += '<h2 class="secao">O que realmente aconteceu</h2>';
    h += '<div class="revela"><div class="mudo pequeno">CULPADO</div><div class="culpado">' + esc(nomeSus(sol.culpado)) + '</div><div class="pequeno" style="margin-top:4px">' + esc(nomeMet(sol.metodo)) + " · " + esc(nomeMot(sol.motivo)) + "</div></div>";
    h += '<div class="papel" style="margin-top:14px"><div class="origem">Relatório final</div><div class="texto">' + esc(sol.explicacao) + "</div></div>";

    if (cumplice) {
      h += '<h2 class="secao">O Cúmplice</h2><div class="cartao"><div class="jogador" style="border:0">' + avatar({ id: cumplice.id, nome: cumplice.nome }) + '<div class="nome">' + esc(cumplice.nome) +
        '<div class="tag">disfarçado de ' + cumplice.esp.icone + " " + esc(cumplice.esp.nome) + "</div></div><div>" + (r.preso === cumplice.id ? '<span class="carimbo-mini certo">PRESO</span>' : '<span class="carimbo-mini errado">ESCAPOU</span>') + "</div></div>";
      if (r.falsas.length) h += '<div class="pequeno mudo" style="margin:6px 0">Pistas falsas que ele plantou:</div>' + r.falsas.map(function (f) { return '<div class="pequeno" style="margin-top:6px">🩸 <i>' + esc(f.origem) + ":</i> " + esc(f.texto) + "</div>"; }).join("");
      else h += '<div class="pequeno mudo">Não plantou nenhuma pista falsa.</div>';
      h += "</div>";
    }

    h += '<h2 class="secao">Votos</h2><div class="cartao" style="padding:6px 10px;overflow-x:auto"><table class="tabela"><tr><th>Quem</th><th>Culpado</th><th>Como / Por quê</th>' + (V.treino ? "" : "<th>Cúmplice</th>") + "</tr>";
    r.votos.forEach(function (v) {
      function ok(a, b) { return a === b ? "certo" : "errado"; }
      h += "<tr><td><b>" + esc(v.nome) + "</b></td><td class=\"" + ok(v.culpado, sol.culpado) + "\">" + esc(nomeSus(v.culpado)) + "</td><td><span class=\"" + ok(v.metodo, sol.metodo) + "\">" + esc(nomeMet(v.metodo)) +
        "</span><br><span class=\"" + ok(v.motivo, sol.motivo) + "\">" + esc(nomeMot(v.motivo)) + "</span></td>" +
        (V.treino ? "" : "<td class=\"" + (v.id === r.cumpliceId ? "mudo" : ok(v.cumplice, r.cumpliceId)) + "\">" + esc(nomeJog(v.cumplice)) + "</td>") + "</tr>";
    });
    h += "</table></div>";

    h += '<h2 class="secao">Placar</h2><div class="cartao">';
    V.jogadores.slice().sort(function (a, b) { return b.pontos - a.pontos; }).forEach(function (j, i) {
      h += '<div class="jogador">' + '<div class="maquina" style="width:22px;color:var(--latao)">' + (i + 1) + "º</div>" + avatar(j) + '<div class="nome">' + esc(j.nome) + "</div>" +
        '<div class="pequeno"><span class="certo">+' + (r.pontosRodada[j.id] || 0) + '</span> · <b>' + j.pontos + " pts</b></div></div>";
    });
    h += '<div class="pequeno mudo" style="margin-top:8px">Detetives: +3 culpado, +1 como, +1 por quê, +2 Cúmplice certo, +1 por pista sua confirmada por alguém. Cúmplice: +5 se o culpado escapar, +3 se não for descoberto.</div></div>';
    h += '<div class="centro" style="margin-top:14px"><button class="link" data-a="sair">Sair da sala</button></div></div>';
    pinta("corpo", h);
    pinta("base", '<div class="conteudo">' + (V.souHost ? '<button class="btn prim" data-a="novaPartida">🔁 ' + (V.solo ? "Próximo caso" : "Jogar outro caso") + "</button>" : '<div class="centro mudo" style="padding:8px">Aguardando o anfitrião começar outro caso…</div>') + "</div>");
  }

  /* ================= Ações da interface ================= */
  var acoes = {
    criar: function () {
      if (precisaNome()) return;
      abrirModal('<h2 class="titulo" style="font-size:24px;margin-bottom:6px">Escolha o nível</h2>' +
        '<p class="mudo pequeno" style="margin-top:0">Na sala, só vão aparecer os casos deste nível. Dá para trocar depois, antes de abrir o caso.</p><div class="pilha">' +
        NIVEIS.map(function (n) {
          var qtd = casosDoNivel(CASOS, n[0]).length;
          return '<button class="nivel-opcao" data-a="criarNivel" data-v="' + n[0] + '"><span class="ic">' + n[1] + '</span><span><b>' + n[0] + '</b> <span class="mudo pequeno">· ' + qtd + " casos</span><br><span class=\"mudo pequeno\">" + n[2] + "</span></span></button>";
        }).join("") + '</div><button class="btn fantasma" data-a="fechar" style="margin-top:12px">Voltar</button>');
    },
    criarNivel: function (el) {
      ui.nivelInicial = el.dataset.v;
      fecharModal();
      iniciarHost(gerarCodigo(), null);
    },
    nivel: function (el) { if (V && V.souHost) enviarAcao({ tipo: "config", nivel: el.dataset.v }); },
    entrar: function () {
      if (precisaNome()) return;
      var cod = (document.getElementById("codigo").value || "").toUpperCase();
      if (!/^[A-Z]{4}$/.test(cod)) { toast("O código tem 4 letras.", true); return; }
      conectarCliente(cod);
    },
    retomarHost: function () {
      var h = LS.get("ca_host", null);
      if (!h) return;
      if (!meuNome) meuNome = "Anfitrião";
      iniciarHost(h.codigo, h.estado);
    },
    retomarCliente: function () {
      var c = LS.get("ca_cliente", null);
      if (!c) return;
      if (!meuNome) { toast("Digite seu nome primeiro.", true); return; }
      conectarCliente(c.codigo, false, true);
    },
    esquecer: function () { LS.del("ca_host"); LS.del("ca_cliente"); ui.shell = null; render(); },
    cancelar: function () { if (modo === "cliente") LS.del("ca_cliente"); sairParaInicio(); },
    reconectarAgora: function () { if (C) { clearTimeout(C.tRecon); toast("Tentando reconectar…"); conectarCliente(C.codigo, true); } },
    regras: function () {
      abrirModal('<h2 class="titulo" style="font-size:24px;margin-bottom:12px">Como jogar</h2><div class="regras">' +
        "<p><b>1. Sala.</b> Um jogador cria a sala e passa o código de 4 letras. Os amigos entram pelo próprio celular. De 3 a 7 jogadores (no modo treino, a partir de 1).</p>" +
        "<p><b>Níveis.</b> Quem cria a sala escolhe o nível (Fácil, Médio ou Difícil) e só aparecem os casos daquele nível. São " + CASOS.length + " casos ao todo.</p>" +
        "<p><b>2. Papéis.</b> Cada um recebe uma especialidade (Perito, Investigador, Arquivista…) com um dossiê exclusivo. Um jogador, em segredo, é o <b>Cúmplice</b>: ele sabe a verdade e quer que o grupo erre.</p>" +
        "<p><b>3. Rodadas.</b> São 4 rodadas. Em cada uma você examina um local ou interroga um suspeito (2 ações por rodada se forem até 4 jogadores). O que você descobre vai para o seu <b>caderno</b>, que só você vê.</p>" +
        "<p><b>4. Quadro.</b> Publique no quadro o que quiser mostrar. Se você achou a mesma pista que outra pessoa, toque em <b>Eu também vi</b>: o jogo confere, então pista confirmada é pista verdadeira.</p>" +
        "<p><b>5. O Cúmplice</b> também investiga, mas pode plantar até 2 pistas falsas, que aparecem no quadro como se fossem reais. Pista que ninguém consegue confirmar merece desconfiança.</p>" +
        "<p><b>6. Acusação.</b> No fim, cada um vota: quem é o culpado, como foi feito, por quê e quem é o Cúmplice. Vale a acusação mais votada.</p>" +
        "<p><b>📷 Fotógrafo:</b> quem tira o Fotógrafo tem uma câmera com 2 fotos. No Quadro, ele fotografa uma pista que veio de um local e descobre se ela existe mesmo lá. Só ele vê o resultado.</p>" +
        "<p><b>Em dupla:</b> com só 2 pessoas, crie a sala e escolha <b>🤖 Cúmplice robô</b> nas regras da mesa. Detetives robôs entram no jogo e um deles é o Cúmplice.</p>" +
        "<p><b>Sozinho:</b> no botão <b>Jogar sozinho</b>, você investiga com 3 detetives robôs, sem internet. Um deles é o Cúmplice: desconfie de pista que ninguém confirma e preste atenção quando um robô diz que não viu nada no lugar.</p>" +
        "<p><b>💬 Pergunta livre:</b> se o anfitrião ativou a IA (Gemini), toque num suspeito e escreva qualquer pergunta. Ele responde no personagem e gasta 1 ação. Cuidado: o culpado mente!</p>" +
        "<p><b>🧵 Mural:</b> no Quadro, a aba Mural mostra as pistas, os suspeitos e a vítima como cartões. Todos podem arrastar, ligar com fios vermelhos e marcar o horário de cada coisa, que vai para a Linha do tempo.</p>" +
        "<p><b>⚖️ Pedir prisão:</b> a partir da rodada 2, quem já souber quem foi pode pedir a prisão (uma vez por partida). O grupo tem 60 segundos e precisa de mais da metade de apoio. Acertou? O caso fecha com bônus. Errou? Quem pediu é afastado e perde 2 pontos, quem apoiou perde 1 e o culpado destrói uma pista.</p>" +
        "<p><b>📨 Convite por link:</b> em Convidar amigos, mande o link pelo WhatsApp. Quem tocar nele escolhe entrar pelo aplicativo ou jogar pelo navegador (funciona até em iPhone).</p>" +
        "<p><b>Dica:</b> joguem numa chamada de voz ou vídeo no WhatsApp. Discutir é metade da graça!</p></div>" +
        '<button class="btn prim" data-a="fechar">Entendi</button>');
    },
    fechar: fecharModal,
    config: function () {
      var sp = window.Som ? Som.pref() : { musica: false, efeitos: false }, ap = window.Anim ? Anim.pref() : { clima: false };
      function linha(k, t, d, on) { return '<div class="ajuste"><div class="t">' + t + "<small>" + d + '</small></div><button class="chave' + (on ? " on" : "") + '" data-a="alternar" data-k="' + k + '" aria-label="' + t + '"></button></div>'; }
      abrirModal('<h2 class="titulo" style="font-size:24px;margin-bottom:6px">Som e efeitos</h2><div class="cartao" style="padding:4px 14px">' +
        linha("musica", "🎵 Música de suspense", "Trilha e chuva de fundo, criadas pelo app", sp.musica) +
        linha("efeitos", "🔔 Efeitos sonoros", "Papel, carimbo, máquina de escrever, veredito", sp.efeitos) +
        linha("clima", "🌧️ Chuva e lampião na tela", "Desligue se o celular ficar lento", ap.clima) +
        linha("tres", "🧊 Cenas em 3D", "No caso O Último Brinde, os locais abrem em 3D", pref3d().ativo) +
        linha("leve", "🪶 3D leve", "Sem sombras e com menos detalhe, para celulares simples", pref3d().leve) +
        '</div><button class="btn fantasma" data-a="iaConfig" style="margin-top:12px">🤖 Casos por IA (Gemini)' + (window.IA && IA.config().chave ? " · ✅ ativo" : "") + "</button>" +
        '<button class="btn prim" data-a="fechar" style="margin-top:14px">Pronto</button>');
    },
    iaConfig: function () {
      var cfg = IA.config(), lista = IA.salvos();
      ui.iaModelos = ui.iaModelos || [];
      var ops = ui.iaModelos.length ? ui.iaModelos : (cfg.modelo ? [{ id: cfg.modelo, nome: cfg.modelo }] : []);
      abrirModal('<h2 class="titulo" style="font-size:24px;margin-bottom:6px">Casos por IA</h2>' +
        '<p class="mudo pequeno" style="margin-top:0">O app usa o <b>Google Gemini</b> para escrever casos novos. Para isso, você precisa de uma chave de acesso, que é grátis:</p>' +
        '<ol class="passos pequeno"><li>Abra <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> e entre com sua conta Google.</li><li>Toque em <b>Create API key</b> (Criar chave) e copie a chave.</li><li>Cole aqui embaixo e toque em <b>Salvar e testar</b>.</li></ol>' +
        '<label class="campo"><span>Chave do Gemini</span><input id="iaChave" class="entrada" type="password" autocomplete="off" placeholder="AIza…" value="' + esc(cfg.chave) + '"></label>' +
        (ops.length ? '<label class="campo"><span>Modelo</span><select id="iaModelo" class="entrada">' + ops.map(function (m) { return "<option value=\"" + esc(m.id) + "\"" + (m.id === cfg.modelo ? " selected" : "") + ">" + esc(m.nome) + "</option>"; }).join("") + "</select></label>" : "") +
        '<div id="iaStatus" class="pequeno" style="margin:-4px 0 10px"></div>' +
        '<div class="linha-flex"><button class="btn prim" data-a="iaSalvar">Salvar e testar</button>' + (cfg.chave ? '<button class="btn fantasma" data-a="iaApagar" style="flex:.6">Apagar chave</button>' : "") + "</div>" +
        '<p class="mudo pequeno">🔒 A chave fica guardada só neste celular e nunca vai para o GitHub nem para os amigos. No plano gratuito, o Google pode usar o que for enviado para melhorar os produtos dele. Não coloque dados pessoais no tema do caso.</p>' +
        (lista.length ? '<h2 class="secao">Casos gerados (' + lista.length + ")</h2>" + lista.map(function (c) {
          return '<div class="jogador"><div class="capa-mini">' + esc(c.capa) + '</div><div class="nome">' + esc(c.titulo) + '<div class="tag">' + esc(c.dificuldade) + (c.tema ? " · " + esc(c.tema) : "") + '</div></div><button class="x" data-a="iaRemover" data-id="' + esc(c.id) + '" aria-label="Apagar caso">🗑</button></div>';
        }).join("") : "") +
        '<button class="btn fantasma" data-a="fechar" style="margin-top:12px">Fechar</button>');
    },
    iaSalvar: function () {
      var ch = (document.getElementById("iaChave") || {}).value || "";
      var selM = document.getElementById("iaModelo");
      var st = document.getElementById("iaStatus");
      if (!ch.trim()) { toast("Cole a chave do Gemini.", true); return; }
      IA.salvarConfig({ chave: ch, modelo: selM ? selM.value : IA.config().modelo });
      if (st) st.innerHTML = '<span class="mudo">Testando a chave…</span>';
      IA.listarModelos(ch.trim()).then(function (ms) {
        if (!ms.length) throw new Error("A chave funciona, mas não encontrei nenhum modelo Gemini disponível.");
        ui.iaModelos = ms;
        var atual = IA.config().modelo;
        if (!atual || !ms.some(function (m) { return m.id === atual; })) atual = ms[0].id;
        IA.salvarConfig({ chave: ch, modelo: atual });
        acoes.iaConfig();
        var st2 = document.getElementById("iaStatus");
        if (st2) st2.innerHTML = '<span class="certo">✅ Chave funcionando! Modelo: ' + esc(atual) + "</span>";
        if (modo === "host" && H) hostDifundir();
        if (ui.iaDepois) { var o = ui.iaDepois; ui.iaDepois = null; setTimeout(function () { acoes.iaGerar({ dataset: { origem: o } }); }, 900); }
      }).catch(function (e) {
        var st2 = document.getElementById("iaStatus");
        if (st2) st2.innerHTML = '<span class="errado">' + esc(e.message) + "</span>";
      });
    },
    iaApagar: function () { IA.salvarConfig({ chave: "", modelo: "" }); ui.iaModelos = []; acoes.iaConfig(); toast("Chave apagada deste celular."); if (modo === "host" && H) hostDifundir(); },
    iaRemover: function (el) {
      var id = el.dataset.id;
      IA.remover(id);
      if (window.Fotos) Fotos.apagarCaso(id);
      if (H && H.motor.s.config.casoId === id) {
        var ms = H.motor, lista = ms.casosDoNivel(ms.s.config.nivel);
        ms.s.config.casoId = (lista[0] || CASOS[0]).id;
      }
      acoes.iaConfig(); toast("Caso apagado.");
      if (H) hostDifundir(); else if (V) render();
    },
    iaGerar: function (el) {
      var origem = (el && el.dataset && el.dataset.origem) || "sala";
      if (!IA.config().chave) { ui.iaDepois = origem; acoes.iaConfig(); toast("Primeiro, configure a chave do Gemini."); return; }
      var nivel = origem === "solo" ? (ui.soloNivel || "Fácil") : nivelAtual();
      ui.iaOrigem = origem; ui.iaNivel = nivel;
      abrirModal('<h2 class="titulo" style="font-size:24px;margin-bottom:6px">✨ Gerar caso com IA</h2>' +
        '<p class="mudo pequeno" style="margin-top:0">Nível <b>' + esc(nivel) + '</b>. A IA leva de 20 segundos a 1 minuto para escrever o caso.</p>' +
        '<label class="campo"><span>Tema (opcional)</span><input id="iaTema" class="entrada" maxlength="140" autocomplete="off" placeholder="Ex.: festa de São João, hospital, time de futebol…"></label>' +
        '<div class="pilha"><button class="btn prim" data-a="iaGerarOk">✨ Gerar caso</button><button class="btn fantasma" data-a="' + (origem === "solo" ? "solo" : "fechar") + '">Voltar</button></div>');
    },
    iaGerarOk: function () {
      var tema = ((document.getElementById("iaTema") || {}).value || "").trim();
      var origem = ui.iaOrigem, nivel = ui.iaNivel;
      if (ui.iaGerando) return;
      ui.iaGerando = true;
      abrirModal('<div class="gerando-ia"><div class="lupa-ia">🔍</div><div class="titulo" style="font-size:22px">Escrevendo o caso…</div><div id="iaProg" class="mudo pequeno" style="margin-top:8px">Falando com o Gemini…</div>' +
        '<div class="mudo pequeno" style="margin-top:14px">Pode deixar o celular ligado e esperar aqui.</div></div>');
      IA.gerarCaso({ nivel: nivel, tema: tema }, function (msg) { var p = document.getElementById("iaProg"); if (p) p.textContent = msg; }).then(function (caso) {
        ui.iaGerando = false;
        IA.guardar(caso);
        som("carimbo");
        if (origem === "sala" && V && V.souHost && V.fase === "lobby") {
          fecharModal();
          enviarAcao({ tipo: "config", casoId: caso.id });
          toast("✨ Caso \"" + caso.titulo + "\" criado!");
        } else {
          ui.soloNivel = caso.dificuldade;
          acoes.solo({ dataset: { v: caso.dificuldade } });
          toast("✨ Caso \"" + caso.titulo + "\" criado! Toque nele para jogar.");
        }
      }).catch(function (e) {
        ui.iaGerando = false;
        abrirModal('<h2 class="titulo" style="font-size:22px;margin-bottom:8px">Não deu certo</h2><p>' + esc(e.message) + '</p><div class="pilha"><button class="btn prim" data-a="iaGerar" data-origem="' + esc(origem) + '">Tentar de novo</button>' +
          '<button class="btn fantasma" data-a="iaConfig">Configurar IA</button><button class="btn fantasma" data-a="fechar">Fechar</button></div>');
      });
    },
    alternar: function (el) {
      var k = el.dataset.k, on = !el.classList.contains("on");
      el.classList.toggle("on", on);
      if (k === "clima") { if (window.Anim) Anim.definir("clima", on); }
      else if (k === "tres" || k === "leve") { var p3 = pref3d(); p3[k === "tres" ? "ativo" : "leve"] = on; LS.set("ca_3d", p3); if (V) render(); }
      else if (window.Som) { Som.definir(k, on); if (on && k === "efeitos") som("carimbo"); }
    },
    convidar: function () { compartilhar(textoConvite()); },
    remover: function (el) {
      var j = V.jogadores.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (!j) return;
      abrirModal('<p>Remover <b>' + esc(j.nome) + "</b> da sala?</p>" + '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Cancelar</button><button class="btn prim" data-a="removerOk" data-id="' + j.id + '">Remover</button></div>');
    },
    removerOk: function (el) { fecharModal(); enviarAcao({ tipo: "remover", id: el.dataset.id }); },
    caso: function (el) { if (V.souHost) enviarAcao({ tipo: "config", casoId: el.dataset.id }); },
    treino: function (el) { enviarAcao({ tipo: "config", treino: el.dataset.v === "1" }); },
    modo: function (el) {
      var v = el.dataset.v;
      enviarAcao({ tipo: "config", treino: v === "treino", robos: v === "robos" });
    },
    tempo: function (el) { enviarAcao({ tipo: "config", tempoRodada: parseInt(el.dataset.v, 10) }); },
    iniciar: function () { enviarAcao({ tipo: "iniciar" }); },
    revelar: function () {
      ui.cartaRevelada = true; ui.animarCarta = true; vibrar(40);
      som(V.papel && V.papel.tipo === "cumplice" ? "revelarCumplice" : "revelarDetetive");
      render();
      setTimeout(function () { ui.animarCarta = false; }, 1300);
    },
    pronto: function () { enviarAcao({ tipo: "pronto" }); },
    avancar: function () { enviarAcao({ tipo: "avancar" }); },
    avancarJogo: function () {
      var falta;
      if (V.fase === "votacao") {
        falta = V.jogadores.filter(function (j) { return !j.votou && !j.robo; }).map(function (j) { return j.nome; });
        if (!falta.length) return;
        abrirModal('<p>Ainda não votaram: <b>' + esc(falta.join(", ")) + "</b>.</p><p class=\"mudo pequeno\">Encerrar agora conta só os votos já feitos.</p>" +
          '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Esperar</button><button class="btn prim" data-a="encerrarOk">Encerrar</button></div>');
        return;
      }
      falta = V.jogadores.filter(function (j) { return j.acoes > 0 && j.online && !j.robo; }).map(function (j) { return j.nome; });
      var prox = V.rodada < V.totalRodadas ? "começar a rodada " + (V.rodada + 1) : "ir para a acusação final";
      abrirModal("<p>Quer " + prox + "?</p>" + (falta.length ? '<p class="mudo pequeno">Ainda têm ações sobrando: ' + esc(falta.join(", ")) + ". Elas serão perdidas.</p>" : '<p class="mudo pequeno">Todos já agiram. Conversaram o suficiente?</p>') +
        '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Ainda não</button><button class="btn prim" data-a="avancarOk">Avançar</button></div>');
    },
    avancarOk: function () { fecharModal(); soloAdiantarRobos(); enviarAcao({ tipo: "avancar" }); },
    encerrarOk: function () { fecharModal(); enviarAcao({ tipo: "encerrarVotacao" }); },
    menu: function () {
      abrirModal('<div class="pilha"><button class="btn" data-a="regras">📖 Como jogar</button><button class="btn" data-a="config">🎵 Som e efeitos</button>' +
        (V.solo ? "" : '<button class="btn" data-a="convidarJogo">📨 Convidar de volta · sala ' + esc(V.codigo) + "</button>") +
        '<button class="btn fantasma" data-a="sair">🚪 ' + (V.solo ? "Sair do caso" : "Sair da sala") + '</button><button class="btn fantasma" data-a="fechar">Voltar</button></div>');
    },
    convidarJogo: function () { fecharModal(); compartilhar(textoConvite()); },
    sair: function () {
      abrirModal("<p>" + (H && H.solo ? "Sair do caso? A investigação será descartada." : modo === "host" ? "Você é o anfitrião. Se sair, <b>a sala fecha para todos</b>." : "Sair da sala?") + "</p>" +
        '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Ficar</button><button class="btn prim" data-a="sairOk">Sair</button></div>');
    },
    sairOk: function () { sairDaSala(); },
    aba: function (el) { ui.aba = el.dataset.id; var c = document.getElementById("corpo"); if (c) { c._h = null; c.scrollTop = 0; } render(); },
    examinar: function (el) { if (tem3D(V.caso.id)) abrir3D(el.dataset.id); else investigar("local", el.dataset.id); },
    interrogar: function (el) {
      if (!V.iaPerguntas) { investigar("suspeito", el.dataset.id); return; }
      abrirInterrogatorio(el.dataset.id);
    },
    pedirPrisao: function () { ui.pp = ui.pp || {}; abrirPedidoPrisao(); },
    ppOp: function (el) { ui.pp[el.dataset.campo] = el.dataset.id; abrirPedidoPrisao(); },
    ppConfirmar: function () {
      var pp = ui.pp || {};
      enviarAcao({ tipo: "pedirPrisao", culpado: pp.culpado, metodo: pp.metodo, motivo: pp.motivo }, function (r) {
        if (r && r.ok) { fecharModal(); vibrar(120); som("martelo"); ui.pp = {}; }
      });
    },
    votarPrisao: function (el) { enviarAcao({ tipo: "votarPrisao", apoio: el.dataset.v === "1" }, function (r) { if (r && r.ok) { vibrar(30); fecharModal(); } }); },
    vistaQuadro: function (el) { ui.vistaQuadro = el.dataset.v; ui.ligando = false; ui.fioDe = null; var c = document.getElementById("corpo"); if (c) c._h = null; render(); },
    modoFio: function () { ui.ligando = !ui.ligando; ui.fioDe = null; render(); },
    cartaoMural: function (el) { abrirCartaoMural(el.dataset.id); },
    fioDaqui: function (el) { fecharModal(); ui.vistaQuadro = "mural"; ui.ligando = true; ui.fioDe = el.dataset.id; render(); toast("Agora toque no cartão que quer ligar."); },
    cortarFio: function (el) { enviarMural({ op: "ligar", a: el.dataset.a1, b: el.dataset.a2 }, function (r) { if (r && r.ok) { toast("✂️ Fio cortado"); fecharModal(); } }); },
    salvarHora: function (el) {
      var v = (document.getElementById("horaMural") || {}).value || "";
      if (!v) { toast("Escolha a hora.", true); return; }
      enviarMural({ op: "hora", id: el.dataset.id, hora: v }, function (r) { if (r && r.ok) { fecharModal(); som("alfinete"); toast("🕐 Marcado às " + v); } });
    },
    tirarHora: function (el) { enviarMural({ op: "hora", id: el.dataset.id, hora: "" }, function (r) { if (r && r.ok) fecharModal(); }); },
    depoimento: function (el) { fecharModal(); investigar("suspeito", el.dataset.id); },
    perguntar: function (el) {
      var t = document.getElementById("perguntaTxt"), txt = t ? t.value.trim() : "";
      if (txt.length < 4) { toast("Escreva a sua pergunta.", true); if (t) t.focus(); return; }
      if (V.minhasAcoes <= 0) { toast("Suas ações desta rodada acabaram. Espere a próxima.", true); return; }
      var sus = V.caso.suspeitos.filter(function (x) { return x.id === el.dataset.id; })[0] || {};
      ui.rascunhoPergunta = "";
      enviarAcao({ tipo: "perguntar", id: el.dataset.id, texto: txt }, function (r) {
        if (r && r.ok) { fecharModal(); som("papel"); toast("⏳ " + sus.nome + " está pensando na resposta…"); }
      });
    },
    sugestao: function (el) { var t = document.getElementById("perguntaTxt"); if (t) { t.value = el.dataset.t; ui.rascunhoPergunta = t.value; t.focus(); } },
    verResposta: function (el) {
      var e = (V.caderno || []).filter(function (x) { return x.pid === el.dataset.id; })[0];
      if (e) mostrarResposta(e);
    },
    publicar: function (el) { enviarAcao({ tipo: "publicar", pid: el.dataset.id }, function (r) { if (r && r.ok) { som("alfinete"); toast("📌 Publicada no quadro"); } }); },
    publicarModal: function (el) { fecharModal(); acoes.publicar(el); },
    confirmar: function (el) { enviarAcao({ tipo: "confirmar", itemId: el.dataset.id }, function (r) { if (r && r.ok) { vibrar(30); som("carimbo"); toast("✔ Confirmada"); } }); },
    fotografar: function (el) {
      var q = V.quadro.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (!q) return;
      var lc = localDaOrigem(q.origem);
      abrirModal('<h2 class="titulo" style="font-size:22px;margin-bottom:6px">📷 Fotografar a pista</h2>' +
        '<p class="pequeno">Você vai fotografar <b>' + esc(lc.nome) + '</b> para conferir a pista de <b>' + esc(q.autor) + '</b>:</p><div class="papel"><div class="texto">' + esc(q.texto) + "</div></div>" +
        '<p class="mudo pequeno">Gasta 1 ação desta rodada. Restam ' + V.fotosRestantes + " foto" + (V.fotosRestantes > 1 ? "s" : "") + ' no filme. Só você vê o resultado: depois, conte (ou não) ao grupo.</p>' +
        '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Agora não</button><button class="btn prim" data-a="fotografarOk" data-id="' + q.id + '">📷 Fotografar</button></div>');
    },
    fotografarOk: function (el) {
      enviarAcao({ tipo: "fotografar", itemId: el.dataset.id }, function (r) {
        if (!r || !r.ok || !r.nova) return;
        var e = r.nova, lc = V.caso.locais.filter(function (x) { return x.id === e.local; })[0] || {};
        som("tecla"); setTimeout(function () { som(e.confere ? "carimbo" : "novidade"); }, 450);
        vibrar(80);
        abrirModal('<div class="centro flash-camera">' + Fotos.polaroide({ chave: V.caso.id + ":" + e.local, icone: lc.icone, legenda: lc.nome, selo: e.confere ? "confere" : "nao" }) + "</div>" +
          '<div class="papel" style="margin-top:14px"><div class="origem">' + esc(e.origem) + '</div><div class="texto">' + esc(e.texto) + "</div></div>" +
          '<div class="pilha" style="margin-top:14px"><button class="btn prim" data-a="publicarModal" data-id="' + esc(e.pid) + '">📌 Mostrar a foto no quadro</button><button class="btn fantasma" data-a="fechar">Guardar no meu caderno</button></div>');
      });
    },
    iaFotos: function () {
      if (!IA.config().chave) { acoes.iaConfig(); toast("Primeiro, configure a chave do Gemini."); return; }
      var id = V && (V.caso ? V.caso.id : V.config.casoId);
      var caso = CASOS.filter(function (c) { return c.id === id; })[0];
      if (!caso) return;
      if (ui.fotosGerando) return;
      ui.fotosGerando = true;
      abrirModal('<div class="gerando-ia"><div class="lupa-ia">📷</div><div class="titulo" style="font-size:22px">Fotografando as cenas…</div><div id="fotoProg" class="mudo pequeno" style="margin-top:8px">Preparando a câmera…</div>' +
        '<div class="barra"><span id="fotoBarra" style="width:4%"></span></div><div class="mudo pequeno" style="margin-top:12px">São 6 fotos. Cada uma leva alguns segundos.</div></div>');
      Fotos.gerarIA(caso, function (msg, i, tot) {
        var p = document.getElementById("fotoProg"); if (p) p.textContent = msg;
        var b = document.getElementById("fotoBarra"); if (b) b.style.width = Math.max(4, Math.round(i / tot * 100)) + "%";
      }).then(function (n) {
        ui.fotosGerando = false;
        fecharModal();
        toast(n ? "📷 " + n + " fotos criadas pela IA para \"" + caso.titulo + "\"!" : "A IA não devolveu nenhuma foto. O jogo segue com as fotos ilustradas.", !n);
        if (H) hostDifundir(); else render();
      }).catch(function (e) {
        ui.fotosGerando = false;
        abrirModal('<h2 class="titulo" style="font-size:22px;margin-bottom:8px">Fotos da IA</h2><p>' + esc(e.message) + '</p><div class="pilha"><button class="btn fantasma" data-a="iaConfig">Configurar IA</button><button class="btn prim" data-a="fechar">Ok</button></div>');
        if (H) hostDifundir();
      });
    },
    segredo: function () { ui.segredo = !ui.segredo; render(); },
    escolherFalsa: function (el) { ui.falsa.idx = parseInt(el.dataset.i, 10); ui.falsa.origem = ""; render(); },
    plantar: function () {
      var s = V.segredo, texto;
      var sel = document.getElementById("falsaOrigem");
      if (sel) ui.falsa.origem = sel.value;
      if (ui.falsa.idx === -1) { var ta = document.getElementById("falsaTexto"); texto = ta ? ta.value : ui.falsa.texto; }
      else texto = s.falsas[ui.falsa.idx].texto;
      enviarAcao({ tipo: "plantar", texto: texto, origem: ui.falsa.origem }, function (r) {
        if (r && r.ok) { ui.falsa = { idx: null, texto: "", origem: "" }; som("alfinete"); toast("🩸 Pista falsa plantada"); render(); }
      });
    },
    enviarChat: function () {
      var i = document.getElementById("chatin");
      if (!i || !i.value.trim()) return;
      enviarAcao({ tipo: "chat", texto: i.value });
      i.value = "";
      i.focus();
    },
    votoOp: function (el) { ui.voto[el.dataset.campo] = el.dataset.id; ui.voto._editando = true; render(); },
    votar: function () {
      var v = ui.voto;
      enviarAcao({ tipo: "votar", culpado: v.culpado, metodo: v.metodo, motivo: v.motivo, cumplice: v.cumplice }, function (r) {
        if (r && r.ok) { ui.voto._editando = false; vibrar(60); som("martelo"); toast("⚖️ Voto registrado"); }
      });
    },
    novaPartida: function () {
      if (H && H.solo) { H.motor.novaPartida(); var r = H.motor.iniciar(); if (!r.ok) toast(r.erro || "Erro", true); hostDifundir(); return; }
      enviarAcao({ tipo: "novaPartida" });
    },
    solo: function (el) {
      var n = document.getElementById("nome");
      if (n) meuNome = (n.value || "").trim() || meuNome;
      meuNome = meuNome || "Detetive";
      LS.set("ca_nome", meuNome);
      if (el && el.dataset && el.dataset.v) ui.soloNivel = el.dataset.v;
      var nivel = ui.soloNivel || "Fácil";
      abrirModal('<h2 class="titulo" style="font-size:24px;margin-bottom:6px">Jogar sozinho</h2>' +
        '<p class="mudo pequeno" style="margin-top:0">Você investiga com 3 detetives robôs. Um deles é o <b>Cúmplice</b> e vai tentar te enganar com pistas falsas. Funciona sem internet.</p>' +
        '<div class="segmento niveis" style="margin-bottom:8px">' + NIVEIS.map(function (x) {
          return '<button data-a="solo" data-v="' + x[0] + '" class="' + (x[0] === nivel ? "sel" : "") + '">' + x[1] + " " + x[0] + "</button>";
        }).join("") + '</div><div class="mudo pequeno" style="margin-bottom:10px">' + esc(NIVEIS.filter(function (x) { return x[0] === nivel; })[0][2]) + '</div><div class="casos">' +
        casosDoNivel(CASOS, nivel).map(function (c) {
          return '<button class="caso-opcao" data-a="soloCaso" data-id="' + c.id + '"><div class="capa">' + c.capa + '</div><div><div class="t">' + esc(c.titulo) +
            (c.ia ? '<span class="dif">✨ IA</span>' : "") + '</div><div class="s">' + esc(c.subtitulo) + "</div></div></button>";
        }).join("") + '</div><button class="btn fantasma btn-ia" data-a="iaGerar" data-origem="solo" style="margin-top:10px">✨ Gerar caso novo com IA</button>' +
        '<button class="btn fantasma" data-a="fechar" style="margin-top:8px">Voltar</button>');
    },
    soloCaso: function (el) { fecharModal(); iniciarSolo(el.dataset.id, null); },
    retomarSolo: function () { var x = LS.get("ca_solo", null); if (x && x.estado) iniciarSolo(null, x.estado); },
    esquecerSolo: function () { LS.del("ca_solo"); ui.shell = null; render(); }
  };

  function abrirPedidoPrisao() {
    var c = V.caso, pp = ui.pp || {};
    function grupo(titulo, campo, lista) {
      return '<h2 class="secao">' + titulo + '</h2><div class="opcoes">' + lista.map(function (x) {
        return '<button class="opcao' + (pp[campo] === x.id ? " sel" : "") + '" data-a="ppOp" data-campo="' + campo + '" data-id="' + x.id + '"><span class="marca"></span><span>' + esc(x.nome) + "</span></button>";
      }).join("") + "</div>";
    }
    var completo = pp.culpado && pp.metodo && pp.motivo;
    var h = '<h2 class="titulo" style="font-size:24px;margin-bottom:4px">⚖️ Pedir prisão</h2>' +
      '<p class="mudo pequeno" style="margin-top:0">Você só tem <b>um</b> pedido por partida. ' + (V.solo ? "" : "O grupo tem 60 segundos para apoiar: precisa de mais da metade.") + "</p>";
    h += grupo("Quem você quer prender?", "culpado", c.suspeitos) + grupo("Como foi feito?", "metodo", c.metodos) + grupo("Por quê?", "motivo", c.motivos);
    h += '<div class="cartao pequeno regras-prisao"><b>✅ Se acertar:</b> o caso fecha na hora e você ganha bônus (mais cedo, mais pontos). Errou o "como" ou o "por quê"? O culpado é preso com provas fracas, sem bônus.<br><b>❌ Se errar o culpado:</b> você é afastado do caso e perde 2 pontos, ' + (V.solo ? "" : "quem apoiou perde 1, ") + "e o culpado destrói uma pista.</div>";
    h += '<div class="linha-flex" style="margin-top:14px"><button class="btn fantasma" data-a="fechar">Agora não</button><button class="btn prim" data-a="ppConfirmar"' + (completo ? "" : " disabled") + ">⚖️ Pedir prisão</button></div>";
    var m = document.querySelector("#modal .folha");
    if (!$modal.hidden && m && m.querySelector("[data-a=ppConfirmar]")) { var st = m.scrollTop; m.innerHTML = '<div class="alca"></div>' + h; m.scrollTop = st; }
    else abrirModal(h);
  }

  function abrirInterrogatorio(id) {
    var s = V.caso.suspeitos.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    var n = (V.vistos && V.vistos["d:" + id]) || 0, acoesOk = V.minhasAcoes > 0;
    var pend = (V.perguntando || [])[0];
    var minhas = (V.caderno || []).filter(function (e) { return e.tipo === "pergunta" && e.sus === id; });
    var sug = ["Onde você estava na hora do crime?", "Quem você viu perto da vítima?", "Por que você discutiu com a vítima?", "O que você acha que aconteceu?"];
    var h = '<div class="interroga-cab"><div class="retrato">' + iniciais(s.nome) + '</div><div><div class="n">' + esc(s.nome) + '</div><div class="mudo pequeno">' + s.idade + " anos · " + esc(s.ocupacao) + "</div></div></div>";
    h += '<button class="btn" data-a="depoimento" data-id="' + id + '"' + (n >= 2 || !acoesOk ? " disabled" : "") + ">🗣️ " + (n >= 2 ? "Depoimento já ouvido" : "Ouvir o depoimento (" + n + "/2)") + "</button>";
    h += '<h2 class="secao">💬 Pergunta livre</h2>';
    if (pend) h += '<div class="cartao pequeno pensando">⏳ ' + esc((V.caso.suspeitos.filter(function (x) { return x.id === pend.sus; })[0] || {}).nome || "O suspeito") + " está pensando na sua pergunta: <i>" + esc(pend.pergunta) + "</i></div>";
    else {
      h += '<textarea id="perguntaTxt" class="entrada" maxlength="200" rows="2" placeholder="Ex.: Onde você estava às 22h?">' + esc(ui.rascunhoPergunta || "") + "</textarea>";
      h += '<div class="sugestoes">' + sug.map(function (t) { return '<button class="chip" data-a="sugestao" data-t="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div>";
      h += '<button class="btn prim" data-a="perguntar" data-id="' + id + '"' + (acoesOk ? "" : " disabled") + ">💬 Perguntar · gasta 1 ação</button>";
    }
    h += '<p class="mudo pequeno">' + esc(s.nome.split(" ")[0]) + " responde no personagem, com a IA. Atenção: o culpado pode mentir!</p>";
    if (minhas.length) h += '<h2 class="secao">Suas perguntas a ' + esc(s.nome.split(" ")[0]) + "</h2>" + minhas.map(function (e) {
      return '<div class="papel"><div class="texto"><b>Você:</b> ' + esc(e.pergunta) + "<br><b>" + esc(s.nome.split(" ")[0]) + ":</b> " + esc(e.resposta) + "</div></div>";
    }).join("");
    h += '<button class="btn fantasma" data-a="fechar" style="margin-top:10px">Voltar</button>';
    abrirModal(h);
    var t = document.getElementById("perguntaTxt");
    if (t) t.addEventListener("input", function () { ui.rascunhoPergunta = t.value; });
  }
  function mostrarResposta(e) {
    var s = V.caso.suspeitos.filter(function (x) { return x.id === e.sus; })[0] || { nome: "Suspeito" };
    vibrar(50); som("papel");
    var pub = V.publicadas && V.publicadas[e.pid];
    abrirModal('<div class="interroga-cab"><div class="retrato">' + iniciais(s.nome) + '</div><div><div class="n">' + esc(s.nome) + '</div><div class="mudo pequeno">respondeu à sua pergunta</div></div></div>' +
      '<div class="papel"><span class="alfinete"></span><div class="origem">Você perguntou</div><div class="texto"><i>' + esc(e.pergunta) + '</i></div></div>' +
      '<div class="papel resposta"><div class="origem">' + esc(s.nome) + ' disse</div><div class="texto">' + esc(e.resposta) + "</div></div>" +
      '<div class="pilha" style="margin-top:14px">' + (pub ? "" : '<button class="btn prim" data-a="publicarModal" data-id="' + esc(e.pid) + '">📌 Publicar no quadro</button>') + '<button class="btn fantasma" data-a="fechar">Guardar só no meu caderno</button></div>');
  }

  function investigar(alvo, id) {
    if (V.minhasAcoes <= 0) { toast("Suas ações desta rodada acabaram. Espere a próxima.", true); return; }
    var esgot = alvo === "local" ? (V.vistos["l:" + id] || 0) >= 2 : (V.vistos["d:" + id] || 0) >= 2;
    if (esgot) { toast("Você já descobriu tudo o que havia aqui.", true); return; }
    enviarAcao({ tipo: "investigar", alvo: alvo, id: id }, function (r) {
      if (!r || !r.ok || !r.nova) return;
      mostrarPista(alvo, id, r.nova);
    });
  }
  function mostrarPista(alvo, id, e, objeto) {
      vibrar(50);
      som("papel");
      var foto = "";
      if (alvo === "local") {
        var lc = V.caso.locais.filter(function (x) { return x.id === id; })[0] || {};
        foto = '<div class="centro" style="margin-bottom:14px">' + Fotos.polaroide({ chave: V.caso.id + ":" + id, icone: lc.icone, legenda: lc.nome + (objeto ? " · " + objeto : "") }) + "</div>";
      }
      abrirModal(foto + '<div class="mudo pequeno centro" style="margin-bottom:12px">' + (alvo === "local" ? "Você encontrou:" : "O suspeito disse:") + "</div>" +
        '<div class="papel"><span class="alfinete"></span><div class="origem">' + esc(e.origem) + '</div><div class="texto">' + esc(e.texto) + "</div></div>" +
        '<div class="pilha" style="margin-top:18px"><button class="btn prim" data-a="publicarModal" data-id="' + esc(e.pid) + '">📌 Publicar no quadro</button><button class="btn fantasma" data-a="fechar">Guardar só no meu caderno</button></div>');
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-a]");
    if (!el || el.disabled) return;
    var f = acoes[el.dataset.a];
    if (f) { e.preventDefault(); f(el); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "falsaTexto") ui.falsa.texto = e.target.value;
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "falsaOrigem") ui.falsa.origem = e.target.value;
  });
  document.addEventListener("focusout", function () {
    setTimeout(function () {
      ["corpo", "base", "topo", "abas"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el._pendente && !campoFocado(el)) { el._pendente = false; el._h = null; }
      });
      if (V) render();
    }, 150);
  });

  /* Botão "voltar" do Android: o app nativo chama window.voltarAndroid() */
  window.voltarAndroid = function () {
    if (!$modal.hidden) { fecharModal(); return true; }
    if (ui.c3) { ui.c3.fechar(); return true; }
    if (V && ui.shell === "jogo" && ui.aba !== "investigar" && ui.aba !== "acusar") {
      ui.aba = V.fase === "votacao" ? "acusar" : "investigar"; render(); return true;
    }
    if (ui.carregando && !V) { sairParaInicio(); return true; }
    return false;
  };

  /* Relógio, pings e verificação de conexão */
  setInterval(function () {
    atualizarRelogio();
    if (modo === "host" && H) {
      if (H.motor.tick()) hostDifundir();
    }
  }, 1000);
  setInterval(function () {
    var agora = Date.now();
    if (modo === "host" && H) {
      for (var cid in H.conns) {
        H.rede.enviar(cid, { t: "ping" });
        if (H.visto[cid] && agora - H.visto[cid] > 20000) { H.rede.derrubar(cid); hostFechou(cid); }
      }
    } else if (modo === "cliente" && C && C.entrou && conectado && agora - C.ultimo > 15000) {
      clientePerdeu();
    }
  }, 5000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (modo === "cliente" && C && C.entrou && Date.now() - C.ultimo > 6000) clientePerdeu();
    // o anfitrião voltou do segundo plano: manda o estado atual para todo mundo na hora
    if (modo === "host" && H) setTimeout(hostDifundir, 500);
  });
  // a cada 4 s, atualiza a faixa de conexão (para mostrar "esperando o anfitrião" na hora certa)
  setInterval(function () { if (!conectado && V) pinta("faixa", faixa()); }, 4000);

  /* ---------------- Tela acesa no navegador (no app, o Android já cuida disso) ---------------- */
  var travaTela = null;
  function manterTelaAcesa() {
    if (window.Android || !navigator.wakeLock || document.visibilityState !== "visible") return;
    if (!V) { if (travaTela) { try { travaTela.release(); } catch (e) {} travaTela = null; } return; }
    if (travaTela) return;
    navigator.wakeLock.request("screen").then(function (t) { travaTela = t; t.addEventListener("release", function () { travaTela = null; }); }).catch(function () {});
  }
  setInterval(manterTelaAcesa, 5000);
  document.addEventListener("visibilitychange", manterTelaAcesa);

  /* ---------------- Convite por link ---------------- */
  // Chamado pelo Android quando alguém toca num link de convite (casoaberto://entrar?c=ABCD)
  window.abrirConvite = function (cod) {
    try { if (window.Android && Android.convite) Android.convite(); } catch (e) {}
    cod = String(cod || "");
    if (/^truco:/i.test(cod)) { location.href = "truco.html" + (sufixoUrl() ? sufixoUrl() + "&" : "?") + "sala=" + cod.slice(6).replace(/[^A-Za-z]/g, "").toUpperCase(); return; }
    cod = cod.toUpperCase().replace(/[^A-Z]/g, "");
    if (cod.length !== 4) return;
    if (V && V.codigo === cod) { toast("Você já está na sala " + cod + "."); return; }
    if (V || modo) {
      ui.conviteCod = cod;
      abrirModal("<p>Você recebeu um convite para a sala <b class=\"maquina\">" + esc(cod) + "</b>.</p><p class=\"mudo pequeno\">Para entrar nela, você sai da partida em que está agora.</p>" +
        '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Ficar aqui</button><button class="btn prim" data-a="aceitarConvite">Entrar na sala</button></div>');
      return;
    }
    entrarPorConvite(cod);
  };
  function entrarPorConvite(cod) {
    ui.hub = false;
    if (!meuNome) {
      ui.shell = null; render();
      var c = document.getElementById("codigo"); if (c) c.value = cod;
      var n = document.getElementById("nome"); if (n) n.focus();
      toast("Convite para a sala " + cod + ": digite seu nome e toque em Entrar.");
      return;
    }
    ui.carregando = "Entrando na sala " + cod + "…";
    conectarCliente(cod);
  }
  acoes.aceitarConvite = function () {
    var cod = ui.conviteCod; ui.conviteCod = null; fecharModal();
    if (!cod) return;
    sairDaSalaSilencioso();
    entrarPorConvite(cod);
  };
  function sairDaSalaSilencioso() {
    if (modo === "host" && H && !H.solo) { try { H.rede.fechar(); } catch (e) {} LS.del("ca_host"); }
    if (modo === "cliente") LS.del("ca_cliente");
    sairParaInicio();
  }

  /* ---------------- Aviso de versão nova ---------------- */
  var REPO_API = "https://api.github.com/repos/rhmwmdjg-wq/caso-aberto/releases/latest";
  function versaoInstalada() { try { return window.Android && Android.versao ? Number(Android.versao()) || 0 : 0; } catch (e) { return 0; } }
  function verificarAtualizacao(forcar) {
    var atual = versaoInstalada();
    if (!atual && !forcar) return;
    var cache = LS.get("ca_atualiz", null);
    function aplicar(n, avisar) {
      ui.novaVersao = n > atual ? n : 0;
      if (ui.novaVersao) {
        if (!V) { ui.shell = null; render(); }
        else if (avisar) toast("⬇️ Saiu a versão 1." + n + " do jogo. Atualize quando terminar a partida.");
      } else if (forcar) toast(atual ? "✅ Você já tem a versão mais nova (1." + atual + ")." : "Não deu para conferir a versão.");
    }
    if (!forcar && cache && Date.now() - cache.ts < 3 * 3600e3) { aplicar(cache.n, false); return; }
    fetch(REPO_API, { headers: { Accept: "application/vnd.github+json" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var m = j && /(\d+)\.(\d+)/.exec(j.tag_name || "");
      if (!m) { if (forcar) toast("Não deu para conferir agora. Tente mais tarde.", true); return; }
      var n = Number(m[2]);
      var avisar = !cache || cache.n !== n;
      LS.set("ca_atualiz", { ts: Date.now(), n: n });
      aplicar(n, avisar);
    }).catch(function () { if (forcar) toast("Sem internet para conferir a versão.", true); });
  }
  function avisoAtualizacao() {
    if (!ui.novaVersao || ui.dispensouVersao === ui.novaVersao) return "";
    return '<div class="aviso-atualizar"><b>⬇️ Versão nova do jogo: 1.' + ui.novaVersao + '</b><div class="mudo pequeno">Você está na 1.' + versaoInstalada() + '. Atualize para ter as melhorias e correções. Seus amigos também precisam atualizar.</div>' +
      '<div class="linha-flex"><button class="btn prim pequeno" data-a="baixarVersao">Baixar e instalar</button><button class="btn fantasma pequeno" data-a="dispensarVersao">Depois</button></div></div>';
  }
  acoes.hub = function () { ui.hub = true; ui.shell = null; render(); };
  acoes.hubCaso = function () { ui.hub = false; ui.shell = null; render(); };
  acoes.hubTruco = function () { location.href = "truco.html" + sufixoUrl(); };
  acoes.baixarVersao = function () {
    var url = "https://github.com/rhmwmdjg-wq/caso-aberto/releases/download/v1." + ui.novaVersao + "/CasoAberto.apk";
    if (window.Android && Android.abrirLink) Android.abrirLink(url); else window.open(url, "_blank");
    toast("Baixando… Depois, abra o arquivo CasoAberto.apk para instalar por cima.");
  };
  acoes.dispensarVersao = function () { ui.dispensouVersao = ui.novaVersao; ui.shell = null; render(); };
  acoes.procurarVersao = function () { verificarAtualizacao(true); };
  setTimeout(function () { verificarAtualizacao(false); }, 2500);
  setInterval(function () { verificarAtualizacao(false); }, 3 * 3600e3);

  // Ao abrir o app, volta sozinho para a sala em que a pessoa estava
  (function voltarSozinho() {
    var conv = "";
    try { conv = window.Android && Android.convite ? Android.convite() : ""; } catch (e) {}
    if (!conv) {
      conv = ((/[?&]sala=([A-Za-z]{4})/.exec(location.search) || [])[1] || "");
      // tira o código do endereço, para não entrar de novo ao recarregar a página
      if (conv) try { history.replaceState(null, "", location.pathname + location.search.replace(/([?&])sala=[A-Za-z]{4}&?/, "$1").replace(/[?&]$/, "")); } catch (e) {}
    }
    if (conv && /^truco:/i.test(conv)) { window.abrirConvite(conv); return; }
    if (conv) { ui.hub = false; ui.shell = null; render(); entrarPorConvite(conv.toUpperCase()); return; }
    var agora = Date.now(), lim = 3 * 3600e3;
    // estava numa mesa de truco? volta para lá
    if (!/[?&]hub=1/.test(location.search) && LS.get("jogo_atual", "") === "truco") {
      var th = LS.get("tr_host", null), tc = LS.get("tr_cliente", null), ts = LS.get("tr_solo", null);
      if ((th && agora - th.ts < lim) || (tc && agora - tc.ts < lim) || (ts && ts.estado && ts.estado.fase === "jogo" && agora - ts.ts < lim)) { location.replace("truco.html" + sufixoUrl()); return; }
    }
    ui.hub = !/[?&]caso=1/.test(location.search);
    var host = LS.get("ca_host", null), cli = LS.get("ca_cliente", null);
    if (host && host.estado && agora - host.ts < lim) {
      if (!meuNome) meuNome = "Anfitrião";
      iniciarHost(host.codigo, host.estado);
      setTimeout(function () { toast("Reabrindo a sua sala " + host.codigo + "…"); }, 300);
      return;
    }
    if (cli && cli.codigo && meuNome && agora - cli.ts < lim) {
      ui.carregando = "Voltando para a sala " + cli.codigo + "…";
      conectarCliente(cli.codigo, false, true);
      return;
    }
    render();
  })();
})();
