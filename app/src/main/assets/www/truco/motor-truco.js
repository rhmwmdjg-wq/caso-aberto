/* =========================================================
   TRUCO — Motor do jogo (roda só no celular do ANFITRIÃO)
   Regras: Truco Mineiro (manilhas fixas) ou Truco Paulista (vira).
   4 lugares em duas duplas: lugares 0 e 2 = dupla "Nós/A", 1 e 3 = dupla "B".
   ========================================================= */
(function (global) {
  "use strict";

  var ORDEM = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"];
  var NAIPES = ["O", "E", "C", "P"]; // ouros, espadas, copas, paus (ordem de força das manilhas no paulista)
  var REGRAS = {
    mineiro: { nome: "Truco Mineiro", alvo: 12, valores: [2, 4, 6, 10, 12], maoEspecial: 10, valorEspecial: 4, fugaEspecial: 2 },
    paulista: { nome: "Truco Paulista", alvo: 12, valores: [1, 3, 6, 9, 12], maoEspecial: 11, valorEspecial: 3, fugaEspecial: 1 }
  };
  var NOMES_PEDIDO = { 1: "", 2: "", 3: "TRUCO", 4: "TRUCO", 6: "SEIS", 9: "NOVE", 10: "NOVE", 12: "DOZE" };
  var PALAVRA = { TRUCO: "truco", SEIS: "seis", NOVE: "nove", DOZE: "doze" };

  var PERSONAGENS = [
    { id: "tiao", nome: "Seu Tião", desc: "Fazendeiro das antigas. Não corre de truco nem de chuva." },
    { id: "ze", nome: "Zé do Pequi", desc: "Vende pequi na beira da estrada e grita mais que todo mundo." },
    { id: "lurdinha", nome: "Dona Lurdinha", desc: "Dona do boteco. Conhece o blefe de cada freguês." },
    { id: "bene", nome: "Bené Vaqueiro", desc: "Gibão de couro, fala pouco e pede seis sem piscar." },
    { id: "toinho", nome: "Toinho Barranqueiro", desc: "Pescador do Velho Chico. Paciente como o rio." },
    { id: "cida", nome: "Cida Benzedeira", desc: "Benze o baralho antes de cada mão. Dizem que funciona." },
    { id: "juca", nome: "Juca Sanfoneiro", desc: "Toca no forró de sábado e truca no domingo." },
    { id: "rosinha", nome: "Rosinha do Forró", desc: "Rainha do arrasta-pé e do blefe de doze." }
  ];
  var NOMES_ROBOS = ["Robô Tonho", "Robô Dita", "Robô Vavá", "Robô Quinha", "Robô Bastião", "Robô Nena"];

  function embaralhar(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function baralho() { var b = []; ORDEM.forEach(function (r) { NAIPES.forEach(function (n) { b.push(r + n); }); }); return b; }
  function time(lugar) { return lugar % 2; }

  function Truco(opts) {
    opts = opts || {};
    this.agora = opts.agora || function () { return Date.now(); };
    this.rand = opts.rand || Math.random;
    this.s = opts.estado || {
      codigo: opts.codigo || "", fase: "lobby", hostId: null,
      jogadores: {}, assentos: [null, null, null, null],
      config: { regra: "mineiro", cenario: "boteco", tento: "milho" },
      placar: [0, 0], partidas: [0, 0], mao: null, chat: [], eventos: [], seq: 1, distribuidor: 3
    };
  }
  Truco.PERSONAGENS = PERSONAGENS;
  Truco.REGRAS = REGRAS;
  var P = Truco.prototype;

  P.novoId = function (p) { return p + (this.s.seq++); };
  P.nome = function (id) { var j = this.s.jogadores[id]; return j ? j.nome : "?"; };
  P.regra = function () { return REGRAS[this.s.config.regra] || REGRAS.mineiro; };
  P.lugarDe = function (id) { return this.s.assentos.indexOf(id); };
  P.sistema = function (texto) { this.s.chat.push({ id: this.novoId("c"), sistema: true, texto: texto, ts: this.agora() }); if (this.s.chat.length > 120) this.s.chat.shift(); };
  P.evento = function (e) { e.id = this.novoId("e"); e.ts = this.agora(); this.s.eventos.push(e); if (this.s.eventos.length > 40) this.s.eventos.shift(); };
  P.ehRobo = function (id) { var j = this.s.jogadores[id]; return !!(j && j.robo); };

  /* ---------------- Força das cartas ---------------- */
  P.forca = function (c) {
    var m = this.s.mao, r = c.slice(0, -1), n = c.slice(-1);
    if (this.s.config.regra === "paulista") {
      var vira = m && m.vira, manilha = vira ? ORDEM[(ORDEM.indexOf(vira.slice(0, -1)) + 1) % 10] : null;
      if (r === manilha) return 10 + NAIPES.indexOf(n);
      return ORDEM.indexOf(r);
    }
    if (c === "4P") return 13; // zap
    if (c === "7C") return 12; // sete de copas
    if (c === "AE") return 11; // espadilha
    if (c === "7O") return 10; // pica-fumo
    return ORDEM.indexOf(r);
  };
  P.ehManilha = function (c) { return this.forca(c) >= 10; };

  /* ---------------- Sala ---------------- */
  P.entrar = function (token, nome, ehHost) {
    var s = this.s;
    nome = String(nome || "").trim().slice(0, 18) || "Jogador";
    for (var id in s.jogadores) if (token && s.jogadores[id].token === token) { s.jogadores[id].online = true; return { ok: true, id: id }; }
    var humanos = Object.keys(s.jogadores).filter(function (k) { return !s.jogadores[k].robo; }).length;
    if (humanos >= 4) return { ok: false, erro: "A mesa já está cheia (4 jogadores)." };
    if (s.fase !== "lobby" && s.assentos.indexOf(null) < 0 && !this.temRoboSentado()) return { ok: false, erro: "A partida já começou e a mesa está cheia." };
    var usados = Object.keys(s.jogadores).map(function (k) { return s.jogadores[k].nome.toLowerCase(); });
    var base = nome, n = 2;
    while (usados.indexOf(nome.toLowerCase()) >= 0) nome = base + " " + n++;
    var nid = this.novoId("j");
    s.jogadores[nid] = { id: nid, nome: nome, token: token, online: true, robo: false, personagem: null };
    if (ehHost) s.hostId = nid;
    // senta no primeiro lugar livre (ou no lugar de um robô, se a partida já começou)
    var livre = s.assentos.indexOf(null);
    if (livre >= 0) s.assentos[livre] = nid;
    else if (s.fase !== "lobby") this.trocarRoboPorGente(nid);
    if (!ehHost) this.sistema(nome + " chegou na mesa.");
    return { ok: true, id: nid };
  };
  P.temRoboSentado = function () { var self = this; return this.s.assentos.some(function (id) { return id && self.ehRobo(id); }); };
  P.trocarRoboPorGente = function (nid) {
    var s = this.s, self = this;
    for (var i = 0; i < 4; i++) {
      var id = s.assentos[i];
      if (id && self.ehRobo(id)) {
        s.jogadores[nid].personagem = s.jogadores[id].personagem;
        delete s.jogadores[id];
        s.assentos[i] = nid;
        this.sistema(s.jogadores[nid].nome + " entrou no lugar de um robô.");
        return true;
      }
    }
    return false;
  };
  P.desconectar = function (id) {
    var j = this.s.jogadores[id];
    if (!j) return;
    j.online = false;
    if (this.s.fase === "lobby" && id !== this.s.hostId) {
      var l = this.lugarDe(id); if (l >= 0) this.s.assentos[l] = null;
      delete this.s.jogadores[id];
      this.sistema(j.nome + " saiu da mesa.");
    }
  };
  P.personagensUsados = function () { var s = this.s; return Object.keys(s.jogadores).map(function (k) { return s.jogadores[k].personagem; }).filter(Boolean); };

  P.acao = function (jid, a) {
    var s = this.s, j = s.jogadores[jid];
    if (!j) return { ok: false, erro: "Jogador desconhecido." };
    var ehHost = jid === s.hostId;
    switch (a && a.tipo) {
      case "chat": {
        var t = String(a.texto || "").trim().slice(0, 200);
        if (!t) return { ok: false };
        s.chat.push({ id: this.novoId("c"), autorId: jid, autor: j.nome, texto: t, ts: this.agora() });
        if (s.chat.length > 120) s.chat.shift();
        this.evento({ tipo: "chat", jid: jid });
        return { ok: true };
      }
      case "personagem": {
        if (!PERSONAGENS.some(function (p) { return p.id === a.id; })) return { ok: false };
        if (this.personagensUsados().indexOf(a.id) >= 0 && j.personagem !== a.id) return { ok: false, erro: "Esse personagem já foi escolhido por outro jogador." };
        j.personagem = a.id;
        return { ok: true };
      }
      case "sentar": {
        if (s.fase !== "lobby") return { ok: false, erro: "A partida já começou." };
        var l = Number(a.lugar);
        if (!(l >= 0 && l < 4)) return { ok: false };
        var ocupante = s.assentos[l];
        if (ocupante && !this.ehRobo(ocupante)) return { ok: false, erro: "Esse lugar já tem dono." };
        if (ocupante) { delete s.jogadores[ocupante]; }
        var atual = this.lugarDe(jid);
        if (atual >= 0) s.assentos[atual] = null;
        s.assentos[l] = jid;
        return { ok: true };
      }
      case "config": {
        if (!ehHost || s.fase !== "lobby") return { ok: false, erro: "Só o anfitrião muda as regras, antes de começar." };
        if (a.regra && REGRAS[a.regra]) s.config.regra = a.regra;
        if (a.cenario) s.config.cenario = String(a.cenario).slice(0, 20);
        if (a.tento === "milho" || a.tento === "feijao") s.config.tento = a.tento;
        return { ok: true };
      }
      case "cenario": { // dá para trocar o cenário no meio do jogo também
        if (!ehHost) return { ok: false };
        s.config.cenario = String(a.cenario || "").slice(0, 20);
        return { ok: true };
      }
      case "robos": {
        if (!ehHost || s.fase !== "lobby") return { ok: false };
        this.completarComRobos();
        return { ok: true };
      }
      case "tirarRobo": {
        if (!ehHost || s.fase !== "lobby") return { ok: false };
        var rid = s.assentos[Number(a.lugar)];
        if (rid && this.ehRobo(rid)) { delete s.jogadores[rid]; s.assentos[Number(a.lugar)] = null; }
        return { ok: true };
      }
      case "iniciar": return ehHost ? this.iniciar() : { ok: false, erro: "Só o anfitrião começa." };
      case "jogar": return this.jogar(jid, a.carta, !!a.coberta);
      case "truco": return this.pedirTruco(jid);
      case "responder": return this.responder(jid, a.resposta);
      case "maoEspecial": return this.decidirMaoEspecial(jid, a.jogar);
      case "novaPartida": return ehHost ? this.novaPartida() : { ok: false };
      case "voltarLobby": return ehHost ? this.voltarLobby() : { ok: false };
    }
    return { ok: false, erro: "Ação inválida." };
  };

  P.completarComRobos = function () {
    var s = this.s, nomes = embaralhar(NOMES_ROBOS, this.rand), k = 0, self = this;
    for (var i = 0; i < 4; i++) {
      if (s.assentos[i]) continue;
      var livres = PERSONAGENS.map(function (p) { return p.id; }).filter(function (p) { return self.personagensUsados().indexOf(p) < 0; });
      var id = this.novoId("r");
      s.jogadores[id] = { id: id, nome: nomes[k++] || "Robô", token: null, online: true, robo: true, personagem: livres[Math.floor(this.rand() * livres.length)] || null };
      s.assentos[i] = id;
    }
  };

  P.iniciar = function () {
    var s = this.s, self = this;
    if (s.fase !== "lobby") return { ok: false };
    if (s.assentos.indexOf(null) >= 0) return { ok: false, erro: "Faltam lugares na mesa. Chame mais gente ou complete com robôs." };
    var sem = s.assentos.filter(function (id) { return !s.jogadores[id].personagem; }).map(function (id) { return s.jogadores[id].nome; });
    if (sem.length) return { ok: false, erro: "Falta escolher personagem: " + sem.join(", ") + "." };
    s.placar = [0, 0];
    s.fase = "jogo";
    s.distribuidor = Math.floor(this.rand() * 4);
    this.sistema("Começou o " + this.regra().nome + "! Partida até " + this.regra().alvo + " tentos.");
    this.novaMao();
    return { ok: true };
  };

  P.novaMao = function () {
    var s = this.s, R = this.regra();
    s.distribuidor = (s.distribuidor + 1) % 4;
    var cartas = embaralhar(baralho(), this.rand);
    var maos = [[], [], [], []];
    for (var r = 0; r < 3; r++) for (var i = 1; i <= 4; i++) maos[(s.distribuidor + i) % 4].push(cartas.pop());
    var primeiro = (s.distribuidor + 1) % 4;
    s.mao = {
      num: (s.mao ? s.mao.num : 0) + 1,
      maos: maos, vira: s.config.regra === "paulista" ? cartas.pop() : null,
      mesa: [], vazas: [], inicio: primeiro, vez: primeiro,
      valor: R.valores[0], ultimoAumento: -1, pedido: null, especial: null, fim: null, jogadas: []
    };
    // mão de 10 (mineiro) / mão de 11 (paulista)
    var lim = R.maoEspecial, a = s.placar[0] === lim, b = s.placar[1] === lim;
    if (a && b) { s.mao.ferro = true; this.sistema("Mão de ferro: as duas duplas estão com " + lim + ". Sem truco nesta mão!"); }
    else if (a || b) {
      s.mao.especial = { time: a ? 0 : 1, decidido: false };
      this.sistema("Mão de " + lim + ": a dupla com " + lim + " tentos vê as cartas do parceiro e decide se joga (vale " + R.valorEspecial + ") ou corre.");
    }
    this.evento({ tipo: "distribuir", distribuidor: s.distribuidor, num: s.mao.num });
  };

  /* ---------------- Jogadas ---------------- */
  P.podeAgir = function (jid) {
    var s = this.s, m = s.mao;
    if (s.fase !== "jogo" || !m || m.fim) return "Agora não.";
    if (m.especial && !m.especial.decidido) return "Esperando a decisão da mão de " + this.regra().maoEspecial + ".";
    if (m.pedido) return "Esperando a resposta do pedido.";
    if (this.lugarDe(jid) !== m.vez) return "Não é a sua vez.";
    return null;
  };

  P.jogar = function (jid, carta, coberta) {
    var s = this.s, m = s.mao, erro = this.podeAgir(jid);
    if (erro) return { ok: false, erro: erro };
    var l = this.lugarDe(jid), mao = m.maos[l], i = mao.indexOf(carta);
    if (i < 0) return { ok: false, erro: "Essa carta não está na sua mão." };
    // carta coberta (escondida) só a partir da segunda vaza, e não vale nada
    if (coberta && m.vazas.length === 0) return { ok: false, erro: "Só dá para jogar coberta a partir da segunda rodada." };
    mao.splice(i, 1);
    m.mesa.push({ lugar: l, carta: carta, coberta: !!coberta });
    m.jogadas.push({ lugar: l, carta: carta, coberta: !!coberta, vaza: m.vazas.length });
    this.evento({ tipo: "jogou", lugar: l, carta: coberta ? null : carta });
    if (m.mesa.length < 4) { m.vez = (l + 1) % 4; return { ok: true }; }
    this.fecharVaza();
    return { ok: true };
  };

  P.fecharVaza = function () {
    var s = this.s, m = s.mao, self = this;
    var max = -1;
    m.mesa.forEach(function (j) { var f = j.coberta ? -1 : self.forca(j.carta); if (f > max) max = f; });
    var melhores = m.mesa.filter(function (j) { return !j.coberta && self.forca(j.carta) === max; });
    var times = {};
    melhores.forEach(function (j) { times[time(j.lugar)] = true; });
    var empate = Object.keys(times).length > 1;
    var vaza = { time: empate ? -1 : time(melhores[0].lugar), lugar: melhores[0].lugar, cartas: m.mesa.slice() };
    m.vazas.push(vaza);
    m.mesaAnterior = m.mesa;
    m.mesa = [];
    m.inicio = vaza.lugar;
    m.vez = vaza.lugar;
    this.evento({ tipo: "vaza", time: vaza.time, lugar: vaza.lugar, n: m.vazas.length });
    var venc = this.vencedorDaMao();
    if (venc !== null) this.encerrarMao(venc, m.valor, "vazas");
  };

  // null = continua; 0/1 = dupla vencedora
  P.vencedorDaMao = function () {
    var v = this.s.mao.vazas.map(function (x) { return x.time; });
    var c = [0, 0];
    v.forEach(function (t) { if (t >= 0) c[t]++; });
    if (c[0] >= 2) return 0;
    if (c[1] >= 2) return 1;
    if (v.length === 2) {
      if (v[0] === -1 && v[1] >= 0) return v[1];
      if (v[0] >= 0 && v[1] === -1) return v[0];
      return null;
    }
    if (v.length === 3) {
      if (v[2] >= 0) return v[2];
      var primeiro = v[0] >= 0 ? v[0] : v[1];
      if (primeiro >= 0) return primeiro;
      return time((this.s.distribuidor + 1) % 4); // tudo empatado: ganha a dupla do "mão"
    }
    return null;
  };

  P.encerrarMao = function (timeVenc, pontos, motivo) {
    var s = this.s, m = s.mao, R = this.regra();
    if (m.fim) return;
    s.placar[timeVenc] += pontos;
    m.fim = { time: timeVenc, pontos: pontos, motivo: motivo };
    m.pedido = null;
    this.evento({ tipo: "fimMao", time: timeVenc, pontos: pontos, motivo: motivo });
    var nomes = this.nomesDupla(timeVenc);
    this.sistema(nomes + " " + (motivo === "correu" ? "levaram (a outra dupla correu)" : "ganharam a mão") + ": +" + pontos + " tento" + (pontos > 1 ? "s" : "") + ".");
    if (s.placar[timeVenc] >= R.alvo) {
      s.placar[timeVenc] = Math.max(s.placar[timeVenc], R.alvo);
      s.partidas[timeVenc]++;
      s.fase = "fim";
      s.vencedor = timeVenc;
      this.evento({ tipo: "fimPartida", time: timeVenc });
      this.sistema("🏆 " + nomes + " venceram a partida!");
    }
  };
  P.nomesDupla = function (t) { var s = this.s, self = this; return [s.assentos[t], s.assentos[t + 2]].map(function (id) { return self.nome(id); }).join(" e "); };

  // chamado pelo app depois de uma pausa, para todo mundo ver as cartas da última vaza
  P.proximaMao = function () {
    var s = this.s;
    if (s.fase !== "jogo" || !s.mao || !s.mao.fim) return false;
    this.novaMao();
    return true;
  };

  /* ---------------- Truco, seis, nove, doze ---------------- */
  P.proximoValor = function () {
    var m = this.s.mao, vs = this.regra().valores, base = m.pedido ? m.pedido.valor : m.valor;
    var i = vs.indexOf(base);
    return i >= 0 && i < vs.length - 1 ? vs[i + 1] : null;
  };
  P.podeTrucar = function (jid) {
    var s = this.s, m = s.mao;
    if (s.fase !== "jogo" || !m || m.fim || m.pedido || m.ferro) return false;
    if (m.especial) return false;
    var l = this.lugarDe(jid);
    if (l !== m.vez) return false;
    if (m.ultimoAumento === time(l)) return false;
    return this.proximoValor() !== null;
  };
  P.pedirTruco = function (jid) {
    var s = this.s, m = s.mao;
    if (!this.podeTrucar(jid)) return { ok: false, erro: m && m.especial ? "Na mão de " + this.regra().maoEspecial + " não tem truco." : m && m.ferro ? "Na mão de ferro não tem truco." : "Agora não dá para pedir." };
    var l = this.lugarDe(jid), v = this.proximoValor(), nome = NOMES_PEDIDO[v];
    m.pedido = { valor: v, deTime: time(l), deLugar: l, anterior: m.valor, respostas: {} };
    this.evento({ tipo: "grito", lugar: l, jid: jid, palavra: PALAVRA[nome], texto: nome + "!" });
    return { ok: true };
  };
  P.responder = function (jid, resp) {
    var s = this.s, m = s.mao;
    if (!m || !m.pedido || m.fim) return { ok: false, erro: "Não há pedido para responder." };
    var l = this.lugarDe(jid), pe = m.pedido;
    if (l < 0 || time(l) === pe.deTime) return { ok: false, erro: "Quem responde é a outra dupla." };
    if (resp === "aceito") {
      m.valor = pe.valor; m.ultimoAumento = pe.deTime; m.pedido = null;
      this.evento({ tipo: "grito", lugar: l, jid: jid, palavra: "aceito", texto: "DESCE!" });
      this.sistema(this.nome(jid) + " aceitou. A mão vale " + m.valor + ".");
      return { ok: true };
    }
    if (resp === "corro") {
      this.evento({ tipo: "grito", lugar: l, jid: jid, palavra: "corro", texto: "CORRI!" });
      this.encerrarMao(pe.deTime, pe.anterior, "correu");
      return { ok: true };
    }
    if (resp === "aumento") {
      var vs = this.regra().valores, i = vs.indexOf(pe.valor);
      if (i < 0 || i >= vs.length - 1) return { ok: false, erro: "Não dá para aumentar mais." };
      var nv = vs[i + 1], nome = NOMES_PEDIDO[nv];
      m.valor = pe.valor;           // aumentar = aceitar o pedido anterior
      m.ultimoAumento = pe.deTime;
      m.pedido = { valor: nv, deTime: time(l), deLugar: l, anterior: pe.valor, respostas: {} };
      this.evento({ tipo: "grito", lugar: l, jid: jid, palavra: PALAVRA[nome], texto: nome + "!" });
      return { ok: true };
    }
    return { ok: false };
  };

  // mão de 10/11: a dupla decide se joga ou corre
  P.decidirMaoEspecial = function (jid, jogar) {
    var s = this.s, m = s.mao, R = this.regra();
    if (!m || !m.especial || m.especial.decidido) return { ok: false };
    var l = this.lugarDe(jid);
    if (time(l) !== m.especial.time) return { ok: false, erro: "Quem decide é a dupla da mão de " + R.maoEspecial + "." };
    m.especial.decidido = true;
    if (jogar) {
      m.valor = R.valorEspecial;
      this.evento({ tipo: "grito", lugar: l, jid: jid, palavra: "aceito", texto: "VAMO!" });
      this.sistema(this.nome(jid) + " decidiu jogar a mão de " + R.maoEspecial + ". Vale " + m.valor + ".");
    } else {
      this.evento({ tipo: "grito", lugar: l, jid: jid, palavra: "corro", texto: "CORRI!" });
      this.encerrarMao(1 - m.especial.time, R.fugaEspecial, "correu");
    }
    return { ok: true };
  };

  P.novaPartida = function () {
    var s = this.s;
    if (s.fase !== "fim") return { ok: false };
    s.placar = [0, 0]; s.fase = "jogo"; s.vencedor = null; s.mao = null;
    this.sistema("Nova partida!");
    this.novaMao();
    return { ok: true };
  };
  P.voltarLobby = function () {
    var s = this.s, self = this;
    s.fase = "lobby"; s.mao = null; s.placar = [0, 0];
    Object.keys(s.jogadores).forEach(function (id) { if (!s.jogadores[id].online && !self.ehRobo(id) && id !== s.hostId) { var l = self.lugarDe(id); if (l >= 0) s.assentos[l] = null; delete s.jogadores[id]; } });
    return { ok: true };
  };

  /* ---------------- Robôs ---------------- */
  P.forcaMao = function (lugar) {
    var self = this, cs = this.s.mao.maos[lugar].map(function (c) { return self.forca(c); }).sort(function (a, b) { return b - a; });
    var pts = 0;
    cs.forEach(function (f, i) { pts += (f >= 10 ? 4 + (f - 10) : f >= 8 ? 2.2 : f >= 6 ? 1 : 0.2) * (i === 0 ? 1.2 : 1); });
    var m = this.s.mao, minhas = m.vazas.filter(function (v) { return v.time === time(lugar); }).length;
    var deles = m.vazas.filter(function (v) { return v.time === 1 - time(lugar); }).length;
    return pts + minhas * 3 - deles * 3;
  };
  // Devolve a próxima ação de um robô (ou null). Quem chama aplica com this.acao().
  P.planoRobo = function () {
    var s = this.s, m = s.mao, self = this, rand = this.rand;
    if (s.fase !== "jogo" || !m || m.fim) return null;
    function robosDoTime(t) { return [t, t + 2].filter(function (l) { var id = s.assentos[l]; return self.ehRobo(id) || !s.jogadores[id].online; }); }
    function humanoOnlineNoTime(t) { return [t, t + 2].some(function (l) { var id = s.assentos[l]; return !self.ehRobo(id) && s.jogadores[id].online; }); }
    // mão de 10/11
    if (m.especial && !m.especial.decidido) {
      var t = m.especial.time;
      if (humanoOnlineNoTime(t)) return null;
      var l0 = robosDoTime(t)[0], f = this.forcaMao(l0) + this.forcaMao(l0 === t ? t + 2 : t) * 0.6;
      return { lugar: l0, a: { tipo: "maoEspecial", jogar: f > 7 || rand() < 0.25 } };
    }
    // responder pedido
    if (m.pedido) {
      var tr = 1 - m.pedido.deTime;
      if (humanoOnlineNoTime(tr)) return null;
      var lr = robosDoTime(tr)[0], fr = this.forcaMao(lr) + this.forcaMao((lr + 2) % 4) * 0.5;
      var exige = { 3: 3.5, 4: 3.5, 6: 5.5, 9: 7, 10: 7, 12: 8.5 }[m.pedido.valor] || 5;
      var resp = fr >= exige + 4 && this.proximoValor() !== null && rand() < 0.5 ? "aumento" : (fr >= exige || rand() < 0.12) ? "aceito" : "corro";
      return { lugar: lr, a: { tipo: "responder", resposta: resp } };
    }
    if (m.especial && !m.especial.decidido) return null;
    var lv = m.vez, id = s.assentos[lv];
    if (!(this.ehRobo(id) || !s.jogadores[id].online)) return null;
    // pedir truco?
    if (this.podeTrucar(id)) {
      var fm = this.forcaMao(lv);
      if ((fm > 9 && rand() < 0.45) || (fm > 6 && rand() < 0.15) || rand() < 0.04) return { lugar: lv, a: { tipo: "truco" } };
    }
    return { lugar: lv, a: { tipo: "jogar", carta: this.escolherCarta(lv) } };
  };
  P.escolherCarta = function (lugar) {
    var m = this.s.mao, self = this;
    var cs = m.maos[lugar].slice().sort(function (a, b) { return self.forca(a) - self.forca(b); });
    if (!m.mesa.length) {
      // abre a rodada: na primeira vaza joga a do meio; depois, a mais forte se precisa ganhar
      if (cs.length === 3) return cs[1];
      return cs[cs.length - 1];
    }
    var max = -1, dono = -1;
    m.mesa.forEach(function (j) { var f = j.coberta ? -1 : self.forca(j.carta); if (f > max) { max = f; dono = j.lugar; } });
    if (dono >= 0 && time(dono) === time(lugar)) return cs[0]; // parceiro ganhando: joga a menor
    for (var i = 0; i < cs.length; i++) if (self.forca(cs[i]) > max) return cs[i]; // menor que ganha
    return cs[0];
  };

  /* ---------------- Visão de cada jogador ---------------- */
  P.visao = function (jid) {
    var s = this.s, m = s.mao, self = this, eu = this.lugarDe(jid), R = this.regra();
    var v = {
      jogo: "truco", codigo: s.codigo, fase: s.fase, meuId: jid, hostId: s.hostId, souHost: jid === s.hostId, meuLugar: eu,
      config: s.config, regra: { id: s.config.regra, nome: R.nome, alvo: R.alvo, maoEspecial: R.maoEspecial },
      placar: s.placar, partidas: s.partidas, vencedor: s.vencedor,
      chat: s.chat.slice(-60), eventos: s.eventos.slice(-20), agora: this.agora(),
      personagensUsados: this.personagensUsados(),
      jogadores: Object.keys(s.jogadores).map(function (id) { var j = s.jogadores[id]; return { id: id, nome: j.nome, robo: !!j.robo, online: j.online, personagem: j.personagem, lugar: self.lugarDe(id) }; }),
      assentos: s.assentos.map(function (id, l) {
        if (!id) return null;
        var j = s.jogadores[id];
        return { id: id, nome: j.nome, robo: !!j.robo, online: j.online, personagem: j.personagem, cartas: m ? m.maos[l].length : 0 };
      })
    };
    if (m) {
      var meuTime = eu >= 0 ? time(eu) : -1;
      v.mao = {
        num: m.num, vira: m.vira, distribuidor: s.distribuidor,
        mesa: m.mesa.map(function (j) { return { lugar: j.lugar, carta: j.coberta ? null : j.carta, coberta: j.coberta }; }),
        ultimaVaza: m.mesaAnterior && m.mesa.length === 0 ? m.mesaAnterior.map(function (j) { return { lugar: j.lugar, carta: j.coberta ? null : j.carta, coberta: j.coberta }; }) : null,
        vazas: m.vazas.map(function (x) { return { time: x.time, lugar: x.lugar }; }),
        vez: m.vez, valor: m.valor, proximoValor: m.fim ? null : this.proximoValor(),
        nomeProximo: NOMES_PEDIDO[this.proximoValor()] || "",
        pedido: m.pedido ? { valor: m.pedido.valor, nome: NOMES_PEDIDO[m.pedido.valor], deTime: m.pedido.deTime, deLugar: m.pedido.deLugar, nomeAumento: NOMES_PEDIDO[this.proximoValor()] || "" } : null,
        especial: m.especial, ferro: !!m.ferro, fim: m.fim,
        minhasCartas: eu >= 0 ? m.maos[eu].slice() : [],
        podeTruco: eu >= 0 && this.podeTrucar(jid),
        possoResponder: !!(m.pedido && eu >= 0 && time(eu) !== m.pedido.deTime && !m.fim),
        possoDecidirEspecial: !!(m.especial && !m.especial.decidido && eu >= 0 && time(eu) === m.especial.time),
        manilhas: s.config.regra === "paulista" && m.vira ? ORDEM[(ORDEM.indexOf(m.vira.slice(0, -1)) + 1) % 10] : null
      };
      // na mão de 10/11, a dupla vê as cartas do parceiro
      if (m.especial && meuTime === m.especial.time && !m.especial.decidido) v.mao.cartasParceiro = m.maos[(eu + 2) % 4].slice();
      if (eu >= 0) v.mao.forcas = v.mao.minhasCartas.map(function (c) { return self.forca(c); });
      if (m.fim) v.mao.reveladas = m.jogadas.map(function (j) { return { lugar: j.lugar, carta: j.carta, vaza: j.vaza }; });
    }
    return v;
  };
  P.exportar = function () { return JSON.parse(JSON.stringify(this.s)); };

  global.Truco = Truco;
  if (typeof module !== "undefined") module.exports = Truco;
})(typeof window !== "undefined" ? window : globalThis);
