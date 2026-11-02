/* =========================================================
   TRUCO — Arte desenhada no próprio app (SVG):
   personagens, cartas, tentos de milho/feijão, garrafas e cenários.
   Tudo original, sem marcas.
   ========================================================= */
(function (global) {
  "use strict";

  /* ---------------- Personagens ---------------- */
  var LOOK = {
    tiao:     { pele: "#c98e62", cabelo: "#d9d9d9", camisa: "#6b8e4e", chapeu: "palha", bigode: true, barba: false, rugas: true },
    ze:       { pele: "#a86b42", cabelo: "#2b1a10", camisa: "#d9822b", chapeu: "bone", bigode: false, sorriso: true },
    lurdinha: { pele: "#e0aa82", cabelo: "#6a3b1f", camisa: "#c0392b", chapeu: "coque", brinco: true, batom: true },
    bene:     { pele: "#8d5a36", cabelo: "#1a110b", camisa: "#8b5a2b", chapeu: "couro", bigode: true },
    toinho:   { pele: "#6e4426", cabelo: "#1a110b", camisa: "#2e86ab", chapeu: "pescador", barba: true },
    cida:     { pele: "#b07a52", cabelo: "#ededed", camisa: "#7d4f9e", chapeu: "lenco", brinco: true, oculos: true },
    juca:     { pele: "#d29a6e", cabelo: "#3b2414", camisa: "#e8c547", chapeu: "palha-fita", bigode: true, sorriso: true },
    rosinha:  { pele: "#9c6440", cabelo: "#140c08", camisa: "#e84f8a", chapeu: "flor", brinco: true, batom: true, cacheado: true }
  };
  var FOTOS = { barba: 1, chapeu: 1, mestre: 1, morena: 1 };
  function temFoto(id) { return !!FOTOS[id]; }
  function retrato(id) { // corpo inteiro (seleção de personagem e grito de truco)
    return FOTOS[id] ? '<img class="retrato-foto" src="truco/img/' + id + '-corpo.jpg" alt="" draggable="false">' : avatar(id, "grande");
  }
  function avatar(id, extra) {
    if (FOTOS[id]) return '<img class="avatar-foto ' + (extra || "") + '" src="truco/img/' + id + '-rosto.jpg" alt="" draggable="false">';
    var L = LOOK[id] || { pele: "#c98e62", cabelo: "#333", camisa: "#777", chapeu: "" };
    var s = '<svg viewBox="0 0 100 100" class="avatar-svg ' + (extra || "") + '" aria-hidden="true">';
    s += '<circle cx="50" cy="50" r="49" fill="#f3e2c0"/>';
    // corpo
    s += '<path d="M14 100 Q16 72 50 70 Q84 72 86 100 Z" fill="' + L.camisa + '"/>';
    s += '<path d="M42 70 L50 82 L58 70" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>';
    s += '<rect x="43" y="58" width="14" height="14" rx="5" fill="' + L.pele + '"/>';
    // cabelo atrás
    if (L.chapeu === "coque" || L.chapeu === "flor" || L.cacheado) s += '<ellipse cx="50" cy="42" rx="27" ry="29" fill="' + L.cabelo + '"/>';
    if (L.cacheado) for (var i = 0; i < 9; i++) s += '<circle cx="' + (24 + i * 6.5) + '" cy="' + (60 + (i % 2) * 4) + '" r="6" fill="' + L.cabelo + '"/>';
    // rosto
    s += '<ellipse cx="50" cy="44" rx="21" ry="24" fill="' + L.pele + '"/>';
    s += '<ellipse cx="29" cy="46" rx="4" ry="6" fill="' + L.pele + '"/><ellipse cx="71" cy="46" rx="4" ry="6" fill="' + L.pele + '"/>';
    if (L.brinco) s += '<circle cx="29" cy="54" r="2.2" fill="#f1c40f"/><circle cx="71" cy="54" r="2.2" fill="#f1c40f"/>';
    // cabelo da frente
    if (L.chapeu !== "lenco") s += '<path d="M29 38 Q32 18 50 18 Q68 18 71 38 Q62 28 50 28 Q38 28 29 38 Z" fill="' + L.cabelo + '"/>';
    // olhos e sobrancelhas
    s += '<ellipse cx="42" cy="44" rx="2.6" ry="3" fill="#20140c"/><ellipse cx="58" cy="44" rx="2.6" ry="3" fill="#20140c"/>';
    s += '<circle cx="43" cy="43" r=".9" fill="#fff"/><circle cx="59" cy="43" r=".9" fill="#fff"/>';
    s += '<path d="M37 38 Q42 35 46 38 M54 38 Q58 35 63 38" stroke="' + (L.cabelo === "#ededed" || L.cabelo === "#d9d9d9" ? "#999" : "#20140c") + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if (L.oculos) s += '<circle cx="42" cy="44" r="6" fill="none" stroke="#333" stroke-width="1.6"/><circle cx="58" cy="44" r="6" fill="none" stroke="#333" stroke-width="1.6"/><path d="M48 44 L52 44" stroke="#333" stroke-width="1.6"/>';
    if (L.rugas) s += '<path d="M34 50 Q36 52 35 54 M66 50 Q64 52 65 54" stroke="rgba(0,0,0,.25)" stroke-width="1.2" fill="none"/>';
    // nariz e boca
    s += '<path d="M50 46 Q47 53 50 55 Q52 55 53 54" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6" stroke-linecap="round"/>';
    if (L.barba) s += '<path d="M30 50 Q32 70 50 70 Q68 70 70 50 Q64 62 50 62 Q36 62 30 50 Z" fill="' + L.cabelo + '"/>';
    if (L.bigode) s += '<path d="M40 58 Q45 54 50 57 Q55 54 60 58 Q55 60 50 59 Q45 60 40 58 Z" fill="' + (L.cabelo === "#d9d9d9" ? "#bdbdbd" : L.cabelo) + '"/>';
    s += L.sorriso || L.batom ? '<path d="M43 61 Q50 67 57 61" fill="' + (L.batom ? "#b0303a" : "#7a2e22") + '" stroke="none"/>' : '<path d="M44 62 Q50 65 56 62" fill="none" stroke="#6b2a1e" stroke-width="2" stroke-linecap="round"/>';
    // chapéus
    switch (L.chapeu) {
      case "palha": case "palha-fita":
        s += '<ellipse cx="50" cy="27" rx="38" ry="8" fill="#e3c27a" stroke="#b8954a" stroke-width="1.5"/><path d="M31 27 Q33 8 50 8 Q67 8 69 27 Z" fill="#e8c983" stroke="#b8954a" stroke-width="1.5"/>';
        s += '<path d="M33 22 L67 22" stroke="' + (L.chapeu === "palha-fita" ? "#c0392b" : "#8a6a32") + '" stroke-width="3.5"/>';
        for (var k = 0; k < 6; k++) s += '<path d="M' + (36 + k * 6) + ' 10 L' + (34 + k * 6) + ' 26" stroke="#c9a65e" stroke-width=".8"/>';
        break;
      case "couro":
        s += '<path d="M10 30 Q50 40 90 30 Q80 22 70 25 Q68 6 50 7 Q32 6 30 25 Q20 22 10 30 Z" fill="#7a4a24" stroke="#4d2e15" stroke-width="1.5"/><path d="M30 25 Q50 30 70 25" stroke="#4d2e15" stroke-width="2" fill="none"/>';
        for (var q = 0; q < 5; q++) s += '<circle cx="' + (38 + q * 6) + '" cy="16" r="1.4" fill="#d4a24c"/>';
        break;
      case "bone":
        s += '<path d="M29 30 Q30 12 50 12 Q70 12 71 30 Z" fill="#1f6f43"/><path d="M50 28 Q76 26 84 33 Q66 34 50 31 Z" fill="#185a36"/><circle cx="50" cy="13" r="2" fill="#185a36"/>';
        break;
      case "pescador":
        s += '<path d="M26 31 Q28 12 50 12 Q72 12 74 31 Q50 27 26 31 Z" fill="#cfc3a1"/><path d="M20 33 Q50 24 80 33 Q50 38 20 33 Z" fill="#b9ac87"/>';
        break;
      case "lenco":
        s += '<path d="M27 42 Q26 14 50 14 Q74 14 73 42 Q66 26 50 26 Q34 26 27 42 Z" fill="#c0392b"/>';
        for (var b = 0; b < 7; b++) s += '<circle cx="' + (34 + b * 5.4) + '" cy="' + (22 + (b % 2) * 3) + '" r="1.3" fill="#fff"/>';
        s += '<path d="M70 34 Q80 40 76 50 Q72 42 68 40 Z" fill="#a93226"/>';
        break;
      case "coque":
        s += '<circle cx="50" cy="13" r="9" fill="' + L.cabelo + '"/><path d="M44 13 L56 11" stroke="#f1c40f" stroke-width="2"/>';
        break;
      case "flor":
        s += '<g transform="translate(68 22)">' + [0, 72, 144, 216, 288].map(function (r) { return '<ellipse cx="0" cy="-5" rx="3.5" ry="5.5" fill="#ff6fa3" transform="rotate(' + r + ')"/>'; }).join("") + '<circle r="3" fill="#ffd23f"/></g>';
        break;
    }
    return s + "</svg>";
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
    s += '<rect x="1" y="1" width="78" height="118" rx="7" fill="#fdfbf5" stroke="#cfc6b0" stroke-width="1.2"/>';
    s += '<text x="7" y="19" font-size="16" font-weight="700" fill="' + cor + '" font-family="Georgia,serif">' + (NOME_RANK[r] || r) + '</text><text x="7" y="33" font-size="13" fill="' + cor + '">' + sim + "</text>";
    s += '<g transform="rotate(180 40 60)"><text x="7" y="19" font-size="16" font-weight="700" fill="' + cor + '" font-family="Georgia,serif">' + (NOME_RANK[r] || r) + '</text><text x="7" y="33" font-size="13" fill="' + cor + '">' + sim + "</text></g>";
    if (r === "K" || r === "Q" || r === "J") s += figura(r, n);
    else if (r === "A") s += '<text x="40" y="76" text-anchor="middle" font-size="' + (n === "E" ? 50 : 40) + '" fill="' + cor + '">' + sim + "</text>" + (n === "E" ? '<circle cx="40" cy="60" r="30" fill="none" stroke="' + cor + '" stroke-width="1" opacity=".35"/>' : "");
    else {
      var num = parseInt(r, 10);
      (PIPS[num] || []).forEach(function (p) { s += '<text x="' + p[0] + '" y="' + (p[1] + 6) + '" text-anchor="middle" font-size="17" fill="' + cor + '">' + sim + "</text>"; });
    }
    if (opts.manilha) s += '<rect x="2.5" y="2.5" width="75" height="115" rx="6" fill="none" stroke="#e0a526" stroke-width="2.5"/>';
    return s + "</svg>";
  }
  function verso(opts) {
    opts = opts || {};
    var s = '<svg viewBox="0 0 80 120" class="carta-svg verso' + (opts.cls ? " " + opts.cls : "") + '">';
    s += '<defs><pattern id="tr-trama2" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#c8161d"/><path d="M0 3 L3 0 L6 3 L3 6 Z" fill="none" stroke="#e8545a" stroke-width=".6"/></pattern></defs>';
    s += '<rect x="1" y="1" width="78" height="118" rx="7" fill="#fdfbf5" stroke="#d8d0bd"/><rect x="5" y="5" width="70" height="110" rx="4" fill="url(#tr-trama2)"/>';
    s += '<rect x="8" y="8" width="64" height="104" rx="3" fill="none" stroke="#fff" stroke-width=".9" opacity=".85"/>';
    s += '<circle cx="40" cy="58" r="15" fill="#fdfbf5"/><circle cx="40" cy="58" r="12.5" fill="none" stroke="#c8161d" stroke-width=".8"/>';
    s += '<text x="40" y="66" text-anchor="middle" font-size="22" fill="#c8161d">♠</text>';
    s += '<text x="40" y="88" text-anchor="middle" font-size="7.5" fill="#fff" font-family="Georgia,serif" font-weight="700" letter-spacing="2">TRUCO</text>';
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
        '<g transform="translate(266 46) rotate(-3)"><rect x="-4" y="-30" width="4" height="34" fill="#4a2c17"/><rect x="96" y="-30" width="4" height="34" fill="#4a2c17"/><rect x="-14" y="0" width="128" height="58" rx="4" fill="#9a6a3c" stroke="#5a3a1c" stroke-width="2"/>' +
        '<text x="50" y="18" text-anchor="middle" font-size="10.5" fill="#2a1a0c" font-family="Georgia,serif" font-weight="700">Aqui tem:</text><text x="50" y="33" text-anchor="middle" font-size="10.5" fill="#2a1a0c" font-family="Georgia,serif">Truco, cerveja</text><text x="50" y="48" text-anchor="middle" font-size="10.5" fill="#2a1a0c" font-family="Georgia,serif">e resenha boa!</text></g>' +
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

  global.ArteTruco = { avatar: avatar, retrato: retrato, temFoto: temFoto, carta: carta, verso: verso, tentos: tentos, grao: grao, decoracaoMesa: decoracaoMesa, fundo: fundo, CENARIOS: CENARIOS, SIMBOLO: SIMBOLO };
})(window);
