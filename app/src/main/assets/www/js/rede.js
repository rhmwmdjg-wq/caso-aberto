/* =========================================================
   CASO ABERTO — Rede
   Principal: servidor Supabase Realtime (mais estável).
   Reserva: conexão direta entre celulares (WebRTC via PeerJS).
   O servidor público do PeerJS só apresenta os celulares;
   depois disso os dados vão direto de um para o outro.
   Com ?local=1 na URL usa BroadcastChannel (testes no PC).
   ========================================================= */
(function (global) {
  "use strict";

  var PREFIXO = "caso-aberto-br-v1-";
  var STUN = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ];
  // Servidor TURN gratuito (Open Relay, da Metered). Ele repassa os dados quando
  // a rede da operadora não deixa os celulares se falarem direto, o que é comum no 4G.
  // A senha é calculada a partir do segredo público do serviço e vale por 24 horas.
  var TURN_HOST = "staticauth.openrelay.metered.ca";
  var TURN_SEGREDO = "openrelayprojectsecret";

  var LOCAL = /[?&]local=1/.test(global.location ? global.location.search : "");

  function idAleatorio() {
    return "x" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  var iceCache = null;
  function obterIce(cb) {
    if (iceCache && iceCache.validade > Date.now() + 3600e3) { cb(iceCache.lista); return; }
    var pronto = false;
    function fim(lista) { if (pronto) return; pronto = true; cb(lista); }
    setTimeout(function () { fim(STUN); }, 1500); // se a conta demorar, segue só com STUN
    try {
      var sub = global.crypto && global.crypto.subtle;
      if (!sub || !global.TextEncoder) { fim(STUN); return; }
      var validade = Math.floor(Date.now() / 1000) + 24 * 3600;
      var usuario = validade + ":casoaberto";
      var enc = new TextEncoder();
      sub.importKey("raw", enc.encode(TURN_SEGREDO), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]).then(function (k) {
        return sub.sign("HMAC", k, enc.encode(usuario));
      }).then(function (assinatura) {
        var bytes = new Uint8Array(assinatura), bin = "";
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        var senha = btoa(bin);
        var lista = STUN.concat([{
          urls: [
            "turn:" + TURN_HOST + ":80",
            "turn:" + TURN_HOST + ":80?transport=tcp",
            "turn:" + TURN_HOST + ":443",
            "turns:" + TURN_HOST + ":443?transport=tcp"
          ],
          username: usuario, credential: senha
        }]);
        iceCache = { lista: lista, validade: validade * 1000 };
        fim(lista);
      }).catch(function () { fim(STUN); });
    } catch (e) { fim(STUN); }
  }

  /* ------------------ PeerJS ------------------ */
  function novoPeer(id, ice) {
    return new global.Peer(id, { debug: 1, config: { iceServers: ice } });
  }

  // O anfitrião mantém a sala aberta: se perder a ligação com o servidor de apresentação
  // (tela desligada, troca de Wi-Fi para 4G…), ele se reconecta sozinho, sem parar.
  function hostPeer(codigo, h) {
    var peer = null, conns = {}, fechado = false, jaAbriu = false, tentativas = 0, vigia = null, recriando = false;

    function ligarConn(conn) {
      var cid = conn.peer + ":" + conn.connectionId;
      conn.on("open", function () { conns[cid] = conn; h.conexao(cid); });
      conn.on("data", function (d) { h.mensagem(cid, d); });
      conn.on("close", function () { if (conns[cid]) { delete conns[cid]; h.fechou(cid); } });
      conn.on("error", function () { if (conns[cid]) { delete conns[cid]; h.fechou(cid); } });
    }

    function criar() {
      if (fechado) return;
      recriando = true;
      obterIce(function (ice) {
        if (fechado) return;
        var p = novoPeer(PREFIXO + codigo, ice);
        peer = p;
        recriando = false;
        p.on("open", function () {
          if (p !== peer) return;
          tentativas = 0;
          h.sinal && h.sinal(true);
          if (!jaAbriu) { jaAbriu = true; h.pronto && h.pronto(); }
        });
        p.on("connection", ligarConn);
        p.on("disconnected", function () {
          if (p !== peer) return;
          h.sinal && h.sinal(false);
          setTimeout(reconectar, 1000);
        });
        p.on("close", function () { if (p === peer && !fechado) { h.sinal && h.sinal(false); setTimeout(function () { if (p === peer) recriar(); }, 2000); } });
        p.on("error", function (e) {
          if (p !== peer) return;
          var t = e && e.type;
          if (t === "unavailable-id") {
            if (!jaAbriu) { h.erro && h.erro("ocupado"); return; }
            // o servidor ainda lembra da nossa sala antiga: espera e tenta de novo
            setTimeout(function () { if (p === peer) recriar(); }, 4000);
          } else if (t === "network" || t === "server-error" || t === "socket-error" || t === "socket-closed") {
            h.sinal && h.sinal(false);
            if (!jaAbriu && tentativas === 0) h.erro && h.erro("rede");
          } else if (t === "browser-incompatible") h.erro && h.erro("incompativel");
        });
      });
    }
    function reconectar() {
      if (fechado || !peer || recriando) return;
      if (peer.destroyed) { recriar(); return; }
      if (peer.disconnected) {
        tentativas++;
        try { peer.reconnect(); } catch (e) { recriar(); }
      }
    }
    function recriar() {
      if (fechado || recriando) return;
      try { if (peer && !peer.destroyed) peer.destroy(); } catch (e) {}
      criar();
    }
    // vigia: confere a ligação com o servidor a cada 5 segundos
    vigia = setInterval(function () {
      if (fechado || !peer || recriando) return;
      if (peer.destroyed) recriar();
      else if (peer.disconnected) reconectar();
    }, 5000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") reconectar();
    });
    criar();
    return {
      enviar: function (cid, msg) { var c = conns[cid]; if (c && c.open) { try { c.send(msg); } catch (e) {} } },
      derrubar: function (cid) { var c = conns[cid]; if (c) { try { c.close(); } catch (e) {} } },
      fechar: function () { fechado = true; clearInterval(vigia); try { if (peer) peer.destroy(); } catch (e) {} }
    };
  }

  function clientePeer(codigo, h) {
    var peer = null, conn = null, aberto = false, fechado = false;
    var timeout = setTimeout(function () {
      if (!aberto && !fechado) { h.erro && h.erro("tempo"); }
    }, 25000);
    obterIce(function (ice) {
      if (fechado) return;
      peer = novoPeer(idAleatorio(), ice);
      peer.on("open", function () {
        conn = peer.connect(PREFIXO + codigo, { reliable: true, serialization: "json" });
        conn.on("open", function () { aberto = true; clearTimeout(timeout); h.aberto(); });
        conn.on("data", function (d) { h.mensagem(d); });
        conn.on("close", function () { if (!fechado) { fechado = true; h.fechou(); } });
        conn.on("error", function () { if (!fechado) { fechado = true; h.fechou(); } });
      });
      peer.on("error", function (e) {
        if (e && e.type === "peer-unavailable") { clearTimeout(timeout); h.erro && h.erro("sala"); }
        else if (e && (e.type === "network" || e.type === "server-error" || e.type === "socket-error")) h.erro && h.erro("rede");
      });
    });
    return {
      enviar: function (msg) { if (conn && conn.open) { try { conn.send(msg); } catch (e) {} } },
      fechar: function () { fechado = true; clearTimeout(timeout); try { if (peer) peer.destroy(); } catch (e) {} }
    };
  }

  /* ------------------ Local (testes) ------------------ */
  function hostLocal(codigo, h) {
    var bc = new BroadcastChannel("ca-" + codigo), conns = {};
    bc.onmessage = function (ev) {
      var m = ev.data;
      if (m.para !== "host") return;
      if (m.k === "oi") { conns[m.de] = true; bc.postMessage({ para: m.de, k: "ok" }); h.conexao(m.de); }
      else if (m.k === "msg" && conns[m.de]) h.mensagem(m.de, m.d);
      else if (m.k === "tchau" && conns[m.de]) { delete conns[m.de]; h.fechou(m.de); }
    };
    setTimeout(function () { h.pronto && h.pronto(); }, 50);
    return {
      enviar: function (cid, msg) { if (conns[cid]) bc.postMessage({ para: cid, k: "msg", d: msg }); },
      derrubar: function (cid) { bc.postMessage({ para: cid, k: "tchau" }); delete conns[cid]; h.fechou(cid); },
      fechar: function () { bc.close(); }
    };
  }

  function clienteLocal(codigo, h) {
    var bc = new BroadcastChannel("ca-" + codigo), eu = idAleatorio(), aberto = false;
    bc.onmessage = function (ev) {
      var m = ev.data;
      if (m.para !== eu) return;
      if (m.k === "ok") { aberto = true; h.aberto(); }
      else if (m.k === "msg") h.mensagem(m.d);
      else if (m.k === "tchau") h.fechou();
    };
    bc.postMessage({ para: "host", de: eu, k: "oi" });
    setTimeout(function () { if (!aberto) h.erro && h.erro("sala"); }, 3000);
    global.addEventListener("beforeunload", function () { bc.postMessage({ para: "host", de: eu, k: "tchau" }); });
    return {
      enviar: function (msg) { bc.postMessage({ para: "host", de: eu, k: "msg", d: msg }); },
      fechar: function () { bc.postMessage({ para: "host", de: eu, k: "tchau" }); bc.close(); }
    };
  }

  /* ------------------ Servidor (Supabase Realtime) ------------------
     Os celulares não se falam direto: todos se ligam a um servidor na nuvem,
     que repassa as mensagens. Funciona em qualquer rede (4G, Wi-Fi da casa,
     rede da operadora) e o próprio cliente se reconecta sozinho quando a
     internet cai e volta. Cada sala usa um canal de entrada ("ca2-CÓDIGO")
     e cada convidado tem um canal só dele com o anfitrião, para ninguém
     receber o que é dos outros. */
  var SB_URL = "https://bgvwaamwgcathojxtjqf.supabase.co";
  var SB_CHAVE = "sb_publishable_bVEo_g6vmNig5qCzpe8ATg_yB-yIvAF"; // chave pública (pode ficar no app)
  var PREFIXO_SV = "ca2-";
  var sbCliente = null;
  function servidor() {
    if (sbCliente) return sbCliente;
    if (!global.supabase || !global.supabase.createClient) return null;
    sbCliente = global.supabase.createClient(SB_URL, SB_CHAVE, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { heartbeatIntervalMs: 15000, timeout: 15000, params: { eventsPerSecond: 40 } }
    });
    // ao voltar do segundo plano, força a reconexão do socket se ele caiu
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible" || !sbCliente) return;
      try { if (!sbCliente.realtime.isConnected()) sbCliente.realtime.connect(); } catch (e) {}
    });
    global.addEventListener("online", function () { try { if (sbCliente && !sbCliente.realtime.isConnected()) sbCliente.realtime.connect(); } catch (e) {} });
    return sbCliente;
  }
  // canal com reentrada automática: se cair, volta a se inscrever e avisa quem usa
  function canal(nome, aoMsg, aoEstado) {
    var sb = servidor(), ch = null, fechado = false, inscrito = false, tRetry = null;
    function abrir() {
      if (fechado) return;
      var este = sb.channel(nome, { config: { broadcast: { self: false, ack: false } } });
      ch = este;
      este.on("broadcast", { event: "m" }, function (e) { if (este === ch) aoMsg(e.payload || {}); });
      este.subscribe(function (st) {
        if (fechado || este !== ch) return;
        if (st === "SUBSCRIBED") { inscrito = true; clearTimeout(tRetry); aoEstado && aoEstado(true); return; }
        var era = inscrito; inscrito = false;
        if (era) aoEstado && aoEstado(false);
        clearTimeout(tRetry);
        // erro ou tempo esgotado: a própria biblioteca tenta entrar de novo sozinha.
        // Só recriamos o canal se ele foi fechado de vez ou se não voltar em 10 s
        // (recriar cedo demais gera canais duplicados que se derrubam).
        tRetry = setTimeout(function () {
          if (fechado || inscrito || este !== ch) return;
          try { sb.removeChannel(este); } catch (e) {}
          abrir();
        }, st === "CLOSED" ? 1500 : 10000);
      });
    }
    abrir();
    return {
      enviar: function (obj) {
        if (!ch || !inscrito) return false;
        try { ch.send({ type: "broadcast", event: "m", payload: obj }); return true; } catch (e) { return false; }
      },
      ok: function () { return inscrito; },
      fechar: function () { fechado = true; clearTimeout(tRetry); try { sb.removeChannel(ch); } catch (e) {} }
    };
  }

  function hostServidor(codigo, h) {
    var meu = idAleatorio(), conns = {}, fechado = false, jaAbriu = false, confirmando = true;
    var sala = canal(PREFIXO_SV + codigo, function (m) {
      if (fechado) return;
      if (m.k === "quem" && m.de !== meu) { sala.enviar({ k: "eu", de: meu }); return; }
      if (m.k === "eu" && m.de !== meu && confirmando) { confirmando = false; fechado = true; fecharTudo(); h.erro && h.erro("ocupado"); return; }
      if (m.k === "oi" && m.de) ligar(m.de);
    }, function (ok) {
      h.sinal && h.sinal(ok);
      if (ok && !jaAbriu) {
        // confere se o código já está em uso por outra sala antes de abrir
        sala.enviar({ k: "quem", de: meu });
        setTimeout(function () {
          if (fechado) return;
          confirmando = false;
          if (!jaAbriu) { jaAbriu = true; h.pronto && h.pronto(); }
        }, 1500);
      }
      if (ok) for (var c in conns) conns[c].enviar({ k: "ok", de: "host" });
    });
    function ligar(cid) {
      if (conns[cid]) { conns[cid].enviar({ k: "ok", de: "host" }); return; }
      var novo = true;
      conns[cid] = canal(PREFIXO_SV + codigo + "-" + cid, function (m) {
        if (m.de !== cid) return;
        if (m.k === "msg") h.mensagem(cid, m.d);
        else if (m.k === "oi") { conns[cid] && conns[cid].enviar({ k: "ok", de: "host" }); }
        else if (m.k === "tchau") { var c = conns[cid]; delete conns[cid]; if (c) c.fechar(); h.fechou(cid); }
      }, function (ok) {
        if (!ok || !conns[cid]) return;
        conns[cid].enviar({ k: "ok", de: "host" });
        if (novo) { novo = false; h.conexao(cid); }
      });
    }
    function fecharTudo() { for (var c in conns) conns[c].fechar(); conns = {}; sala.fechar(); }
    return {
      enviar: function (cid, msg) { var c = conns[cid]; if (c) c.enviar({ k: "msg", de: "host", d: msg }); },
      derrubar: function (cid) { var c = conns[cid]; if (c) { c.enviar({ k: "fim", de: "host" }); setTimeout(function () { c.fechar(); }, 300); delete conns[cid]; } },
      fechar: function () { fechado = true; fecharTudo(); }
    };
  }

  function clienteServidor(codigo, h, opcoes) {
    var eu = idAleatorio(), aberto = false, fechado = false, tentativas = 0, tOi = null, tLimite = null;
    var limite = (opcoes && opcoes.limite) || 9000;
    var priv = canal(PREFIXO_SV + codigo + "-" + eu, function (m) {
      if (fechado || m.de !== "host") return;
      if (m.k === "ok") {
        clearTimeout(tLimite);
        if (!aberto) { aberto = true; h.aberto(); }
      } else if (m.k === "msg") h.mensagem(m.d);
      else if (m.k === "fim") { fechado = true; h.fechou(); }
    }, function (ok) {
      if (fechado) return;
      if (ok) chamar();
      else if (aberto) { aberto = false; h.fechou(); }
    });
    var sala = canal(PREFIXO_SV + codigo, function () {}, function (ok) { if (ok) chamar(); });
    // avisa o anfitrião que chegou, repetindo até ele responder
    function chamar() {
      if (fechado || aberto) return;
      clearTimeout(tOi);
      if (sala.ok() && priv.ok()) { sala.enviar({ k: "oi", de: eu }); priv.enviar({ k: "oi", de: eu }); tentativas++; }
      tOi = setTimeout(chamar, Math.min(3000, 800 + tentativas * 400));
    }
    tLimite = setTimeout(function () {
      if (aberto || fechado) return;
      fechado = true; clearTimeout(tOi); sala.fechar(); priv.fechar();
      h.erro && h.erro(sala.ok() || priv.ok() ? "sala" : "rede");
    }, limite);
    return {
      servidorOk: function () { return sala.ok() || priv.ok(); },
      enviar: function (msg) { priv.enviar({ k: "msg", de: eu, d: msg }); },
      fechar: function () { if (!fechado) priv.enviar({ k: "tchau", de: eu }); fechado = true; clearTimeout(tOi); clearTimeout(tLimite); setTimeout(function () { sala.fechar(); priv.fechar(); }, 200); }
    };
  }

  /* ------------------ Escolha do caminho ------------------
     Sempre tenta o servidor primeiro. Se o servidor não responder,
     usa a conexão direta antiga (PeerJS) como reserva. */
  function criarHost(codigo, h) {
    if (LOCAL) return hostLocal(codigo, h);
    if (!servidor()) return hostPeer(codigo, h);
    var atual = null, decidido = false;
    var reserva = setTimeout(function () {
      if (decidido) return;
      decidido = true; try { atual.fechar(); } catch (e) {}
      atual = hostPeer(codigo, h);
    }, 12000);
    var hs = Object.assign({}, h, {
      pronto: function () { if (!decidido) { decidido = true; clearTimeout(reserva); } h.pronto && h.pronto(); },
      erro: function (t) { if (t === "ocupado") { decidido = true; clearTimeout(reserva); } h.erro && h.erro(t); }
    });
    atual = hostServidor(codigo, hs);
    return {
      enviar: function (cid, msg) { atual.enviar(cid, msg); },
      derrubar: function (cid) { atual.derrubar(cid); },
      fechar: function () { clearTimeout(reserva); decidido = true; atual.fechar(); }
    };
  }
  function conectar(codigo, h) {
    if (LOCAL) return clienteLocal(codigo, h);
    if (!servidor()) return clientePeer(codigo, h);
    var atual, usandoPeer = false;
    var hc = Object.assign({}, h, {
      erro: function (t) {
        // sem resposta no servidor: tenta a conexão direta antes de desistir
        if (!usandoPeer && (t === "sala" || t === "rede")) { usandoPeer = true; atual = clientePeer(codigo, h); return; }
        h.erro && h.erro(t);
      }
    });
    atual = clienteServidor(codigo, hc);
    return {
      servidorOk: function () { return !usandoPeer && atual.servidorOk ? atual.servidorOk() : false; },
      enviar: function (msg) { atual.enviar(msg); },
      fechar: function () { atual.fechar(); }
    };
  }

  global.Rede = {
    local: LOCAL,
    criarHost: criarHost,
    conectar: conectar
  };
})(window);
