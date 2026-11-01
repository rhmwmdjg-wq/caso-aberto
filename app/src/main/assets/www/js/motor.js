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
      config: { casoId: this.casos[0].id, nivel: this.casos[0].dificuldade, treino: false, tempoRodada: 0, solo: false },
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
    if (!j) return;
    j.online = false;
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
        if (typeof a.treino === "boolean") s.config.treino = a.treino;
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
    }
    return { ok: false, erro: "Ação inválida." };
  };

  P.minimoJogadores = function () { return (this.s.config.treino || this.s.config.solo) ? 1 : 3; };

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
        this.roboFala(id, sortear(["Olhem o que eu achei. Isso muda tudo!", "Acabei de publicar uma pista importante no quadro.", "Achei uma coisa suspeita. Está no quadro.", "Gente, vejam o quadro. Acho que é isso!"], rand));
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
        if (loc && (vistos["l:" + loc.id] || 0) > 0 && rand() < 0.5) {
          p.duvidas[chave] = true;
          self.roboFala(id, sortear([
            "Estranho… eu examinei " + loc.nome + " e não vi nada disso que " + q.autor + " publicou.",
            "Não consigo confirmar a pista de " + q.autor + ". Eu estive em " + loc.nome + " e não achei isso.",
            "Hum. " + q.autor + " diz que achou isso em " + loc.nome + ", mas eu passei lá e não vi."
          ], rand));
        }
      });
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
    if (s.config.solo) {
      this.removerRobos();
      s.config.treino = false;
      this.criarRobos(3);
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
    if (s.config.solo) {
      // no solo, o Cúmplice é sempre um dos robôs
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
    if (s.fase === "intro" || (s.fase === "rodada" && p.rodada < p.totalRodadas)) {
      p.rodada++;
      s.fase = "rodada";
      var caso = this.caso();
      var self = this;
      s.ordem.forEach(function (id) { p.acoes[id] = p.acoesPorRodada; });
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
    var n = vistos[chave] || 0;
    if (n >= lista.length) return { ok: false, erro: "Você já descobriu tudo o que havia aqui." };
    var entrada = { pid: chave + ":" + n, tipo: a.alvo === "local" ? "local" : "depoimento", rodada: p.rodada, origem: origem, texto: lista[n] };
    p.cadernos[jid].push(entrada);
    vistos[chave] = n + 1;
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
    var acusado = maisVotado(cC);
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
      votos: p.votos
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
    if (s.config.solo) this.removerRobos();
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
          votou: !!(p && p.votos[id])
        };
      }),
      chat: s.chat.slice(-80),
      casos: this.casos.map(function (c) {
        return { id: c.id, titulo: c.titulo, subtitulo: c.subtitulo, dificuldade: c.dificuldade, capa: c.capa, ia: !!c.ia };
      }),
      minimo: this.minimoJogadores(),
      maximo: s.config.treino ? Math.min(MAX_JOGADORES, this.esps.length) : MAX_JOGADORES
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
      v.meuVoto = p.votos[jid] || null;
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
        falsas: p.quadro.filter(function (q) { return q.falsa; }).map(function (q) { return { origem: q.origem, texto: q.texto, autor: q.autor }; })
      };
    }
    return v;
  };

  P.exportar = function () { return JSON.parse(JSON.stringify(this.s)); };

  global.Motor = Motor;
  if (typeof module !== "undefined") module.exports = Motor;
})(typeof window !== "undefined" ? window : globalThis);
