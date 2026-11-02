/* =========================================================
   TRUCO — Sons: efeitos das cartas e dos tentos, vozes dos
   personagens e música de fundo (viola caipira tocada pelo
   próprio app, ou as músicas do celular do jogador).
   ========================================================= */
(function (global) {
  "use strict";

  var CHAVE = "tr_som";
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } }
  var cfg = Object.assign({ musica: true, efeitos: true, vozes: true, fonte: "viola", volume: 0.8 }, ler());
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch (e) {} }

  var ctx = null, mestre = null, busMusica = null, busFx = null;
  function audio() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    mestre = ctx.createGain(); mestre.gain.value = cfg.volume; mestre.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = 0.32; busMusica.connect(mestre);
    busFx = ctx.createGain(); busFx.gain.value = 0.9; busFx.connect(mestre);
    return ctx;
  }
  // o áudio só pode começar depois de um toque na tela
  function destravar() {
    audio();
    if (cfg.musica && !tocando) iniciarMusica();
  }
  ["pointerdown", "touchstart", "keydown"].forEach(function (ev) { document.addEventListener(ev, destravar, { passive: true }); });

  /* ---------------- Efeitos ---------------- */
  var ruidoBuf = null;
  function ruido() {
    if (ruidoBuf) return ruidoBuf;
    var c = audio(), n = c.sampleRate * 1, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (ruidoBuf = b);
  }
  function rajada(t, dur, freq, q, vol, tipo) {
    var c = ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = ruido(); s.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = tipo || "bandpass"; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.008, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(busFx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function tom(t, freq, dur, vol, tipo, ate) {
    var c = ctx, o = c.createOscillator(), g = c.createGain();
    o.type = tipo || "sine"; o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(busFx); o.start(t); o.stop(t + dur + 0.02);
  }
  var FX = {
    embaralhar: function (t) { // baralho sendo embaralhado (as cartas batendo umas nas outras)
      for (var i = 0; i < 26; i++) rajada(t + i * 0.022 + Math.random() * 0.006, 0.03, 2600 + Math.random() * 1600, 1.4, 0.35);
      rajada(t + 0.62, 0.08, 1200, 0.8, 0.5);
    },
    carta: function (t) { // uma carta sendo distribuída (deslizando)
      rajada(t, 0.09, 3200 + Math.random() * 800, 1.1, 0.28);
      rajada(t + 0.05, 0.05, 1500, 1, 0.18);
    },
    distribuir: function (t, n) { FX.embaralhar(t); for (var i = 0; i < (n || 12); i++) FX.carta(t + 0.85 + i * 0.13); },
    jogar: function (t) { // carta batendo na mesa de madeira
      rajada(t, 0.06, 2400, 0.9, 0.55);
      tom(t, 150, 0.09, 0.35, "sine", 70);
      rajada(t + 0.01, 0.12, 600, 0.7, 0.2, "lowpass");
    },
    murro: function (t) { tom(t, 95, 0.18, 0.7, "sine", 45); rajada(t, 0.12, 400, 0.6, 0.5, "lowpass"); FX.jogar(t + 0.02); }, // murro na mesa no truco
    tento: function (t, n) { // grãos de milho/feijão caindo no monte
      for (var i = 0; i < (n || 4) * 2; i++) { var tt = t + Math.random() * 0.35; tom(tt, 1800 + Math.random() * 1800, 0.025, 0.14, "triangle"); rajada(tt, 0.02, 3500, 2, 0.08); }
    },
    brinde: function (t) { [0, 0.16].forEach(function (d) { tom(t + d, 2630, 0.7, 0.18); tom(t + d, 4110, 0.5, 0.08); tom(t + d, 5300, 0.3, 0.05); }); },
    garrafa: function (t) { tom(t, 1180, 0.35, 0.12, "sine", 1100); tom(t, 2350, 0.2, 0.05); },
    chat: function (t) { tom(t, 880, 0.08, 0.1, "triangle"); tom(t + 0.07, 1320, 0.1, 0.08, "triangle"); },
    vez: function (t) { tom(t, 660, 0.12, 0.12, "triangle"); },
    vitoria: function (t) { [523, 659, 784, 1046].forEach(function (f, i) { tom(t + i * 0.12, f, 0.4, 0.14, "triangle"); }); FX.brinde(t + 0.6); },
    derrota: function (t) { [392, 349, 311, 262].forEach(function (f, i) { tom(t + i * 0.16, f, 0.45, 0.12, "triangle"); }); }
  };
  function fx(nome, arg) {
    if (!cfg.efeitos || !FX[nome]) return;
    var c = audio(); if (!c) return;
    try { FX[nome](c.currentTime + 0.02, arg); } catch (e) {}
  }

  /* ---------------- Vozes dos personagens ---------------- */
  var vozesCustom = {};   // jogadorId -> { palavra: dataURL } (gravadas pelo próprio jogador)
  var tocandoVoz = null;
  function voz(personagem, palavra, jogadorId) {
    if (!cfg.vozes || !personagem || !palavra) return;
    var src = (jogadorId && vozesCustom[jogadorId] && vozesCustom[jogadorId][palavra]) || ("truco/vozes/" + personagem + "-" + palavra + ".mp3");
    try {
      if (tocandoVoz) { tocandoVoz.pause(); }
      var a = new Audio(src);
      a.volume = Math.min(1, cfg.volume + 0.2);
      tocandoVoz = a;
      // abaixa a música enquanto o personagem grita
      abafar(1.6);
      a.play().catch(function () {});
    } catch (e) {}
  }
  function abafar(seg) {
    if (!ctx || !busMusica) return;
    var t = ctx.currentTime;
    busMusica.gain.cancelScheduledValues(t);
    busMusica.gain.setTargetAtTime(0.08, t, 0.05);
    busMusica.gain.setTargetAtTime(0.32, t + seg, 0.4);
    if (minhaMusica) { minhaMusica.volume = 0.15; clearTimeout(abafar._t); abafar._t = setTimeout(function () { if (minhaMusica) minhaMusica.volume = 0.5 * cfg.volume; }, seg * 1000); }
  }

  /* ---------------- Música: viola caipira ---------------- */
  // Corda dedilhada (Karplus-Strong), gerada uma vez por nota e guardada.
  var cacheNota = {};
  function cordaBuf(freq) {
    var k = Math.round(freq * 10);
    if (cacheNota[k]) return cacheNota[k];
    var c = ctx, sr = c.sampleRate, dur = 1.6, n = Math.floor(sr * dur), b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
    var per = Math.max(2, Math.round(sr / freq)), linha = new Float32Array(per);
    for (var i = 0; i < per; i++) linha[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / per * Math.PI));
    var p = 0, decai = 0.996 - Math.min(0.006, freq / 400000);
    for (var j = 0; j < n; j++) {
      var a = linha[p], bb = linha[(p + 1) % per];
      var v = (a + bb) * 0.5 * decai;
      linha[p] = v; d[j] = a;
      p = (p + 1) % per;
    }
    // ataque metálico das cordas de aço da viola
    for (var x = 0; x < Math.min(n, 220); x++) d[x] *= 1 + 0.6 * (1 - x / 220);
    return (cacheNota[k] = b);
  }
  function pluck(t, freq, vol, pan) {
    var c = ctx;
    [[freq, 1], [freq * 2.003, 0.45]].forEach(function (par) { // viola: cordas em pares (uma oitavada)
      var s = c.createBufferSource(), g = c.createGain();
      s.buffer = cordaBuf(par[0]);
      g.gain.value = vol * par[1];
      var dest = busMusica;
      if (c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = pan || 0; g.connect(pn); pn.connect(busMusica); dest = null; }
      s.connect(g); if (dest) g.connect(dest);
      s.start(t); s.stop(t + 1.6);
    });
  }
  function hz(semi) { return 196 * Math.pow(2, semi / 12); } // 0 = Sol (G3)
  // escala maior (em semitons a partir da tônica)
  var MAIOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21];
  var ACORDES = { I: [0, 4, 7], IV: [5, 9, 12], V: [7, 11, 14, 17], vi: [9, 12, 16], ii: [2, 5, 9] };
  var MUSICAS = [
    { nome: "Toada da Beira do Rio", tom: 0, bpm: 84, compasso: 3, prog: ["I", "I", "IV", "I", "V", "V", "I", "I", "vi", "IV", "I", "V", "I", "IV", "V", "I"] },
    { nome: "Pagode do Sertão", tom: 2, bpm: 108, compasso: 4, prog: ["I", "IV", "V", "I", "I", "IV", "V", "I", "vi", "ii", "V", "I", "IV", "V", "I", "I"] },
    { nome: "Moda do Pequizeiro", tom: -3, bpm: 92, compasso: 4, prog: ["I", "I", "V", "V", "IV", "IV", "I", "V", "I", "vi", "IV", "V", "I", "IV", "V", "I"] }
  ];
  var tocando = false, idxMusica = Math.floor(Math.random() * MUSICAS.length), proxT = 0, passo = 0, timer = null, melAnterior = 4;
  function grau(semi, tonica) { // nota da escala mais próxima
    var melhor = MAIOR[0], dm = 99;
    MAIOR.forEach(function (m) { var d = Math.abs(m - semi); if (d < dm) { dm = d; melhor = m; } });
    return melhor + tonica;
  }
  function terca(semi, tonica) { // terça acima, dentro da escala ("duas vozes" da moda de viola)
    var rel = semi - tonica, i = MAIOR.indexOf(rel);
    if (i < 0) return semi + 4;
    return tonica + (MAIOR[i + 2] !== undefined ? MAIOR[i + 2] : rel + 4);
  }
  function agendar() {
    if (!tocando || !ctx) return;
    var M = MUSICAS[idxMusica], batida = 60 / M.bpm, sub = batida / 2;
    while (proxT < ctx.currentTime + 0.4) {
      var porCompasso = M.compasso * 2, comp = Math.floor(passo / porCompasso), pos = passo % porCompasso;
      if (comp >= M.prog.length * 2) { // terminou a música (duas voltas): pausa curta e troca
        idxMusica = (idxMusica + 1) % MUSICAS.length; passo = 0; proxT += 2.5; continue;
      }
      var ac = ACORDES[M.prog[comp % M.prog.length]], t0 = M.tom, t = proxT + (Math.random() - 0.5) * 0.012;
      // baixo no tempo forte (polegar)
      if (pos === 0) pluck(t, hz(t0 + ac[0] - 12), 0.42, -0.2);
      else if (pos === M.compasso) pluck(t, hz(t0 + ac[ac.length > 3 ? 1 : 2] - 12), 0.32, -0.2);
      // ponteado / rasqueado nos contratempos
      if (pos % 2 === 1 || (M.compasso === 3 && pos === 2)) {
        ac.slice(0, 3).forEach(function (n, i) { pluck(t + i * 0.012, hz(t0 + n), 0.11, 0.25); });
      }
      // melodia em terças (a cada batida, às vezes no contratempo)
      if (pos % 2 === 0 || Math.random() < 0.18) {
        var alvo = ac[Math.floor(Math.random() * ac.length)] + 12;
        var mel = grau(Math.round((melAnterior * 2 + alvo) / 3 + (Math.random() - 0.5) * 3), 0);
        melAnterior = mel;
        if (Math.random() < 0.85) {
          pluck(t, hz(t0 + mel), 0.2, 0.05);
          pluck(t + 0.004, hz(terca(t0 + mel, t0)), 0.15, 0.1);
        }
      }
      proxT += sub; passo++;
    }
  }
  function iniciarMusica() {
    if (!cfg.musica) return;
    if (cfg.fonte === "minhas") { tocarMinhas(); return; }
    var c = audio(); if (!c) return;
    if (tocando) return;
    tocando = true; proxT = c.currentTime + 0.3; passo = 0;
    timer = setInterval(agendar, 120);
  }
  function pararMusica() {
    tocando = false; clearInterval(timer); timer = null;
    if (minhaMusica) { minhaMusica.pause(); minhaMusica = null; }
  }

  /* ---------------- Músicas do próprio celular ---------------- */
  var BANCO = "truco-musicas", minhaMusica = null, idxMinha = 0;
  function banco() {
    return new Promise(function (ok, erro) {
      if (!global.indexedDB) return erro(new Error("sem IndexedDB"));
      var r = indexedDB.open(BANCO, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("m", { keyPath: "id" }); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { erro(r.error); };
    });
  }
  function listarMinhas() {
    return banco().then(function (db) {
      return new Promise(function (ok) { var out = []; var c = db.transaction("m").objectStore("m").openCursor(); c.onsuccess = function () { var x = c.result; if (x) { out.push({ id: x.value.id, nome: x.value.nome }); x.continue(); } else ok(out); }; c.onerror = function () { ok([]); }; });
    }).catch(function () { return []; });
  }
  function adicionarMinhas(arquivos) {
    return banco().then(function (db) {
      return Promise.all(Array.prototype.map.call(arquivos, function (f) {
        return new Promise(function (ok) { var tx = db.transaction("m", "readwrite"); tx.objectStore("m").put({ id: "m" + Date.now() + Math.random().toString(36).slice(2, 6), nome: f.name, blob: f }); tx.oncomplete = ok; tx.onerror = ok; });
      }));
    });
  }
  function removerMinha(id) { return banco().then(function (db) { return new Promise(function (ok) { var tx = db.transaction("m", "readwrite"); tx.objectStore("m").delete(id); tx.oncomplete = ok; tx.onerror = ok; }); }); }
  function pegarMinha(id) { return banco().then(function (db) { return new Promise(function (ok) { var r = db.transaction("m").objectStore("m").get(id); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ok(null); }; }); }); }
  function tocarMinhas() {
    if (minhaMusica) return;
    listarMinhas().then(function (lista) {
      if (!lista.length) { cfg.fonte = "viola"; salvar(); iniciarMusica(); return; }
      if (tocando) { tocando = false; clearInterval(timer); }
      idxMinha = idxMinha % lista.length;
      pegarMinha(lista[idxMinha].id).then(function (m) {
        if (!m || !cfg.musica || cfg.fonte !== "minhas") return;
        var url = URL.createObjectURL(m.blob), a = new Audio(url);
        a.volume = 0.5 * cfg.volume;
        minhaMusica = a;
        a.onended = function () { URL.revokeObjectURL(url); minhaMusica = null; idxMinha++; tocarMinhas(); };
        a.play().catch(function () { minhaMusica = null; });
      });
    });
  }

  function definir(k, v) {
    cfg[k] = v; salvar();
    if (k === "musica") { if (v) iniciarMusica(); else pararMusica(); }
    if (k === "fonte") { pararMusica(); if (cfg.musica) iniciarMusica(); }
    if (k === "volume" && mestre) mestre.gain.value = v;
  }
  function silenciarTudo(s) {
    definir("musica", !s); cfg.efeitos = !s; cfg.vozes = !s; salvar();
  }
  // pausa a música quando o app vai para segundo plano
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.visibilityState === "hidden") { ctx.suspend(); if (minhaMusica) minhaMusica.pause(); }
    else { ctx.resume(); if (minhaMusica && cfg.musica) minhaMusica.play().catch(function () {}); }
  });

  global.SomTruco = {
    cfg: function () { return cfg; }, definir: definir, silenciarTudo: silenciarTudo,
    fx: fx, voz: voz, vozesCustom: vozesCustom,
    iniciarMusica: iniciarMusica, pararMusica: pararMusica, nomeMusica: function () { return cfg.fonte === "minhas" ? "Suas músicas" : MUSICAS[idxMusica].nome; },
    proximaMusica: function () { if (cfg.fonte === "minhas") { if (minhaMusica) { minhaMusica.pause(); minhaMusica = null; } idxMinha++; tocarMinhas(); } else { idxMusica = (idxMusica + 1) % MUSICAS.length; passo = 0; } },
    listarMinhas: listarMinhas, adicionarMinhas: adicionarMinhas, removerMinha: removerMinha
  };
})(window);
