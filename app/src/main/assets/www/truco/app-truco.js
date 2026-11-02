/* =========================================================
   TRUCO DO NORTE DE MINAS — Interface, sala online e robôs
   ========================================================= */
(function () {
  "use strict";

  var $app = document.getElementById("app");
  var $modal = document.getElementById("modal");
  var $toasts = document.getElementById("toasts");
  var A = window.ArteTruco, S = window.SomTruco;

  /* ---------------- Utilidades ---------------- */
  var PERFIL = (/[?&]perfil=(\w+)/.exec(location.search) || [])[1] || "";
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(PERFIL + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(PERFIL + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(PERFIL + k); } catch (e) {} }
  };
  function sufixo() { var p = []; if (PERFIL) p.push("perfil=" + PERFIL); if (Rede.local) p.push("local=1"); return p.join("&"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function gerarCodigo() { var l = "ABCDEFGHJKLMNPQRSTUVWXYZ", c = ""; for (var i = 0; i < 4; i++) c += l[Math.floor(Math.random() * l.length)]; return c; }
  function gerarToken() { return "t" + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function vibrar(ms) { try { if (window.Android && Android.vibrar) Android.vibrar(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function toast(txt, erro) {
    var d = document.createElement("div");
    d.className = "toast" + (erro ? " erro" : "");
    d.textContent = txt;
    $toasts.appendChild(d);
    setTimeout(function () { d.style.opacity = "0"; }, 2600);
    setTimeout(function () { d.remove(); }, 3000);
  }
  function abrirModal(html, cls) { $modal.innerHTML = '<div class="folha ' + (cls || "") + '"><div class="alca"></div>' + html + "</div>"; $modal.hidden = false; }
  function fecharModal() { $modal.hidden = true; $modal.innerHTML = ""; ui.modal = null; }
  $modal.addEventListener("click", function (e) { if (e.target === $modal) fecharModal(); });
  var PERS = {}; Truco.PERSONAGENS.forEach(function (p) { PERS[p.id] = p; });

  /* ---------------- Estado ---------------- */
  var token = LS.get("ca_token", null);
  if (!token) { token = gerarToken(); LS.set("ca_token", token); }
  var meuNome = LS.get("ca_nome", "");
  var V = null, modo = null, conectado = true, H = null, C = null;
  var ui = { carregando: "", ultimoEvento: -1, chatVisto: 0, coberta: false, forte: false, bolhas: {}, modal: null, ultimaFase: null, tela: null };
  A.definirTema(LS.get("tr_tema", "classico"));

  /* ================= ANFITRIÃO ================= */
  function iniciarHost(codigo, estadoSalvo, solo, tentativa) {
    tentativa = tentativa || 0;
    modo = "host";
    ui.carregando = solo ? "" : estadoSalvo ? "Reabrindo a mesa " + codigo + "…" : "Arrumando a mesa…";
    render();
    var motor = new Truco({ codigo: codigo, estado: estadoSalvo || null });
    motor.s.codigo = codigo;
    var meu = motor.entrar(token, meuNome || "Anfitrião", true);
    motor.s.hostId = meu.id;
    if (estadoSalvo) Object.keys(motor.s.jogadores).forEach(function (id) { var j = motor.s.jogadores[id]; if (id !== meu.id && !j.robo) j.online = false; });
    H = { motor: motor, meuId: meu.id, conns: {}, visto: {}, codigo: codigo, salvarEm: 0, solo: !!solo, vozes: {} };
    var minhas = minhasVozes(); if (minhas) { H.vozes[meu.id] = minhas; S.vozesCustom[meu.id] = minhas; }
    LS.set("jogo_atual", "truco");
    if (solo) {
      H.rede = { enviar: function () {}, derrubar: function () {}, fechar: function () {} };
      conectado = true;
      hostDifundir();
      return;
    }
    H.rede = Rede.criarHost("TR" + codigo, {
      pronto: function () { conectado = true; LS.set("tr_host", { codigo: codigo, ts: Date.now() }); LS.del("tr_cliente"); hostDifundir(); },
      conexao: function (cid) { H.visto[cid] = Date.now(); },
      mensagem: function (cid, m) { H.visto[cid] = Date.now(); hostMensagem(cid, m); },
      sinal: function (ok) { if (!H) return; if (conectado !== ok) { conectado = ok; if (ok && V) toast("Mesa no ar de novo!"); render(); } },
      fechou: function (cid) { hostFechou(cid); },
      erro: function (tipo) {
        if (tipo === "ocupado") {
          H.rede.fechar();
          if (estadoSalvo && tentativa < 12) { setTimeout(function () { iniciarHost(codigo, estadoSalvo, false, tentativa + 1); }, 3000); }
          else if (!estadoSalvo) iniciarHost(gerarCodigo(), null, false, 0);
          else sairParaInicio("Não deu para recuperar a mesa. Crie uma nova.");
        } else if (tipo === "rede") {
          if (!V) sairParaInicio("Sem conexão com a internet. Verifique e tente de novo.");
          else { conectado = false; render(); }
        } else if (tipo === "incompativel") sairParaInicio("Este celular não suporta o jogo online.");
      }
    });
  }
  function hostMensagem(cid, m) {
    if (!m || !m.t || !H) return;
    var motor = H.motor;
    if (m.t === "pong") return;
    if (m.t === "entrar") {
      var r = motor.entrar(m.token, m.nome, false);
      if (!r.ok) { H.rede.enviar(cid, { t: "recusado", erro: r.erro }); setTimeout(function () { H.rede.derrubar(cid); }, 400); return; }
      for (var c in H.conns) if (H.conns[c] === r.id && c !== cid) { delete H.conns[c]; H.rede.derrubar(c); }
      H.conns[cid] = r.id;
      motor.s.jogadores[r.id].online = true;
      // manda as vozes gravadas de quem já está na mesa
      for (var jid in H.vozes) if (jid !== r.id) H.rede.enviar(cid, { t: "vozes", jid: jid, dados: H.vozes[jid] });
      hostDifundir();
      return;
    }
    var jid2 = H.conns[cid];
    if (!jid2) return;
    if (m.t === "vozes") {
      var dados = limparVozes(m.dados);
      if (dados) { H.vozes[jid2] = dados; S.vozesCustom[jid2] = dados; } else { delete H.vozes[jid2]; delete S.vozesCustom[jid2]; }
      for (var c2 in H.conns) if (c2 !== cid) H.rede.enviar(c2, { t: "vozes", jid: jid2, dados: dados });
      return;
    }
    if (m.t === "acao") {
      var res = hostProcessar(jid2, m.a);
      if (m.rid) H.rede.enviar(cid, { t: "res", rid: m.rid, r: res });
    }
  }
  function hostFechou(cid) {
    var jid = H.conns[cid];
    delete H.conns[cid]; delete H.visto[cid];
    if (!jid) return;
    for (var c in H.conns) if (H.conns[c] === jid) return;
    H.motor.desconectar(jid);
    hostDifundir();
  }
  function hostProcessar(jid, a) {
    var r = H.motor.acao(jid, a);
    if (r && r.ok) hostDifundir();
    return r;
  }
  function hostDifundir() {
    if (!H) return;
    for (var cid in H.conns) H.rede.enviar(cid, { t: "estado", v: H.motor.visao(H.conns[cid]) });
    receberVisao(H.motor.visao(H.meuId));
    if (!H.solo || H.motor.s.fase !== "lobby") {
      var agora = Date.now(), chave = H.solo ? "tr_solo" : "tr_host";
      if (agora - H.salvarEm > 800) { H.salvarEm = agora; LS.set(chave, { codigo: H.codigo, ts: agora, estado: H.motor.exportar() }); }
    }
    agendarRobos();
  }
  // Robôs (e quem caiu da internet) jogam sozinhos, no ritmo de gente
  function agendarRobos() {
    if (!H || H.tRobo) return;
    var m = H.motor, s = m.s;
    if (s.fase !== "jogo" || !s.mao) return;
    if (s.mao.fim) {
      H.tRobo = setTimeout(function () { if (!H) return; H.tRobo = null; if (m.proximaMao()) hostDifundir(); }, 3800);
      return;
    }
    var pl = m.planoRobo();
    if (!pl) return;
    var id = s.assentos[pl.lugar], gente = id && !m.ehRobo(id);
    var atraso = gente ? 15000 : pl.a.tipo === "jogar" ? 1200 + Math.random() * 1600 : 1800 + Math.random() * 1700;
    if (s.mao.jogadas.length === 0 && !s.mao.mesa.length) atraso += 2600; // espera a distribuição
    H.tRobo = setTimeout(function () {
      if (!H) return;
      H.tRobo = null;
      var p2 = m.planoRobo();
      if (p2) m.acao(s.assentos[p2.lugar], p2.a);
      hostDifundir();
    }, atraso);
  }

  /* ================= CONVIDADO ================= */
  function conectarCliente(codigo, reconectando, retomando) {
    modo = "cliente";
    if (!C || C.codigo !== codigo) C = { codigo: codigo, rede: null, tentativas: 0, ultimo: Date.now(), pend: {}, rid: 1, entrou: false, retomando: !!retomando };
    if (!reconectando) { ui.carregando = "Procurando a mesa " + codigo + "…"; render(); }
    if (C.rede) C.rede.fechar();
    var esta = C;
    LS.set("jogo_atual", "truco");
    C.rede = Rede.conectar("TR" + codigo, {
      aberto: function () { if (C !== esta) return; C.ultimo = Date.now(); C.rede.enviar({ t: "entrar", token: token, nome: meuNome }); },
      mensagem: function (m) {
        if (C !== esta) return;
        C.ultimo = Date.now();
        if (m.t === "ping") { C.rede.enviar({ t: "pong" }); return; }
        if (m.t === "estado") {
          var primeira = !C.entrou;
          C.entrou = true; C.tentativas = 0; C.perdeuEm = 0; C.retomando = false;
          if (!conectado) toast("Conectado de novo!");
          conectado = true;
          LS.set("tr_cliente", { codigo: codigo, ts: Date.now() });
          LS.del("tr_host");
          receberVisao(m.v);
          if (primeira) enviarMinhasVozes();
        } else if (m.t === "vozes") {
          if (m.dados) S.vozesCustom[m.jid] = m.dados; else delete S.vozesCustom[m.jid];
        } else if (m.t === "res") {
          var cb = C.pend[m.rid]; delete C.pend[m.rid]; if (cb) cb(m.r);
        } else if (m.t === "recusado") sairParaInicio(m.erro || "Não foi possível entrar.");
        else if (m.t === "fim") sairParaInicio("O anfitrião fechou a mesa.");
      },
      fechou: function () { if (C === esta) clientePerdeu(); },
      erro: function (tipo) {
        if (C !== esta) return;
        if (!C.entrou && !C.retomando) {
          if (tipo === "sala") sairParaInicio("Mesa " + codigo + " não encontrada. Confira o código (o anfitrião precisa estar com o jogo aberto).");
          else sairParaInicio("Não deu para conectar à mesa " + codigo + ". Confira a internet.");
        } else clientePerdeu();
      }
    });
  }
  function clientePerdeu() {
    if (!C) return;
    conectado = false; render();
    C.tentativas++;
    if (!C.perdeuEm) C.perdeuEm = Date.now();
    if (Date.now() - C.perdeuEm > 30 * 60e3) { sairParaInicio("Não deu para voltar à mesa."); return; }
    clearTimeout(C.tRecon);
    var cod = C.codigo;
    C.tRecon = setTimeout(function () { if (C && C.codigo === cod) conectarCliente(cod, true); }, Math.min(10000, 2000 + C.tentativas * 1000));
  }
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
    if (H) { try { H.rede.enviar && Object.keys(H.conns).forEach(function (c) { H.rede.enviar(c, { t: "fim" }); }); H.rede.fechar(); } catch (e) {} clearTimeout(H.tRobo); }
    if (C) { clearTimeout(C.tRecon); try { C.rede.fechar(); } catch (e) {} }
    H = null; C = null; V = null; modo = null; conectado = true; ui.carregando = ""; ui.shell = null; ui.ultimoEvento = -1;
    fecharModal();
    render();
    if (msg) setTimeout(function () { toast(msg, true); }, 50);
  }
  function sairDaMesa() {
    if (modo === "host") { LS.del(H && H.solo ? "tr_solo" : "tr_host"); } else LS.del("tr_cliente");
    LS.del("jogo_atual");
    sairParaInicio();
  }

  /* ---------------- Vozes gravadas pelo jogador ---------------- */
  var PALAVRAS = [["truco", "TRUCO!"], ["seis", "SEIS!"], ["nove", "NOVE!"], ["doze", "DOZE!"], ["aceito", "Aceitar (Desce!)"], ["corro", "Correr (Corri!)"]];
  function vozesSalvas(p) { return LS.get("tr_voz_" + p, null) || {}; }
  function meuPersonagem() { var p; if (!V) p = LS.get("tr_ultimo_personagem", null); else { var eu = V.jogadores.filter(function (j) { return j.id === V.meuId; })[0]; p = eu && eu.personagem; } return PERS[p] ? p : null; }
  function minhasVozes() {
    var p = meuPersonagem();
    if (!p || LS.get("tr_usar_voz", true) === false) return null;
    var v = vozesSalvas(p);
    return Object.keys(v).length ? v : null;
  }
  function limparVozes(d) {
    if (!d || typeof d !== "object") return null;
    var out = {}, n = 0;
    PALAVRAS.forEach(function (p) { var x = d[p[0]]; if (typeof x === "string" && /^data:audio\//.test(x) && x.length < 120000) { out[p[0]] = x; n++; } });
    return n ? out : null;
  }
  function enviarMinhasVozes() {
    var v = minhasVozes();
    if (modo === "host" && H) {
      if (v) { H.vozes[H.meuId] = v; S.vozesCustom[H.meuId] = v; } else { delete H.vozes[H.meuId]; delete S.vozesCustom[H.meuId]; }
      for (var c in H.conns) H.rede.enviar(c, { t: "vozes", jid: H.meuId, dados: v });
    } else if (C && C.rede && conectado) {
      C.rede.enviar({ t: "vozes", dados: v });
      if (V) { if (v) S.vozesCustom[V.meuId] = v; else delete S.vozesCustom[V.meuId]; }
    }
  }
  var gravador = null;
  function gravar(palavra) {
    var p = meuPersonagem();
    if (!p) { toast("Escolha um personagem primeiro.", true); return; }
    if (gravador) { gravador.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Este celular não deixa gravar áudio aqui.", true); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var pedacos = [], rec = new MediaRecorder(stream);
      gravador = rec; ui.gravando = palavra; telaVozes();
      rec.ondataavailable = function (e) { if (e.data.size) pedacos.push(e.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        gravador = null; ui.gravando = null;
        var blob = new Blob(pedacos, { type: rec.mimeType || "audio/webm" });
        var fr = new FileReader();
        fr.onload = function () {
          var v = vozesSalvas(p); v[palavra] = fr.result; LS.set("tr_voz_" + p, v);
          toast("🎤 Gravado!"); telaVozes(); enviarMinhasVozes();
        };
        fr.readAsDataURL(blob);
      };
      rec.start();
      setTimeout(function () { if (rec.state === "recording") rec.stop(); }, 2500);
    }).catch(function () { toast("Sem permissão para usar o microfone.", true); });
  }
  function telaVozes() {
    var p = meuPersonagem();
    if (!p) { abrirModal('<h2 class="tr-titulo">GRAVAR MINHA VOZ</h2><p>Escolha seu malandro na mesa primeiro. A voz gravada fica ligada a ele.</p><button class="tr-btn vermelho grande" data-a="fechar">ENTENDI</button>'); return; }
    var v = vozesSalvas(p), usar = LS.get("tr_usar_voz", true) !== false;
    var h = '<h2 class="tr-titulo">VOZ DE ' + esc(PERS[p].nome.toUpperCase()) + "</h2><p class=\"mudo pequeno\">Grite com vontade! Cada gravação tem até 2,5 segundos. Os amigos da mesa ouvem a sua voz quando você gritar.</p>";
    h += '<label class="linha-chave"><span>Usar minha voz no jogo</span><button class="chave' + (usar ? " on" : "") + '" data-a="usarVoz"></button></label>';
    PALAVRAS.forEach(function (w) {
      var tem = !!v[w[0]], gravandoEsta = ui.gravando === w[0];
      h += '<div class="voz-linha"><b>' + w[1] + '</b><span class="mudo pequeno">' + (tem ? "sua voz" : S.temFala(p, w[0]) ? "voz do jogo" : "sem voz") + "</span>" +
        '<button class="tr-mini ' + (gravandoEsta ? "vermelho pulsa" : "ouro") + '" data-a="gravar" data-p="' + w[0] + '">' + (gravandoEsta ? "PARAR" : window.ic("mic") + " GRAVAR") + "</button>" +
        '<button class="tr-mini" data-a="ouvir" data-p="' + w[0] + '">' + window.ic("play_arrow") + "</button>" +
        (tem ? '<button class="tr-mini" data-a="apagarVoz" data-p="' + w[0] + '">' + window.ic("close") + "</button>" : "") + "</div>";
    });
    h += '<button class="tr-btn fantasma grande" data-a="fechar" style="margin-top:12px">PRONTO</button>';
    ui.modal = "vozes";
    abrirModal(h);
  }

  /* ================= Recebendo o estado ================= */
  function numEvento(id) { return parseInt(String(id).replace(/\D/g, ""), 10) || 0; }
  function receberVisao(v) {
    var antes = V;
    V = v;
    ui.carregando = "";
    var pAntes = antes && antes.jogadores.filter(function (j) { return j.id === antes.meuId; })[0];
    var pAgora = v.jogadores.filter(function (j) { return j.id === v.meuId; })[0];
    if (pAgora && pAgora.personagem) LS.set("tr_ultimo_personagem", pAgora.personagem);
    if (pAgora && pAgora.personagem && (!pAntes || pAntes.personagem !== pAgora.personagem)) setTimeout(enviarMinhasVozes, 200);
    // eventos novos (sons, gritos, animações)
    var evs = v.eventos || [];
    if (ui.ultimoEvento < 0) ui.ultimoEvento = evs.length ? numEvento(evs[evs.length - 1].id) : 0;
    else evs.forEach(function (e) { var n = numEvento(e.id); if (n > ui.ultimoEvento) { ui.ultimoEvento = n; tratarEvento(e, v); } });
    if (antes && antes.fase !== v.fase) {
      if (v.fase === "jogo" && antes.fase === "lobby") { fecharModal(); S.iniciarMusica(); }
      if (v.fase === "lobby") fecharModal();
    }
    if (v.mao && (!antes || !antes.mao || antes.mao.vez !== v.mao.vez || antes.mao.num !== v.mao.num || (antes.mao.pedido && !v.mao.pedido))) ui.vezDesde = Date.now();
    // é a minha vez?
    if (v.mao && v.fase === "jogo" && v.mao.vez === v.meuLugar && !v.mao.pedido && !v.mao.fim && (!antes || !antes.mao || antes.mao.vez !== v.meuLugar || antes.mao.pedido)) { S.fx("vez"); vibrar(40); }
    if (v.mao && v.mao.pedido && v.mao.possoResponder && !(antes && antes.mao && antes.mao.pedido && antes.mao.pedido.valor === v.mao.pedido.valor)) vibrar(250);
    render();
  }
  function rel(lugar) { return V.meuLugar < 0 ? lugar : (lugar - V.meuLugar + 4) % 4; }
  function tratarEvento(e, v) {
    var as = v.assentos[e.lugar];
    switch (e.tipo) {
      case "distribuir": S.fx("distribuir", 12); ui.animDistribuir = Date.now(); break;
      case "jogou":
        var estalo = e.forte && LS.get("tr_estalo", true) !== false;
        S.fx(e.forte ? "estalo" : "jogar"); ui.animJogada = { lugar: e.lugar, t: Date.now(), forte: estalo };
        if (estalo) { ui.tremer = Date.now(); vibrar(120); }
        break;
      case "bordao":
        ui.bolhas[e.lugar] = { texto: e.texto, t: Date.now(), ouro: as && as.personagem === "morena" };
        if (as && Math.random() < 0.5) S.voz(as.personagem, "reacao", as.id);
        setTimeout(render, 3900);
        break;
      case "grito":
        S.fx("murro");
        var falou = as ? S.voz(as.personagem, e.palavra, as.id) : false;
        if (!falou) S.fx("alarde");
        if (["truco", "seis", "nove", "doze"].indexOf(e.palavra) >= 0) { ui.gritao = { lugar: e.lugar, texto: e.texto, t: Date.now() }; setTimeout(render, 2400); }
        // o Mestre Valdo ainda provoca depois de pedir truco
        if (as && as.personagem === "mestre" && e.palavra === "truco" && !(S.vozesCustom[as.id] && S.vozesCustom[as.id].truco)) setTimeout(function () { S.voz("mestre", "provoca"); }, 750);
        ui.bolhas[e.lugar] = { texto: e.texto, t: Date.now(), grito: true };
        if (["truco", "seis", "nove", "doze"].indexOf(e.palavra) >= 0) { ui.tremer = Date.now(); vibrar(180); }
        setTimeout(render, 2700);
        break;
      case "vaza": ui.animVaza = { lugar: e.lugar, time: e.time, t: Date.now() }; if (e.time >= 0) setTimeout(function () { S.fx("carta"); }, 1300); break;
      case "fimMao": {
        var nos = v.meuLugar >= 0 ? v.meuLugar % 2 : 0;
        S.fx("tento", e.pontos);
        ui.fimMao = { nos: e.time === nos, pontos: e.pontos, motivo: e.motivo, t: Date.now() };
        setTimeout(render, 3700);
        break;
      }
      case "fimPartida": {
        var nos2 = v.meuLugar >= 0 ? v.meuLugar % 2 : 0;
        S.fx(e.time === nos2 ? "vitoria" : "derrota");
        break;
      }
      case "chat": {
        var ult = v.chat[v.chat.length - 1];
        if (ult && ult.autorId !== v.meuId) {
          S.fx("chat");
          var lj = v.jogadores.filter(function (j) { return j.id === ult.autorId; })[0];
          if (lj && lj.lugar >= 0) { ui.bolhas[lj.lugar] = { texto: ult.texto, t: Date.now() }; setTimeout(render, 4200); }
          if (ui.modal !== "chat") toast("💬 " + ult.autor + ": " + ult.texto.slice(0, 50));
        }
        break;
      }
    }
  }

  /* ================= Renderização ================= */
  var I = window.ic;
  var BORDOES = ["TRUCO, LADRÃO!", "SEIS NA CARROÇA!", "CAI PRA DENTRO!", "TEM GATO AÍ?", "VEM PRA FESTA, MARRECO!", "AQUI É LEITURA, NÃO É SORTE!", "TÁ COM MEDO?", "SEGURA, PARCEIRO!"];
  function shell(nome, html) {
    if (ui.shell !== nome) { $app.innerHTML = html; ui.shell = nome; var r = $app.querySelector(".rolagem"); if (r) r.scrollTop = 0; return true; }
    return false;
  }
  function pinta(id, html) {
    var el = document.getElementById(id);
    if (!el || el._h === html) return;
    var a = document.activeElement;
    if (a && el.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
    el.innerHTML = html; el._h = html;
  }
  function faixa() {
    if (conectado) return "";
    if (modo === "host") return '<div class="tr-faixa">📡 Sem internet: reconectando a mesa…</div>';
    return '<div class="tr-faixa">📡 Conexão perdida: voltando para a mesa…</div>';
  }
  function nn(n) { return ("0" + n).slice(-2); }
  function pnome(id) { return (PERS[id] || {}).nome || "?"; }
  function curto(nome) { return String(nome || "").replace(/^Robô /, "🤖 ").split(" ").slice(0, 2).join(" "); }
  function render() {
    if (!V) {
      if (ui.carregando) { shell("carregando", '<div class="tela tr-carregando"><div class="girando"></div><div id="msgc"></div><button class="link" data-a="cancelar">Cancelar</button></div>'); pinta("msgc", esc(ui.carregando)); }
      else if (ui.tela === "baralhos") renderBaralhos();
      else renderInicio();
      return;
    }
    if (ui.tela === "personagens") return renderPersonagens();
    if (ui.tela === "baralhos") return renderBaralhos();
    if (V.fase === "lobby") renderLobby();
    else renderMesa();
  }
  function fundoCena() { return '<div class="tr-cena">' + A.fundo(V ? V.config.cenario : "rancho") + '<div class="tr-escurece"></div></div>'; }

  /* ---------------- Início ---------------- */
  function renderInicio() {
    var host = LS.get("tr_host", null), cli = LS.get("tr_cliente", null), solo = LS.get("tr_solo", null), agora = Date.now(), lim = 6 * 3600e3;
    var ret = "";
    if (host && host.estado && agora - host.ts < lim) ret = '<div class="tr-cartao tr-retomar"><div>Você tinha uma mesa aberta (<b>' + esc(host.codigo) + '</b>).</div><div class="tr-linha"><button class="tr-btn ouro" data-a="retomarHost">Reabrir</button><button class="tr-btn fantasma" data-a="esquecer">Descartar</button></div></div>';
    else if (solo && solo.estado && agora - solo.ts < lim && solo.estado.fase === "jogo") ret = '<div class="tr-cartao tr-retomar"><div>Continuar a partida com os robôs?</div><div class="tr-linha"><button class="tr-btn ouro" data-a="retomarSolo">Continuar</button><button class="tr-btn fantasma" data-a="esquecerSolo">Descartar</button></div></div>';
    else if (cli && agora - cli.ts < lim) ret = '<div class="tr-cartao tr-retomar"><div>Voltar para a mesa <b>' + esc(cli.codigo) + '</b>?</div><div class="tr-linha"><button class="tr-btn ouro" data-a="retomarCliente">Voltar</button><button class="tr-btn fantasma" data-a="esquecer">Descartar</button></div></div>';
    var novo = shell("inicio", '<div class="tela tr-tela">' + '<div class="tr-cena">' + A.fundo("rancho") + '<div class="tr-escurece forte"></div></div><div class="rolagem"><div class="tr-conteudo">' +
      '<button class="tr-voltar" data-a="jogos">' + I("arrow_back") + " Jogos</button>" +
      '<div class="tr-logo"><div class="cartas-logo">' + A.carta("4P") + A.carta("7C") + A.carta("AE") + '</div><h1>TRUCO</h1><div class="sub">do Norte de Minas · mesa raiz 3D</div></div>' +
      '<div id="retomar"></div>' +
      '<label class="tr-campo"><span>SEU NOME DE MALANDRO</span><input id="nome" class="tr-entrada" maxlength="18" autocomplete="off" placeholder="Ex.: Ruan"></label>' +
      '<button class="tr-btn vermelho grande" data-a="criar">' + I("groups") + " CRIAR MESA</button>" +
      '<button class="tr-btn fantasma grande" data-a="solo">' + I("smart_toy") + " JOGAR COM ROBÔS</button>" +
      '<div class="tr-ou">ou entre com o código</div>' +
      '<div class="tr-linha"><input id="codigo" class="tr-entrada codigo" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="····"><button class="tr-btn ouro" data-a="entrar">ENTRAR</button></div>' +
      '<div class="tr-links"><button data-a="regras">' + I("casino") + " Regras</button><button data-a=\"baralhos\">" + I("style") + " Baralhos</button><button data-a=\"som\">" + I("volume_up") + " Som</button></div>" +
      "</div></div></div>");
    if (novo) {
      var n = document.getElementById("nome"); n.value = meuNome;
      n.addEventListener("input", function () { meuNome = n.value.trim(); LS.set("ca_nome", meuNome); });
      var c = document.getElementById("codigo");
      c.addEventListener("input", function () { c.value = c.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4); });
      c.addEventListener("keydown", function (e) { if (e.key === "Enter") acoes.entrar(); });
      if (ui.codigoConvite) c.value = ui.codigoConvite;
    }
    pinta("retomar", ret);
  }
  function precisaNome() {
    var n = document.getElementById("nome");
    meuNome = (n ? n.value : meuNome).trim();
    if (!meuNome) { toast("Digite seu nome primeiro.", true); if (n) n.focus(); return true; }
    LS.set("ca_nome", meuNome);
    return false;
  }

  /* ---------------- Sala (antes de começar) ---------------- */
  function vaga(l, nos) {
    var a = V.assentos[l];
    if (!a) {
      return '<div class="tr-vaga livre"><div class="ic-grande">' + I("person_add") + '</div><b>VAGA ABERTA</b>' +
        (V.meuLugar !== l ? '<button class="tr-mini" data-a="sentar" data-l="' + l + '">Sentar aqui</button>' : "") +
        (V.souHost ? '<button class="tr-mini ouro" data-a="robos">' + I("smart_toy") + " Pôr bot</button>" : "") + "</div>";
    }
    var host = a.id === V.hostId, eu = a.id === V.meuId;
    return '<div class="tr-vaga' + (eu ? " eu" : "") + '">' + (host ? '<span class="tag-host">HOST</span>' : "") + (a.robo ? '<span class="tag-bot">BOT</span>' : "") +
      (a.robo && V.souHost ? '<button class="tr-x" data-a="tirarRobo" data-l="' + l + '">' + I("close") + "</button>" : "") +
      '<div class="foto">' + (a.personagem ? A.avatar(a.personagem) : '<div class="sem-foto">?</div>') + "</div>" +
      "<b>" + esc(curto(a.nome)) + (eu ? " (você)" : "") + "</b>" +
      '<span class="estado' + (a.personagem ? " ok" : "") + '">' + (a.personagem ? "● " + esc(pnome(a.personagem)) : "○ escolhendo malandro…") + "</span>" +
      (eu ? '<button class="tr-mini ouro" data-a="abrirPersonagens">' + I("swords") + " Trocar malandro</button>" : "") + "</div>";
  }
  function renderLobby() {
    shell("lobby", '<div class="tela tr-tela">' + '<div class="tr-cena" id="cen"></div><div id="faixa"></div><div class="rolagem" id="corpo"></div><div class="tr-base" id="base"></div></div>');
    pinta("faixa", faixa());
    pinta("cen", A.fundo(V.config.cenario) + '<div class="tr-escurece forte"></div>');
    var cfg = V.config, ocupados = V.assentos.filter(Boolean).length, solo = H && H.solo;
    var host = V.jogadores.filter(function (j) { return j.id === V.hostId; })[0] || {};
    var meuT = V.meuLugar >= 0 ? V.meuLugar % 2 : 0;
    var h = '<div class="tr-conteudo">';
    h += '<div class="tr-sobretitulo"><span class="ponto"></span>' + (solo ? "MESA COM ROBÔS" : "MESA PRIVADA #" + esc(V.codigo)) + '<span class="dir">' + I("groups") + " " + ocupados + "/4 JOGADORES</span></div>";
    h += '<div class="tr-cartao tr-mesa-info"><div class="tr-linha cabeca"><h2>MESA DO ' + esc(String(host.nome || "").toUpperCase()) + '</h2><span class="tag-aberta">● ' + (solo ? "TREINO" : "ABERTA") + "</span></div>" +
      '<div class="sub">Criada por ' + esc(host.nome || "") + " · Valendo cerveja &amp; honra</div>" +
      '<div class="tags"><span>' + I("sports_esports") + " " + (cfg.regra === "paulista" ? "Truco Paulista" : "Truco Mineiro") + "</span><span>" + I("trophy") + " 12 Tentos</span><span>" + I("mic") + " Voz ativa</span><span>" + I("style") + " " + esc(A.TEMAS[A.tema()].nome) + "</span></div></div>";
    if (!solo) {
      h += '<div class="tr-cartao tr-codigo"><div class="tr-linha cabeca"><div class="ic-chave">' + I("lock") + '</div><div class="txt"><b>CÓDIGO DE ENTRADA</b><span>Compartilhe pra fechar a 4ª ponta</span></div></div>' +
        '<div class="caixa-cod"><div><small>CÓDIGO SECRETO</small><div class="cod">' + esc(V.codigo) + '</div></div><button class="tr-btn ouro" data-a="copiarCodigo">' + I("content_copy") + " COPIAR</button></div>" +
        '<div class="tr-linha"><button class="tr-btn verde" data-a="mandarZap">' + I("chat") + ' MANDA NO ZAP</button><button class="tr-btn escuro" data-a="convidar">' + I("share") + " OUTROS APPS</button></div></div>";
    }
    h += '<div class="tr-secao"><h3>' + I("swords") + ' A MESA DE EMBATE</h3><span class="dir">DUPLA FIXA</span></div>';
    h += '<div class="tr-feltro-lobby"><div class="dupla-cab"><span class="ponto ouro"></span>DUPLA NÓS' + (meuT === 0 ? "" : "") + '<span class="dir">' + [meuT, meuT + 2].filter(function (l) { var a = V.assentos[l]; return a && a.personagem; }).length + "/2 PRONTOS</span></div>" +
      '<div class="duas">' + vaga(meuT, true) + vaga(meuT + 2, true) + '</div><div class="vs"><i></i><span>VS</span><i></i></div>' +
      '<div class="dupla-cab"><span class="ponto rosa"></span>DUPLA ELES (DESAFIANTES)<span class="dir">' + (V.assentos[1 - meuT] && V.assentos[3 - meuT] ? "COMPLETA" : "FALTA " + [1 - meuT, 3 - meuT].filter(function (l) { return !V.assentos[l]; }).length) + "</span></div>" +
      '<div class="duas">' + vaga(1 - meuT, false) + vaga(3 - meuT, false) + "</div></div>";
    // regras
    var dis = V.souHost ? "" : " disabled";
    h += '<div class="tr-secao"><h3>' + I("settings") + " REGRAS DO BOTECO</h3><span class=\"dir\">" + (V.souHost ? "Você manda aqui" : "O host escolhe") + "</span></div><div class=\"tr-cartao tr-regras\">";
    h += '<div class="regra"><div class="ic-r">' + I("casino") + '</div><div class="txt"><b>Modalidade</b><span>' + (cfg.regra === "paulista" ? "Vira define as 4 manilhas" : "Manilhas fixas: zap, copas, espadilha e pica-fumo") + '</span></div><div class="alterna"><button data-a="regra" data-v="paulista" class="' + (cfg.regra === "paulista" ? "sel" : "") + '"' + dis + '>PAULISTA</button><button data-a="regra" data-v="mineiro" class="' + (cfg.regra === "mineiro" ? "sel" : "") + '"' + dis + ">MINEIRO</button></div></div>";
    h += '<div class="regra"><div class="ic-r">' + I("style") + '</div><div class="txt"><b>Baralho equipado</b><span>' + esc(A.TEMAS[A.tema()].nome) + ' (só no seu celular)</span></div><button class="tr-quad" data-a="baralhos">' + I("style") + "</button></div>";
    h += '<div class="regra"><div class="ic-r">' + I("sports_bar") + '</div><div class="txt"><b>Tentos</b><span>Grão que marca os pontos</span></div><div class="alterna"><button data-a="tento" data-v="milho" class="' + (cfg.tento === "milho" ? "sel" : "") + '"' + dis + '>MILHO</button><button data-a="tento" data-v="feijao" class="' + (cfg.tento === "feijao" ? "sel" : "") + '"' + dis + ">FEIJÃO</button></div></div>";
    h += '<div class="regra"><div class="ic-r">' + I("volume_up") + '</div><div class="txt"><b>Estalo de mesa 3D</b><span>Faísca e tremida na batida forte</span></div><button class="chave' + (LS.get("tr_estalo", true) ? " on" : "") + '" data-a="estalo"></button></div>';
    h += '<div class="cenarios">' + Object.keys(A.CENARIOS).map(function (k) { var c = A.CENARIOS[k]; return '<button class="' + (cfg.cenario === k ? "sel" : "") + '" data-a="cenario" data-v="' + k + '"' + dis + ">" + c.icone + " " + esc(c.nome) + "</button>"; }).join("") + "</div></div>";
    // resenha
    var msgs = V.chat.filter(function (c) { return !c.sistema; }).slice(-4);
    h += '<div class="tr-secao"><h3>' + I("chat") + ' RESENHA DO LOBBY</h3><span class="dir verde">' + I("record_voice_over") + " CANAL ABERTO</span></div><div class=\"tr-cartao tr-resenha\">" +
      (msgs.length ? msgs.map(function (c) { var j = V.jogadores.filter(function (x) { return x.id === c.autorId; })[0]; return '<div class="msg"><div class="mini-av">' + (j && j.personagem ? A.avatar(j.personagem) : "") + '</div><div><b>' + esc(c.autor) + (c.autorId === V.hostId ? " (Host)" : "") + "</b><p>" + esc(c.texto) + "</p></div></div>"; }).join("") : '<div class="vazio">Ninguém falou nada ainda. Puxa a resenha!</div>') +
      '<div class="chips">' + ["Bota o chopp pra gelar!", "Truco na primeira!", "Bora que tá cedo!"].map(function (f) { return '<button data-a="frase" data-t="' + esc(f) + '">"' + esc(f) + '"</button>'; }).join("") + "</div>" +
      '<div class="tr-linha"><input id="chatLobby" class="tr-entrada" maxlength="200" placeholder="Manda a resenha…" autocomplete="off"><button class="tr-btn ouro icone" data-a="enviarChatLobby">' + I("send") + "</button></div></div>";
    h += '<div class="tr-links"><button data-a="regras">' + I("casino") + " Regras</button><button data-a=\"som\">" + I("volume_up") + " Som</button><button data-a=\"vozes\">" + I("mic") + " Minha voz</button></div></div>";
    pinta("corpo", h);
    var ci = document.getElementById("chatLobby");
    if (ci && !ci._ok) { ci._ok = true; ci.addEventListener("keydown", function (e) { if (e.key === "Enter") acoes.enviarChatLobby(); }); }
    var falta = V.assentos.filter(function (a) { return !a; }).length, semP = V.assentos.filter(function (a) { return a && !a.personagem && !a.robo; }).length;
    var pode = !falta && !semP;
    pinta("base", '<button class="tr-base-btn" data-a="sair">' + I("logout") + "<span>SAIR</span></button>" +
      (V.souHost ? '<button class="tr-base-btn" data-a="robos"' + (falta ? "" : " disabled") + ">" + I("smart_toy") + "<span>PÔR BOT</span></button>" +
        '<button class="tr-btn vermelho comecar" data-a="iniciar"' + (pode ? "" : " disabled") + ">" + I("play_arrow") + "<span><b>COMEÇAR</b><small>" + (pode ? "Bora pro jogo!" : falta ? "Falta " + falta + " ou bot" : "Falta escolher malandro") + "</small></span></button>"
        : '<div class="tr-espera">' + I("hourglass_top") + " Esperando o host começar…</div>"));
  }

  /* ---------------- Seleção de malandros ---------------- */
  function renderPersonagens() {
    shell("personagens", '<div class="tela tr-tela"><div class="tr-cena" id="cen"></div><div class="tr-cab" id="cab"></div><div class="rolagem" id="corpo"></div><div class="tr-base" id="base"></div></div>');
    pinta("cen", A.fundo(V.config.cenario) + '<div class="tr-escurece forte"></div>');
    var meu = meuPersonagem(), foco = ui.foco || meu || Truco.PERSONAGENS[0].id, P = PERS[foco];
    pinta("cab", '<button class="tr-ic" data-a="voltarLobbyTela">' + I("arrow_back") + '</button><div class="t"><small>MESA · TRUCO</small><b>SELEÇÃO DE MALANDROS</b></div><span class="tag-tentos">' + I("trophy") + " 12 TENTOS</span>");
    var dono = V.jogadores.filter(function (j) { return j.personagem === foco && j.id !== V.meuId; })[0];
    var h = '<div class="tr-conteudo">';
    h += '<div class="tr-heroi"><div class="foto">' + A.retrato(foco) + '</div><div class="vel"></div><span class="tag-lenda">' + I("stars") + " MALANDRO LENDÁRIO</span>" +
      '<div class="txt"><small>' + esc(P.titulo.toUpperCase()) + "</small><h2>" + esc(P.nome.toUpperCase()) + "</h2><p>" + esc(P.desc) + "</p></div></div>";
    h += '<div class="tr-stats"><div><small>NAIPE FAVORITO</small><b>' + esc(P.naipe) + '</b></div><div><small>BLEFE LENDÁRIO</small><b class="vermelho">' + P.blefe + '%</b></div><div><small>RESENHA / HORA</small><b class="verde">' + P.resenha + " dB</b></div></div>";
    h += '<div class="tr-secao"><h3>' + I("groups") + ' MESA DOS JOGADORES</h3><span class="dir">' + Truco.PERSONAGENS.length + " MALANDROS</span></div><div class=\"tr-carrossel\">";
    Truco.PERSONAGENS.forEach(function (p) {
      var d = V.jogadores.filter(function (j) { return j.personagem === p.id; })[0];
      h += '<button class="mini-pers' + (p.id === foco ? " foco" : "") + (p.id === meu ? " meu" : "") + '" data-a="focoPers" data-id="' + p.id + '">' + A.avatar(p.id) + "<b>" + esc(p.nome.split(" ")[0]) + "</b><small>" + (p.id === meu ? "Selecionado" : d ? (d.robo ? "com robô" : "com " + esc(d.nome.split(" ")[0])) : "Livre") + "</small></button>";
    });
    h += "</div>";
    var falas = S.falas(foco);
    h += '<div class="tr-cartao tr-bordoes"><div class="cab"><h3>' + I("record_voice_over") + " BORDÕES &amp; GRITO DE TRUCO</h3></div><small class=\"rot\">VOZ OFICIAL DUBLADA</small>";
    if (!falas.length) h += '<div class="vazio">Ainda sem voz gravada para este malandro. Grave a sua!</div>';
    falas.forEach(function (f, i) { h += '<button class="fala" data-a="ouvirFala" data-id="' + foco + '" data-p="' + f.palavra + '"><span class="play' + (i % 2 ? " ouro" : "") + '">' + I("play_arrow") + "</span><span><b>" + esc(f.rotulo) + "</b><small>" + esc(P.nome.toUpperCase()) + "</small></span></button>"; });
    h += '<button class="tr-mini ouro largo" data-a="vozes">' + I("mic") + " Gravar a minha voz para os gritos</button></div>";
    var nomesAt = ["Força do blefe &amp; cara de pau", "Resenha &amp; desestabilização", "Velocidade da batida na mesa", "Sorte no vira &amp; manilhas"], cores = ["vermelho", "ouro", "verde", "ouro"];
    h += '<div class="tr-cartao tr-atributos"><h3>' + I("sports_esports") + " ATRIBUTOS &amp; ESTILO</h3><small class=\"rot\">SÓ PRA RESENHA: NÃO MUDAM AS REGRAS</small>" +
      P.atrib.map(function (v, i) { return '<div class="barra"><div class="r"><span>' + nomesAt[i] + "</span><b>" + v + '%</b></div><div class="trilho"><i class="' + cores[i] + '" style="width:' + v + '%"></i></div></div>'; }).join("") +
      '<div class="habil">' + I("bolt") + "<div><b>ESTILO DE JOGO</b><p>" + esc(P.habilidade) + "</p></div></div></div></div>";
    pinta("corpo", h);
    var bloqueado = dono && !dono.robo;
    pinta("base", '<button class="tr-btn vermelho largo" data-a="equipar" data-id="' + foco + '"' + (bloqueado ? " disabled" : "") + ">" + I("check_circle") + " " + (bloqueado ? "COM " + esc(dono.nome.toUpperCase()) : foco === meu ? "JÁ EQUIPADO" : "EQUIPAR NO JOGO") + "</button>");
  }

  /* ---------------- Baralhos ---------------- */
  function renderBaralhos() {
    shell("baralhos", '<div class="tela tr-tela"><div class="tr-cena" id="cen"></div><div class="tr-cab" id="cab"></div><div class="rolagem" id="corpo"></div><div class="tr-base" id="base"></div></div>');
    pinta("cen", A.fundo(V ? V.config.cenario : "rancho") + '<div class="tr-escurece forte"></div>');
    var foco = ui.focoTema || A.tema(), T = A.TEMAS[foco];
    pinta("cab", '<button class="tr-ic" data-a="voltarLobbyTela">' + I("arrow_back") + '</button><div class="t"><small>BARALHOS 3D</small><b>DETALHE DO BARALHO</b></div>');
    var h = '<div class="tr-conteudo"><div class="tr-sobretitulo"><span class="ponto"></span>ARMAZÉM DE BARALHOS</div>';
    h += '<div class="tr-cartao tr-vitrine"><div class="cab"><span>' + I("casino") + ' MESA 3D</span><span class="tag-equip">' + (foco === A.tema() ? "EQUIPADO" : "PRÉVIA") + "</span></div>" +
      '<div class="palco' + (ui.girar ? " girando" : "") + (ui.bater ? " batendo" : "") + '"><div class="carta-gira"><div class="f">' + A.verso({ tema: foco }) + '</div><div class="t">' + A.carta("AE") + "</div></div></div>" +
      '<div class="tr-linha"><button class="tr-mini" data-a="girarBaralho">' + I("refresh") + " GIRAR</button><button class=\"tr-mini\" data-a=\"virarBaralho\">" + I("style") + " VIRAR</button><button class=\"tr-mini vermelho\" data-a=\"baterBaralho\">" + I("pan_tool") + " BATER CARTA</button></div></div>";
    h += '<div class="tr-secao"><h3>COLEÇÃO DISPONÍVEL</h3></div><div class="tr-colecao">';
    Object.keys(A.TEMAS).forEach(function (k) {
      var t = A.TEMAS[k];
      h += '<button class="tema' + (k === foco ? " foco" : "") + '" data-a="focoTema" data-id="' + k + '"><span class="amostra">' + A.verso({ tema: k }) + "</span>" + (k === A.tema() ? '<span class="tag-uso">EM USO</span>' : "") + "<b>" + esc(t.nome.toUpperCase()) + "</b><small>" + esc(t.desc) + "</small></button>";
    });
    h += "</div></div>";
    pinta("corpo", h);
    pinta("base", '<button class="tr-btn vermelho largo" data-a="equiparTema" data-id="' + foco + '">' + I("check_circle") + " " + (foco === A.tema() ? "JÁ EQUIPADO" : "EQUIPAR BARALHO NA MESA 3D") + "</button>");
  }

  /* ---------------- Mesa (jogo) ---------------- */
  function bolha(l) {
    var b = ui.bolhas[l];
    if (!b) return "";
    if (Date.now() - b.t > (b.grito ? 2600 : 3800)) { delete ui.bolhas[l]; return ""; }
    return '<div class="tr-bolha' + (b.grito ? " grito" : "") + (b.ouro ? " ouro" : "") + '">' + esc(b.texto) + "</div>";
  }
  function jogador(l, pos) {
    var a = V.assentos[l], m = V.mao;
    if (!a) return "";
    var nosT = V.meuLugar >= 0 ? V.meuLugar % 2 : 0, nos = l % 2 === nosT;
    var vez = m && !m.fim && m.vez === l && !m.pedido && !(m.especial && !m.especial.decidido);
    return '<div class="tr-jog ' + pos + (vez ? " vez" : "") + (nos ? " nos" : " eles") + '">' + bolha(l) +
      '<div class="foto">' + A.avatar(a.personagem) + '<span class="cartas">' + I("style") + " " + (m ? a.cartas : 0) + "</span>" + (a.online ? "" : '<span class="off">📵</span>') + (m && m.distribuidor === l ? '<span class="pe" title="Deu as cartas">PÉ</span>' : "") + "</div>" +
      '<b class="nome">' + esc(curto(a.nome)) + (pos === "pos-topo" ? " <span>(" + (nos ? "Nós" : "Eles") + ")</span>" : "") + "</b></div>";
  }
  function statusLinha() {
    var m = V.mao;
    if (!m || V.fase !== "jogo") return "";
    if (m.fim) return "";
    if (m.pedido) { var d = V.assentos[m.pedido.deLugar]; return '<span class="st vermelho">' + I("local_fire_department") + " " + esc(curto(d.nome)) + " pediu " + esc(m.pedido.nome) + (m.possoResponder ? " · responda aí embaixo" : " · esperando resposta") + "</span>"; }
    if (m.especial && !m.especial.decidido) return '<span class="st ouro">' + I("hourglass_top") + " Mão de " + V.regra.maoEspecial + ": decidindo se joga…</span>";
    var a = V.assentos[m.vez], seg = Math.max(0, Math.round((Date.now() - (ui.vezDesde || Date.now())) / 1000));
    if (m.vez === V.meuLugar) return '<span class="st ouro">' + I("hourglass_top") + " Sua vez · " + seg + "s</span>";
    return '<span class="st">' + I("hourglass_top") + " Pensando… <b>" + seg + "s</b> · " + esc(curto(a ? a.nome : "")) + "</span>";
  }
  function renderMesa() {
    var novo = shell("mesa", '<div class="tela tr-mesa" id="mesaTela"><div class="tr-cena" id="cen"></div><div id="faixa"></div>' +
      '<header class="tr-topo" id="topo"></header><div class="tr-info" id="info"></div><div class="tr-status" id="status"></div>' +
      '<div class="tr-arena" id="arena"></div><div class="tr-mao" id="mao"></div><div class="tr-acoes" id="acoesBar"></div><div class="tr-sobre" id="sobre"></div></div>');
    pinta("cen", A.fundo(V.config.cenario) + '<div class="tr-escurece"></div>');
    pinta("faixa", faixa());
    var m = V.mao, nosT = V.meuLugar >= 0 ? V.meuLugar % 2 : 0, elesT = 1 - nosT, alvo = V.regra.alvo, tento = V.config.tento;
    var naoLidas = V.chat.filter(function (c, i) { return i >= ui.chatVisto && !c.sistema && c.autorId !== V.meuId; }).length;
    var mudo = !(S.cfg().musica || S.cfg().efeitos || S.cfg().vozes);
    pinta("topo", '<button class="tr-ic" data-a="menu">' + I("menu") + '</button><button class="tr-ic mic" data-a="vozes">' + I("mic") + "</button>" +
      '<div class="tr-placar"><span class="rot">NÓS</span><b class="nos">' + nn(V.placar[nosT]) + '</b><i></i><b class="eles">' + nn(V.placar[elesT]) + '</b><span class="rot">ELES</span></div>' +
      '<button class="tr-ic" data-a="chat">' + I("chat") + (naoLidas ? '<span class="selo">' + naoLidas + "</span>" : "") + '</button><button class="tr-ic" data-a="mudo">' + I(mudo ? "volume_off" : "volume_up") + "</button>");
    var info = '<span class="modo">' + I("sports_esports") + " <b>" + (V.regra.id === "paulista" ? "TRUCO PAULISTA" : "TRUCO MINEIRO") + "</b>";
    if (m && m.vira) info += " · Vira [" + esc(m.vira.slice(0, -1) + A.SIMBOLO[m.vira.slice(-1)]) + "] → Manilha [" + esc(m.manilhas) + "]";
    else if (m) info += " · Zap, copas, espadilha, pica-fumo";
    info += '</span><span class="graos"><span class="g nos">' + A.tentos(tento, Math.min(V.placar[nosT], alvo), alvo) + '</span><span class="g eles">' + A.tentos(tento, Math.min(V.placar[elesT], alvo), alvo) + "</span></span>";
    pinta("info", info);
    pinta("status", statusLinha());
    if (!m) { pinta("arena", ""); pinta("mao", ""); pinta("acoesBar", ""); return; }
    var lugar = function (r) { return V.meuLugar < 0 ? r : (V.meuLugar + r) % 4; };
    // arena: parceiro em cima, adversários dos lados, feltro no meio
    var h = jogador(lugar(2), "pos-topo") + '<div class="tr-meio">' + jogador(lugar(3), "pos-esq") + '<div class="tr-feltro"><div class="rot">' + I("sports_bar") + " RESENHA</div>";
    if (m.vira) h += '<div class="vira"><small>VIRA</small>' + A.carta(m.vira, { cls: "mini" }) + "</div>";
    h += '<div class="vazas">' + [0, 1, 2].map(function (i) { var vz = m.vazas[i]; return '<i class="' + (!vz ? "" : vz.time === -1 ? "emp" : vz.time === nosT ? "ganha" : "perde") + '"></i>'; }).join("") + "</div>";
    // cartas jogadas
    var mostrar = m.mesa.length ? m.mesa : (m.ultimaVaza || []);
    var velha = !m.mesa.length, ultV = m.vazas[m.vazas.length - 1];
    var venceu = velha && ultV && ultV.time !== -1 ? ultV.lugar : -1;
    h += '<div class="jogadas' + (velha && mostrar.length ? (venceu >= 0 ? " velha recolhe r" + rel(venceu) : " velha empatou") : "") + '">';
    mostrar.forEach(function (j) {
      var r = rel(j.lugar), nova = ui.animJogada && ui.animJogada.lugar === j.lugar && Date.now() - ui.animJogada.t < 700;
      var forte = nova && ui.animJogada.forte;
      h += '<div class="jogada r' + r + (nova ? " chegando" : "") + (forte ? " forte" : "") + (j.lugar === venceu ? " vencedora" : "") + '"><div class="c3d"><div class="fr">' + (j.coberta ? A.verso() : A.carta(j.carta)) + '</div><div class="vs">' + A.verso() + "</div></div>" + (forte ? '<div class="faiscas">' + "<i></i>".repeat(10) + "</div>" : "") + "</div>";
    });
    h += "</div>";
    if (ui.animDistribuir && Date.now() - ui.animDistribuir < 2300 && !m.mesa.length && !m.vazas.length) {
      h += '<div class="distribuicao de' + rel(m.distribuidor) + '">';
      for (var k = 0; k < 12; k++) h += '<div class="voa para' + rel((m.distribuidor + 1 + k) % 4) + '" style="--k:' + k + '">' + A.verso() + "</div>";
      h += "</div>";
      setTimeout(render, 2400);
    }
    if (m.especial && !m.especial.decidido && m.cartasParceiro) h += '<div class="parceiro"><small>CARTAS DO PARCEIRO</small><div>' + m.cartasParceiro.map(function (c) { return A.carta(c, { cls: "mini2" }); }).join("") + "</div></div>";
    h += '<div class="valendo">' + I("local_fire_department") + " VALENDO " + m.valor + " PONTO" + (m.valor > 1 ? "S" : "") + (m.ferro ? " · MÃO DE FERRO" : m.especial ? " · MÃO DE " + V.regra.maoEspecial : "") + "</div>";
    h += "</div>" + jogador(lugar(1), "pos-dir") + "</div>";
    pinta("arena", h);
    // minha mão
    var mm = "";
    if (V.meuLugar >= 0) {
      var minhaVez = m.vez === V.meuLugar && !m.pedido && !m.fim && !(m.especial && !m.especial.decidido);
      var distribuindo = ui.animDistribuir && Date.now() - ui.animDistribuir < 2400;
      mm += '<div class="dica">' + (minhaVez ? "TOQUE NUMA CARTA PRA JOGAR" : "") + "</div>" + bolha(V.meuLugar);
      mm += '<div class="minhas-cartas' + (minhaVez ? " ativa" : "") + '">';
      m.minhasCartas.forEach(function (c, i) {
        var man = m.forcas && m.forcas[i] >= 10;
        mm += '<button class="minha-carta' + (distribuindo ? " dist" : "") + (man ? " manilha" : "") + '" style="--i:' + i + '" data-a="jogar" data-c="' + c + '"' + (minhaVez ? "" : " disabled") + ">" + (man ? '<span class="fita">MANILHA!</span>' : "") + A.carta(c, { manilha: man }) + "</button>";
      });
      mm += '</div><div class="tr-chips-mao"><button class="' + (ui.forte ? "on" : "") + '" data-a="forte"' + (minhaVez ? "" : " disabled") + ">" + I("pan_tool") + " Bater forte!</button>" +
        '<button class="' + (ui.coberta ? "on" : "") + '" data-a="coberta"' + (minhaVez && m.vazas.length > 0 ? "" : " disabled") + ">" + I("visibility_off") + " Carta coberta</button></div>";
    }
    pinta("mao", mm);
    // barra de ações
    var ab = "", pe = m.pedido, resp = pe && m.possoResponder;
    if (m.especial && !m.especial.decidido && m.possoDecidirEspecial) {
      ab += '<div class="linha1"><button class="tr-acao correr" data-a="especial" data-v="0"><b>CORRER</b><small>FURAR</small></button><button class="tr-acao truco" data-a="especial" data-v="1">' + I("local_fire_department") + " <b>JOGAR A MÃO</b></button></div>";
    } else {
      var rotTruco = resp ? (pe.nomeAumento ? pe.nomeAumento + "!" : "NO MÁXIMO") : (m.nomeProximo ? m.nomeProximo + "!" : "TRUCO!");
      var trucoOk = resp ? !!pe.nomeAumento : m.podeTruco;
      ab += '<div class="linha1"><button class="tr-acao correr" data-a="responder" data-r="corro"' + (resp ? "" : " disabled") + "><b>CORRER</b><small>FURAR</small></button>" +
        '<button class="tr-acao truco" data-a="' + (resp ? "responder" : "truco") + '" data-r="aumento"' + (trucoOk ? "" : " disabled") + ">" + I("local_fire_department") + " <b>" + esc(rotTruco) + "</b></button>" +
        '<button class="tr-acao aceitar" data-a="responder" data-r="aceito"' + (resp ? "" : " disabled") + "><b>ACEITAR</b><small>" + (resp ? "VALE " + pe.valor : "CAI DENTRO!") + "</small></button></div>";
    }
    ab += '<div class="linha2"><div class="bordoes">' + BORDOES.map(function (b) { return '<button data-a="bordao" data-t="' + esc(b) + '">' + I("record_voice_over") + ' "' + esc(b) + '"</button>'; }).join("") + "</div></div>";
    pinta("acoesBar", ab);
    // sobreposições que não tapam os botões
    var sob = "";
    if (ui.gritao && Date.now() - ui.gritao.t < 2300) {
      var g = V.assentos[ui.gritao.lugar];
      if (g) sob += '<div class="tr-gritao"><div class="foto">' + A.retrato(g.personagem) + '</div><div class="carimbo">' + esc(ui.gritao.texto) + '</div><div class="quem">' + esc(curto(g.nome)) + "</div></div>";
    }
    if (ui.fimMao && Date.now() - ui.fimMao.t < 3400 && V.fase === "jogo") {
      var f = ui.fimMao;
      sob += '<div class="tr-fim-mao ' + (f.nos ? "ganhou" : "perdeu") + '">' + (f.nos ? "NÓS" : "ELES") + " +" + f.pontos + (f.motivo === "correu" ? "<small>CORRERAM</small>" : "") + "</div>";
    }
    if (V.fase === "fim") {
      var venceuP = V.vencedor === nosT;
      sob += '<div class="tr-fim"><div class="trofeu">' + I(venceuP ? "trophy" : "sports_bar") + "</div><h2>" + (venceuP ? "VOCÊS VENCERAM!" : "NÃO FOI DESSA VEZ…") + "</h2>" +
        "<p>Placar " + V.placar[nosT] + " x " + V.placar[elesT] + " · Partidas " + V.partidas[nosT] + " x " + V.partidas[elesT] + "</p>" +
        (V.souHost ? '<button class="tr-btn vermelho grande" data-a="novaPartida">' + I("refresh") + ' JOGAR OUTRA</button><button class="tr-btn fantasma grande" data-a="voltarLobby">TROCAR MALANDROS OU REGRAS</button>' : '<p class="mudo">Esperando o host começar outra…</p>') + "</div>";
    }
    pinta("sobre", sob);
    var tela = document.getElementById("mesaTela");
    if (tela && ui.tremer && Date.now() - ui.tremer < 600) { tela.classList.remove("tremer"); void tela.offsetWidth; tela.classList.add("tremer"); ui.tremer = 0; }
    if (novo) S.iniciarMusica();
  }

  /* ---------------- Chat ---------------- */
  function abrirChat() {
    ui.modal = "chat";
    ui.chatVisto = V.chat.length;
    var h = '<h2 class="tr-titulo">' + I("chat") + ' RESENHA DA MESA</h2><div class="chat-lista" id="chatLista">' + V.chat.map(function (c) {
      if (c.sistema) return '<div class="msg sis">' + esc(c.texto) + "</div>";
      return '<div class="msg' + (c.autorId === V.meuId ? " minha" : "") + '">' + (c.autorId === V.meuId ? "" : '<div class="autor">' + esc(c.autor) + "</div>") + esc(c.texto) + "</div>";
    }).join("") + '</div><div class="frases">' + ["Bora, parceiro!", "Tá com medo?", "Joga a menor!", "Segura que é nossa!", "Essa é minha!", "Kkkkk"].map(function (f) { return '<button class="chip" data-a="frase" data-t="' + esc(f) + '">' + esc(f) + "</button>"; }).join("") +
      '</div><div class="tr-linha"><input id="chatin" class="tr-entrada" maxlength="200" placeholder="Escreva para a mesa…" autocomplete="off"><button class="tr-btn ouro icone" data-a="enviarChat">' + I("send") + "</button></div>";
    abrirModal(h, "folha-chat");
    var l = document.getElementById("chatLista"); if (l) l.scrollTop = l.scrollHeight;
    var i = document.getElementById("chatin"); if (i) i.addEventListener("keydown", function (e) { if (e.key === "Enter") acoes.enviarChat(); });
    render();
  }

  /* ---------------- Som ---------------- */
  function telaSom() {
    var c = S.cfg();
    ui.modal = "som";
    S.listarMinhas().then(function (lista) {
      if (ui.modal !== "som") return;
      var h = '<h2 class="tr-titulo">' + I("volume_up") + " SOM</h2>";
      [["musica", "Música de fundo"], ["efeitos", "Barulho das cartas e dos tentos"], ["vozes", "Vozes dos malandros"]].forEach(function (k) {
        h += '<label class="linha-chave"><span>' + k[1] + '</span><button class="chave' + (c[k[0]] ? " on" : "") + '" data-a="alternar" data-k="' + k[0] + '"></button></label>';
      });
      h += '<label class="tr-campo"><span>VOLUME</span><input type="range" id="volume" min="0" max="1" step="0.05" value="' + c.volume + '"></label>';
      h += '<div class="alterna largo"><button data-a="fonte" data-v="viola" class="' + (c.fonte === "viola" ? "sel" : "") + '">VIOLA CAIPIRA</button><button data-a="fonte" data-v="minhas" class="' + (c.fonte === "minhas" ? "sel" : "") + '">MINHAS MÚSICAS</button></div>';
      h += '<div class="mudo pequeno" style="margin:8px 0">Tocando: ' + esc(S.nomeMusica()) + ' · <button class="link" data-a="proxMusica">próxima</button></div>';
      h += '<div class="tr-cartao"><b>Minhas músicas</b><div class="mudo pequeno">Escolha músicas do seu celular (só toca no seu aparelho). Use músicas que você tem direito de usar.</div>' +
        (lista.length ? lista.map(function (m) { return '<div class="voz-linha"><span>🎶 ' + esc(m.nome) + '</span><button class="tr-mini" data-a="tirarMusica" data-id="' + m.id + '">' + I("close") + "</button></div>"; }).join("") : '<div class="mudo pequeno" style="margin:8px 0">Nenhuma música ainda.</div>') +
        '<label class="tr-mini ouro" style="margin-top:8px">+ Adicionar músicas<input type="file" id="arqMusica" accept="audio/*" multiple hidden></label></div>';
      h += '<button class="tr-btn fantasma grande" data-a="fechar" style="margin-top:12px">PRONTO</button>';
      abrirModal(h);
      var vol = document.getElementById("volume"); if (vol) vol.addEventListener("input", function () { S.definir("volume", parseFloat(vol.value)); });
      var arq = document.getElementById("arqMusica");
      if (arq) arq.addEventListener("change", function () { if (!arq.files.length) return; S.adicionarMinhas(arq.files).then(function () { toast("Músicas adicionadas!"); S.definir("fonte", "minhas"); telaSom(); }); });
    });
  }

  /* ---------------- Ações ---------------- */
  function compartilharTexto(txt) {
    try { if (window.Android && Android.compartilhar) { Android.compartilhar(txt); return; } if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; } navigator.clipboard.writeText(txt).then(function () { toast("Convite copiado!"); }); } catch (e) {}
  }
  function textoConvite() { return "🃏 Bora jogar TRUCO comigo! Toque no link para sentar na mesa:\nhttps://rhmwmdjg-wq.github.io/caso-aberto/entrar.html?c=" + V.codigo + "&j=truco\n\n(Ou abra o jogo, toque em Truco e digite o código " + V.codigo + ")"; }
  var acoes = {
    fechar: fecharModal,
    jogos: function () { location.href = "index.html?hub=1" + (sufixo() ? "&" + sufixo() : ""); },
    criar: function () { if (precisaNome()) return; iniciarHost(gerarCodigo(), null, false); },
    solo: function () {
      if (precisaNome()) return;
      iniciarHost("SOLO", null, true);
      var p = LS.get("tr_ultimo_personagem", null);
      if (p && PERS[p]) H.motor.acao(H.meuId, { tipo: "personagem", id: p });
      H.motor.acao(H.meuId, { tipo: "robos" });
      hostDifundir();
      if (!meuPersonagem()) acoes.abrirPersonagens();
    },
    entrar: function () {
      if (precisaNome()) return;
      var cod = (document.getElementById("codigo").value || "").toUpperCase();
      if (!/^[A-Z]{4}$/.test(cod)) { toast("O código tem 4 letras.", true); return; }
      conectarCliente(cod);
    },
    retomarHost: function () { var h = LS.get("tr_host", null); if (h) iniciarHost(h.codigo, h.estado, false); },
    retomarSolo: function () { var h = LS.get("tr_solo", null); if (h) iniciarHost("SOLO", h.estado, true); },
    retomarCliente: function () { var c = LS.get("tr_cliente", null); if (c && !precisaNome()) conectarCliente(c.codigo, false, true); },
    esquecer: function () { LS.del("tr_host"); LS.del("tr_cliente"); ui.shell = null; render(); },
    esquecerSolo: function () { LS.del("tr_solo"); ui.shell = null; render(); },
    cancelar: function () { if (modo === "cliente") LS.del("tr_cliente"); sairParaInicio(); },
    convidar: function () { compartilharTexto(textoConvite()); },
    mandarZap: function () {
      var url = "https://wa.me/?text=" + encodeURIComponent(textoConvite());
      if (window.Android && Android.abrirLink) Android.abrirLink(url); else window.open(url, "_blank");
    },
    copiarCodigo: function () { try { navigator.clipboard.writeText(V.codigo).then(function () { toast("Código " + V.codigo + " copiado!"); }, function () { toast("Código: " + V.codigo); }); } catch (e) { toast("Código: " + V.codigo); } },
    sentar: function (el) { enviarAcao({ tipo: "sentar", lugar: +el.dataset.l }); },
    tirarRobo: function (el) { enviarAcao({ tipo: "tirarRobo", lugar: +el.dataset.l }); },
    robos: function () { enviarAcao({ tipo: "robos" }); },
    abrirPersonagens: function () { ui.tela = "personagens"; ui.foco = meuPersonagem() || null; render(); },
    voltarLobbyTela: function () { ui.tela = null; ui.girar = false; render(); },
    focoPers: function (el) { ui.foco = el.dataset.id; S.voz(el.dataset.id, "selecao"); render(); },
    ouvirFala: function (el) { if (S.voz(el.dataset.id, el.dataset.p) === false) toast("Ligue as vozes em Som.", true); },
    equipar: function (el) {
      enviarAcao({ tipo: "personagem", id: el.dataset.id }, function (r) {
        if (r && r.ok) { S.voz(el.dataset.id, "selecao"); toast("Malandro equipado: " + pnome(el.dataset.id)); ui.tela = null; render(); }
      });
    },
    baralhos: function () { fecharModal(); ui.tela = "baralhos"; ui.focoTema = A.tema(); render(); },
    focoTema: function (el) { ui.focoTema = el.dataset.id; render(); },
    girarBaralho: function () { ui.girar = !ui.girar; render(); },
    virarBaralho: function () { var p = document.querySelector(".palco"); if (p) p.classList.toggle("virada"); },
    baterBaralho: function () { var p = document.querySelector(".palco"); if (!p) return; p.classList.remove("batendo"); void p.offsetWidth; p.classList.add("batendo"); S.fx("estalo"); vibrar(80); },
    equiparTema: function (el) { A.definirTema(el.dataset.id); LS.set("tr_tema", el.dataset.id); toast("Baralho " + A.TEMAS[el.dataset.id].nome + " equipado!"); S.fx("carta"); render(); },
    estalo: function () { LS.set("tr_estalo", !LS.get("tr_estalo", true)); render(); },
    regra: function (el) { enviarAcao({ tipo: "config", regra: el.dataset.v }); },
    cenario: function (el) { enviarAcao({ tipo: V.fase === "lobby" ? "config" : "cenario", cenario: el.dataset.v }); },
    tento: function (el) { enviarAcao({ tipo: "config", tento: el.dataset.v }); },
    iniciar: function () { enviarAcao({ tipo: "iniciar" }); },
    jogar: function (el) {
      var cob = ui.coberta, forte = ui.forte; ui.coberta = false; ui.forte = false;
      enviarAcao({ tipo: "jogar", carta: el.dataset.c, coberta: cob, forte: forte });
    },
    coberta: function () { ui.coberta = !ui.coberta; render(); },
    forte: function () { ui.forte = !ui.forte; render(); },
    truco: function () { enviarAcao({ tipo: "truco" }); },
    responder: function (el) { enviarAcao({ tipo: "responder", resposta: el.dataset.r }); },
    especial: function (el) { enviarAcao({ tipo: "maoEspecial", jogar: el.dataset.v === "1" }); },
    bordao: function (el) { enviarAcao({ tipo: "bordao", texto: el.dataset.t }); },
    novaPartida: function () { enviarAcao({ tipo: "novaPartida" }); },
    voltarLobby: function () { enviarAcao({ tipo: "voltarLobby" }); },
    chat: abrirChat,
    frase: function (el) { enviarAcao({ tipo: "chat", texto: el.dataset.t }, function () { if (ui.modal === "chat") abrirChat(); }); },
    enviarChat: function () {
      var i = document.getElementById("chatin"); if (!i || !i.value.trim()) return;
      var t = i.value; i.value = "";
      enviarAcao({ tipo: "chat", texto: t }, function () { if (ui.modal === "chat") abrirChat(); });
    },
    enviarChatLobby: function () {
      var i = document.getElementById("chatLobby"); if (!i || !i.value.trim()) return;
      var t = i.value; i.value = ""; i.blur();
      enviarAcao({ tipo: "chat", texto: t });
    },
    mudo: function () { var c = S.cfg(), ligado = c.musica || c.efeitos || c.vozes; S.silenciarTudo(ligado); toast(ligado ? "Tudo no silêncio" : "Som ligado"); render(); },
    som: telaSom,
    alternar: function (el) { var k = el.dataset.k; S.definir(k, !S.cfg()[k]); telaSom(); if (V) render(); },
    fonte: function (el) { S.definir("fonte", el.dataset.v); setTimeout(telaSom, 300); },
    proxMusica: function () { S.proximaMusica(); setTimeout(telaSom, 400); },
    tirarMusica: function (el) { S.removerMinha(el.dataset.id).then(telaSom); },
    vozes: telaVozes,
    usarVoz: function () { LS.set("tr_usar_voz", LS.get("tr_usar_voz", true) === false); enviarMinhasVozes(); telaVozes(); },
    gravar: function (el) { gravar(el.dataset.p); },
    ouvir: function (el) { var p = meuPersonagem(), v = vozesSalvas(p)[el.dataset.p]; if (v) { try { new Audio(v).play(); } catch (e) {} } else if (S.voz(p, el.dataset.p) === false) toast("Esse grito ainda não tem voz. Grave a sua!", true); },
    apagarVoz: function (el) { var p = meuPersonagem(), v = vozesSalvas(p); delete v[el.dataset.p]; LS.set("tr_voz_" + p, v); enviarMinhasVozes(); telaVozes(); },
    menu: function () {
      ui.modal = "menu";
      var h = '<div class="tr-menu">' + (V.souHost ? '<small class="rot">TROCAR O CENÁRIO</small><div class="cenarios">' + Object.keys(A.CENARIOS).map(function (k) { return '<button class="' + (V.config.cenario === k ? "sel" : "") + '" data-a="cenario" data-v="' + k + '">' + A.CENARIOS[k].icone + " " + esc(A.CENARIOS[k].nome) + "</button>"; }).join("") + "</div>" : "") +
        '<button class="tr-btn escuro grande" data-a="baralhos">' + I("style") + ' BARALHOS</button><button class="tr-btn escuro grande" data-a="som">' + I("volume_up") + ' SOM E MÚSICA</button><button class="tr-btn escuro grande" data-a="vozes">' + I("mic") + ' MINHA VOZ</button><button class="tr-btn escuro grande" data-a="regras">' + I("casino") + " REGRAS</button>" +
        (H && H.solo ? "" : '<button class="tr-btn verde grande" data-a="mandarZap">' + I("chat") + " CHAMAR NO ZAP (" + esc(V.codigo) + ")</button>") +
        '<button class="tr-btn fantasma grande" data-a="sair">' + I("logout") + ' SAIR DA MESA</button><button class="tr-btn fantasma grande" data-a="fechar">VOLTAR</button></div>';
      abrirModal(h);
    },
    sair: function () {
      abrirModal('<h2 class="tr-titulo">SAIR DA MESA?</h2><p>' + (modo === "host" && !(H && H.solo) ? "Você é o host. Se sair, <b>a mesa fecha para todos</b>." : "Você pode voltar depois pelo código.") + '</p><div class="tr-linha"><button class="tr-btn fantasma" data-a="fechar">FICAR</button><button class="tr-btn vermelho" data-a="sairOk">SAIR</button></div>');
    },
    sairOk: function () { sairDaMesa(); },
    regras: function () {
      abrirModal('<h2 class="tr-titulo">' + I("casino") + ' COMO JOGAR TRUCO</h2><div class="regras">' +
        "<p><b>Mesa:</b> quatro jogadores em duas duplas. Quem senta em frente é o parceiro. Faltou gente? Os robôs completam.</p>" +
        "<p><b>A mão:</b> cada um recebe 3 cartas. Ganha a mão quem fizer 2 de 3 rodadas. Se empatar (cangar) a primeira, quem ganhar a segunda leva. Ganhou a primeira e empatou a segunda? Leva quem ganhou a primeira.</p>" +
        "<p><b>Truco Mineiro:</b> manilhas fixas, da maior para a menor: <b>4♣ (zap)</b>, <b>7♥ (copas)</b>, <b>A♠ (espadilha)</b> e <b>7♦ (pica-fumo)</b>. Depois: 3, 2, A, K, J, Q, 7, 6, 5, 4. A mão vale 2 tentos; truco 4, seis 6, nove 10, doze 12. <b>Mão de 10</b>: a dupla vê as cartas do parceiro e decide se joga (vale 4) ou corre.</p>" +
        "<p><b>Truco Paulista:</b> uma carta é virada (a vira) e a manilha é a carta seguinte. Entre as manilhas: ♣ > ♥ > ♠ > ♦. A mão vale 1; truco 3, seis 6, nove 9, doze 12. <b>Mão de 11</b> igual à mão de 10.</p>" +
        "<p><b>Botões da mesa:</b> TRUCO pede aumento na sua vez. Quando pedirem pra você: CORRER, ACEITAR ou aumentar (SEIS, NOVE, DOZE). <b>Bater forte</b> joga a carta com estalo e faísca. <b>Carta coberta</b> (a partir da 2ª rodada) joga virada para baixo e não vale nada.</p>" +
        "<p><b>Partida:</b> quem chegar a 12 tentos primeiro ganha. Os tentos são grãos de milho ou de feijão branco.</p></div>" +
        '<button class="tr-btn vermelho grande" data-a="fechar">BORA JOGAR</button>');
    }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-a]");
    if (!el || el.disabled) return;
    var f = acoes[el.dataset.a];
    if (f) { e.preventDefault(); e.stopPropagation(); f(el); }
  });
  window.voltarAndroid = function () { if (!$modal.hidden) { fecharModal(); return true; } return false; };

  // pings e conexão
  setInterval(function () {
    var agora = Date.now();
    if (modo === "host" && H && !H.solo) {
      for (var cid in H.conns) { H.rede.enviar(cid, { t: "ping" }); if (H.visto[cid] && agora - H.visto[cid] > 20000) { H.rede.derrubar(cid); hostFechou(cid); } }
    } else if (modo === "cliente" && C && C.entrou && conectado && agora - C.ultimo > 15000) clientePerdeu();
  }, 5000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (modo === "cliente" && C && C.entrou && Date.now() - C.ultimo > 6000) clientePerdeu();
    if (modo === "host" && H) setTimeout(hostDifundir, 500);
  });
  // relógio do "Pensando…"
  setInterval(function () { if (V && V.fase === "jogo" && ui.shell === "mesa" && !ui.tela) pinta("status", statusLinha()); }, 1000);
  // atualiza bolhas e animações que expiram
  setInterval(function () { if (V && V.fase !== "lobby" && Object.keys(ui.bolhas).length) render(); }, 1000);
  // tela acesa no navegador
  var trava = null;
  setInterval(function () {
    if (window.Android || !navigator.wakeLock || document.visibilityState !== "visible") return;
    if (!V) { if (trava) { try { trava.release(); } catch (e) {} trava = null; } return; }
    if (!trava) navigator.wakeLock.request("screen").then(function (t) { trava = t; t.addEventListener("release", function () { trava = null; }); }).catch(function () {});
  }, 5000);

  /* ---------------- Convites ---------------- */
  window.abrirConvite = function (cod) {
    try { if (window.Android && Android.convite) Android.convite(); } catch (e) {}
    cod = String(cod || "");
    if (cod.indexOf("truco:") !== 0) { location.href = "index.html?sala=" + cod.replace(/[^A-Za-z]/g, "") + (sufixo() ? "&" + sufixo() : ""); return; }
    cod = cod.slice(6).toUpperCase().replace(/[^A-Z]/g, "");
    if (cod.length !== 4) return;
    if (V && V.codigo === cod) { toast("Você já está nessa mesa."); return; }
    if (V) sairDaMesa();
    entrarPorConvite(cod);
  };
  function entrarPorConvite(cod) {
    if (!meuNome) { ui.codigoConvite = cod; ui.shell = null; render(); toast("Convite para a mesa " + cod + ": digite seu nome e toque em Entrar."); return; }
    conectarCliente(cod);
  }

  // Ao abrir: convite, ou volta sozinho para a mesa em que estava
  (function abrir() {
    var conv = "";
    try { conv = window.Android && Android.convite ? Android.convite() : ""; } catch (e) {}
    if (conv) { window.abrirConvite(conv); return; }
    var sala = (/[?&]sala=([A-Za-z]{4})/.exec(location.search) || [])[1];
    if (sala) {
      try { history.replaceState(null, "", location.pathname + location.search.replace(/([?&])sala=[A-Za-z]{4}&?/, "$1").replace(/[?&]$/, "")); } catch (e) {}
      entrarPorConvite(sala.toUpperCase()); return;
    }
    var agora = Date.now(), lim = 3 * 3600e3, host = LS.get("tr_host", null), cli = LS.get("tr_cliente", null), solo = LS.get("tr_solo", null);
    if (host && host.estado && agora - host.ts < lim) { iniciarHost(host.codigo, host.estado, false); return; }
    if (cli && cli.codigo && meuNome && agora - cli.ts < lim) { ui.carregando = "Voltando para a mesa " + cli.codigo + "…"; conectarCliente(cli.codigo, false, true); return; }
    if (solo && solo.estado && solo.estado.fase === "jogo" && agora - solo.ts < lim) { iniciarHost("SOLO", solo.estado, true); return; }
    render();
  })();
})();
