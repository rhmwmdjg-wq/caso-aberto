/* =========================================================
   TRUCO — Arte desenhada no próprio app (SVG):
   personagens, cartas, tentos de milho/feijão, garrafas e cenários.
   Tudo original, sem marcas.
   ========================================================= */
(function (global) {
  "use strict";

  /* ---------------- Personagens ---------------- */
  var FOTOS = { barba: 1, chapeu: 1, mestre: 1, morena: 1 };
  function temFoto(id) { return !!FOTOS[id]; }
  function retrato(id) { // corpo inteiro (seleção de personagem e grito de truco)
    return FOTOS[id] ? '<img class="retrato-foto" src="truco/img/' + id + '-corpo.jpg" alt="" draggable="false">' : '<div class="sem-foto">?</div>';
  }
  function avatar(id, extra) {
    if (FOTOS[id]) return '<img class="avatar-foto ' + (extra || "") + '" src="truco/img/' + id + '-rosto.jpg" alt="" draggable="false">';
    return '<div class="sem-foto ' + (extra || "") + '">?</div>';
  }

  /* ---------------- Cartas ---------------- */
  var SIMBOLO = { P: "♣", C: "♥", E: "♠", O: "♦" };
  var COR = { P: "#1b1b1b", E: "#1b1b1b", C: "#c62828", O: "#c62828" };
  var NOME_RANK = { Q: "Q", J: "J", K: "K", A: "A" };
  function figura(r, n) { // rei, dama e valete no estilo do baralho tradicional (desenho próprio)
    var c = COR[n], sim = SIMBOLO[n];
    var manto = n === "C" || n === "O" ? ["#c62828", "#1e4e9c"] : ["#1e4e9c", "#c62828"];
    var ouro = "#f2c230", pele = "#f5d7b5", linha = "#1b1b1b";
    var coroa = r === "K" ? '<path d="M-9 -33 L-9 -42 L-5 -37 L0 -44 L5 -37 L9 -42 L9 -33 Z" fill="' + ouro + '" stroke="' + linha + '" stroke-width=".7"/><circle cx="0" cy="-39" r="1.3" fill="' + manto[0] + '"/>'
      : r === "Q" ? '<path d="M-8 -33 Q-9 -41 -4 -40 Q0 -46 4 -40 Q9 -41 8 -33 Z" fill="' + ouro + '" stroke="' + linha + '" stroke-width=".7"/><circle cx="0" cy="-41" r="1.4" fill="' + manto[1] + '"/>'
      : '<path d="M-9 -32 Q-8 -41 0 -41 Q8 -41 9 -32 Z" fill="' + manto[1] + '" stroke="' + linha + '" stroke-width=".7"/><path d="M-9 -33 L9 -33" stroke="' + ouro + '" stroke-width="2"/><path d="M6 -40 Q12 -46 14 -38" stroke="' + manto[0] + '" stroke-width="2" fill="none"/>';
    var cabelo = r === "Q" ? '<path d="M-8 -32 Q-11 -20 -8 -14 L-5 -18 L-5 -30 Z M8 -32 Q11 -20 8 -14 L5 -18 L5 -30 Z" fill="#7a4a1d" stroke="' + linha + '" stroke-width=".5"/>' : "";
    var barba = r === "K" ? '<path d="M-6 -21 Q0 -12 6 -21 Q4 -16 0 -15 Q-4 -16 -6 -21 Z" fill="#7a4a1d" stroke="' + linha + '" stroke-width=".5"/>' : "";
    var objeto = r === "K" ? '<path d="M11 -26 L11 2" stroke="' + linha + '" stroke-width="1.6"/><path d="M8 -26 L14 -26" stroke="' + ouro + '" stroke-width="2"/>'
      : r === "Q" ? '<path d="M-12 -6 L-12 -16" stroke="#2e7d32" stroke-width="1.2"/><circle cx="-12" cy="-18" r="3" fill="' + manto[0] + '" stroke="' + linha + '" stroke-width=".5"/>'
      : '<path d="M-13 2 L-13 -24" stroke="' + linha + '" stroke-width="1.2"/><path d="M-15 -24 L-13 -30 L-11 -24 Z" fill="#999" stroke="' + linha + '" stroke-width=".5"/>';
    var meio = '<g>' + coroa + cabelo + '<ellipse cx="0" cy="-25" rx="6.5" ry="8" fill="' + pele + '" stroke="' + linha + '" stroke-width=".7"/>' +
      '<circle cx="-2.3" cy="-26" r=".9" fill="' + linha + '"/><circle cx="2.3" cy="-26" r=".9" fill="' + linha + '"/><path d="M-1.6 -21.5 Q0 -20.6 1.6 -21.5" stroke="#a33" stroke-width=".7" fill="none"/>' + barba +
      '<path d="M-14 -14 Q0 -20 14 -14 L16 2 L-16 2 Z" fill="' + manto[0] + '" stroke="' + linha + '" stroke-width=".7"/>' +
      '<path d="M-7 -16 L0 -6 L7 -16" fill="' + ouro + '" stroke="' + linha + '" stroke-width=".6"/>' +
      '<path d="M-14 -10 L-8 2 M14 -10 L8 2" stroke="' + manto[1] + '" stroke-width="3"/>' +
      [-10, -4, 4, 10].map(function (x) { return '<circle cx="' + x + '" cy="-3" r="1" fill="' + ouro + '"/>'; }).join("") +
      objeto + '<text x="-9" y="-1" font-size="7" fill="' + c + '" text-anchor="middle">' + sim + "</text></g>";
    return '<g transform="translate(40 60)"><rect x="-21" y="-46" width="42" height="92" fill="#fffdf6" stroke="' + c + '" stroke-width=".8"/>' +
      '<clipPath id="cl' + r + n + '"><rect x="-21" y="-46" width="42" height="46"/></clipPath><g clip-path="url(#cl' + r + n + ')">' + meio + "</g>" +
      '<g transform="rotate(180)"><g clip-path="url(#cl' + r + n + ')">' + meio + "</g></g>" +
      '<path d="M-21 0 L21 0" stroke="' + linha + '" stroke-width=".5" opacity=".5"/></g>';
  }
  var PIPS = { // posições dos naipes no meio da carta (80x120)
    1: [[40, 60]], 2: [[40, 30], [40, 90]], 3: [[40, 26], [40, 60], [40, 94]], 4: [[26, 32], [54, 32], [26, 88], [54, 88]],
    5: [[26, 32], [54, 32], [40, 60], [26, 88], [54, 88]], 6: [[26, 30], [54, 30], [26, 60], [54, 60], [26, 90], [54, 90]],
    7: [[26, 28], [54, 28], [40, 44], [26, 62], [54, 62], [26, 92], [54, 92]]
  };
  function carta(c, opts) {
    opts = opts || {};
    if (!c) return verso(opts);
    var r = c.slice(0, -1), n = c.slice(-1), cor = COR[n], sim = SIMBOLO[n];
    var s = '<svg viewBox="0 0 80 120" class="carta-svg' + (opts.cls ? " " + opts.cls : "") + '">';
    s += '<rect x="1" y="1" width="78" height="118" rx="7" fill="#F7F3E8" stroke="#d6ccb4" stroke-width="1.2"/>';
    var canto = '<text x="6" y="23" font-size="21" fill="' + cor + '" font-family="Anton,Impact,sans-serif">' + (NOME_RANK[r] || r) + '</text><text x="6.5" y="37" font-size="13" fill="' + cor + '">' + sim + "</text>";
    s += canto + '<g transform="rotate(180 40 60)">' + canto + "</g>";
    if (r === "K" || r === "Q" || r === "J") s += figura(r, n);
    else if (r === "A") s += '<text x="40" y="76" text-anchor="middle" font-size="' + (n === "E" ? 50 : 40) + '" fill="' + cor + '">' + sim + "</text>" + (n === "E" ? '<circle cx="40" cy="60" r="30" fill="none" stroke="' + cor + '" stroke-width="1" opacity=".35"/>' : "");
    else {
      var num = parseInt(r, 10);
      (PIPS[num] || []).forEach(function (p) { s += '<text x="' + p[0] + '" y="' + (p[1] + 6) + '" text-anchor="middle" font-size="17" fill="' + cor + '">' + sim + "</text>"; });
    }
    if (opts.manilha) s += '<rect x="2.5" y="2.5" width="75" height="115" rx="6" fill="none" stroke="#E5A93C" stroke-width="2.5"/>';
    return s + "</svg>";
  }
  // Temas de baralho (só muda a cor das costas; cada jogador escolhe o seu)
  var TEMAS = {
    classico: { nome: "Clássico Boteco", desc: "Costas vermelhas, do jeito que o povo conhece", base: "#c8161d", linha: "#e8545a", emblema: "#c8161d", fundo: "#F7F3E8" },
    safira: { nome: "Azul Safira", desc: "Arabescos azuis, pra quem gosta de mesa fina", base: "#1e4e9c", linha: "#5f8fe0", emblema: "#1e4e9c", fundo: "#F7F3E8" },
    ouro: { nome: "Ouro Imperial", desc: "Costas douradas que brilham na luz do lampião", base: "#a8761a", linha: "#f2cf6b", emblema: "#8a5d0c", fundo: "#fff6dc" },
    preto: { nome: "Preto Fosco", desc: "Discreto, sério, de quem não brinca em serviço", base: "#1d1a18", linha: "#6b5a44", emblema: "#E5A93C", fundo: "#1d1a18" }
  };
  var temaAtual = "classico";
  function verso(opts) {
    opts = opts || {};
    var t = TEMAS[opts.tema || temaAtual] || TEMAS.classico, id = "trama-" + (opts.tema || temaAtual);
    var s = '<svg viewBox="0 0 80 120" class="carta-svg verso' + (opts.cls ? " " + opts.cls : "") + '">';
    s += '<defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="' + t.base + '"/><path d="M0 3 L3 0 L6 3 L3 6 Z" fill="none" stroke="' + t.linha + '" stroke-width=".6"/></pattern></defs>';
    s += '<rect x="1" y="1" width="78" height="118" rx="7" fill="#F7F3E8" stroke="#d8d0bd"/><rect x="5" y="5" width="70" height="110" rx="4" fill="url(#' + id + ')"/>';
    s += '<rect x="8" y="8" width="64" height="104" rx="3" fill="none" stroke="' + (t.fundo === "#1d1a18" ? "#E5A93C" : "#fff") + '" stroke-width=".9" opacity=".85"/>';
    s += '<circle cx="40" cy="58" r="15" fill="' + t.fundo + '"/><circle cx="40" cy="58" r="12.5" fill="none" stroke="' + t.emblema + '" stroke-width=".8"/>';
    s += '<text x="40" y="66" text-anchor="middle" font-size="22" fill="' + t.emblema + '">♠</text>';
    s += '<text x="40" y="90" text-anchor="middle" font-size="9" fill="' + (t.fundo === "#1d1a18" ? "#E5A93C" : "#fff") + '" font-family="Anton,Impact,sans-serif" letter-spacing="2">TRUCO</text>';
    return s + "</svg>";
  }

  /* ---------------- Tentos: milho ou feijão branco ---------------- */
  function grao(tipo, i) {
    var rot = (i * 47) % 360;
    if (tipo === "feijao") return '<svg viewBox="0 0 20 14" class="grao" style="transform:rotate(' + rot + 'deg)"><path d="M3 7 Q2 1 9 2 Q12 3 13 2 Q19 1 18 7 Q18 13 10 12 Q2 13 3 7 Z" fill="#f6f1e4" stroke="#cdbf9e" stroke-width="1"/><ellipse cx="11" cy="4.6" rx="2" ry=".9" fill="#d8ccb0"/></svg>';
    return '<svg viewBox="0 0 14 16" class="grao" style="transform:rotate(' + rot + 'deg)"><path d="M7 1 Q13 4 12 10 Q11 15 7 15 Q3 15 2 10 Q1 4 7 1 Z" fill="#f2b51d" stroke="#c28a0e" stroke-width="1"/><path d="M5 5 Q7 3 9 5" stroke="#fff3c4" stroke-width="1.3" fill="none" opacity=".8"/></svg>';
  }
  function tentos(tipo, n, alvo) {
    var s = '<span class="tentos">';
    for (var i = 0; i < alvo; i++) s += i < n ? grao(tipo, i) : '<span class="grao-vazio"></span>';
    return s + "</span>";
  }

  /* ---------------- Mesa com cerveja ---------------- */
  function garrafa(x, y, esc, rot) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + esc + ") rotate(" + (rot || 0) + ')">' +
      '<ellipse cx="0" cy="58" rx="13" ry="4" fill="rgba(0,0,0,.35)"/>' +
      '<path d="M-10 58 L-10 10 Q-10 0 -4 -6 L-4 -26 L4 -26 L4 -6 Q10 0 10 10 L10 58 Z" fill="#5a2d0c"/>' +
      '<path d="M-7 54 L-7 12 Q-7 4 -2 -2 L-2 -22" stroke="rgba(255,255,255,.28)" stroke-width="2.4" fill="none"/>' +
      '<rect x="-10" y="18" width="20" height="22" fill="#f4e7c3"/><rect x="-10" y="18" width="20" height="5" fill="#c0392b"/>' +
      '<text x="0" y="34" text-anchor="middle" font-size="6" fill="#5a2d0c" font-weight="700">CERVEJA</text>' +
      '<rect x="-4.6" y="-30" width="9.2" height="5" rx="1" fill="#d4a017"/></g>';
  }
  function copo(x, y, esc) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + esc + ')"><ellipse cx="0" cy="26" rx="10" ry="3" fill="rgba(0,0,0,.3)"/>' +
      '<path d="M-10 -10 L-8 26 L8 26 L10 -10 Z" fill="rgba(240,180,60,.85)"/><path d="M-10 -10 L-9.6 -4 L9.6 -4 L10 -10 Z" fill="#fffbe8"/>' +
      '<path d="M-10 -10 L-8 26 L8 26 L10 -10 Z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>' +
      [-6, -2, 2, 6].map(function (xx) { return '<path d="M' + xx + ' -4 L' + (xx * 0.8) + ' 26" stroke="rgba(255,255,255,.25)" stroke-width="1"/>'; }).join("") + "</g>";
  }
  function tigela(x, y, tipo) {
    var s = '<g transform="translate(' + x + " " + y + ')"><ellipse cx="0" cy="10" rx="30" ry="9" fill="rgba(0,0,0,.35)"/>' +
      '<path d="M-28 -2 Q-26 18 0 20 Q26 18 28 -2 Z" fill="#6b3d1e" stroke="#3e2210" stroke-width="1.5"/><ellipse cx="0" cy="-2" rx="28" ry="9" fill="#4a2a14"/>';
    for (var i = 0; i < 22; i++) {
      var a = i * 2.4, r = (i % 7) * 3.4, gx = Math.cos(a) * r * 1.2, gy = -3 + Math.sin(a) * r * 0.35;
      s += tipo === "milho" ? '<ellipse cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" rx="3.2" ry="3.8" fill="#f2b51d" stroke="#b9820c" stroke-width=".6"/>'
        : '<ellipse cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" rx="4.4" ry="2.8" fill="#f6f1e4" stroke="#c9bb98" stroke-width=".6" transform="rotate(' + (i * 37 % 180) + " " + gx.toFixed(1) + " " + gy.toFixed(1) + ')"/>';
    }
    return s + "</g>";
  }
  function decoracaoMesa(semente) {
    var s = '<svg class="mesa-deco" viewBox="0 0 400 400" preserveAspectRatio="none">';
    s += garrafa(42, 40, 0.9, -4) + garrafa(70, 30, 0.82, 3) + copo(100, 58, 0.9);
    s += garrafa(352, 300, 0.95, 5) + copo(318, 330, 0.95);
    s += tigela(330, 62, "milho") + tigela(64, 330, "feijao");
    return s + "</svg>";
  }

  /* ---------------- Cenários do norte de Minas ---------------- */
  var CENARIOS = {
    rancho: { nome: "Rancho do Truco", icone: "🤠", desc: "Placa de TRUCO, chapéu de palha, lampião e o pôr do sol no cerrado." },
    boteco: { nome: "Boteco do Seu Tião", icone: "🍺", desc: "Azulejo, balcão e a geladeira da cerveja trincando." },
    varanda: { nome: "Varanda da fazenda", icone: "🌅", desc: "Pôr do sol no cerrado, pequizeiro e o gado no pasto." },
    rio: { nome: "Beira do Velho Chico", icone: "🛶", desc: "Noite de lua no Rio São Francisco, com a canoa amarrada." },
    festa: { nome: "Festa de agosto", icone: "🎉", desc: "Bandeirinhas, fogueira e forró na praça da cidade." }
  };
  function fundo(id) {
    if (id === "rancho" || !CENARIOS[id]) {
      return '<div class="cen-rancho"><div class="foto" style="background-image:url(truco/img/rancho.jpg)"></div><div class="luz"></div>' +
        '<svg class="chao" viewBox="0 0 400 500" preserveAspectRatio="none"><defs><linearGradient id="ch-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4024"/><stop offset="1" stop-color="#2a170b"/></linearGradient></defs><rect width="400" height="500" fill="url(#ch-r)"/>' +
        Array.apply(null, Array(16)).map(function (_, i) { return '<path d="M0 ' + (i * 32 + 10) + " L400 " + (i * 32 + 14) + '" stroke="#3c2312" stroke-width="2.5" opacity=".7"/>'; }).join("") +
        "</svg></div>";
    }
    var s = '<svg class="cenario-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">';
    if (id === "varanda") {
      s += '<defs><linearGradient id="ceu-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a5c"/><stop offset=".45" stop-color="#e2774a"/><stop offset=".7" stop-color="#f6c66b"/></linearGradient></defs>';
      s += '<rect width="400" height="800" fill="url(#ceu-v)"/><circle cx="300" cy="300" r="46" fill="#ffd98a" opacity=".9"/>';
      s += '<path d="M0 360 Q80 330 160 352 Q260 320 400 348 L400 520 L0 520 Z" fill="#5b4a2b"/>';
      s += '<g fill="#2b2016">' + [40, 120, 230, 350].map(function (x, i) { var h = 70 + i * 13; return '<rect x="' + (x - 3) + '" y="' + (350 - h) + '" width="6" height="' + h + '"/><ellipse cx="' + x + '" cy="' + (345 - h) + '" rx="' + (30 + i * 4) + '" ry="' + (20 + i * 2) + '"/><ellipse cx="' + (x - 18) + '" cy="' + (355 - h) + '" rx="18" ry="12"/>'; }).join("") + "</g>";
      s += '<g fill="#3b2a1a">' + [70, 180, 300].map(function (x) { return '<ellipse cx="' + x + '" cy="370" rx="14" ry="7"/><rect x="' + (x - 10) + '" y="372" width="2.5" height="10"/><rect x="' + (x + 8) + '" y="372" width="2.5" height="10"/>'; }).join("") + "</g>";
      s += '<rect y="420" width="400" height="22" fill="#6b4423"/>' + Array.apply(null, Array(14)).map(function (_, i) { return '<rect x="' + (i * 30 + 6) + '" y="380" width="8" height="60" fill="#7d5230"/>'; }).join("") + '<rect y="376" width="400" height="10" fill="#8a5d36"/>';
      s += '<rect y="440" width="400" height="360" fill="#9c6b45"/>' + Array.apply(null, Array(12)).map(function (_, i) { return '<path d="M0 ' + (450 + i * 30) + ' L400 ' + (450 + i * 30) + '" stroke="#86593a" stroke-width="2"/>'; }).join("");
    } else if (id === "rio") {
      s += '<defs><linearGradient id="ceu-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1730"/><stop offset=".55" stop-color="#1d3a5f"/></linearGradient></defs>';
      s += '<rect width="400" height="800" fill="url(#ceu-r)"/>';
      for (var e = 0; e < 60; e++) s += '<circle cx="' + ((e * 73) % 400) + '" cy="' + ((e * 37) % 300) + '" r="' + (e % 3 === 0 ? 1.4 : 0.8) + '" fill="#fff" opacity="' + (0.4 + (e % 5) / 10) + '"/>';
      s += '<circle cx="90" cy="140" r="30" fill="#f6f1d3"/><circle cx="102" cy="132" r="28" fill="#13284a" opacity=".12"/>';
      s += '<path d="M0 330 Q100 310 200 325 Q300 312 400 330 L400 350 L0 350 Z" fill="#0d2238"/>';
      s += '<rect y="345" width="400" height="140" fill="#163d5c"/>';
      for (var w = 0; w < 18; w++) s += '<path d="M' + ((w * 53) % 400) + " " + (360 + w * 7) + " q12 -4 24 0" + '" stroke="#5d8bb0" stroke-width="1.6" fill="none" opacity=".6"/>';
      s += '<path d="M60 360 L130 360 L80 520 Z" fill="#f6f1d3" opacity=".08"/>';
      s += '<path d="M240 410 Q300 430 360 410 L350 422 Q300 436 250 422 Z" fill="#5a3a1e"/><path d="M300 360 L300 412" stroke="#3b2414" stroke-width="2"/>';
      s += '<rect y="480" width="400" height="320" fill="#6b5034"/>' + Array.apply(null, Array(10)).map(function (_, i) { return '<path d="M0 ' + (490 + i * 32) + ' L400 ' + (490 + i * 32) + '" stroke="#5a4129" stroke-width="3"/>'; }).join("");
    } else if (id === "festa") {
      s += '<rect width="400" height="800" fill="#1a1230"/>';
      s += '<rect y="260" width="400" height="180" fill="#3a2a2a"/>' + [20, 120, 230, 330].map(function (x, i) { return '<rect x="' + x + '" y="' + (190 + i % 2 * 20) + '" width="70" height="90" fill="' + ["#d35400", "#16a085", "#c0392b", "#2980b9"][i] + '"/><rect x="' + (x + 24) + '" y="' + (240 + i % 2 * 20) + '" width="22" height="40" fill="#2c1a10"/><path d="M' + (x - 6) + " " + (190 + i % 2 * 20) + " L" + (x + 35) + " " + (165 + i % 2 * 20) + " L" + (x + 76) + " " + (190 + i % 2 * 20) + ' Z" fill="#7b3f20"/>'; }).join("");
      var cores = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"];
      [60, 110, 160].forEach(function (y, k) {
        s += '<path d="M0 ' + y + " Q200 " + (y + 40) + " 400 " + y + '" stroke="#ddd" stroke-width="1" fill="none"/>';
        for (var b2 = 0; b2 < 16; b2++) { var x2 = b2 * 25 + 8, yy = y + Math.sin(b2 / 15 * Math.PI) * 20 + 2; s += '<path d="M' + x2 + " " + yy + " l14 0 l0 16 l-7 -6 l-7 6 Z" + '" fill="' + cores[(b2 + k) % 6] + '"/>'; }
      });
      s += '<ellipse cx="200" cy="440" rx="60" ry="14" fill="#ff9f43" opacity=".35"/><path d="M180 440 Q190 400 200 380 Q210 400 220 440 Z" fill="#ff6b1a"/><path d="M190 440 Q197 415 203 400 Q209 418 212 440 Z" fill="#ffd23f"/>';
      s += '<rect y="450" width="400" height="350" fill="#7a5a3a"/>' + Array.apply(null, Array(30)).map(function (_, i) { return '<circle cx="' + ((i * 97) % 400) + '" cy="' + (470 + (i * 53) % 320) + '" r="2" fill="#5d4229"/>'; }).join("");
    } else { // boteco
      s += '<rect width="400" height="800" fill="#2b3a2f"/>';
      for (var y = 0; y < 26; y++) for (var x = 0; x < 14; x++) s += '<rect x="' + (x * 30) + '" y="' + (y * 30) + '" width="29" height="29" fill="' + ((x + y) % 2 ? "#3d6b52" : "#e9e4d0") + '" opacity=".22"/>';
      s += '<rect y="0" width="400" height="120" fill="#20160f"/><rect x="40" y="18" width="320" height="10" fill="#5a3b22"/><rect x="40" y="70" width="320" height="10" fill="#5a3b22"/>';
      [60, 90, 120, 150, 250, 280, 310, 340].forEach(function (x, i) { s += '<rect x="' + x + '" y="' + (i % 2 ? 36 : 30) + '" width="12" height="' + (i % 2 ? 34 : 40) + '" rx="3" fill="' + ["#2e7d32", "#8d6e63", "#c0392b", "#f39c12"][i % 4] + '" opacity=".9"/>'; });
      s += '<path d="M200 120 L200 160" stroke="#222" stroke-width="2"/><path d="M180 160 L220 160 L210 175 L190 175 Z" fill="#c9a227"/><ellipse cx="200" cy="300" rx="180" ry="140" fill="#ffd27a" opacity=".12"/>';
      s += '<rect x="300" y="170" width="80" height="150" rx="6" fill="#c0392b"/><rect x="306" y="178" width="68" height="70" rx="3" fill="#7fb3d5" opacity=".8"/><text x="340" y="290" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">GELADA</text>';
      s += '<rect y="330" width="400" height="470" fill="#4a3324"/>' + Array.apply(null, Array(15)).map(function (_, i) { return '<path d="M0 ' + (340 + i * 32) + ' L400 ' + (340 + i * 32) + '" stroke="#3b281b" stroke-width="2"/>'; }).join("");
    }
    return s + "</svg>";
  }

  global.ArteTruco = { TEMAS: TEMAS, definirTema: function (t) { if (TEMAS[t]) temaAtual = t; }, tema: function () { return temaAtual; }, avatar: avatar, retrato: retrato, temFoto: temFoto, carta: carta, verso: verso, tentos: tentos, grao: grao, decoracaoMesa: decoracaoMesa, fundo: fundo, CENARIOS: CENARIOS, SIMBOLO: SIMBOLO };
})(window);
