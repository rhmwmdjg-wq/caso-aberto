/* =========================================================
   CASO ABERTO — Fotos das cenas
   1) Polaroides ilustradas, desenhadas pelo próprio app (sempre).
   2) Fotos geradas pelo Gemini (opcional), guardadas no celular
      de quem gerou e enviadas aos convidados quando precisarem.
   ========================================================= */
(function (global) {
  "use strict";

  var API = "https://generativelanguage.googleapis.com/v1beta/";
  var cache = {};          // chave -> dataURL
  var pedidos = {};        // chaves já pedidas ao anfitrião
  var IDX = "ca_fotos_idx";

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function lerIdx() { try { return JSON.parse(localStorage.getItem(IDX) || "{}") || {}; } catch (e) { return {}; } }
  function gravarIdx(o) { try { localStorage.setItem(IDX, JSON.stringify(o)); } catch (e) {} }

  /* ---------------- Banco de fotos (IndexedDB) ---------------- */
  var dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (ok, falha) {
      try {
        var r = indexedDB.open("caso-aberto-fotos", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("fotos"); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { falha(r.error); };
      } catch (e) { falha(e); }
    });
    return dbP;
  }
  function guardar(chave, dataUrl) {
    cache[chave] = dataUrl;
    return db().then(function (d) {
      return new Promise(function (ok) {
        var tx = d.transaction("fotos", "readwrite"); tx.objectStore("fotos").put(dataUrl, chave);
        tx.oncomplete = function () { ok(true); }; tx.onerror = function () { ok(false); };
      });
    }).catch(function () { return false; });
  }
  function obter(chave) {
    if (cache[chave]) return Promise.resolve(cache[chave]);
    return db().then(function (d) {
      return new Promise(function (ok) {
        var r = d.transaction("fotos").objectStore("fotos").get(chave);
        r.onsuccess = function () { if (r.result) cache[chave] = r.result; ok(r.result || null); };
        r.onerror = function () { ok(null); };
      });
    }).catch(function () { return null; });
  }
  function apagarCaso(casoId) {
    var idx = lerIdx(); delete idx[casoId]; gravarIdx(idx);
    Object.keys(cache).forEach(function (k) { if (k.indexOf(casoId + ":") === 0) delete cache[k]; });
    return db().then(function (d) {
      var st = d.transaction("fotos", "readwrite").objectStore("fotos");
      ["dossie", "l1", "l2", "l3", "l4", "l5"].forEach(function (s) { st.delete(casoId + ":" + s); });
    }).catch(function () {});
  }
  // carrega na memória as fotos de um caso (para mostrar sem esperar)
  function carregarCaso(casoId) {
    if (!lerIdx()[casoId]) return Promise.resolve(false);
    return Promise.all(["dossie", "l1", "l2", "l3", "l4", "l5"].map(function (s) { return obter(casoId + ":" + s); })).then(function () { aplicarTodas(); return true; });
  }

  /* ---------------- Desenho da polaroide ---------------- */
  var PALETAS = [
    ["#3b3328", "#1c1814", "#7a6a4f"], ["#22303a", "#11181e", "#4f6b7a"], ["#3a2626", "#1b1111", "#7a4f4f"],
    ["#2c3324", "#151a10", "#6a7a4f"], ["#33293a", "#18121c", "#6f5a7a"], ["#3a3122", "#1d170e", "#8a7444"]
  ];
  function ilustracao(chave, icone) {
    var h = hash(chave), pal = PALETAS[h % PALETAS.length];
    var giro = ((h >>> 3) % 14) - 7, x = 38 + ((h >>> 6) % 24), y = 34 + ((h >>> 9) % 18);
    var marcas = "";
    var n = 2 + ((h >>> 12) % 2);
    for (var i = 0; i < n; i++) {
      var mx = 12 + ((h >>> (i * 5 + 2)) % 70), my = 58 + ((h >>> (i * 4 + 7)) % 28);
      marcas += '<span class="marcador" style="left:' + mx + "%;top:" + my + '%">' + (i + 1) + "</span>";
    }
    return '<div class="ilustra" style="background:radial-gradient(ellipse at ' + x + "% " + (y - 10) + "%, " + pal[2] + " 0%, " + pal[0] + " 38%, " + pal[1] + ' 85%)">' +
      '<div class="chao" style="background:linear-gradient(180deg, transparent, ' + pal[1] + ')"></div>' +
      '<span class="objeto" style="left:' + x + "%;top:" + y + "%;transform:translate(-50%,-50%) rotate(" + giro + 'deg)">' + esc(icone || "🔍") + "</span>" +
      marcas + '<div class="grao"></div><div class="flash"></div></div>';
  }
  function hora(chave) { var h = hash(chave + "h"); return ("0" + (18 + h % 6)).slice(-2) + ":" + ("0" + (h >>> 4) % 60).slice(-2); }

  // opts: { chave, icone, legenda, selo: "confere"|"nao", pequeno, texto }
  function polaroide(opts) {
    var chave = opts.chave || "x", img = cache[chave];
    if (!img && global.Fotos.solicitar && lerIdxRemoto(chave)) global.Fotos.solicitar(chave);
    var giro = ((hash(chave + "g") % 5) - 2) * 0.8;
    return '<figure class="polaroide' + (opts.pequeno ? " pequena" : "") + '" style="transform:rotate(' + giro + 'deg)">' +
      '<span class="fita"></span>' +
      '<div class="cena" data-foto="' + esc(chave) + '" data-icone="' + esc(opts.icone || "") + '">' +
      (img ? '<img alt="" src="' + img + '">' : ilustracao(chave, opts.icone)) +
      '<span class="data-foto">' + hora(chave) + "</span>" +
      (opts.selo ? '<span class="selo-foto ' + (opts.selo === "confere" ? "ok" : "nao") + '">' + (opts.selo === "confere" ? "CONFERE ✔" : "NÃO CONFERE ✖") + "</span>" : "") +
      "</div>" +
      '<figcaption>' + esc(opts.legenda || "") + (opts.texto ? '<span class="texto-foto">' + esc(opts.texto) + "</span>" : "") + "</figcaption></figure>";
  }
  // convidados: o anfitrião avisa quais casos têm fotos de IA
  var remotos = {};
  function lerIdxRemoto(chave) { var c = chave.split(":")[0]; return !!remotos[c]; }
  function marcarRemoto(casoId, tem) { remotos[casoId] = !!tem; }
  function aplicar(chave) {
    var img = cache[chave];
    if (!img) return;
    var els = document.querySelectorAll('.cena[data-foto="' + chave.replace(/"/g, "") + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], antigo = el.querySelector(".ilustra");
      if (antigo) { var im = document.createElement("img"); im.alt = ""; im.src = img; im.className = "revelando"; el.replaceChild(im, antigo); }
    }
  }
  function aplicarTodas() { Object.keys(cache).forEach(aplicar); }
  // foto tirada da cena 3D: usada quando ainda não há foto da IA
  function usarSeVazio(chave, dataUrl) { if (dataUrl && !cache[chave]) { cache[chave] = dataUrl; aplicar(chave); } }
  function receber(chave, dataUrl) { delete pedidos[chave]; if (dataUrl) { cache[chave] = dataUrl; aplicar(chave); } }

  /* ---------------- Fotos com Gemini ---------------- */
  function chaveCfg() { return (global.IA && global.IA.config()) || {}; }
  function pedirApi(caminho, corpo, chave, ms) {
    var ctl = global.AbortController ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms) : null;
    return fetch(API + caminho, {
      method: corpo ? "POST" : "GET",
      headers: corpo ? { "Content-Type": "application/json", "x-goog-api-key": chave } : { "x-goog-api-key": chave },
      body: corpo ? JSON.stringify(corpo) : undefined, signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (t) clearTimeout(t);
      return r.text().then(function (txt) { var j = null; try { j = JSON.parse(txt); } catch (e) {} return { ok: r.ok, status: r.status, j: j }; });
    }, function (e) {
      if (t) clearTimeout(t);
      throw new Error(e && e.name === "AbortError" ? "A IA demorou demais para revelar a foto." : "Sem conexão com o Google.");
    });
  }
  function modeloImagem(chave) {
    var salvo = null; try { salvo = localStorage.getItem("ca_gemini_img"); } catch (e) {}
    if (salvo) return Promise.resolve(salvo);
    return pedirApi("models?pageSize=200", null, chave, 20000).then(function (r) {
      if (!r.ok) throw new Error("Não consegui consultar os modelos do Gemini.");
      var ms = ((r.j && r.j.models) || []).filter(function (m) {
        return /image/i.test(m.name) && /gemini/i.test(m.name) && (m.supportedGenerationMethods || []).indexOf("generateContent") >= 0;
      }).map(function (m) { return m.name.replace(/^models\//, ""); });
      function nota(id) { var v = /gemini-(\d+(?:\.\d+)?)/.exec(id); var n = v ? parseFloat(v[1]) * 10 : 0; if (/flash/.test(id)) n += 50; if (/pro/.test(id)) n -= 20; if (/preview|exp/.test(id)) n -= 5; return n; }
      ms.sort(function (a, b) { return nota(b) - nota(a); });
      if (!ms.length) throw new Error("Sua chave do Gemini não tem nenhum modelo de imagem disponível. O jogo continua com as fotos ilustradas.");
      return ms[0];
    });
  }
  function comprimir(dataUrl) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () {
        var L = 640, A = 480, c = document.createElement("canvas"); c.width = L; c.height = A;
        var g = c.getContext("2d"), r = Math.max(L / im.width, A / im.height), w = im.width * r, h = im.height * r;
        g.drawImage(im, (L - w) / 2, (A - h) / 2, w, h);
        try { ok(c.toDataURL("image/jpeg", 0.72)); } catch (e) { ok(dataUrl); }
      };
      im.onerror = function () { ok(null); };
      im.src = dataUrl;
    });
  }
  function umaFoto(chaveApi, modelo, prompt) {
    function tentar(modalidades) {
      return pedirApi("models/" + encodeURIComponent(modelo) + ":generateContent", {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: modalidades }
      }, chaveApi, 120000);
    }
    return tentar(["IMAGE"]).then(function (r) {
      if (!r.ok && r.status === 400) return tentar(["TEXT", "IMAGE"]);
      return r;
    }).then(function (r) {
      if (!r.ok) {
        if (r.status === 429 || r.status === 403 || r.status === 400)
          throw new Error("Seu plano do Gemini não liberou a criação de imagens agora (no plano gratuito ela costuma ser bem limitada). O jogo continua com as fotos ilustradas.");
        if (r.status === 404) { try { localStorage.removeItem("ca_gemini_img"); } catch (e) {} throw new Error("O modelo de imagem do Gemini mudou. Tente de novo."); }
        throw new Error("O Gemini não conseguiu criar a foto agora. Tente mais tarde.");
      }
      var partes = (r.j && r.j.candidates && r.j.candidates[0] && r.j.candidates[0].content && r.j.candidates[0].content.parts) || [];
      var d = null;
      partes.forEach(function (p) { var x = p.inlineData || p.inline_data; if (!d && x && x.data) d = "data:" + (x.mimeType || x.mime_type || "image/png") + ";base64," + x.data; });
      if (!d) throw new Error("O Gemini respondeu sem imagem. Tente de novo ou use outro tema.");
      return comprimir(d);
    });
  }
  function promptLocal(caso, local) {
    return "Fotografia de perícia policial, estilo foto analógica antiga com flash forte, enquadramento 4:3. " +
      "Lugar: " + local.nome + ", num cenário de mistério brasileiro: " + caso.subtitulo + ". " +
      "Mostre só o ambiente, vazio e silencioso, com clima de suspense, sombras e alguns objetos comuns do lugar. " +
      "Sem pessoas, sem corpos, sem sangue, sem armas em destaque, sem textos, letras, números ou placas na imagem.";
  }
  function promptDossie(caso, texto) {
    return "Fotografia analógica antiga com flash, tirada por um fotógrafo de polícia, enquadramento 4:3. Cenário: " + caso.subtitulo + ". " +
      "A foto mostra a cena descrita a seguir, sem revelar rostos (pessoas de costas, desfocadas ou só silhuetas): " + texto + " " +
      "Sem sangue, sem violência, sem textos, letras ou números na imagem.";
  }
  // Gera as 6 fotos de um caso (5 locais + a foto do dossiê do Fotógrafo)
  function gerarIA(caso, progresso) {
    var cfg = chaveCfg();
    if (!cfg.chave) return Promise.reject(new Error("Configure a chave do Gemini primeiro."));
    progresso = progresso || function () {};
    progresso("Preparando a câmera…", 0, 6);
    return modeloImagem(cfg.chave).then(function (modelo) {
      try { localStorage.setItem("ca_gemini_img", modelo); } catch (e) {}
      var tarefas = caso.locais.map(function (l) { return { chave: caso.id + ":" + l.id, prompt: promptLocal(caso, l), nome: l.nome }; });
      if (caso.dossies && caso.dossies.fotografo) tarefas.push({ chave: caso.id + ":dossie", prompt: promptDossie(caso, caso.dossies.fotografo), nome: "foto do Fotógrafo" });
      var feitas = 0;
      var seq = Promise.resolve();
      tarefas.forEach(function (t, i) {
        seq = seq.then(function () {
          progresso("Revelando a foto " + (i + 1) + " de " + tarefas.length + ": " + t.nome + "…", i, tarefas.length);
          return umaFoto(cfg.chave, modelo, t.prompt).then(function (d) {
            if (!d) return;
            feitas++;
            var idx = lerIdx(); idx[caso.id] = true; gravarIdx(idx);
            return guardar(t.chave, d).then(function () { aplicar(t.chave); });
          });
        });
      });
      return seq.then(function () { return feitas; });
    });
  }

  global.Fotos = {
    polaroide: polaroide,
    temIA: function (casoId) { return !!lerIdx()[casoId]; },
    carregarCaso: carregarCaso,
    obter: obter,
    receber: receber,
    marcarRemoto: marcarRemoto,
    gerarIA: gerarIA,
    apagarCaso: apagarCaso,
    usarSeVazio: usarSeVazio,
    aplicarTodas: aplicarTodas,
    // o app troca esta função para pedir a foto ao anfitrião
    solicitar: null,
    _pedidos: pedidos
  };
})(window);
