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
    return r;
  }

  function hostDifundir() {
    if (!H) return;
    function comFotos(v) { if (v.caso && window.Fotos) v.fotosIA = Fotos.temIA(v.caso.id); return v; }
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
    }, 2500 + Math.random() * 4500);
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
    if (Date.now() - C.perdeuEm > 15 * 60e3) {
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
    return '<div class="faixa-conexao">📡 Conexão perdida: reconectando' + (C && C.tentativas > 1 ? " (tentativa " + C.tentativas + ")" : "") + '… <button class="link" data-a="reconectarAgora" style="color:#fff;text-decoration:underline;padding:0 4px">Tentar agora</button></div>';
  }

  function render() {
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
      '<div class="logo"><span class="lupa">🔍</span><h1 class="titulo">CASO<span>.</span>ABERTO</h1><div><span class="slogan digita">um de vocês está mentindo</span></div></div>' +
      '<div id="retomar"></div>' +
      '<label class="campo"><span>Seu nome de detetive</span><input id="nome" class="entrada" maxlength="18" autocomplete="off" placeholder="Ex.: Ruan"></label>' +
      '<div class="pilha"><button class="btn prim" data-a="criar">🕵️ Criar sala</button><button class="btn fantasma" data-a="solo">🕯️ Jogar sozinho <span class="mudo pequeno">(sem internet)</span></button></div>' +
      '<div class="ou">ou entre com um código</div>' +
      '<div class="linha-flex" style="align-items:stretch"><input id="codigo" class="entrada codigo" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="····" style="flex:1.4"><button class="btn latao" data-a="entrar" style="width:auto">Entrar</button></div>' +
      '<div class="centro" style="margin-top:22px"><button class="link" data-a="regras">📖 Como jogar</button> · <button class="link" data-a="config">🎵 Som e efeitos</button></div>' +
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
    var h = '<div class="conteudo">';
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
      return '<' + (clicavel ? 'button data-a="interrogar" data-id="' + s.id + '"' : "div") + ' class="suspeito-linha' + (clicavel && ((V.vistos["d:" + s.id] || 0) >= 2) ? " esgotado" : "") + '"><div class="retrato">' + iniciais(s.nome) + '</div><div><div class="n">' + esc(s.nome) + ' <span class="mudo pequeno">· ' + s.idade + ' anos</span></div><div class="d">' + esc(s.ocupacao) + ". " + esc(s.descricao) + "</div></div>" + info + "</" + (clicavel ? "button" : "div") + ">";
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
    pinta("corpo", '<div class="conteudo">' + html + "</div>");
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
    var el = document.getElementById("relogio");
    if (!el || !V) return;
    if (!V.fimRodadaEm) { el.textContent = ""; return; }
    var resta = Math.max(0, Math.round((V.fimRodadaEm - (Date.now() + offsetRelogio)) / 1000));
    el.textContent = "⏱ " + Math.floor(resta / 60) + ":" + ("0" + (resta % 60)).slice(-2);
    el.className = "relogio" + (resta <= 30 ? " urgente" : "");
  }

  function abaInvestigar() {
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
      h += '<button class="local' + (v >= l.total ? " esgotado" : "") + '" data-a="examinar" data-id="' + l.id + '"><span class="ic">' + l.icone + '</span><span class="n">' + esc(l.nome) +
        '</span><span class="p">' + (v >= l.total ? "✓ examinado" : v + "/" + l.total + " pistas") + "</span></button>";
    });
    h += '</div><h2 class="secao">Interrogar um suspeito</h2>' + listaSuspeitos(true);
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
    var h = '<div class="mudo pequeno" style="margin-bottom:12px">Pistas que o grupo compartilhou. Se você encontrou a mesma pista, toque em <b>Eu também vi</b>: o jogo confere no seu caderno, então pista confirmada é pista verdadeira.</div>';
    if (!V.quadro.length) return h + '<div class="quadro-mural"><div class="vazio">O quadro está vazio.<br>Publique suas descobertas pelo Caderno.</div></div>';
    var html = V.quadro.slice().reverse().map(cartaoPista).join("");
    marcarDepois(ui.animQ, V.quadro.filter(function (q) { return !ui.animQ[q.id]; }).map(function (q) { return q.id; }));
    marcarDepois(ui.animC, V.quadro.filter(function (q) { return q.confirmados.length && !ui.animC[q.id]; }).map(function (q) { return q.id; }));
    return h + '<div class="quadro-mural">' + html + "</div>";
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
    cancelar: function () { sairParaInicio(); },
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
        if (ui.iaDepois) { var o = ui.iaDepois; ui.iaDepois = null; setTimeout(function () { acoes.iaGerar({ dataset: { origem: o } }); }, 900); }
      }).catch(function (e) {
        var st2 = document.getElementById("iaStatus");
        if (st2) st2.innerHTML = '<span class="errado">' + esc(e.message) + "</span>";
      });
    },
    iaApagar: function () { IA.salvarConfig({ chave: "", modelo: "" }); ui.iaModelos = []; acoes.iaConfig(); toast("Chave apagada deste celular."); },
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
      else if (window.Som) { Som.definir(k, on); if (on && k === "efeitos") som("carimbo"); }
    },
    convidar: function () {
      compartilhar("🔍 Bora jogar CASO ABERTO! Abra o app, toque em \"Entrar\" e use o código da sala: " + V.codigo);
    },
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
        (V.solo ? "" : '<button class="btn" data-a="convidarJogo">📨 Ver código da sala (' + esc(V.codigo) + ')</button>') +
        '<button class="btn fantasma" data-a="sair">🚪 ' + (V.solo ? "Sair do caso" : "Sair da sala") + '</button><button class="btn fantasma" data-a="fechar">Voltar</button></div>');
    },
    convidarJogo: function () { fecharModal(); toast("Código da sala: " + V.codigo); },
    sair: function () {
      abrirModal("<p>" + (H && H.solo ? "Sair do caso? A investigação será descartada." : modo === "host" ? "Você é o anfitrião. Se sair, <b>a sala fecha para todos</b>." : "Sair da sala?") + "</p>" +
        '<div class="linha-flex"><button class="btn fantasma" data-a="fechar">Ficar</button><button class="btn prim" data-a="sairOk">Sair</button></div>');
    },
    sairOk: function () { sairDaSala(); },
    aba: function (el) { ui.aba = el.dataset.id; var c = document.getElementById("corpo"); if (c) { c._h = null; c.scrollTop = 0; } render(); },
    examinar: function (el) { investigar("local", el.dataset.id); },
    interrogar: function (el) { investigar("suspeito", el.dataset.id); },
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

  function investigar(alvo, id) {
    if (V.minhasAcoes <= 0) { toast("Suas ações desta rodada acabaram. Espere a próxima.", true); return; }
    var esgot = alvo === "local" ? (V.vistos["l:" + id] || 0) >= 2 : (V.vistos["d:" + id] || 0) >= 2;
    if (esgot) { toast("Você já descobriu tudo o que havia aqui.", true); return; }
    enviarAcao({ tipo: "investigar", alvo: alvo, id: id }, function (r) {
      if (!r || !r.ok || !r.nova) return;
      vibrar(50);
      som("papel");
      var e = r.nova;
      var foto = "";
      if (alvo === "local") {
        var lc = V.caso.locais.filter(function (x) { return x.id === id; })[0] || {};
        foto = '<div class="centro" style="margin-bottom:14px">' + Fotos.polaroide({ chave: V.caso.id + ":" + id, icone: lc.icone, legenda: lc.nome }) + "</div>";
      }
      abrirModal(foto + '<div class="mudo pequeno centro" style="margin-bottom:12px">' + (alvo === "local" ? "Você encontrou:" : "O suspeito disse:") + "</div>" +
        '<div class="papel"><span class="alfinete"></span><div class="origem">' + esc(e.origem) + '</div><div class="texto">' + esc(e.texto) + "</div></div>" +
        '<div class="pilha" style="margin-top:18px"><button class="btn prim" data-a="publicarModal" data-id="' + esc(e.pid) + '">📌 Publicar no quadro</button><button class="btn fantasma" data-a="fechar">Guardar só no meu caderno</button></div>');
    });
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
    if (document.visibilityState === "visible" && modo === "cliente" && C && C.entrou && Date.now() - C.ultimo > 12000) clientePerdeu();
  });

  render();
})();
