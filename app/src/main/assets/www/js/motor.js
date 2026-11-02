/* =========================================================
   CASO ABERTO — Motor do jogo
   Roda só no celular do ANFITRIÃO. Guarda o estado completo
   e monta, para cada jogador, apenas o que ele pode ver.
   ========================================================= */
(function (global) {
  "use strict";

  var MAX_JOGADORES = 7;
  var TOTAL_RODADAS = 4;
  var MAX_PLANTADAS = 2;
  var MAX_FOTOS = 2;

  function embaralhar(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function Motor(opts) {
    opts = opts || {};
    this.casos = opts.casos;
    this.esps = opts.especialidades;
    this.agora = opts.agora || function () { return Date.now(); };
    this.rand = opts.rand || Math.random;
    this.s = opts.estado || {
      codigo: opts.codigo || "",
      fase: "lobby",
      hostId: null,
      jogadores: {},
      ordem: [],
      config: { casoId: this.casos[0].id, nivel: this.casos[0].dificuldade, treino: false, tempoRodada: 0, solo: false, robos: false },
      partida: null,
      chat: [],
      seq: 1,
      partidasJogadas: 0
    };
  }

  Motor.MAX_JOGADORES = MAX_JOGADORES;
  Motor.NIVEIS = ["Fácil", "Médio", "Difícil"];
  Motor.TOTAL_RODADAS = TOTAL_RODADAS;

  var P = Motor.prototype;

  P.caso = function (id) {
    id = id || (this.s.partida ? this.s.partida.casoId : this.s.config.casoId);
    for (var i = 0; i < this.casos.length; i++) if (this.casos[i].id === id) return this.casos[i];
    return this.casos[0];
  };
  P.casosDoNivel = function (nivel) { return this.casos.filter(function (c) { return c.dificuldade === nivel; }); };
  P.definirNivel = function (nivel) {
    if (Motor.NIVEIS.indexOf(nivel) < 0) return false;
    var lista = this.casosDoNivel(nivel);
    if (!lista.length) return false;
    this.s.config.nivel = nivel;
    if (this.caso(this.s.config.casoId).dificuldade !== nivel) this.s.config.casoId = lista[0].id;
    return true;
  };
  P.esp = function (id) {
    for (var i = 0; i < this.esps.length; i++) if (this.esps[i].id === id) return this.esps[i];
    return null;
  };
  P.novoId = function (prefixo) { return prefixo + (this.s.seq++); };
  P.nome = function (id) { var j = this.s.jogadores[id]; return j ? j.nome : "?"; };

  /* ---------------- Entrada / saída ---------------- */
  P.entrar = function (token, nome, ehHost) {
    var s = this.s;
    nome = String(nome || "").trim().slice(0, 18) || "Detetive";
    for (var k in s.jogadores) {
      if (s.jogadores[k].token === token) {
        if (!s.jogadores[k].online && s.fase !== "lobby") this.sistema(nome + " voltou para a sala.");
        s.jogadores[k].online = true;
        s.jogadores[k].nome = nome;
        return { ok: true, id: k };
      }
    }
    if (s.fase !== "lobby") return { ok: false, erro: "A partida já começou. Espere terminar para entrar." };
    if (s.ordem.length >= MAX_JOGADORES) return { ok: false, erro: "A sala está cheia (máximo " + MAX_JOGADORES + " jogadores)." };
    var usados = s.ordem.map(function (i) { return s.jogadores[i].nome.toLowerCase(); });
    var base = nome, n = 2;
    while (usados.indexOf(nome.toLowerCase()) >= 0) { nome = base + " " + n; n++; }
    var id = this.novoId("j");
    s.jogadores[id] = { id: id, nome: nome, token: token, online: true, pontos: 0, pronto: false };
    s.ordem.push(id);
    if (ehHost || !s.hostId) s.hostId = id;
    this.sistema(nome + " entrou na sala.");
    return { ok: true, id: id };
  };

  P.desconectar = function (id) {
    var j = this.s.jogadores[id];
    if (!j || !j.online) return;
    j.online = false;
    if (this.s.fase !== "lobby") this.sistema(j.nome + " perdeu a conexão. A partida continua; quando voltar, tudo estará como deixou.");
    if (this.s.fase === "lobby") {
      // No lobby, quem sai é removido de vez.
      delete this.s.jogadores[id];
      this.s.ordem = this.s.ordem.filter(function (x) { return x !== id; });
      this.sistema(j.nome + " saiu da sala.");
    }
  };

  P.sistema = function (texto) {
    this.s.chat.push({ id: this.novoId("c"), sistema: true, texto: texto, ts: this.agora() });
    if (this.s.chat.length > 150) this.s.chat.shift();
  };

  /* ---------------- Ações ---------------- */
  // Retorna { ok:true } ou { ok:false, erro:"..." }
  P.acao = function (jid, a) {
    var s = this.s, j = s.jogadores[jid];
    if (!j) return { ok: false, erro: "Jogador desconhecido." };
    var ehHost = jid === s.hostId;
    var p = s.partida;
    switch (a && a.tipo) {
      case "chat": {
        var t = String(a.texto || "").trim().slice(0, 300);
        if (!t) return { ok: false };
        s.chat.push({ id: this.novoId("c"), autorId: jid, autor: j.nome, texto: t, ts: this.agora() });
        if (s.chat.length > 150) s.chat.shift();
        return { ok: true };
      }
      case "config": {
        if (!ehHost || s.fase !== "lobby") return { ok: false, erro: "Só o anfitrião muda as regras." };
        if (typeof a.nivel === "string") this.definirNivel(a.nivel);
        if (a.casoId && this.caso(a.casoId).id === a.casoId) { s.config.casoId = a.casoId; s.config.nivel = this.caso(a.casoId).dificuldade; }
        if (typeof a.treino === "boolean") { s.config.treino = a.treino; if (a.treino) s.config.robos = false; }
        if (typeof a.robos === "boolean") { s.config.robos = a.robos; if (a.robos) s.config.treino = false; }
        if (typeof a.tempoRodada === "number") s.config.tempoRodada = Math.max(0, Math.min(900, a.tempoRodada | 0));
        return { ok: true };
      }
      case "remover": {
        if (!ehHost || s.fase !== "lobby" || a.id === jid) return { ok: false };
        var alvo = s.jogadores[a.id];
        if (!alvo) return { ok: false };
        delete s.jogadores[a.id];
        s.ordem = s.ordem.filter(function (x) { return x !== a.id; });
        this.sistema(alvo.nome + " foi removido da sala.");
        return { ok: true, removido: a.id };
      }
      case "iniciar": return ehHost ? this.iniciar() : { ok: false, erro: "Só o anfitrião inicia." };
      case "avancar": return ehHost ? this.avancar() : { ok: false, erro: "Só o anfitrião avança." };
      case "encerrarVotacao": return ehHost && s.fase === "votacao" ? this.resolver() : { ok: false };
      case "novaPartida": return ehHost ? this.novaPartida() : { ok: false };
      case "pronto": {
        if (s.fase !== "intro") return { ok: false };
        j.pronto = true;
        return { ok: true };
      }
      case "investigar": return this.investigar(jid, a);
      case "publicar": return this.publicar(jid, a.pid);
      case "confirmar": return this.confirmar(jid, a.itemId);
      case "plantar": return this.plantar(jid, a.texto, a.origem);
      case "votar": return this.votar(jid, a);
      case "fotografar": return this.fotografar(jid, a.itemId);
      case "perguntar": return this.perguntar(jid, a);
      case "mural": return this.muralAcao(jid, a);
      case "pedirPrisao": return this.pedirPrisao(jid, a);
      case "votarPrisao": return this.votarPrisao(jid, !!a.apoio);
    }
    return { ok: false, erro: "Ação inválida." };
  };

  P.comRobos = function () { return !!(this.s.config.solo || this.s.config.robos); };
  P.minimoJogadores = function () { return (this.s.config.treino || this.comRobos()) ? 1 : 3; };

  /* ---------------- Robôs do modo solo ---------------- */
  var NOMES_ROBOS = ["Inspetora Vilma", "Detetive Bento", "Agente Nogueira", "Perita Odete", "Sargento Lauro", "Doutora Ísis", "Cabo Tavares"];
  P.ehRobo = function (id) { var j = this.s.jogadores[id]; return !!(j && j.robo); };
  P.humanos = function () { var s = this.s, self = this; return s.ordem.filter(function (id) { return !self.ehRobo(id); }); };
  P.criarRobos = function (n) {
    var s = this.s, nomes = embaralhar(NOMES_ROBOS, this.rand);
    for (var i = 0; i < n; i++) {
      var id = this.novoId("j");
      s.jogadores[id] = { id: id, nome: nomes[i], token: null, online: true, pontos: 0, pronto: true, robo: true };
      s.ordem.push(id);
    }
  };
  P.removerRobos = function () {
    var s = this.s, self = this;
    s.ordem.slice().forEach(function (id) { if (self.ehRobo(id)) delete s.jogadores[id]; });
    s.ordem = s.ordem.filter(function (id) { return s.jogadores[id]; });
  };
  P.roboFala = function (id, texto) {
    this.s.chat.push({ id: this.novoId("c"), autorId: id, autor: this.nome(id), texto: texto, ts: this.agora() });
    if (this.s.chat.length > 150) this.s.chat.shift();
  };
  function sortear(lista, rand) { return lista[Math.floor(rand() * lista.length)]; }

  // Uma ação de um robô: investiga, publica, confirma, comenta e (se for o Cúmplice) planta pistas falsas.
  // Retorna true se fez alguma coisa.
  P.agirRobo = function (id) {
    var s = this.s, p = s.partida, self = this, rand = this.rand;
    if (!p || s.fase !== "rodada" || !this.ehRobo(id) || (p.acoes[id] || 0) <= 0) return false;
    var caso = this.caso(), vistos = p.vistos[id], cumplice = p.cumpliceId === id;
    var opcoes = [];
    caso.locais.forEach(function (l) { if ((vistos["l:" + l.id] || 0) < l.pistas.length) opcoes.push({ alvo: "local", id: l.id, peso: 3 }); });
    caso.suspeitos.forEach(function (x) { if ((vistos["d:" + x.id] || 0) < caso.depoimentos[x.id].length) opcoes.push({ alvo: "suspeito", id: x.id, peso: 2 }); });
    if (!opcoes.length) { p.acoes[id] = 0; return false; }
    var tot = 0; opcoes.forEach(function (o) { tot += o.peso; });
    var r = rand() * tot, esc = opcoes[0];
    for (var i = 0; i < opcoes.length; i++) { r -= opcoes[i].peso; if (r <= 0) { esc = opcoes[i]; break; } }
    var res = this.investigar(id, { alvo: esc.alvo, id: esc.id });
    if (!res.ok) return false;
    var achado = res.nova;

    // O Cúmplice robô planta as pistas falsas (uma nas rodadas 1-2, outra na 3-4)
    var plantou = p.plantadas[id] || 0;
    var querPlantar = cumplice && plantou < MAX_PLANTADAS && caso.falsas && caso.falsas.length &&
      ((plantou === 0 && (p.rodada >= 2 || rand() < 0.5)) || (plantou === 1 && p.rodada >= 3 && rand() < 0.7) || (plantou === 1 && p.rodada === p.totalRodadas));
    if (querPlantar) {
      var usadas = p.quadro.filter(function (q) { return q.falsa; }).map(function (q) { return q.texto; });
      var livres = caso.falsas.filter(function (f) { return usadas.indexOf(f.texto) < 0; });
      if (livres.length) {
        var f = sortear(livres, rand);
        var loc = caso.locais.filter(function (l) { return l.nome === f.origem; })[0];
        this.plantar(id, f.texto, loc ? loc.icone + " " + loc.nome : f.origem);
        if (rand() < 0.55) this.roboFala(id, sortear(["Olhem o que eu achei. Isso muda tudo!", "Acabei de publicar uma pista importante no quadro.", "Achei uma coisa suspeita. Está no quadro.", "Gente, vejam o quadro. Acho que é isso!", "Mais uma pista no quadro.", "Coloquei no quadro. Alguém viu o mesmo?"], rand));
        return true;
      }
    }

    // Publica a pista verdadeira? Detetives publicam quase sempre; o Cúmplice esconde boa parte.
    if (rand() < (cumplice ? 0.45 : 0.8)) {
      var ok = this.publicar(id, achado.pid);
      if (ok.ok && rand() < 0.55) {
        this.roboFala(id, sortear([
          "Publiquei o que encontrei: " + achado.origem + ".",
          "Coloquei no quadro. Alguém viu o mesmo?",
          "Isso aqui veio de " + achado.origem + ". Vale conferir.",
          "Mais uma pista no quadro.",
          "Olhem o que eu achei. Isso muda tudo!",
          "Gente, vejam o quadro. Acho que é isso!"
        ], rand));
      }
    }

    // Confirma pistas do quadro que também estão no seu caderno
    p.quadro.forEach(function (q) {
      if (!q.novidade && q.pid && q.autorId !== id && q.confirmados.indexOf(id) < 0 && self.temPista(id, q.pid) && rand() < 0.85) q.confirmados.push(id);
    });

    // Detetive honesto desconfia de pista falsa de um lugar que ele examinou
    if (!cumplice) {
      p.quadro.forEach(function (q) {
        if (!q.falsa || q.autorId === id) return;
        p.duvidas = p.duvidas || {};
        var chave = id + ">" + q.id;
        if (p.duvidas[chave]) return;
        var loc = caso.locais.filter(function (l) { return q.origem === l.icone + " " + l.nome; })[0];
        if (loc && (vistos["l:" + loc.id] || 0) > 0 && p.rodada >= 2 && rand() < 0.3) {
          p.duvidas[chave] = true;
          self.roboFala(id, sortear([
            "Estranho… eu examinei " + loc.nome + " e não vi nada disso que " + q.autor + " publicou.",
            "Não consigo confirmar a pista de " + q.autor + ". Eu estive em " + loc.nome + " e não achei isso.",
            "Hum. " + q.autor + " diz que achou isso em " + loc.nome + ", mas eu passei lá e não vi."
          ], rand));
        }
      });
    }
    // O Cúmplice robô também lança dúvida sobre pistas verdadeiras dos outros, para confundir
    if (cumplice && p.rodada >= 2 && rand() < 0.35) {
      var alvos = p.quadro.filter(function (q) { return !q.falsa && !q.novidade && q.autorId && q.autorId !== id; });
      p.duvidas = p.duvidas || {};
      alvos = alvos.filter(function (q) { return !p.duvidas[id + ">" + q.id]; });
      if (alvos.length) {
        var q = sortear(alvos, rand), loc2 = caso.locais.filter(function (l) { return q.origem === l.icone + " " + l.nome; })[0];
        p.duvidas[id + ">" + q.id] = true;
        self.roboFala(id, loc2 ? sortear([
          "Estranho… eu examinei " + loc2.nome + " e não vi nada disso que " + q.autor + " publicou.",
          "Hum. " + q.autor + " diz que achou isso em " + loc2.nome + ", mas eu passei lá e não vi."
        ], rand) : sortear(["Não sei se dá para confiar na pista de " + q.autor + ".", "Essa história de " + q.autor + " não fecha para mim."], rand));
      }
    }
    return true;
  };
  P.robosPendentes = function () {
    var s = this.s, p = s.partida, self = this;
    if (!p || s.fase !== "rodada") return [];
    return s.ordem.filter(function (id) { return self.ehRobo(id) && (p.acoes[id] || 0) > 0; });
  };

  P.iniciar = function () {
    var s = this.s;
    if (s.fase !== "lobby") return { ok: false };
    if (this.comRobos()) {
      // Cúmplice robô: completa a mesa com detetives robôs (pelo menos 1), e um deles é o Cúmplice
      this.removerRobos();
      s.config.treino = false;
      var humanos = s.ordem.filter(function (i) { return s.jogadores[i].online; }).length;
      if (humanos > MAX_JOGADORES - 2) return { ok: false, erro: "Com Cúmplice robô cabem até " + (MAX_JOGADORES - 2) + " jogadores." };
      // sempre pelo menos 2 robôs (normalmente 3), para o Cúmplice não ser óbvio
      this.criarRobos(s.config.solo ? 3 : Math.min(MAX_JOGADORES - humanos, Math.max(3, 5 - humanos)));
    }
    var ids = s.ordem.filter(function (i) { return s.jogadores[i].online; });
    if (ids.length < this.minimoJogadores())
      return { ok: false, erro: "São precisos pelo menos " + this.minimoJogadores() + " jogadores (com Cúmplice)." };
    if (s.config.treino && ids.length > this.esps.length)
      return { ok: false, erro: "No modo treino cabem até " + this.esps.length + " jogadores." };
    // remove quem estava offline
    s.ordem = ids;
    var caso = this.caso(s.config.casoId);
    var mist = embaralhar(ids, this.rand);
    var espsMist = embaralhar(this.esps.map(function (e) { return e.id; }), this.rand);
    var self0 = this;
    if (this.comRobos()) {
      // com robôs, o Cúmplice é sempre um dos robôs
      var robos = mist.filter(function (i) { return self0.ehRobo(i); });
      var escolhido = robos[Math.floor(this.rand() * robos.length)];
      mist = [escolhido].concat(mist.filter(function (i) { return i !== escolhido; }));
    }
    var cumplice = s.config.treino ? null : mist[0];
    var detetives = s.config.treino ? mist : mist.slice(1);
    var papeis = {}, cadernos = {};
    var self = this;
    detetives.forEach(function (id, i) {
      papeis[id] = { tipo: "detetive", esp: espsMist[i] };
    });
    if (cumplice) {
      var livres = espsMist.slice(detetives.length);
      var disfarce = livres.length ? livres[0] : espsMist[Math.floor(this.rand() * detetives.length)];
      papeis[cumplice] = { tipo: "cumplice", esp: disfarce };
    }
    ids.forEach(function (id) {
      var e = papeis[id].esp;
      cadernos[id] = [{
        pid: "dos:" + e, tipo: "dossie", rodada: 0,
        origem: "Dossiê · " + self.esp(e).nome,
        texto: caso.dossies[e]
      }];
      s.jogadores[id].pronto = !!s.jogadores[id].robo;
    });
    s.partida = {
      casoId: caso.id,
      solo: !!s.config.solo,
      robos: !s.config.solo && !!s.config.robos,
      treino: !!s.config.treino,
      cumpliceId: cumplice,
      papeis: papeis,
      rodada: 0,
      totalRodadas: TOTAL_RODADAS,
      acoesPorRodada: ids.length <= 4 ? 2 : 1,
      acoes: {},
      vistos: {},
      cadernos: cadernos,
      quadro: [],
      plantadas: {},
      votos: {},
      fimRodadaEm: 0,
      resultado: null
    };
    ids.forEach(function (id) { s.partida.vistos[id] = {}; s.partida.acoes[id] = 0; });
    s.fase = "intro";
    this.sistema("Caso aberto: \"" + caso.titulo + "\". Leiam o caso e confiram seus papéis.");
    return { ok: true };
  };

  P.avancar = function () {
    var s = this.s, p = s.partida;
    if (!p) return { ok: false };
    if (p.prisao) return { ok: false, erro: "Espere a votação do pedido de prisão terminar." };
    if (s.fase === "intro" || (s.fase === "rodada" && p.rodada < p.totalRodadas)) {
      p.rodada++;
      s.fase = "rodada";
      var caso = this.caso();
      var self = this;
      s.ordem.forEach(function (id) { p.acoes[id] = (p.afastados && p.afastados[id]) ? 0 : p.acoesPorRodada; });
      p.fimRodadaEm = s.config.tempoRodada > 0 ? this.agora() + s.config.tempoRodada * 1000 : 0;
      var nov = caso.novidades[p.rodada];
      if (nov) {
        s.ordem.forEach(function (id) {
          p.cadernos[id].push({ pid: "nov:" + p.rodada, tipo: "novidade", rodada: p.rodada, origem: "Novidade", texto: nov });
        });
        p.quadro.push({
          id: this.novoId("q"), pid: "nov:" + p.rodada, autorId: null, autor: "Delegacia",
          origem: "Novidade", texto: nov, rodada: p.rodada, ts: this.agora(), confirmados: [], novidade: true
        });
      }
      this.sistema("Rodada " + p.rodada + " de " + p.totalRodadas + " começou." + (nov ? " Há uma novidade no quadro!" : ""));
      return { ok: true };
    }
    if (s.fase === "rodada") {
      s.fase = "votacao";
      p.fimRodadaEm = 0;
      this.sistema("Hora da acusação! Cada um vota em quem é o culpado e em quem é o Cúmplice.");
      return { ok: true };
    }
    return { ok: false };
  };

  P.tick = function () {
    var s = this.s, p = s.partida;
    if (p && p.prisao && this.agora() >= p.prisao.ate) { this.decidirPrisao(true); return true; }
    if (s.fase === "rodada" && p && p.fimRodadaEm && this.agora() >= p.fimRodadaEm) {
      this.sistema("O tempo da rodada acabou.");
      this.avancar();
      return true;
    }
    return false;
  };

  P.investigar = function (jid, a) {
    var s = this.s, p = s.partida;
    if (s.fase !== "rodada" || !p) return { ok: false, erro: "Agora não dá para investigar." };
    if ((p.acoes[jid] || 0) <= 0) return { ok: false, erro: "Você já usou suas ações nesta rodada." };
    var caso = this.caso(), lista, chave, origem;
    if (a.alvo === "local") {
      var local = null;
      caso.locais.forEach(function (l) { if (l.id === a.id) local = l; });
      if (!local) return { ok: false, erro: "Local inválido." };
      lista = local.pistas; chave = "l:" + local.id; origem = local.icone + " " + local.nome;
    } else if (a.alvo === "suspeito") {
      var sus = null;
      caso.suspeitos.forEach(function (x) { if (x.id === a.id) sus = x; });
      if (!sus) return { ok: false, erro: "Suspeito inválido." };
      lista = caso.depoimentos[sus.id]; chave = "d:" + sus.id; origem = "Depoimento de " + sus.nome;
    } else return { ok: false };
    var vistos = p.vistos[jid];
    // quais pistas deste lugar a pessoa já viu (na cena 3D, ela escolhe o objeto)
    p.vistosIdx = p.vistosIdx || {};
    p.vistosIdx[jid] = p.vistosIdx[jid] || {};
    var vistasAqui = p.vistosIdx[jid][chave];
    if (!vistasAqui) { vistasAqui = []; for (var k = 0; k < (vistos[chave] || 0); k++) vistasAqui.push(k); p.vistosIdx[jid][chave] = vistasAqui; }
    if (vistasAqui.length >= lista.length) return { ok: false, erro: "Você já descobriu tudo o que havia aqui." };
    var n = -1;
    if (typeof a.indice === "number" && a.indice >= 0 && a.indice < lista.length) {
      if ((p.destruidas || []).indexOf(chave + ":" + a.indice) >= 0) return { ok: false, erro: "Essa pista foi destruída pelo culpado." };
      if (vistasAqui.indexOf(a.indice) >= 0) return { ok: false, erro: "Você já examinou isso. Procure outro objeto." };
      n = a.indice;
    } else {
      for (var i2 = 0; i2 < lista.length; i2++) if (vistasAqui.indexOf(i2) < 0) { n = i2; break; }
    }
    var entrada = { pid: chave + ":" + n, tipo: a.alvo === "local" ? "local" : "depoimento", rodada: p.rodada, origem: origem, texto: lista[n] };
    p.cadernos[jid].push(entrada);
    vistasAqui.push(n);
    vistos[chave] = vistasAqui.length;
    p.acoes[jid]--;
    return { ok: true, nova: entrada };
  };

  // Câmera do Fotógrafo: gasta 1 ação e confere se uma pista do quadro existe mesmo no local de onde diz ter vindo.
  P.localDaOrigem = function (origem) {
    var caso = this.caso(), achou = null;
    caso.locais.forEach(function (l) { if (origem === l.icone + " " + l.nome || origem === l.nome) achou = l; });
    return achou;
  };
  P.fotografar = function (jid, itemId) {
    var s = this.s, p = s.partida;
    if (!p || s.fase !== "rodada") return { ok: false, erro: "Só dá para fotografar durante as rodadas." };
    var papel = p.papeis[jid];
    if (!papel || papel.esp !== "fotografo") return { ok: false, erro: "Só o Fotógrafo tem a câmera." };
    p.fotos = p.fotos || {};
    if ((p.fotos[jid] || 0) >= MAX_FOTOS) return { ok: false, erro: "Acabou o filme: você já tirou as " + MAX_FOTOS + " fotos da partida." };
    if ((p.acoes[jid] || 0) <= 0) return { ok: false, erro: "Fotografar gasta 1 ação, e você já usou as suas nesta rodada." };
    var item = null;
    p.quadro.forEach(function (q) { if (q.id === itemId) item = q; });
    if (!item || item.novidade) return { ok: false, erro: "Escolha uma pista do quadro." };
    if (item.autorId === jid) return { ok: false, erro: "Essa pista é sua." };
    var local = this.localDaOrigem(item.origem);
    if (!local) return { ok: false, erro: "Só dá para fotografar pistas que vieram de um local, não de depoimentos." };
    var confere = !item.falsa;
    var resumo = item.texto.length > 90 ? item.texto.slice(0, 87) + "…" : item.texto;
    var entrada = {
      pid: "foto:" + item.id, tipo: "foto", rodada: p.rodada, local: local.id, confere: confere,
      origem: "📷 Sua foto · " + local.nome,
      texto: confere
        ? "A foto confirma a pista de " + item.autor + ": \"" + resumo + "\" Está mesmo em " + local.nome + "."
        : "Fotografei " + local.nome + " inteiro e NÃO aparece nada do que " + item.autor + " publicou: \"" + resumo + "\" Essa pista pode ser falsa."
    };
    p.cadernos[jid].push(entrada);
    p.fotos[jid] = (p.fotos[jid] || 0) + 1;
    p.acoes[jid]--;
    return { ok: true, nova: entrada };
  };

  P.temPista = function (jid, pid) {
    var c = this.s.partida.cadernos[jid] || [];
    for (var i = 0; i < c.length; i++) if (c[i].pid === pid) return c[i];
    return null;
  };

  P.publicar = function (jid, pid) {
    var s = this.s, p = s.partida;
    if (!p || (s.fase !== "rodada" && s.fase !== "votacao")) return { ok: false, erro: "Agora não dá para publicar." };
    var e = this.temPista(jid, pid);
    if (!e) return { ok: false, erro: "Essa pista não está no seu caderno." };
    for (var i = 0; i < p.quadro.length; i++)
      if (p.quadro[i].pid === pid) return { ok: false, erro: "Essa pista já está no quadro. Use \"Eu também vi\" nela." };
    p.quadro.push({
      id: this.novoId("q"), pid: pid, autorId: jid, autor: this.nome(jid),
      origem: e.origem, texto: e.texto, rodada: p.rodada, ts: this.agora(), confirmados: []
    });
    return { ok: true };
  };

  P.confirmar = function (jid, itemId) {
    var p = this.s.partida;
    if (!p) return { ok: false };
    var item = null;
    p.quadro.forEach(function (q) { if (q.id === itemId) item = q; });
    if (!item || item.novidade) return { ok: false };
    if (item.autorId === jid) return { ok: false, erro: "A pista é sua." };
    if (!item.pid || !this.temPista(jid, item.pid)) return { ok: false, erro: "Você não tem essa pista no seu caderno." };
    if (item.confirmados.indexOf(jid) < 0) item.confirmados.push(jid);
    return { ok: true };
  };

  P.plantar = function (jid, texto, origem) {
    var s = this.s, p = s.partida;
    if (!p || p.cumpliceId !== jid) return { ok: false, erro: "Ação inválida." };
    if (s.fase !== "rodada" && s.fase !== "votacao") return { ok: false, erro: "Agora não dá." };
    if ((p.plantadas[jid] || 0) >= MAX_PLANTADAS) return { ok: false, erro: "Você já plantou todas as pistas falsas." };
    texto = String(texto || "").trim().slice(0, 240);
    origem = String(origem || "").trim().slice(0, 60);
    if (texto.length < 8) return { ok: false, erro: "Escreva a pista falsa." };
    if (!origem) return { ok: false, erro: "Escolha de onde a pista \"veio\"." };
    p.plantadas[jid] = (p.plantadas[jid] || 0) + 1;
    p.quadro.push({
      id: this.novoId("q"), pid: null, autorId: jid, autor: this.nome(jid),
      origem: origem, texto: texto, rodada: p.rodada, ts: this.agora(), confirmados: [], falsa: true
    });
    return { ok: true };
  };

  P.votar = function (jid, a) {
    var s = this.s, p = s.partida;
    if (s.fase !== "votacao" || !p) return { ok: false, erro: "A votação ainda não começou." };
    if (s.ordem.indexOf(jid) < 0) return { ok: false };
    var caso = this.caso();
    function existe(lista, id) { return lista.some(function (x) { return x.id === id; }); }
    if (p.prisaoFinal) a = { culpado: p.prisaoFinal.culpado, metodo: p.prisaoFinal.metodo, motivo: p.prisaoFinal.motivo, cumplice: a.cumplice };
    if (!existe(caso.suspeitos, a.culpado)) return { ok: false, erro: "Escolha o culpado." };
    if (!existe(caso.metodos, a.metodo)) return { ok: false, erro: "Escolha como foi feito." };
    if (!existe(caso.motivos, a.motivo)) return { ok: false, erro: "Escolha o motivo." };
    if (!p.treino) {
      if (s.ordem.indexOf(a.cumplice) < 0 || a.cumplice === jid) return { ok: false, erro: "Escolha quem é o Cúmplice." };
    }
    p.votos[jid] = { culpado: a.culpado, metodo: a.metodo, motivo: a.motivo, cumplice: p.treino ? null : a.cumplice };
    var todos = this.humanos().every(function (id) { return p.votos[id]; });
    if (todos) this.resolver();
    return { ok: true };
  };

  function maisVotado(contagem) {
    var melhor = null, max = 0, empate = false;
    for (var k in contagem) {
      if (contagem[k] > max) { max = contagem[k]; melhor = k; empate = false; }
      else if (contagem[k] === max) empate = true;
    }
    return empate ? null : melhor;
  }

  P.resolver = function () {
    var s = this.s, p = s.partida, caso = this.caso(), sol = caso.solucao;
    var cC = {}, cM = {}, cO = {}, cX = {};
    var self = this;
    Object.keys(p.votos).forEach(function (id) {
      var v = p.votos[id];
      cC[v.culpado] = (cC[v.culpado] || 0) + 1;
      cM[v.metodo] = (cM[v.metodo] || 0) + 1;
      cO[v.motivo] = (cO[v.motivo] || 0) + 1;
      if (v.cumplice) cX[v.cumplice] = (cX[v.cumplice] || 0) + 1;
    });
    var acusado = p.prisaoFinal ? p.prisaoFinal.culpado : maisVotado(cC);
    var preso = p.treino ? null : maisVotado(cX);
    var resolvido = acusado === sol.culpado;
    var pego = !p.treino && preso === p.cumpliceId;
    var desfecho;
    if (p.treino) desfecho = resolvido ? "resolvido" : "fracasso";
    else if (resolvido && pego) desfecho = "total";
    else if (resolvido) desfecho = "parcial";
    else if (pego) desfecho = "empate";
    else desfecho = "cumplice";

    var pontosRodada = {};
    s.ordem.forEach(function (id) {
      var v = p.votos[id], pts = 0;
      if (id === p.cumpliceId) {
        if (!resolvido) pts += 5;
        if (!pego) pts += 3;
      } else if (v) {
        if (v.culpado === sol.culpado) pts += 3;
        if (v.metodo === sol.metodo) pts += 1;
        if (v.motivo === sol.motivo) pts += 1;
        if (!p.treino && v.cumplice === p.cumpliceId) pts += 2;
      }
      // prisão antecipada: bônus para quem pediu (quanto mais cedo, maior) e multas por prisão errada
      if (p.prisaoFinal && p.prisaoFinal.autorId === id && p.prisaoFinal.completa) pts += p.prisaoFinal.bonus;
      if (p.multas && p.multas[id]) pts -= p.multas[id];
      // pistas verdadeiras publicadas que alguém confirmou
      p.quadro.forEach(function (q) {
        if (q.autorId === id && !q.falsa && q.confirmados.length > 0 && id !== p.cumpliceId) pts += 1;
      });
      pontosRodada[id] = pts;
      s.jogadores[id].pontos += pts;
    });

    p.resultado = {
      desfecho: desfecho,
      acusado: acusado, preso: preso,
      contagem: { culpado: cC, metodo: cM, motivo: cO, cumplice: cX },
      pontosRodada: pontosRodada,
      votos: p.votos,
      prisao: p.prisaoFinal || null,
      prisoesErradas: p.prisoesErradas || []
    };
    s.fase = "resultado";
    s.partidasJogadas++;
    this.sistema("Caso encerrado! Vejam o resultado.");
    return { ok: true };
  };

  P.novaPartida = function () {
    var s = this.s;
    if (s.fase !== "resultado") return { ok: false };
    s.partida = null;
    s.fase = "lobby";
    var self = this;
    if (this.comRobos() || this.humanos().length !== s.ordem.length) this.removerRobos();
    s.ordem.slice().forEach(function (id) {
      var j = s.jogadores[id];
      j.pronto = false;
      if (!j.online) self.desconectar(id);
    });
    // sugere o próximo caso do mesmo nível
    var nivel = s.config.nivel || this.caso(s.config.casoId).dificuldade;
    var lista = this.casosDoNivel(nivel);
    if (!lista.length) lista = this.casos;
    var idx = 0;
    for (var i = 0; i < lista.length; i++) if (lista[i].id === s.config.casoId) idx = i;
    s.config.casoId = lista[(idx + 1) % lista.length].id;
    this.sistema("Nova partida! O anfitrião está escolhendo o próximo caso.");
    return { ok: true };
  };

  /* ---------------- Pergunta livre a um suspeito (respondida pela IA no celular do anfitrião) ---------------- */
  P.perguntar = function (jid, a) {
    var s = this.s, p = s.partida;
    if (s.fase !== "rodada" || !p) return { ok: false, erro: "Só dá para interrogar durante as rodadas." };
    if ((p.acoes[jid] || 0) <= 0) return { ok: false, erro: "Você já usou suas ações nesta rodada." };
    var caso = this.caso(), sus = null;
    caso.suspeitos.forEach(function (x) { if (x.id === a.id) sus = x; });
    if (!sus) return { ok: false, erro: "Suspeito inválido." };
    var texto = String(a.texto || "").replace(/\s+/g, " ").trim().slice(0, 200);
    if (texto.length < 4) return { ok: false, erro: "Escreva a sua pergunta." };
    p.perguntas = p.perguntas || [];
    if (p.perguntas.some(function (q) { return q.jid === jid && q.resposta == null; })) return { ok: false, erro: "Espere a resposta da sua pergunta anterior." };
    var pg = { id: this.novoId("pg"), jid: jid, sus: sus.id, pergunta: texto, resposta: null, rodada: p.rodada, ts: this.agora() };
    p.perguntas.push(pg);
    p.acoes[jid]--;
    return { ok: true, pergunta: pg };
  };

  // resposta = texto da IA; se vier erro, a pergunta é desfeita e a ação devolvida
  P.responder = function (id, resposta, erro) {
    var p = this.s.partida;
    if (!p || !p.perguntas) return { ok: false };
    var pg = null, i;
    for (i = 0; i < p.perguntas.length; i++) if (p.perguntas[i].id === id) pg = p.perguntas[i];
    if (!pg || pg.resposta != null) return { ok: false };
    var sus = null;
    this.caso().suspeitos.forEach(function (x) { if (x.id === pg.sus) sus = x; });
    if (!resposta) {
      p.perguntas = p.perguntas.filter(function (q) { return q !== pg; });
      if (this.s.fase === "rodada" && p.rodada === pg.rodada) p.acoes[pg.jid] = (p.acoes[pg.jid] || 0) + 1;
      this.sistema((sus ? sus.nome : "O suspeito") + " não respondeu à pergunta de " + this.nome(pg.jid) + (erro ? " (" + String(erro).slice(0, 90) + ")" : "") + ". A ação foi devolvida.");
      return { ok: true, falhou: true };
    }
    pg.resposta = String(resposta).slice(0, 500);
    if (p.cadernos[pg.jid]) p.cadernos[pg.jid].push({
      pid: "pg:" + pg.id, tipo: "pergunta", rodada: pg.rodada,
      origem: "Pergunta a " + (sus ? sus.nome : "suspeito"),
      texto: "Pergunta: \u201c" + pg.pergunta + "\u201d \u2014 Resposta: \u201c" + pg.resposta + "\u201d",
      pergunta: pg.pergunta, resposta: pg.resposta, sus: pg.sus
    });
    return { ok: true };
  };

  // se o anfitrião fechou o app no meio de uma pergunta, ela é desfeita
  P.cancelarPerguntasPendentes = function () {
    var p = this.s.partida, self = this;
    if (!p || !p.perguntas) return;
    p.perguntas.filter(function (q) { return q.resposta == null; }).forEach(function (q) { self.responder(q.id, null, "o anfitrião saiu do app"); });
  };

  /* ---------------- Mural do detetive (fios e linha do tempo, compartilhado) ---------------- */
  P.muralAcao = function (jid, a) {
    var s = this.s, p = s.partida;
    if (!p || (s.fase !== "rodada" && s.fase !== "votacao")) return { ok: false, erro: "O mural só funciona durante a investigação." };
    var m = p.mural || (p.mural = { pos: {}, fios: [], tempo: {} });
    var caso = this.caso();
    function valido(id) {
      id = String(id || "");
      if (id === "vitima") return true;
      if (id.indexOf("s:") === 0) return caso.suspeitos.some(function (x) { return "s:" + x.id === id; });
      return p.quadro.some(function (q) { return q.id === id; });
    }
    function num(x) { x = Number(x); return isFinite(x) ? Math.round(Math.max(0, Math.min(1, x)) * 1000) / 1000 : 0; }
    if (a.op === "mover") {
      if (!valido(a.id)) return { ok: false };
      m.pos[a.id] = [num(a.x), num(a.y)];
      return { ok: true };
    }
    if (a.op === "ligar") {
      if (!valido(a.a) || !valido(a.b) || a.a === a.b) return { ok: false };
      var par = [String(a.a), String(a.b)].sort();
      for (var i = 0; i < m.fios.length; i++) if (m.fios[i][0] === par[0] && m.fios[i][1] === par[1]) { m.fios.splice(i, 1); return { ok: true, removido: true }; }
      if (m.fios.length >= 80) return { ok: false, erro: "O mural já tem fios demais. Tire algum antes." };
      m.fios.push([par[0], par[1], this.nome(jid)]);
      return { ok: true };
    }
    if (a.op === "hora") {
      if (!valido(a.id)) return { ok: false };
      var h = String(a.hora || "").trim();
      if (!h) { delete m.tempo[a.id]; return { ok: true }; }
      var mm = /^(\d{1,2}):(\d{2})$/.exec(h);
      if (!mm || +mm[1] > 23 || +mm[2] > 59) return { ok: false, erro: "Use a hora no formato 21:30." };
      m.tempo[a.id] = ("0" + (+mm[1])).slice(-2) + ":" + mm[2];
      return { ok: true };
    }
    return { ok: false };
  };

  /* ---------------- Pedir prisão no meio da investigação ---------------- */
  var TEMPO_PRISAO = 60000;
  P.pedirPrisao = function (jid, a) {
    var s = this.s, p = s.partida, self = this;
    if (s.fase !== "rodada" || !p) return { ok: false, erro: "Só dá para pedir prisão durante as rodadas." };
    if (p.rodada < 2) return { ok: false, erro: "Pedidos de prisão só a partir da rodada 2." };
    if (this.ehRobo(jid)) return { ok: false };
    if (p.prisao) return { ok: false, erro: "Já há um pedido de prisão em votação." };
    p.prisoesUsadas = p.prisoesUsadas || {};
    if (p.prisoesUsadas[jid]) return { ok: false, erro: "Você já fez o seu pedido de prisão nesta partida." };
    if (p.afastados && p.afastados[jid]) return { ok: false, erro: "Você foi afastado do caso." };
    var caso = this.caso();
    function existe(lista, id) { return lista.some(function (x) { return x.id === id; }); }
    if (!existe(caso.suspeitos, a.culpado)) return { ok: false, erro: "Escolha quem vai ser preso." };
    if (!existe(caso.metodos, a.metodo)) return { ok: false, erro: "Escolha como foi feito." };
    if (!existe(caso.motivos, a.motivo)) return { ok: false, erro: "Escolha o motivo." };
    var eleitores = s.ordem.filter(function (id) { return !self.ehRobo(id) && s.jogadores[id].online; });
    if (eleitores.indexOf(jid) < 0) eleitores.push(jid);
    p.prisoesUsadas[jid] = true;
    p.prisao = { autorId: jid, culpado: a.culpado, metodo: a.metodo, motivo: a.motivo, ate: this.agora() + TEMPO_PRISAO, eleitores: eleitores, votos: {} };
    p.prisao.votos[jid] = true;
    var sus = caso.suspeitos.filter(function (x) { return x.id === a.culpado; })[0];
    if (eleitores.length > 1) this.sistema("⚖️ " + this.nome(jid) + " pediu a prisão de " + sus.nome + "! O grupo tem 60 segundos para apoiar ou recusar.");
    this.decidirPrisao(false);
    return { ok: true };
  };

  P.votarPrisao = function (jid, apoio) {
    var p = this.s.partida;
    if (!p || !p.prisao) return { ok: false, erro: "Não há pedido de prisão em votação." };
    if (p.prisao.eleitores.indexOf(jid) < 0) return { ok: false, erro: "Você não participa desta votação." };
    if (jid === p.prisao.autorId) return { ok: false };
    p.prisao.votos[jid] = apoio;
    this.decidirPrisao(false);
    return { ok: true };
  };

  // Decide quando já dá para saber o resultado (ou quando o tempo acabou: quem não votou conta como recusa)
  P.decidirPrisao = function (tempoAcabou) {
    var p = this.s.partida, pr = p && p.prisao;
    if (!pr) return;
    var n = pr.eleitores.length, sim = 0, nao = 0;
    pr.eleitores.forEach(function (id) { if (pr.votos[id] === true) sim++; else if (pr.votos[id] === false) nao++; });
    if (sim * 2 > n) return this.executarPrisao();
    if (tempoAcabou || (n - nao) * 2 <= n || sim + nao >= n) {
      var sus = this.caso().suspeitos.filter(function (x) { return x.id === pr.culpado; })[0];
      p.prisao = null;
      this.sistema("O grupo recusou o pedido de prisão de " + this.nome(pr.autorId) + " contra " + sus.nome + ". A investigação continua.");
    }
  };

  P.executarPrisao = function () {
    var s = this.s, p = s.partida, pr = p.prisao, caso = this.caso(), sol = caso.solucao, self = this;
    p.prisao = null;
    var sus = caso.suspeitos.filter(function (x) { return x.id === pr.culpado; })[0];
    var apoiadores = pr.eleitores.filter(function (id) { return pr.votos[id] === true && id !== pr.autorId; });
    if (pr.culpado === sol.culpado) {
      var completa = pr.metodo === sol.metodo && pr.motivo === sol.motivo;
      p.prisaoFinal = {
        autorId: pr.autorId, autor: this.nome(pr.autorId), culpado: pr.culpado, metodo: pr.metodo, motivo: pr.motivo,
        completa: completa, rodada: p.rodada, bonus: completa ? Math.max(1, p.totalRodadas - p.rodada + 2) : 0
      };
      s.fase = "votacao";
      p.fimRodadaEm = 0;
      this.sistema("⚖️ Prisão aprovada: " + sus.nome + " foi preso" + (completa ? "!" : ", mas com provas fracas.") + (p.treino ? "" : " Agora votem só em quem é o Cúmplice."));
      if (p.treino) this.resolver();
      return;
    }
    // prisão errada
    p.afastados = p.afastados || {};
    p.afastados[pr.autorId] = true;
    p.acoes[pr.autorId] = 0;
    p.multas = p.multas || {};
    p.multas[pr.autorId] = (p.multas[pr.autorId] || 0) + 2;
    apoiadores.forEach(function (id) { p.multas[id] = (p.multas[id] || 0) + 1; });
    p.prisoesErradas = p.prisoesErradas || [];
    p.prisoesErradas.push({ autor: this.nome(pr.autorId), suspeito: sus.nome, rodada: p.rodada, apoiadores: apoiadores.map(function (id) { return self.nome(id); }) });
    var local = this.destruirPista();
    var txt = sus.nome + " foi solto: tem álibi confirmado e NÃO é o culpado." + (local ? " O verdadeiro culpado ficou alerta e destruiu uma pista em " + local + "." : "");
    var pidN = "solto:" + sus.id;
    s.ordem.forEach(function (id) { if (p.cadernos[id]) p.cadernos[id].push({ pid: pidN, tipo: "novidade", rodada: p.rodada, origem: "Delegacia", texto: txt }); });
    p.quadro.push({ id: this.novoId("q"), pid: pidN, autorId: null, autor: "Delegacia", origem: "Prisão errada", texto: txt, rodada: p.rodada, ts: this.agora(), confirmados: [], novidade: true });
    this.sistema("❌ Prisão errada! " + this.nome(pr.autorId) + " foi afastado do caso" + (apoiadores.length ? " e quem apoiou perdeu 1 ponto" : "") + ".");
  };

  // Some uma pista de local que ninguém descobriu ainda (marcada como já vista para todos)
  P.destruirPista = function () {
    var s = this.s, p = s.partida, caso = this.caso(), self = this;
    p.vistosIdx = p.vistosIdx || {};
    function vistas(id, chave) {
      p.vistosIdx[id] = p.vistosIdx[id] || {};
      var v = p.vistosIdx[id][chave];
      if (!v) { v = []; for (var k = 0; k < ((p.vistos[id] || {})[chave] || 0); k++) v.push(k); p.vistosIdx[id][chave] = v; }
      return v;
    }
    var livres = [];
    caso.locais.forEach(function (l) {
      var chave = "l:" + l.id;
      for (var i = 0; i < l.pistas.length; i++) {
        var alguem = s.ordem.some(function (id) { return p.vistos[id] && vistas(id, chave).indexOf(i) >= 0; });
        if (!alguem) livres.push({ l: l, i: i, chave: chave });
      }
    });
    if (!livres.length) return null;
    var e = livres[Math.floor(this.rand() * livres.length)];
    s.ordem.forEach(function (id) {
      if (!p.vistos[id]) return;
      var v = vistas(id, e.chave);
      v.push(e.i);
      p.vistos[id][e.chave] = v.length;
    });
    p.destruidas = (p.destruidas || []).concat([e.chave + ":" + e.i]);
    return e.l.icone + " " + e.l.nome;
  };

  /* ---------------- Visão de cada jogador ---------------- */
  P.visao = function (jid) {
    var s = this.s, p = s.partida, self = this;
    var caso = this.caso();
    var v = {
      codigo: s.codigo,
      fase: s.fase,
      meuId: jid,
      hostId: s.hostId,
      souHost: jid === s.hostId,
      config: s.config,
      agora: this.agora(),
      jogadores: s.ordem.map(function (id) {
        var j = s.jogadores[id];
        return {
          id: id, nome: j.nome, online: j.online, pontos: j.pontos, pronto: j.pronto, robo: !!j.robo,
          acoes: p ? (p.acoes[id] || 0) : 0,
          afastado: !!(p && p.afastados && p.afastados[id]),
          votou: !!(p && p.votos[id])
        };
      }),
      chat: s.chat.slice(-80),
      casos: this.casos.map(function (c) {
        return { id: c.id, titulo: c.titulo, subtitulo: c.subtitulo, dificuldade: c.dificuldade, capa: c.capa, ia: !!c.ia };
      }),
      minimo: this.minimoJogadores(),
      maximo: s.config.treino ? Math.min(MAX_JOGADORES, this.esps.length) : s.config.robos ? MAX_JOGADORES - 2 : MAX_JOGADORES
    };
    if (!p) return v;

    var papel = p.papeis[jid];
    v.caso = {
      id: caso.id, titulo: caso.titulo, subtitulo: caso.subtitulo, intro: caso.intro, vitima: caso.vitima, capa: caso.capa, ia: !!caso.ia,
      suspeitos: caso.suspeitos, metodos: caso.metodos, motivos: caso.motivos,
      locais: caso.locais.map(function (l) { return { id: l.id, nome: l.nome, icone: l.icone, total: l.pistas.length }; })
    };
    v.treino = p.treino;
    v.solo = !!p.solo;
    v.robos = !!p.robos;
    v.rodada = p.rodada;
    v.totalRodadas = p.totalRodadas;
    v.acoesPorRodada = p.acoesPorRodada;
    v.fimRodadaEm = p.fimRodadaEm;
    if (papel) {
      var e = this.esp(papel.esp);
      v.papel = { tipo: papel.tipo, esp: e };
      v.caderno = p.cadernos[jid];
      v.minhasAcoes = p.acoes[jid] || 0;
      v.vistos = p.vistos[jid];
      v.vistosIdx = (p.vistosIdx && p.vistosIdx[jid]) || {};
      v.meuVoto = p.votos[jid] || null;
      if (papel.esp === "fotografo") v.fotosRestantes = MAX_FOTOS - ((p.fotos && p.fotos[jid]) || 0);
      if (papel.tipo === "cumplice") {
        v.segredo = {
          culpado: caso.solucao.culpado, metodo: caso.solucao.metodo, motivo: caso.solucao.motivo,
          falsas: caso.falsas,
          plantadasRestantes: MAX_PLANTADAS - (p.plantadas[jid] || 0)
        };
      }
    }
    var meusPids = {};
    (p.cadernos[jid] || []).forEach(function (c) { meusPids[c.pid] = true; });
    v.quadro = p.quadro.map(function (q) {
      return {
        id: q.id, autorId: q.autorId, autor: q.autor, origem: q.origem, texto: q.texto, rodada: q.rodada, ts: q.ts,
        novidade: !!q.novidade,
        confirmados: q.confirmados.map(function (c) { return self.nome(c); }),
        podeConfirmar: !q.novidade && q.autorId !== jid && !!q.pid && !!meusPids[q.pid] && q.confirmados.indexOf(jid) < 0,
        jaConfirmei: q.confirmados.indexOf(jid) >= 0,
        // o cúmplice reconhece as próprias pistas falsas
        minhaFalsa: !!q.falsa && q.autorId === jid
      };
    });
    v.mural = p.mural || { pos: {}, fios: [], tempo: {} };
    v.prisaoUsada = !!(p.prisoesUsadas && p.prisoesUsadas[jid]);
    v.afastado = !!(p.afastados && p.afastados[jid]);
    v.prisaoFinal = p.prisaoFinal || null;
    if (p.prisao) {
      var pr = p.prisao, sim = 0, nao = 0;
      pr.eleitores.forEach(function (id) { if (pr.votos[id] === true) sim++; else if (pr.votos[id] === false) nao++; });
      v.prisao = {
        autorId: pr.autorId, autor: this.nome(pr.autorId), culpado: pr.culpado, metodo: pr.metodo, motivo: pr.motivo, ate: pr.ate,
        apoios: sim, recusas: nao, total: pr.eleitores.length,
        possoVotar: pr.eleitores.indexOf(jid) >= 0 && jid !== pr.autorId,
        meuVoto: pr.votos[jid] === undefined ? null : pr.votos[jid]
      };
    }
    v.perguntando = (p.perguntas || []).filter(function (q) { return q.jid === jid && q.resposta == null; }).map(function (q) { return { sus: q.sus, pergunta: q.pergunta }; });
    v.publicadas = {};
    p.quadro.forEach(function (q) { if (q.pid) v.publicadas[q.pid] = q.autor; });

    if (s.fase === "resultado" && p.resultado) {
      var r = p.resultado;
      v.resultado = {
        desfecho: r.desfecho, acusado: r.acusado, preso: r.preso, contagem: r.contagem,
        pontosRodada: r.pontosRodada,
        solucao: caso.solucao,
        cumpliceId: p.cumpliceId,
        papeis: Object.keys(p.papeis).map(function (id) {
          return { id: id, nome: self.nome(id), tipo: p.papeis[id].tipo, esp: self.esp(p.papeis[id].esp) };
        }),
        votos: Object.keys(r.votos).map(function (id) { var x = r.votos[id]; return { id: id, nome: self.nome(id), culpado: x.culpado, metodo: x.metodo, motivo: x.motivo, cumplice: x.cumplice }; }),
        falsas: p.quadro.filter(function (q) { return q.falsa; }).map(function (q) { return { origem: q.origem, texto: q.texto, autor: q.autor }; }),
        prisao: r.prisao || null,
        prisoesErradas: r.prisoesErradas || []
      };
    }
    return v;
  };

  P.exportar = function () { return JSON.parse(JSON.stringify(this.s)); };

  global.Motor = Motor;
  if (typeof module !== "undefined") module.exports = Motor;
})(typeof window !== "undefined" ? window : globalThis);
