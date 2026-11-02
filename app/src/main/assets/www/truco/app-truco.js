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
  var ui = { carregando: "", ultimoEvento: -1, chatVisto: 0, coberta: false, bolhas: {}, modal: null, ultimaFase: null };

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
  function meuPersonagem() { if (!V) return LS.get("tr_ultimo_personagem", null); var eu = V.jogadores.filter(function (j) { return j.id === V.meuId; })[0]; return eu && eu.personagem; }
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
    if (!p) { abrirModal('<h2 class="titulo">🎤 Gravar minha voz</h2><p>Escolha seu personagem na mesa primeiro. A voz gravada fica ligada a ele.</p><button class="btn prim" data-a="fechar">Entendi</button>'); return; }
    var v = vozesSalvas(p), usar = LS.get("tr_usar_voz", true) !== false;
    var h = '<h2 class="titulo">🎤 Voz de ' + esc(PERS[p].nome) + "</h2><p class=\"mudo pequeno\">Grite com vontade! Cada gravação tem até 2,5 segundos. Os amigos da mesa ouvem a sua voz quando você pedir truco.</p>";
    h += '<label class="linha-chave"><span>Usar minha voz no jogo</span><button class="chave' + (usar ? " on" : "") + '" data-a="usarVoz"></button></label>';
    PALAVRAS.forEach(function (w) {
      var tem = !!v[w[0]], gravandoEsta = ui.gravando === w[0];
      h += '<div class="voz-linha"><b>' + w[1] + '</b><span class="mudo pequeno">' + (tem ? "sua voz" : "voz padrão") + "</span>" +
        '<button class="btn pequeno ' + (gravandoEsta ? "prim pulsa" : "") + '" data-a="gravar" data-p="' + w[0] + '">' + (gravandoEsta ? "⏹ Parar" : "🎤 Gravar") + "</button>" +
        '<button class="btn pequeno fantasma" data-a="ouvir" data-p="' + w[0] + '">▶</button>' +
        (tem ? '<button class="btn pequeno fantasma" data-a="apagarVoz" data-p="' + w[0] + '">🗑</button>' : "") + "</div>";
    });
    h += '<button class="btn fantasma" data-a="fechar" style="margin-top:12px">Pronto</button>';
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
      case "jogou": S.fx("jogar"); ui.animJogada = { lugar: e.lugar, t: Date.now() }; break;
      case "grito":
        S.fx("murro");
        if (as) S.voz(as.personagem, e.palavra, as.id);
        ui.bolhas[e.lugar] = { texto: e.texto, t: Date.now(), grito: true };
        if (["truco", "seis", "nove", "doze"].indexOf(e.palavra) >= 0) { ui.tremer = Date.now(); vibrar(180); }
        setTimeout(render, 2700);
        break;
      case "vaza": break;
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
  function shell(nome, html) {
    if (ui.shell !== nome) { $app.innerHTML = html; ui.shell = nome; return true; }
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
    if (modo === "host") return '<div class="faixa-conexao">📡 Sem internet: reconectando a mesa…</div>';
    return '<div class="faixa-conexao">📡 Conexão perdida: voltando para a mesa…</div>';
  }
  function render() {
    if (!V) {
      if (ui.carregando) { shell("carregando", '<div class="tela centro-tela"><div class="girando"></div><div id="msgc"></div><button class="link" data-a="cancelar">Cancelar</button></div>'); pinta("msgc", esc(ui.carregando)); }
      else renderInicio();
      return;
    }
    if (V.fase === "lobby") renderLobby();
    else renderMesa();
  }

  /* ---------------- Início ---------------- */
  function renderInicio() {
    var host = LS.get("tr_host", null), cli = LS.get("tr_cliente", null), solo = LS.get("tr_solo", null), agora = Date.now(), lim = 6 * 3600e3;
    var ret = "";
    if (host && host.estado && agora - host.ts < lim) ret = '<div class="retomar">Você tinha uma mesa aberta (<b>' + esc(host.codigo) + '</b>).<div class="linha-flex"><button class="btn latao pequeno" data-a="retomarHost">Reabrir</button><button class="btn fantasma pequeno" data-a="esquecer">Descartar</button></div></div>';
    else if (solo && solo.estado && agora - solo.ts < lim && solo.estado.fase === "jogo") ret = '<div class="retomar">Continuar a partida com os robôs?<div class="linha-flex"><button class="btn latao pequeno" data-a="retomarSolo">Continuar</button><button class="btn fantasma pequeno" data-a="esquecerSolo">Descartar</button></div></div>';
    else if (cli && agora - cli.ts < lim) ret = '<div class="retomar">Voltar para a mesa <b>' + esc(cli.codigo) + '</b>?<div class="linha-flex"><button class="btn latao pequeno" data-a="retomarCliente">Voltar</button><button class="btn fantasma pequeno" data-a="esquecer">Descartar</button></div></div>';
    var novo = shell("inicio", '<div class="tela inicio-truco">' + '<div class="cenario">' + A.fundo("boteco") + '</div><div class="rolagem"><div class="conteudo">' +
      '<button class="link voltar-jogos" data-a="jogos">← Jogos</button>' +
      '<div class="logo-truco"><div class="cartas-logo">' + A.carta("4P") + A.carta("7C") + A.carta("AE") + '</div><h1>TRUCO</h1><div class="sub">do Norte de Minas</div></div>' +
      '<div id="retomar"></div>' +
      '<label class="campo"><span>Seu nome</span><input id="nome" class="entrada" maxlength="18" autocomplete="off" placeholder="Ex.: Ruan"></label>' +
      '<div class="pilha"><button class="btn prim" data-a="criar">🃏 Criar mesa</button><button class="btn fantasma" data-a="solo">🤖 Jogar com robôs</button></div>' +
      '<div class="ou">ou entre com o código</div>' +
      '<div class="linha-flex"><input id="codigo" class="entrada codigo" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="····"><button class="btn latao" data-a="entrar" style="width:auto">Entrar</button></div>' +
      '<div class="centro" style="margin-top:20px"><button class="link" data-a="regras">📖 Regras</button> · <button class="link" data-a="som">🎵 Som</button> · <button class="link" data-a="vozes">🎤 Minha voz</button></div>' +
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
  function renderLobby() {
    shell("lobby", '<div class="tela"><div id="faixa"></div><div class="cenario" id="cen"></div><div class="rolagem" id="corpo"></div><div class="base" id="base"></div></div>');
    pinta("faixa", faixa());
    pinta("cen", A.fundo(V.config.cenario));
    var h = '<div class="conteudo">';
    if (H && H.solo) h += '<div class="cartao centro"><b>🤖 Partida com robôs</b><div class="mudo pequeno">Escolha seu personagem, o cenário e a regra. Os robôs completam a mesa.</div></div>';
    else h += '<div class="cartao codigo-sala"><div class="rot">CÓDIGO DA MESA</div><div class="cod">' + esc(V.codigo) + '</div><button class="btn latao" data-a="convidar">📨 Convidar amigos</button></div>';
    // lugares
    h += '<h2 class="secao">A mesa</h2><div class="mesa-lobby">';
    [0, 1, 2, 3].forEach(function (l) {
      var a = V.assentos[l], dupla = l % 2 === 0 ? "d1" : "d2";
      h += '<div class="lugar ' + dupla + ' l' + l + '">';
      if (!a) h += '<button class="vazio" data-a="sentar" data-l="' + l + '">+ Sentar aqui</button>';
      else {
        h += (a.personagem ? A.avatar(a.personagem) : '<div class="sem-pers">?</div>') + '<div class="n">' + (a.robo ? "🤖 " : "") + esc(a.nome) + (a.id === V.meuId ? " (você)" : "") + "</div>" +
          '<div class="p mudo pequeno">' + (a.personagem ? esc(PERS[a.personagem].nome) : "escolhendo…") + "</div>";
        if (a.robo && V.souHost) h += '<button class="x" data-a="tirarRobo" data-l="' + l + '">×</button>';
        else if (a.robo) h += "";
        else if (!a.robo && a.id !== V.meuId && V.meuLugar >= 0) h += "";
      }
      h += "</div>";
    });
    h += '<div class="rotulo-dupla d1">Dupla 1</div><div class="rotulo-dupla d2">Dupla 2</div><div class="mesa-centro">' + A.decoracaoMesa() + "</div></div>";
    if (V.souHost && V.assentos.indexOf(null) >= 0) h += '<button class="btn fantasma" data-a="robos">🤖 Completar a mesa com robôs</button>';
    h += '<div class="mudo pequeno centro" style="margin-top:6px">Quem senta em frente é o seu parceiro. Toque num lugar vazio para trocar de lugar.</div>';
    // personagens
    var meu = meuPersonagem();
    h += '<h2 class="secao">Seu personagem</h2><div class="grade-pers">';
    Truco.PERSONAGENS.forEach(function (p) {
      var dono = V.jogadores.filter(function (j) { return j.personagem === p.id; })[0];
      var meuP = meu === p.id, ocupado = dono && !meuP;
      h += '<button class="pers' + (meuP ? " sel" : "") + (ocupado ? " ocupado" : "") + '" data-a="personagem" data-id="' + p.id + '"' + (ocupado ? " disabled" : "") + ">" + A.avatar(p.id) +
        '<div class="n">' + esc(p.nome) + '</div><div class="d">' + (ocupado ? "com " + esc(dono.nome) : esc(p.desc)) + "</div>" +
        '<span class="ouvir" data-a="ouvirPers" data-id="' + p.id + '">🔊</span></button>';
    });
    h += '</div><div class="centro"><button class="link" data-a="vozes">🎤 Gravar a minha voz para o meu personagem</button></div>';
    // regras da mesa
    var cfg = V.config;
    h += '<h2 class="secao">Regras da mesa' + (V.souHost ? "" : ' <span class="mudo pequeno">(o anfitrião escolhe)</span>') + "</h2>";
    h += '<div class="segmento">' + [["mineiro", "Truco Mineiro"], ["paulista", "Truco Paulista"]].map(function (r) { return '<button data-a="regra" data-v="' + r[0] + '" class="' + (cfg.regra === r[0] ? "sel" : "") + '"' + (V.souHost ? "" : " disabled") + ">" + r[1] + "</button>"; }).join("") + "</div>";
    h += '<div class="mudo pequeno" style="margin:6px 0 12px">' + (cfg.regra === "paulista" ? "Manilha muda a cada mão (a carta seguinte à vira). Mão vale 1; truco 3, seis, nove e doze. Mão de 11." : "Manilhas fixas: zap (4♣), 7♥, espadilha (A♠) e 7♦. Mão vale 2; truco 4, seis 6, nove 10 e doze 12. Mão de 10.") + "</div>";
    h += '<h2 class="secao">Cenário</h2><div class="grade-cen">';
    Object.keys(A.CENARIOS).forEach(function (k) { var c = A.CENARIOS[k]; h += '<button class="cen' + (cfg.cenario === k ? " sel" : "") + '" data-a="cenario" data-v="' + k + '"' + (V.souHost ? "" : " disabled") + '><span class="ic">' + c.icone + '</span><b>' + esc(c.nome) + '</b><span class="mudo pequeno">' + esc(c.desc) + "</span></button>"; });
    h += '</div><h2 class="secao">Tentos</h2><div class="segmento">' + [["milho", "🌽 Grão de milho"], ["feijao", "⚪ Feijão branco"]].map(function (t) { return '<button data-a="tento" data-v="' + t[0] + '" class="' + (cfg.tento === t[0] ? "sel" : "") + '"' + (V.souHost ? "" : " disabled") + ">" + t[1] + "</button>"; }).join("") + "</div>";
    h += '<div class="centro" style="margin:18px 0 8px"><button class="link" data-a="regras">📖 Regras</button> · <button class="link" data-a="som">🎵 Som</button> · <button class="link" data-a="sair">Sair da mesa</button></div></div>';
    pinta("corpo", h);
    var pronto = V.assentos.every(function (a) { return a && a.personagem; });
    pinta("base", V.souHost ? '<button class="btn prim" data-a="iniciar"' + (pronto ? "" : " disabled") + ">🃏 " + (pronto ? "Começar a partida" : "Falta gente ou personagem") + "</button>"
      : '<div class="centro mudo">Esperando o anfitrião começar…</div>');
  }

  /* ---------------- Mesa (jogo) ---------------- */
  function bolha(l) {
    var b = ui.bolhas[l];
    if (!b) return "";
    var idade = Date.now() - b.t;
    if (idade > (b.grito ? 2600 : 4000)) { delete ui.bolhas[l]; return ""; }
    return '<div class="bolha' + (b.grito ? " grito" : "") + '">' + esc(b.texto) + "</div>";
  }
  function assento(l) {
    var a = V.assentos[l], m = V.mao, r = rel(l);
    if (!a) return "";
    var vez = m && !m.fim && m.vez === l && !m.pedido && !(m.especial && !m.especial.decidido);
    var h = '<div class="assento r' + r + (vez ? " vez" : "") + (l % 2 === (V.meuLugar < 0 ? 0 : V.meuLugar % 2) ? " nos" : " eles") + '">';
    h += '<div class="av">' + A.avatar(a.personagem) + (a.online ? "" : '<span class="off">📵</span>') + (m && m.distribuidor === l ? '<span class="dist" title="Deu as cartas">🃏</span>' : "") + "</div>";
    h += '<div class="nm">' + (a.robo ? "🤖 " + esc(a.nome.replace(/^Robô /, "")) : esc(a.nome.split(" ")[0])) + "</div>";
    if (r !== 0 && m) { h += '<div class="mao-costas">'; for (var i = 0; i < a.cartas; i++) h += '<span class="costas">' + A.verso() + "</span>"; h += "</div>"; }
    h += bolha(l);
    return h + "</div>";
  }
  function renderMesa() {
    var novo = shell("mesa", '<div class="tela mesa-tela" id="mesaTela"><div class="cenario" id="cen"></div><div id="faixa"></div><div class="topo-truco" id="topo"></div>' +
      '<div class="mesa-area" id="area"></div><div class="minha-area" id="minha"></div><div class="sobre" id="sobre"></div></div>');
    pinta("faixa", faixa());
    pinta("cen", A.fundo(V.config.cenario));
    var m = V.mao, nos = V.meuLugar >= 0 ? V.meuLugar % 2 : 0, eles = 1 - nos, alvo = V.regra.alvo, tento = V.config.tento;
    var naoLidas = V.chat.filter(function (c, i) { return i >= ui.chatVisto && !c.sistema && c.autorId !== V.meuId; }).length;
    // placar
    var t = '<button class="ic-btn" data-a="menu">☰</button><div class="placar">' +
      '<div class="lado nos"><span class="rot">Nós</span><b>' + V.placar[nos] + "</b>" + A.tentos(tento, Math.min(V.placar[nos], alvo), alvo) + "</div>" +
      '<div class="lado eles"><span class="rot">Eles</span><b>' + V.placar[eles] + "</b>" + A.tentos(tento, Math.min(V.placar[eles], alvo), alvo) + "</div></div>" +
      '<button class="ic-btn" data-a="mudo">' + (S.cfg().musica || S.cfg().efeitos ? "🔊" : "🔇") + '</button><button class="ic-btn" data-a="chat">💬' + (naoLidas ? '<span class="selo">' + naoLidas + "</span>" : "") + "</button>";
    pinta("topo", t);
    if (!m) { pinta("area", ""); pinta("minha", ""); return; }
    // área central
    var h = '<div class="mesa-madeira">' + A.decoracaoMesa() + "</div>";
    [1, 2, 3].forEach(function (r) { var l = (V.meuLugar + r + 4) % 4; if (V.meuLugar < 0) l = r; h += assento(l); });
    var info = '<div class="info-mao"><span class="valor">Vale <b>' + m.valor + "</b></span>";
    info += '<span class="vazas">' + [0, 1, 2].map(function (i) { var vz = m.vazas[i]; return '<i class="' + (!vz ? "" : vz.time === -1 ? "emp" : vz.time === nos ? "ganha" : "perde") + '"></i>'; }).join("") + "</span>";
    if (m.vira) info += '<span class="vira">' + A.carta(m.vira, { cls: "mini" }) + '<span class="pequeno">manilha: <b>' + esc(m.manilhas === "Q" ? "Q" : m.manilhas) + "</b></span></span>";
    if (m.ferro) info += '<span class="tag">Mão de ferro</span>';
    if (m.especial) info += '<span class="tag">Mão de ' + V.regra.maoEspecial + "</span>";
    h += info + "</div>";
    // cartas na mesa
    var mostrar = m.mesa.length ? m.mesa : (m.ultimaVaza || []);
    var velha = !m.mesa.length;
    h += '<div class="jogadas' + (velha ? " velha" : "") + '">';
    mostrar.forEach(function (j) {
      var r = rel(j.lugar), nova = ui.animJogada && ui.animJogada.lugar === j.lugar && Date.now() - ui.animJogada.t < 700 && !velha;
      h += '<div class="jogada r' + r + (nova ? " chegando" : "") + '">' + (j.coberta ? A.verso() : A.carta(j.carta)) + "</div>";
    });
    h += "</div>";
    pinta("area", h);
    // minha mão
    var mm = "";
    if (V.meuLugar >= 0) {
      var minha = m.minhasCartas, minhaVez = m.vez === V.meuLugar && !m.pedido && !m.fim && !(m.especial && !m.especial.decidido);
      var distribuindo = ui.animDistribuir && Date.now() - ui.animDistribuir < 2400;
      mm += '<div class="eu">' + assentoEu() + "</div>";
      mm += '<div class="minhas-cartas' + (minhaVez ? " ativa" : "") + '">';
      minha.forEach(function (c, i) {
        var man = m.forcas && m.forcas[i] >= 10;
        mm += '<button class="minha-carta' + (distribuindo ? " dist" : "") + '" style="--i:' + i + '" data-a="jogar" data-c="' + c + '"' + (minhaVez ? "" : " disabled") + ">" + A.carta(c, { manilha: man }) + "</button>";
      });
      mm += "</div>";
      mm += '<div class="acoes-mao">';
      if (m.podeTruco) mm += '<button class="btn-truco" data-a="truco">' + esc(m.nomeProximo || "TRUCO") + "!</button>";
      if (minhaVez && m.vazas.length > 0) mm += '<button class="btn-coberta' + (ui.coberta ? " on" : "") + '" data-a="coberta">' + (ui.coberta ? "🂠 Coberta: sim" : "🂠 Jogar coberta") + "</button>";
      mm += '<div class="aviso-vez">' + (m.fim ? "" : m.pedido ? "" : minhaVez ? "Sua vez: toque numa carta" : (V.assentos[m.vez] ? "Vez de " + esc(V.assentos[m.vez].nome.split(" ")[0]) : "")) + "</div>";
      mm += "</div>";
    }
    pinta("minha", mm);
    // sobreposições: pedido de truco, mão de 10/11, fim de mão, fim de partida
    var sob = "";
    if (m.pedido && !m.fim) {
      var de = V.assentos[m.pedido.deLugar];
      sob += '<div class="painel-pedido' + (m.possoResponder ? " responder" : "") + '"><div class="quem">' + A.avatar(de.personagem) + "<div><b>" + esc(de.nome) + '</b> pediu</div></div><div class="palavra">' + esc(m.pedido.nome) + "!</div>";
      if (m.possoResponder) {
        sob += '<div class="botoes"><button class="btn prim" data-a="responder" data-r="aceito">Desce! (vale ' + m.pedido.valor + ")</button><button class=\"btn fantasma\" data-a=\"responder\" data-r=\"corro\">Corro</button>" +
          (m.pedido.nomeAumento ? '<button class="btn-truco" data-a="responder" data-r="aumento">' + esc(m.pedido.nomeAumento) + "!</button>" : "") + "</div>";
      } else sob += '<div class="mudo pequeno">' + (m.pedido.deTime === nos ? "Esperando a outra dupla responder…" : "Seu parceiro está decidindo…") + "</div>";
      sob += "</div>";
    } else if (m.especial && !m.especial.decidido) {
      if (m.possoDecidirEspecial) {
        sob += '<div class="painel-pedido responder"><div class="palavra pequena">Mão de ' + V.regra.maoEspecial + '</div><div class="pequeno">Cartas do seu parceiro:</div><div class="cartas-parceiro">' + (m.cartasParceiro || []).map(function (c) { return A.carta(c, { cls: "mini2" }); }).join("") + "</div>" +
          '<div class="botoes"><button class="btn prim" data-a="especial" data-v="1">Jogar (vale ' + (V.regra.id === "paulista" ? 3 : 4) + ')</button><button class="btn fantasma" data-a="especial" data-v="0">Correr</button></div></div>';
      } else sob += '<div class="painel-pedido"><div class="palavra pequena">Mão de ' + V.regra.maoEspecial + '</div><div class="mudo pequeno">' + (m.especial.time === nos ? "Seu parceiro está decidindo…" : "A outra dupla está decidindo se joga…") + "</div></div>";
    }
    if (ui.fimMao && Date.now() - ui.fimMao.t < 3500 && V.fase === "jogo") {
      var f = ui.fimMao;
      sob += '<div class="faixa-fim ' + (f.nos ? "ganhou" : "perdeu") + '">' + (f.nos ? "Nós" : "Eles") + " +" + f.pontos + (f.motivo === "correu" ? " (correram)" : "") + "</div>";
    }
    if (V.fase === "fim") {
      var venceu = V.vencedor === nos;
      sob += '<div class="painel-fim"><div class="trofeu">' + (venceu ? "🏆" : "🍺") + "</div><h2>" + (venceu ? "Vocês venceram!" : "Não foi dessa vez…") + "</h2>" +
        '<div class="mudo">Placar ' + V.placar[nos] + " x " + V.placar[eles] + " · Partidas: " + V.partidas[nos] + " x " + V.partidas[eles] + "</div>" +
        (V.souHost ? '<div class="pilha"><button class="btn prim" data-a="novaPartida">🃏 Jogar outra</button><button class="btn fantasma" data-a="voltarLobby">Trocar personagens ou regras</button></div>' : '<div class="mudo pequeno">Esperando o anfitrião começar outra…</div>') + "</div>";
    }
    pinta("sobre", sob);
    var tela = document.getElementById("mesaTela");
    if (tela && ui.tremer && Date.now() - ui.tremer < 600) { tela.classList.remove("tremer"); void tela.offsetWidth; tela.classList.add("tremer"); ui.tremer = 0; }
    if (novo) S.iniciarMusica();
  }
  function assentoEu() {
    var a = V.assentos[V.meuLugar];
    if (!a) return "";
    return '<div class="assento-eu">' + A.avatar(a.personagem) + bolha(V.meuLugar) + "</div>";
  }

  /* ---------------- Chat ---------------- */
  function abrirChat() {
    ui.modal = "chat";
    ui.chatVisto = V.chat.length;
    var h = '<h2 class="titulo">💬 Conversa da mesa</h2><div class="chat-lista" id="chatLista">' + V.chat.map(function (c) {
      if (c.sistema) return '<div class="msg sis">' + esc(c.texto) + "</div>";
      return '<div class="msg' + (c.autorId === V.meuId ? " minha" : "") + '">' + (c.autorId === V.meuId ? "" : '<div class="autor">' + esc(c.autor) + "</div>") + esc(c.texto) + "</div>";
    }).join("") + '</div><div class="frases">' + ["Bora, parceiro!", "Tá com medo?", "Joga a menor!", "Segura que é nossa!", "Essa é minha!", "Kkkkk"].map(function (f) { return '<button class="chip" data-a="frase" data-t="' + esc(f) + '">' + esc(f) + "</button>"; }).join("") +
      '</div><div class="linha-flex"><input id="chatin" class="entrada" maxlength="200" placeholder="Escreva para a mesa…" autocomplete="off"><button class="btn prim" data-a="enviarChat" style="width:auto">➤</button></div>';
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
      var h = '<h2 class="titulo">🎵 Som</h2>';
      [["musica", "Música de fundo"], ["efeitos", "Barulho das cartas e dos tentos"], ["vozes", "Vozes dos personagens"]].forEach(function (k) {
        h += '<label class="linha-chave"><span>' + k[1] + '</span><button class="chave' + (c[k[0]] ? " on" : "") + '" data-a="alternar" data-k="' + k[0] + '"></button></label>';
      });
      h += '<label class="campo"><span>Volume</span><input type="range" id="volume" min="0" max="1" step="0.05" value="' + c.volume + '"></label>';
      h += '<h2 class="secao">Música que toca</h2><div class="segmento"><button data-a="fonte" data-v="viola" class="' + (c.fonte === "viola" ? "sel" : "") + '">🪕 Viola caipira</button><button data-a="fonte" data-v="minhas" class="' + (c.fonte === "minhas" ? "sel" : "") + '">📱 Minhas músicas</button></div>';
      h += '<div class="mudo pequeno" style="margin:6px 0">Tocando: ' + esc(S.nomeMusica()) + ' · <button class="link" data-a="proxMusica">próxima ⏭</button></div>';
      h += '<div class="cartao"><b>📱 Minhas músicas</b><div class="mudo pequeno">Escolha músicas do seu celular (só toca no seu aparelho). Use músicas que você tem direito de usar.</div>' +
        (lista.length ? lista.map(function (m) { return '<div class="voz-linha"><span>🎶 ' + esc(m.nome) + '</span><button class="btn pequeno fantasma" data-a="tirarMusica" data-id="' + m.id + '">🗑</button></div>'; }).join("") : '<div class="mudo pequeno" style="margin:8px 0">Nenhuma música ainda.</div>') +
        '<label class="btn pequeno" style="margin-top:8px">➕ Adicionar músicas<input type="file" id="arqMusica" accept="audio/*" multiple hidden></label></div>';
      h += '<button class="btn fantasma" data-a="fechar" style="margin-top:12px">Pronto</button>';
      abrirModal(h);
      var vol = document.getElementById("volume"); if (vol) vol.addEventListener("input", function () { S.definir("volume", parseFloat(vol.value)); });
      var arq = document.getElementById("arqMusica");
      if (arq) arq.addEventListener("change", function () { if (!arq.files.length) return; S.adicionarMinhas(arq.files).then(function () { toast("Músicas adicionadas!"); S.definir("fonte", "minhas"); telaSom(); }); });
    });
  }

  /* ---------------- Ações ---------------- */
  var acoes = {
    fechar: fecharModal,
    jogos: function () { location.href = "index.html?hub=1" + (sufixo() ? "&" + sufixo() : ""); },
    criar: function () { if (precisaNome()) return; iniciarHost(gerarCodigo(), null, false); },
    solo: function () { if (precisaNome()) return; iniciarHost("SOLO", null, true); H.motor.acao(H.meuId, { tipo: "robos" }); var p = LS.get("tr_ultimo_personagem", null); if (p) { var ocup = H.motor.personagensUsados(); if (ocup.indexOf(p) >= 0) { /* robô pegou: troca o robô */ var rid = Object.keys(H.motor.s.jogadores).filter(function (k) { return H.motor.s.jogadores[k].personagem === p; })[0]; if (rid) H.motor.s.jogadores[rid].personagem = Truco.PERSONAGENS.map(function (x) { return x.id; }).filter(function (x) { return H.motor.personagensUsados().indexOf(x) < 0; })[0]; } H.motor.acao(H.meuId, { tipo: "personagem", id: p }); } hostDifundir(); },
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
    convidar: function () {
      var txt = "🃏 Bora jogar TRUCO comigo! Toque no link para sentar na mesa:\nhttps://rhmwmdjg-wq.github.io/caso-aberto/entrar.html?c=" + V.codigo + "&j=truco\n\n(Ou abra o jogo, toque em Truco e digite o código " + V.codigo + ")";
      try { if (window.Android && Android.compartilhar) { Android.compartilhar(txt); return; } if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; } navigator.clipboard.writeText(txt).then(function () { toast("Convite copiado!"); }); } catch (e) {}
    },
    sentar: function (el) { enviarAcao({ tipo: "sentar", lugar: +el.dataset.l }); },
    tirarRobo: function (el) { enviarAcao({ tipo: "tirarRobo", lugar: +el.dataset.l }); },
    robos: function () { enviarAcao({ tipo: "robos" }); },
    personagem: function (el) { enviarAcao({ tipo: "personagem", id: el.dataset.id }, function (r) { if (r && r.ok) { S.voz(el.dataset.id, "truco"); } }); },
    ouvirPers: function (el) { S.voz(el.dataset.id, ["truco", "seis", "aceito"][Math.floor(Math.random() * 3)]); },
    regra: function (el) { enviarAcao({ tipo: "config", regra: el.dataset.v }); },
    cenario: function (el) { enviarAcao({ tipo: V.fase === "lobby" ? "config" : "cenario", cenario: el.dataset.v }); },
    tento: function (el) { enviarAcao({ tipo: "config", tento: el.dataset.v }); },
    iniciar: function () { enviarAcao({ tipo: "iniciar" }); },
    jogar: function (el) {
      var cob = ui.coberta; ui.coberta = false;
      enviarAcao({ tipo: "jogar", carta: el.dataset.c, coberta: cob });
    },
    coberta: function () { ui.coberta = !ui.coberta; render(); },
    truco: function () { enviarAcao({ tipo: "truco" }); },
    responder: function (el) { enviarAcao({ tipo: "responder", resposta: el.dataset.r }); },
    especial: function (el) { enviarAcao({ tipo: "maoEspecial", jogar: el.dataset.v === "1" }); },
    novaPartida: function () { enviarAcao({ tipo: "novaPartida" }); },
    voltarLobby: function () { enviarAcao({ tipo: "voltarLobby" }); },
    chat: abrirChat,
    frase: function (el) { enviarAcao({ tipo: "chat", texto: el.dataset.t }, function () { if (ui.modal === "chat") abrirChat(); }); },
    enviarChat: function () {
      var i = document.getElementById("chatin"); if (!i || !i.value.trim()) return;
      var t = i.value; i.value = "";
      enviarAcao({ tipo: "chat", texto: t }, function () { if (ui.modal === "chat") abrirChat(); });
    },
    mudo: function () { var c = S.cfg(), ligado = c.musica || c.efeitos || c.vozes; S.silenciarTudo(ligado); toast(ligado ? "🔇 Tudo no silêncio" : "🔊 Som ligado"); render(); },
    som: telaSom,
    alternar: function (el) { var k = el.dataset.k; S.definir(k, !S.cfg()[k]); telaSom(); if (V) render(); },
    fonte: function (el) { S.definir("fonte", el.dataset.v); setTimeout(telaSom, 300); },
    proxMusica: function () { S.proximaMusica(); setTimeout(telaSom, 400); },
    tirarMusica: function (el) { S.removerMinha(el.dataset.id).then(telaSom); },
    vozes: telaVozes,
    usarVoz: function () { LS.set("tr_usar_voz", LS.get("tr_usar_voz", true) === false); enviarMinhasVozes(); telaVozes(); },
    gravar: function (el) { gravar(el.dataset.p); },
    ouvir: function (el) { var p = meuPersonagem(), v = vozesSalvas(p)[el.dataset.p]; if (v) { try { new Audio(v).play(); } catch (e) {} } else S.voz(p, el.dataset.p); },
    apagarVoz: function (el) { var p = meuPersonagem(), v = vozesSalvas(p); delete v[el.dataset.p]; LS.set("tr_voz_" + p, v); enviarMinhasVozes(); telaVozes(); },
    menu: function () {
      ui.modal = "menu";
      var h = '<div class="pilha">' + (V.souHost ? '<div class="secao">Trocar o cenário</div><div class="grade-cen mini">' + Object.keys(A.CENARIOS).map(function (k) { return '<button class="cen' + (V.config.cenario === k ? " sel" : "") + '" data-a="cenario" data-v="' + k + '">' + A.CENARIOS[k].icone + " " + esc(A.CENARIOS[k].nome) + "</button>"; }).join("") + "</div>" : "") +
        '<button class="btn" data-a="som">🎵 Som e música</button><button class="btn" data-a="vozes">🎤 Minha voz</button><button class="btn" data-a="regras">📖 Regras</button>' +
        (H && H.solo ? "" : '<button class="btn" data-a="convidar">📨 Convidar (mesa ' + esc(V.codigo) + ")</button>") +
        '<button class="btn fantasma" data-a="sair">🚪 Sair da mesa</button><button class="btn fantasma" data-a="fechar">Voltar</button></div>';
      abrirModal(h);
    },
    sair: function () {
      abrirModal("<p>" + (modo === "host" && !(H && H.solo) ? "Você é o anfitrião. Se sair, <b>a mesa fecha para todos</b>." : "Sair da mesa?") + '</p><div class="linha-flex"><button class="btn fantasma" data-a="fechar">Ficar</button><button class="btn prim" data-a="sairOk">Sair</button></div>');
    },
    sairOk: function () { sairDaMesa(); },
    regras: function () {
      abrirModal('<h2 class="titulo">📖 Como jogar truco</h2><div class="regras">' +
        "<p><b>Mesa:</b> quatro jogadores em duas duplas. Quem senta em frente é o parceiro. Faltou gente? Os robôs completam.</p>" +
        "<p><b>A mão:</b> cada um recebe 3 cartas. Ganha a mão quem fizer 2 de 3 rodadas (vazas). Se empatar (cangar) a primeira, quem ganhar a segunda leva. Ganhou a primeira e empatou a segunda? Leva quem ganhou a primeira.</p>" +
        "<p><b>Truco Mineiro:</b> manilhas fixas, da maior para a menor: <b>4♣ (zap)</b>, <b>7♥ (copas)</b>, <b>A♠ (espadilha)</b> e <b>7♦ (pica-fumo)</b>. Depois: 3, 2, A, K, J, Q, 7, 6, 5, 4. A mão vale 2 tentos; truco 4, seis 6, nove 10, doze 12. Quem chega a 10 joga a <b>mão de 10</b>: vê as cartas do parceiro e decide se joga (vale 4) ou corre.</p>" +
        "<p><b>Truco Paulista:</b> uma carta é virada (a vira) e a manilha é a carta seguinte. Entre as manilhas: ♣ > ♥ > ♠ > ♦. A mão vale 1; truco 3, seis 6, nove 9, doze 12. <b>Mão de 11</b> igual à mão de 10.</p>" +
        "<p><b>Pedindo truco:</b> na sua vez, toque em TRUCO. A outra dupla pode aceitar (desce), correr (vocês levam o valor de antes) ou aumentar (seis, nove, doze). Quem pediu por último não pode aumentar de novo até a outra dupla aumentar.</p>" +
        "<p><b>Carta coberta:</b> a partir da segunda rodada, dá para jogar uma carta virada para baixo. Ela não vale nada, mas esconde o jogo.</p>" +
        "<p><b>Partida:</b> quem chegar a 12 tentos primeiro ganha. Os tentos são grãos de milho ou de feijão branco, como na mesa do bar.</p></div>" +
        '<button class="btn prim" data-a="fechar">Bora jogar</button>');
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
