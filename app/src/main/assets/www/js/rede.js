/* =========================================================
   CASO ABERTO — Rede
   Conexão direta entre celulares (WebRTC via PeerJS).
   O servidor público do PeerJS só apresenta os celulares;
   depois disso os dados vão direto de um para o outro.
   Com ?local=1 na URL usa BroadcastChannel (testes no PC).
   ========================================================= */
(function (global) {
  "use strict";

  var PREFIXO = "caso-aberto-br-v1-";
  var ICE = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
    // Se algum amigo não conseguir conectar (rede de operadora muito fechada),
    // dá para acrescentar aqui um servidor TURN, ex.:
    // { urls: "turn:SEU_SERVIDOR:3478", username: "usuario", credential: "senha" }
  ];

  var LOCAL = /[?&]local=1/.test(global.location ? global.location.search : "");

  function idAleatorio() {
    return "x" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  /* ------------------ PeerJS ------------------ */
  function novoPeer(id) {
    return new global.Peer(id, { debug: 1, config: { iceServers: ICE } });
  }

  function hostPeer(codigo, h) {
    var peer = novoPeer(PREFIXO + codigo);
    var conns = {}, fechado = false;
    peer.on("open", function () { h.pronto && h.pronto(); });
    peer.on("connection", function (conn) {
      var cid = conn.peer + ":" + conn.connectionId;
      conn.on("open", function () { conns[cid] = conn; h.conexao(cid); });
      conn.on("data", function (d) { h.mensagem(cid, d); });
      conn.on("close", function () { if (conns[cid]) { delete conns[cid]; h.fechou(cid); } });
      conn.on("error", function () { if (conns[cid]) { delete conns[cid]; h.fechou(cid); } });
    });
    peer.on("disconnected", function () {
      if (!fechado) setTimeout(function () { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} }, 1500);
    });
    peer.on("error", function (e) {
      if (e && e.type === "unavailable-id") h.erro && h.erro("ocupado");
      else if (e && (e.type === "network" || e.type === "server-error" || e.type === "socket-error" || e.type === "socket-closed"))
        h.erro && h.erro("rede");
      else if (e && e.type === "browser-incompatible") h.erro && h.erro("incompativel");
    });
    return {
      enviar: function (cid, msg) { var c = conns[cid]; if (c && c.open) { try { c.send(msg); } catch (e) {} } },
      derrubar: function (cid) { var c = conns[cid]; if (c) { try { c.close(); } catch (e) {} } },
      fechar: function () { fechado = true; try { peer.destroy(); } catch (e) {} }
    };
  }

  function clientePeer(codigo, h) {
    var peer = novoPeer(idAleatorio());
    var conn = null, aberto = false, fechado = false;
    var timeout = setTimeout(function () {
      if (!aberto && !fechado) { h.erro && h.erro("tempo"); }
    }, 20000);
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
    return {
      enviar: function (msg) { if (conn && conn.open) { try { conn.send(msg); } catch (e) {} } },
      fechar: function () { fechado = true; clearTimeout(timeout); try { peer.destroy(); } catch (e) {} }
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

  global.Rede = {
    local: LOCAL,
    criarHost: function (codigo, h) { return LOCAL ? hostLocal(codigo, h) : hostPeer(codigo, h); },
    conectar: function (codigo, h) { return LOCAL ? clienteLocal(codigo, h) : clientePeer(codigo, h); }
  };
})(window);
