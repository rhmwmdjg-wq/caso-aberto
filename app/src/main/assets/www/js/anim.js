/* =========================================================
   CASO ABERTO — Animações
   Chuva e lampião ao fundo, abertura do caso e veredito final.
   ========================================================= */
(function (global) {
  "use strict";

  var CHAVE = "ca_anim";
  var reduzir = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pref = { clima: !reduzir };
  try { var s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s && typeof s.clima === "boolean") pref.clima = s.clima; } catch (e) {}

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function som(n) { try { if (global.Som) global.Som.fx(n); } catch (e) {} }

  /* ---------- Chuva no fundo ---------- */
  var cv = document.createElement("canvas"), g = cv.getContext("2d");
  cv.id = "chuva"; cv.setAttribute("aria-hidden", "true");
  var luz = document.createElement("div"); luz.id = "lampiao"; luz.setAttribute("aria-hidden", "true");
  document.body.insertBefore(luz, document.body.firstChild);
  document.body.insertBefore(cv, document.body.firstChild);
  var gotas = [], L = 0, A = 0, dpr = 1, rodando = false, ultimo = 0, relampago = 0, proxRelampago = 0;

  function medir() {
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    L = global.innerWidth; A = global.innerHeight;
    cv.width = L * dpr; cv.height = A * dpr;
    cv.style.width = L + "px"; cv.style.height = A + "px";
    var n = Math.round(Math.min(110, (L * A) / 6000));
    gotas = [];
    for (var i = 0; i < n; i++) gotas.push(novaGota(true));
  }
  function novaGota(qualquer) {
    var z = Math.random();
    return { x: Math.random() * (L + 60) - 30, y: qualquer ? Math.random() * A : -20 - Math.random() * A * 0.3, v: 7 + z * 9, c: 9 + z * 14, a: 0.08 + z * 0.22 };
  }
  function quadro(t) {
    if (!rodando) return;
    requestAnimationFrame(quadro);
    if (t - ultimo < 30) return; // ~30 quadros por segundo, poupa bateria
    var dt = Math.min(3, (t - ultimo) / 33); ultimo = t;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, L, A);
    // relâmpago raro
    if (t > proxRelampago) { relampago = 1; proxRelampago = t + 18000 + Math.random() * 30000; }
    if (relampago > 0.01) {
      g.fillStyle = "rgba(190,205,255," + (relampago * 0.09) + ")"; g.fillRect(0, 0, L, A);
      relampago *= relampago > 0.6 && Math.random() < 0.2 ? 1.05 : 0.86;
    }
    g.lineCap = "round";
    for (var i = 0; i < gotas.length; i++) {
      var d = gotas[i];
      d.y += d.v * dt; d.x -= d.v * 0.18 * dt;
      if (d.y > A + 20) gotas[i] = d = novaGota(false);
      g.strokeStyle = "rgba(170,190,215," + d.a + ")";
      g.lineWidth = d.a > 0.2 ? 1.3 : 0.9;
      g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x + d.c * 0.18, d.y - d.c); g.stroke();
    }
  }
  function ligarChuva() {
    var ligar = pref.clima && document.visibilityState !== "hidden";
    document.documentElement.classList.toggle("sem-clima", !pref.clima);
    if (ligar && !rodando) { rodando = true; ultimo = performance.now(); proxRelampago = ultimo + 8000; requestAnimationFrame(quadro); }
    else if (!ligar && rodando) { rodando = false; g.clearRect(0, 0, cv.width, cv.height); }
  }
  medir();
  global.addEventListener("resize", function () { medir(); });
  document.addEventListener("visibilitychange", ligarChuva);
  ligarChuva();

  /* ---------- Cortinas (abertura e veredito) ---------- */
  var cortina = null, tFechar = null, tempos = [];
  function limpar() {
    tempos.forEach(clearTimeout); tempos = [];
    clearTimeout(tFechar);
    if (cortina) { var c = cortina; cortina = null; c.classList.add("saindo"); setTimeout(function () { c.remove(); }, 450); }
  }
  function depois(ms, f) { tempos.push(setTimeout(f, ms)); }
  function abrirCortina(cls, html, duracao, aoFechar) {
    limpar();
    var c = document.createElement("div");
    c.className = "cortina " + cls;
    c.innerHTML = html + '<div class="pular">toque para continuar</div>';
    c.addEventListener("click", function () { limpar(); if (aoFechar) aoFechar(); });
    document.body.appendChild(c);
    cortina = c;
    tFechar = setTimeout(function () { limpar(); if (aoFechar) aoFechar(); }, duracao);
    return c;
  }
  function datilografar(el, texto, vel, aoFim) {
    var i = 0;
    (function passo() {
      if (!el.isConnected) return;
      el.textContent = texto.slice(0, i);
      if (i < texto.length) {
        if (texto.charAt(i) !== " ") som("tecla");
        i++;
        depois(vel + Math.random() * vel * 0.6, passo);
      } else if (aoFim) aoFim();
    })();
  }

  var Anim = {
    pref: function () { return { clima: pref.clima }; },
    definir: function (k, v) {
      pref[k] = !!v;
      try { localStorage.setItem(CHAVE, JSON.stringify(pref)); } catch (e) {}
      ligarChuva();
    },
    // Abertura do caso: ficha confidencial datilografada sob a luz do lampião
    abertura: function (caso, numero) {
      var c = abrirCortina("abertura",
        '<div class="ficha"><div class="conf">ARQUIVO CONFIDENCIAL</div><div class="num maquina" id="anNum"></div>' +
        '<div class="capa-grande">' + caso.capa + '</div><h1 class="titulo" id="anTit"></h1><div class="sub">' + esc(caso.subtitulo) + "</div></div>",
        5200);
      var num = c.querySelector("#anNum"), tit = c.querySelector("#anTit");
      depois(350, function () {
        datilografar(num, "CASO Nº " + ("00" + numero).slice(-3), 70, function () {
          depois(250, function () { c.classList.add("acesa"); som("papel"); });
          depois(700, function () { tit.textContent = caso.titulo; tit.classList.add("surgir"); });
          depois(1300, function () { c.querySelector(".sub").classList.add("surgir"); });
        });
      });
    },
    // Veredito: tambor, silêncio e o carimbo descendo
    desfecho: function (rotulo, cor, frase, venceu) {
      var c = abrirCortina("veredito",
        '<div class="ficha"><div class="conf">O VEREDITO</div><div class="reticencias"><span>.</span><span>.</span><span>.</span></div>' +
        '<div class="carimbo grande-carimbo ' + cor + '">' + esc(rotulo) + '</div><div class="sub">' + esc(frase) + "</div></div>",
        6500);
      som("tambor");
      depois(2900, function () {
        c.classList.add("bateu");
        som("carimbo");
        if (navigator.vibrate) try { navigator.vibrate(90); } catch (e) {}
      });
      depois(3300, function () { som(venceu === true ? "vitoria" : venceu === false ? "derrota" : "empate"); });
    },
    fechar: limpar
  };

  global.Anim = Anim;
})(window);
