/* =========================================================
   CASO ABERTO — Som
   Trilha de suspense e efeitos gerados pelo próprio app
   (Web Audio). Nenhum arquivo de música, nenhum direito autoral.
   ========================================================= */
(function (global) {
  "use strict";

  var CHAVE = "ca_som";
  var pref = { musica: true, efeitos: true };
  try { var salvo = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (salvo) { pref.musica = salvo.musica !== false; pref.efeitos = salvo.efeitos !== false; } } catch (e) {}

  var ctx = null, mestre, busMusica, busEfeitos, eco, ecoVolta, ruidoBuf;
  var clima = "calmo", proximo = 0, proxNota = 0, proxBatida = 0, acorde = 0, timer = null;
  var drones = [], chuva = null;

  // Lá menor harmônica: dá o clima de mistério (o Sol# é o "arrepio")
  function hz(semitons) { return 220 * Math.pow(2, semitons / 12); } // 0 = Lá 220
  var ACORDES = [
    [-12, -9, -5, 0],   // Lá menor
    [-16, -12, -9, -4], // Fá maior
    [-19, -14, -10, -7],// Ré menor
    [-17, -13, -10, -6] // Mi maior (tensão)
  ];
  var ESCALA = [0, 2, 3, 5, 7, 8, 11, 12, 14, 15];

  function criar() {
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    mestre = ctx.createGain(); mestre.gain.value = 0.9;
    mestre.connect(comp); comp.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = pref.musica ? 1 : 0; busMusica.connect(mestre);
    busEfeitos = ctx.createGain(); busEfeitos.gain.value = pref.efeitos ? 0.9 : 0; busEfeitos.connect(mestre);
    // eco para as notas soltas
    eco = ctx.createDelay(1.5); eco.delayTime.value = 0.42;
    ecoVolta = ctx.createGain(); ecoVolta.gain.value = 0.38;
    var ecoFiltro = ctx.createBiquadFilter(); ecoFiltro.type = "lowpass"; ecoFiltro.frequency.value = 1800;
    eco.connect(ecoFiltro); ecoFiltro.connect(ecoVolta); ecoVolta.connect(eco); ecoFiltro.connect(busMusica);
    // ruído reaproveitado (chuva, papel, carimbo)
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = ruidoBuf.getChannelData(0), ult = 0;
    for (var i = 0; i < d.length; i++) { var b = Math.random() * 2 - 1; ult = (ult + 0.02 * b) / 1.02; d[i] = b * 0.5 + ult * 3; }
    iniciarDrone();
    iniciarChuva();
    timer = setInterval(agendar, 200);
    return true;
  }

  function iniciarDrone() {
    var filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 380; filtro.Q.value = 3;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    var lfoG = ctx.createGain(); lfoG.gain.value = 160; lfo.connect(lfoG); lfoG.connect(filtro.frequency); lfo.start();
    var g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.11, ctx.currentTime, 2.5);
    filtro.connect(g); g.connect(busMusica);
    [[55, "sine", 0], [55.4, "triangle", 0], [110, "sawtooth", -6], [82.4, "sine", 3]].forEach(function (o) {
      var osc = ctx.createOscillator(); osc.type = o[1]; osc.frequency.value = o[0]; osc.detune.value = o[2];
      var og = ctx.createGain(); og.gain.value = o[1] === "sawtooth" ? 0.25 : 0.6;
      osc.connect(og); og.connect(filtro); osc.start();
      drones.push(osc);
    });
    drones.ganho = g; drones.filtro = filtro;
  }

  function iniciarChuva() {
    var src = ctx.createBufferSource(); src.buffer = ruidoBuf; src.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
    var g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.035, ctx.currentTime, 3);
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(busMusica); src.start();
    chuva = g;
  }

  /* ---------- Trilha ---------- */
  function pad(t, notas, dur, vol) {
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(busMusica);
    notas.forEach(function (n, i) {
      [-7, 7].forEach(function (det) {
        var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(n); o.detune.value = det + i;
        o.connect(f); o.start(t); o.stop(t + dur + 0.1);
      });
    });
  }
  function notaSolta(t, semi, vol) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    g.connect(busMusica); g.connect(eco);
    [[1, "sine", 1], [2, "sine", 0.25], [3, "triangle", 0.08]].forEach(function (h) {
      var o = ctx.createOscillator(); o.type = h[1]; o.frequency.value = hz(semi) * h[0];
      var hg = ctx.createGain(); hg.gain.value = h[2];
      o.connect(hg); hg.connect(g); o.start(t); o.stop(t + 2.7);
    });
  }
  function batida(t, forte) {
    [0, 0.2].forEach(function (d, i) {
      var o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(70, t + d); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.18);
      var g = ctx.createGain(); var v = (i ? 0.45 : 0.7) * forte;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(v, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22);
      o.connect(g); g.connect(busMusica); o.start(t + d); o.stop(t + d + 0.25);
    });
  }

  function agendar() {
    if (!ctx || ctx.state !== "running") return;
    var t = ctx.currentTime, adiante = t + 0.6;
    if (clima === "silencio") return;
    var tenso = clima === "tenso", climax = clima === "climax";
    // acordes longos
    if (proximo < adiante) {
      if (proximo < t) proximo = t + 0.05;
      var dur = climax ? 4 : 8;
      var seq = climax ? [0, 3, 0, 3] : ACORDES.map(function (_, i) { return i; });
      pad(proximo, ACORDES[seq[acorde % seq.length]], dur + 1, tenso || climax ? 0.03 : 0.022);
      acorde++;
      proximo += dur;
    }
    // notas soltas, como uma caixinha de música num casarão vazio
    if (proxNota < adiante) {
      if (proxNota < t) proxNota = t + 1;
      var base = ACORDES[(acorde + 3) % ACORDES.length];
      var semi = Math.random() < 0.6 ? base[Math.floor(Math.random() * base.length)] + 12 : ESCALA[Math.floor(Math.random() * ESCALA.length)];
      notaSolta(proxNota, semi, climax ? 0.05 : 0.035);
      if (Math.random() < 0.3) notaSolta(proxNota + 0.32, semi + (Math.random() < 0.5 ? 1 : -1), 0.022);
      proxNota += climax ? 0.9 + Math.random() * 0.8 : 1.8 + Math.random() * 3.2;
    }
    // coração batendo na hora da acusação
    if ((tenso || climax) && proxBatida < adiante) {
      if (proxBatida < t) proxBatida = t + 0.1;
      batida(proxBatida, climax ? 1 : 0.7);
      proxBatida += climax ? 0.62 : 1.05;
    }
  }

  /* ---------- Efeitos ---------- */
  function ruido(t, dur, tipo, freq, q, vol, ataque) {
    var src = ctx.createBufferSource(); src.buffer = ruidoBuf;
    var f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (ataque || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(busEfeitos);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
    return f;
  }
  function tom(t, freq, dur, tipo, vol, ate) {
    var o = ctx.createOscillator(); o.type = tipo || "sine"; o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(busEfeitos); o.start(t); o.stop(t + dur + 0.05);
  }
  function acordeFx(t, semis, dur, tipo, vol) { semis.forEach(function (s, i) { tom(t + i * 0.06, hz(s), dur, tipo, vol); }); }

  var FX = {
    toque: function (t) { tom(t, 1400, 0.04, "triangle", 0.05); },
    papel: function (t) {
      ruido(t, 0.18, "bandpass", 2600, 0.8, 0.35, 0.02);
      ruido(t + 0.08, 0.14, "bandpass", 4200, 1.2, 0.2, 0.01);
    },
    alfinete: function (t) { tom(t, 2400, 0.05, "square", 0.05); ruido(t, 0.04, "highpass", 5000, 1, 0.25); },
    carimbo: function (t) {
      tom(t, 140, 0.3, "sine", 0.9, 45);
      ruido(t, 0.12, "lowpass", 900, 1, 0.6);
    },
    tecla: function (t) {
      ruido(t, 0.03, "highpass", 3000, 1, 0.3);
      tom(t, 700 + Math.random() * 300, 0.025, "square", 0.04);
    },
    sino: function (t) { tom(t, 1900, 0.25, "triangle", 0.05); },
    revelarDetetive: function (t) {
      var f = ruido(t, 0.6, "bandpass", 400, 2, 0.25, 0.25);
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.5);
      acordeFx(t + 0.45, [0, 3, 7, 14], 2.2, "triangle", 0.09);
    },
    revelarCumplice: function (t) {
      var f = ruido(t, 0.6, "bandpass", 300, 2, 0.25, 0.25);
      f.frequency.exponentialRampToValueAtTime(1800, t + 0.5);
      tom(t + 0.45, 55, 2.2, "sawtooth", 0.18, 50);
      acordeFx(t + 0.45, [-12, -11, -6, 1], 2.4, "sawtooth", 0.05);
    },
    novidade: function (t) {
      tom(t, hz(12), 0.35, "sawtooth", 0.08); tom(t, hz(18), 0.35, "sawtooth", 0.06);
      tom(t + 0.4, hz(11), 0.6, "sawtooth", 0.08); tom(t + 0.4, hz(17), 0.6, "sawtooth", 0.06);
    },
    martelo: function (t) {
      tom(t, 220, 0.18, "square", 0.12, 90); ruido(t, 0.1, "lowpass", 1500, 1, 0.5);
      tom(t + 0.22, 200, 0.2, "square", 0.1, 80); ruido(t + 0.22, 0.1, "lowpass", 1500, 1, 0.45);
    },
    tambor: function (t) {
      for (var i = 0; i < 26; i++) {
        var d = i * (0.11 - i * 0.002), v = 0.1 + i * 0.025;
        ruido(t + d, 0.09, "lowpass", 500 + i * 40, 1, Math.min(v, 0.75));
        tom(t + d, 90, 0.1, "sine", Math.min(v, 0.6) * 0.6, 60);
      }
    },
    vitoria: function (t) {
      acordeFx(t, [0, 4, 7, 12], 0.6, "triangle", 0.1);
      acordeFx(t + 0.5, [5, 9, 12, 17], 0.6, "triangle", 0.1);
      acordeFx(t + 1.0, [7, 11, 14, 19], 2.2, "triangle", 0.11);
    },
    derrota: function (t) {
      tom(t, 70, 1.6, "sine", 0.7, 35);
      acordeFx(t, [3, 0, -4, -9], 2.6, "sawtooth", 0.05);
    },
    empate: function (t) { acordeFx(t, [0, 3, 7], 0.8, "triangle", 0.08); acordeFx(t + 0.6, [-1, 2, 5], 1.8, "triangle", 0.08); }
  };

  function aplicarPref() {
    if (!ctx) return;
    var t = ctx.currentTime;
    busMusica.gain.setTargetAtTime(pref.musica ? 1 : 0, t, 0.4);
    busEfeitos.gain.setTargetAtTime(pref.efeitos ? 0.9 : 0, t, 0.05);
  }

  var Som = {
    // chamado no primeiro toque na tela (o Android só libera áudio depois de um toque)
    acordar: function () {
      if (!ctx && !criar()) return;
      if (ctx.state === "suspended" && document.visibilityState !== "hidden") ctx.resume();
    },
    clima: function (nome) {
      if (nome === clima) return;
      clima = nome;
      if (!ctx) return;
      var t = ctx.currentTime;
      if (drones.ganho) drones.ganho.gain.setTargetAtTime(nome === "silencio" ? 0.0001 : nome === "climax" ? 0.16 : nome === "tenso" ? 0.13 : 0.11, t, 1);
      if (drones.filtro) drones.filtro.frequency.setTargetAtTime(nome === "climax" ? 650 : nome === "tenso" ? 480 : 380, t, 1);
      if (chuva) chuva.gain.setTargetAtTime(nome === "silencio" ? 0.012 : 0.035, t, 1);
      proximo = 0; proxBatida = 0;
    },
    fx: function (nome) {
      if (!pref.efeitos || !FX[nome]) return;
      Som.acordar();
      if (!ctx || ctx.state !== "running") { if (ctx) ctx.resume().then(function () { FX[nome](ctx.currentTime + 0.02); }).catch(function () {}); return; }
      FX[nome](ctx.currentTime + 0.01);
    },
    pref: function () { return { musica: pref.musica, efeitos: pref.efeitos }; },
    definir: function (k, v) {
      pref[k] = !!v;
      try { localStorage.setItem(CHAVE, JSON.stringify(pref)); } catch (e) {}
      Som.acordar();
      aplicarPref();
    }
  };

  document.addEventListener("pointerdown", Som.acordar, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.visibilityState === "hidden") ctx.suspend(); else ctx.resume();
  });

  global.Som = Som;
})(window);
