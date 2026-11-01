/* =========================================================
   CASO ABERTO — Cenas em 3D (piloto: "O Último Brinde")
   Feito com Three.js (licença MIT). Tudo é desenhado com formas
   simples, sem arquivos de modelo: fica leve e funciona sem internet.
   ========================================================= */
import * as THREE from "./three.module.min.js";
import { OrbitControls } from "./OrbitControls.js";

/* ---------------- Texturas desenhadas na hora ---------------- */
function texCanvas(w, h, desenhar, repetir) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  desenhar(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); }
  return t;
}
function ruido(g, w, h, alfa) {
  for (let i = 0; i < w * h / 40; i++) {
    g.fillStyle = `rgba(${Math.random() < .5 ? "0,0,0" : "255,255,255"},${Math.random() * alfa})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}
const TEX = {};
function texMadeira(cor1, cor2) {
  const k = "m" + cor1 + cor2;
  return TEX[k] || (TEX[k] = texCanvas(256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? cor1 : cor2; g.fillRect(0, i * 32, w, 32);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, i * 32, w, 2);
      g.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32);
      for (let j = 0; j < 6; j++) { g.strokeStyle = "rgba(0,0,0,.08)"; g.beginPath(); g.moveTo(0, i * 32 + 6 + j * 4); g.bezierCurveTo(80, i * 32 + 2 + j * 5, 160, i * 32 + 10 + j * 3, 256, i * 32 + 5 + j * 4); g.stroke(); }
    }
    ruido(g, w, h, .06);
  }, [3, 3]));
}
function texPapelParede(fundo, desenho) {
  const k = "p" + fundo + desenho;
  return TEX[k] || (TEX[k] = texCanvas(128, 128, (g, w, h) => {
    g.fillStyle = fundo; g.fillRect(0, 0, w, h);
    g.fillStyle = desenho;
    for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) {
      g.beginPath(); g.ellipse(x + 16, y + 16, 4, 8, 0, 0, Math.PI * 2); g.fill();
      g.fillRect(x, y, 1, 32);
    }
    ruido(g, w, h, .05);
  }, [6, 3]));
}
function texAzulejo(c1, c2) {
  const k = "a" + c1 + c2;
  return TEX[k] || (TEX[k] = texCanvas(128, 128, (g, w, h) => {
    for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? c1 : c2; g.fillRect(x * 32, y * 32, 32, 32); }
    g.strokeStyle = "rgba(0,0,0,.25)"; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 128); g.moveTo(0, i * 32); g.lineTo(128, i * 32); g.stroke(); }
  }, [5, 5]));
}
function texConcreto() {
  return TEX.c || (TEX.c = texCanvas(256, 256, (g, w, h) => {
    g.fillStyle = "#5d5a55"; g.fillRect(0, 0, w, h); ruido(g, w, h, .25);
    g.fillStyle = "rgba(20,15,10,.35)"; g.beginPath(); g.ellipse(150, 120, 60, 30, .3, 0, 7); g.fill();
  }, [4, 4]));
}
function texPedra() {
  return TEX.s || (TEX.s = texCanvas(128, 128, (g, w, h) => {
    g.fillStyle = "#6b625a"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      g.fillStyle = `hsl(25,${8 + Math.random() * 8}%,${30 + Math.random() * 15}%)`;
      g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14);
    }
  }, [2, 2]));
}
function texJanela() {
  return TEX.j || (TEX.j = texCanvas(128, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0b1424"); gr.addColorStop(1, "#1c2b44");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(170,190,220,.35)";
    for (let i = 0; i < 60; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 10); g.stroke(); }
    g.fillStyle = "rgba(255,240,200,.6)"; g.beginPath(); g.arc(96, 30, 8, 0, 7); g.fill();
  }));
}
function texRotulo(fundo, texto, corTexto) {
  return texCanvas(128, 64, (g, w, h) => {
    g.fillStyle = fundo; g.fillRect(0, 0, w, h);
    g.fillStyle = corTexto || "#111"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(texto, w / 2, h / 2);
  });
}

/* ---------------- Peças de montar ---------------- */
const MATS = {};
function mat(cor, op = {}) {
  const k = cor + JSON.stringify(op);
  return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: .75, metalness: 0 }, op)));
}
function malha(geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
  o.castShadow = true; o.receiveShadow = true; return o;
}
function caixa(w, h, d, m, x, y, z) { return malha(new THREE.BoxGeometry(w, h, d), typeof m === "string" ? mat(m) : m, x, y, z); }
function cil(rt, rb, h, m, x, y, z, seg = 18) { return malha(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === "string" ? mat(m) : m, x, y, z); }
function grupo(...filhos) { const g = new THREE.Group(); filhos.forEach(f => f && g.add(f)); return g; }
function em(o, x, y, z, ry = 0) { o.position.set(x, y, z); o.rotation.y = ry; return o; }

function sala(cena, o) {
  const L = o.largura || 8, P = o.fundo || 6, A = o.altura || 3.2;
  const piso = malha(new THREE.PlaneGeometry(L, P), new THREE.MeshStandardMaterial({ map: o.piso, roughness: .9 }));
  piso.rotation.x = -Math.PI / 2; cena.add(piso);
  const mp = new THREE.MeshStandardMaterial({ map: o.parede, roughness: .95, side: THREE.DoubleSide });
  const fundo = malha(new THREE.PlaneGeometry(L, A), mp, 0, A / 2, -P / 2); cena.add(fundo);
  const esq = malha(new THREE.PlaneGeometry(P, A), mp, -L / 2, A / 2, 0); esq.rotation.y = Math.PI / 2; cena.add(esq);
  const dir = malha(new THREE.PlaneGeometry(P, A), mp, L / 2, A / 2, 0); dir.rotation.y = -Math.PI / 2; cena.add(dir);
  const rodape = o.rodape || "#2a1d14";
  cena.add(caixa(L, .12, .04, rodape, 0, .06, -P / 2 + .02));
  cena.add(em(caixa(P, .12, .04, rodape, 0, 0, 0), -L / 2 + .02, .06, 0, Math.PI / 2));
  cena.add(em(caixa(P, .12, .04, rodape, 0, 0, 0), L / 2 - .02, .06, 0, Math.PI / 2));
  if (o.janela) {
    const j = o.janela;
    const vidro = malha(new THREE.PlaneGeometry(j.l || 1.4, j.a || 1.6), new THREE.MeshBasicMaterial({ map: texJanela() }), j.x || 0, j.y || 1.7, -P / 2 + .01);
    cena.add(vidro);
    cena.add(caixa((j.l || 1.4) + .14, .08, .1, "#3a2a1c", j.x || 0, (j.y || 1.7) - (j.a || 1.6) / 2, -P / 2 + .05));
    cena.add(caixa(.06, j.a || 1.6, .06, "#3a2a1c", j.x || 0, j.y || 1.7, -P / 2 + .03));
    cena.add(caixa(j.l || 1.4, .05, .06, "#3a2a1c", j.x || 0, j.y || 1.7, -P / 2 + .03));
  }
  return { L, P, A };
}
function luminaria(cena, x, y, z, cor = 0xffb35c, forca = 9, sombra = true) {
  const l = new THREE.PointLight(cor, forca, 9, 1.6);
  l.position.set(x, y, z);
  if (sombra) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.004; }
  cena.add(l);
  const bulbo = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
  bulbo.position.set(x, y, z); cena.add(bulbo);
  return l;
}
function tapete(cena, w, d, x, z, cor1, cor2) {
  const t = texCanvas(128, 96, (g, W, H) => {
    g.fillStyle = cor1; g.fillRect(0, 0, W, H);
    g.strokeStyle = cor2; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, H - 16);
    g.lineWidth = 2; g.strokeRect(18, 18, W - 36, H - 36);
    g.fillStyle = cor2; g.beginPath(); g.ellipse(W / 2, H / 2, 18, 12, 0, 0, 7); g.fill();
  });
  const m = malha(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }), x, .011, z);
  m.rotation.x = -Math.PI / 2; cena.add(m);
}
function mesa(w, d, h, cor) {
  const g = grupo(caixa(w, .07, d, cor, 0, h, 0));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(caixa(.07, h, .07, cor, a * (w / 2 - .08), h / 2, b * (d / 2 - .08))));
  return g;
}
function cadeira(cor) {
  const g = grupo(caixa(.5, .06, .5, cor, 0, .48, 0), caixa(.5, .6, .06, cor, 0, .8, -.22));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(caixa(.05, .48, .05, cor, a * .2, .24, b * .2)));
  return g;
}
function estante(w, h, cores) {
  const g = grupo(caixa(w, h, .35, "#3b2617", 0, h / 2, 0));
  const vao = h / 4;
  for (let i = 0; i < 4; i++) {
    g.add(caixa(w - .08, .03, .32, "#2c1c10", 0, .1 + i * vao, .02));
    let x = -w / 2 + .1;
    while (x < w / 2 - .12) {
      const lw = .05 + Math.random() * .05, lh = vao * (.55 + Math.random() * .3);
      g.add(caixa(lw, lh, .24, cores[Math.floor(Math.random() * cores.length)], x + lw / 2, .12 + i * vao + lh / 2, .05));
      x += lw + .005;
    }
  }
  return g;
}
function xicara(cor = "#f2efe8") {
  const g = grupo(cil(.055, .04, .08, cor, 0, .04, 0), cil(.1, .08, .012, cor, 0, .006, 0));
  const alca = malha(new THREE.TorusGeometry(.025, .007, 6, 12), mat(cor), .065, .045, 0); alca.rotation.y = Math.PI / 2; g.add(alca);
  g.add(cil(.05, .05, .005, "#4a2a12", 0, .075, 0));
  return g;
}
function taca() {
  const vidro = mat("#cfe6ff", { transparent: true, opacity: .45, roughness: .05, metalness: .1 });
  return grupo(cil(.04, .015, .09, vidro, 0, .17, 0), cil(.006, .006, .1, vidro, 0, .075, 0), cil(.035, .035, .006, vidro, 0, .003, 0));
}
function castical() {
  const prata = mat("#c9ccd2", { metalness: .9, roughness: .25 });
  const g = grupo(cil(.09, .11, .03, prata, 0, .015, 0), cil(.02, .025, .35, prata, 0, .2, 0));
  [-1, 0, 1].forEach(i => {
    if (i) g.add(em(caixa(.16, .015, .015, prata, 0, 0, 0), i * .08, .34, 0));
    g.add(cil(.025, .02, .03, prata, i * .15, .36, 0));
    g.add(cil(.015, .015, .14, "#efe6d0", i * .15, .44, 0));
  });
  return g;
}
function livroCaixa(cor) { return grupo(caixa(.28, .03, .2, cor, 0, .015, 0), caixa(.26, .028, .19, "#efe8d6", .006, .016, 0)); }

/* ---------------- Marcadores: lupa (a examinar) e placa amarela (já visto) ---------------- */
function spriteLupa() {
  const t = texCanvas(128, 128, (g) => {
    g.fillStyle = "rgba(214,165,72,.25)"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.strokeStyle = "#f3cf7a"; g.lineWidth = 8; g.beginPath(); g.arc(56, 56, 26, 0, 7); g.stroke();
    g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(76, 76); g.lineTo(100, 100); g.stroke();
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, sizeAttenuation: false }));
  s.scale.set(.085, .085, 1); s.renderOrder = 10;
  return s;
}
function placaEvidencia(n) {
  const t = texCanvas(64, 64, (g) => {
    g.fillStyle = "#f1c232"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#1b1b1b"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 32, 36);
  });
  const g = new THREE.Group();
  const lados = new THREE.MeshStandardMaterial({ map: t, roughness: .6 });
  const a = malha(new THREE.PlaneGeometry(.16, .14), lados, 0, .065, .04); a.rotation.x = -.35; g.add(a);
  const b = malha(new THREE.PlaneGeometry(.16, .14), lados, 0, .065, -.04); b.rotation.x = .35; b.rotation.y = Math.PI; g.add(b);
  return g;
}

/* ---------------- As cenas do caso "O Último Brinde" ---------------- */
// Cada cena devolve { alvo:[x,y,z], camera:[x,y,z], objetos:[{indice, obj, nome, lupa:[x,y,z]}] }
const CENAS = {
  brinde: {
    // Escritório: pista 0 = xícara e taça na mesa; pista 1 = castiçal de prata
    l1(cena) {
      sala(cena, { largura: 7, fundo: 5.5, piso: texMadeira("#5a3a22", "#4d311c"), parede: texPapelParede("#4a3b2c", "#5b4a37"), janela: { x: -1.6, y: 1.8 } });
      tapete(cena, 3.2, 2.2, .3, .2, "#5a1e1e", "#b48a3c");
      cena.add(em(estante(2.2, 2.4, ["#5a1e1e", "#1e3a5a", "#2e4a2a", "#6b5a2a", "#3a2a4a"]), 1.9, 0, -2.55));
      const m = mesa(1.8, .9, .76, "#4a2c18"); em(m, .2, 0, -.6); cena.add(m);
      cena.add(em(cadeira("#3a2214"), .2, 0, .15, Math.PI));
      cena.add(em(livroCaixa("#23395a"), -.3, .8, -.75, .3));
      const lamp = grupo(cil(.08, .1, .02, "#c9a24a", 0, .01, 0), cil(.01, .01, .35, "#c9a24a", 0, .19, 0), cil(.07, .14, .14, mat("#2f5a3a", { side: THREE.DoubleSide }), 0, .4, 0));
      cena.add(em(lamp, .85, .8, -.85));
      const mesinha = mesa(.6, .5, .7, "#3a2214"); em(mesinha, -2.6, 0, -1.6); cena.add(mesinha);
      const xt = grupo(em(xicara(), 0, 0, 0), em(taca(), .22, 0, -.05)); em(xt, -.25, .8, -.5);
      cena.add(xt);
      const ca = castical(); em(ca, -2.6, .74, -1.6); cena.add(ca);
      return {
        alvo: [0, .9, -.6], camera: [0, 2.6, 4.4],
        objetos: [
          { indice: 0, obj: xt, nome: "Xícara de chá e taça do brinde", lupa: [-.15, 1.25, -.5] },
          { indice: 1, obj: ca, nome: "Castiçal de prata", lupa: [-2.6, 1.45, -1.6] }
        ]
      };
    },
    // Cozinha: pista 0 = bandeja do chá no corredor; pista 1 = veneno de rato na despensa
    l2(cena) {
      sala(cena, { largura: 7, fundo: 5.5, piso: texAzulejo("#8c7a62", "#6d5d48"), parede: texAzulejo("#d8d0bd", "#c9bfa8"), janela: { x: 0, y: 1.9, l: 1.2, a: 1.1 } });
      for (let i = 0; i < 4; i++) {
        cena.add(caixa(.9, .9, .6, "#6b4a2c", -1.35 + i * .9, .45, -2.45));
        cena.add(caixa(.92, .05, .64, "#c9c2b2", -1.35 + i * .9, .92, -2.45));
      }
      const fogao = grupo(caixa(.8, .9, .6, "#d9d6cf", 0, .45, 0), caixa(.8, .03, .6, "#1c1c1c", 0, .915, 0));
      [-.18, .18].forEach(x => [-.12, .14].forEach(z => fogao.add(cil(.09, .09, .01, "#333", x, .935, z))));
      fogao.add(cil(.13, .12, .18, mat("#9aa3ad", { metalness: .7, roughness: .3 }), -.18, 1.02, -.12));
      cena.add(em(fogao, 2.25, 0, -2.45));
      cena.add(caixa(.8, 1.9, .7, "#e5e1d6", 2.9, .95, -.9));
      // corredor (porta lateral) com mesinha e bandeja
      cena.add(caixa(1.1, 2.3, .06, "#140f0b", -3.47, 1.15, .6));
      const m = mesa(.7, .45, .78, "#4a2c18"); em(m, -2.7, 0, .6); cena.add(m);
      const bandeja = grupo(caixa(.5, .02, .34, mat("#b9bcc2", { metalness: .8, roughness: .3 }), 0, .01, 0), em(xicara(), -.1, .02, 0),
        grupo(cil(.07, .09, .16, "#efe9dd", 0, .09, 0), cil(.025, .025, .03, "#efe9dd", 0, .185, 0)));
      bandeja.children[2].position.set(.12, .02, .02);
      em(bandeja, -2.7, .82, .6); cena.add(bandeja);
      // despensa
      const desp = grupo(caixa(1.2, 2, .45, "#3b2617", 0, 1, 0));
      [.5, 1.05, 1.6].forEach(y => desp.add(caixa(1.12, .03, .42, "#2c1c10", 0, y, .02)));
      ["#c8a046", "#9a3b2c", "#e0d6b8", "#5b7a3a"].forEach((c, i) => desp.add(caixa(.18, .26, .14, c, -.4 + i * .27, 1.2, .06)));
      [0, 1, 2].forEach(i => desp.add(cil(.07, .07, .2, "#c9ccd2", -.35 + i * .3, .63, .06)));
      em(desp, 2.6, 0, 1.3, -Math.PI / 2); cena.add(desp);
      const veneno = grupo(caixa(.16, .2, .1, new THREE.MeshStandardMaterial({ map: texRotulo("#c02a1f", "RATO", "#ffe36b") }), 0, .1, 0), caixa(.17, .02, .11, "#e8d34a", 0, .21, 0));
      em(veneno, 2.57, 1.63, 1.05, -Math.PI / 2); cena.add(veneno);
      return {
        alvo: [0, 1, -.3], camera: [0, 2.6, 4.6],
        objetos: [
          { indice: 0, obj: bandeja, nome: "Bandeja do chá no corredor", lupa: [-2.7, 1.3, .6] },
          { indice: 1, obj: veneno, nome: "Caixa de veneno de rato", lupa: [2.5, 2.1, 1.05] }
        ]
      };
    },
    // Armário de remédios: pista 0 = cartela e caderno de controle; pista 1 = fechadura e chaves
    l3(cena) {
      sala(cena, { largura: 6, fundo: 4.5, piso: texAzulejo("#d6d2c8", "#bdb7a9"), parede: texPapelParede("#cfd6cf", "#b9c4ba") });
      // armário aberto por dentro (fundo, laterais, teto e base), com portas de vidro
      const arm = grupo(caixa(1.6, 1.4, .04, "#e9e6df", 0, 0, -.18), caixa(.04, 1.4, .4, "#e9e6df", -.78, 0, 0), caixa(.04, 1.4, .4, "#e9e6df", .78, 0, 0),
        caixa(1.6, .04, .4, "#e9e6df", 0, .68, 0), caixa(1.6, .04, .4, "#e9e6df", 0, -.68, 0));
      const vidro = mat("#bfe0ff", { transparent: true, opacity: .25, roughness: .05 });
      arm.add(caixa(.76, 1.3, .02, vidro, -.39, 0, .21)); arm.add(caixa(.76, 1.3, .02, vidro, .39, 0, .21));
      [-.3, .15].forEach(y => arm.add(caixa(1.5, .02, .36, "#d3cfc6", 0, y, 0)));
      ["#f2f2f2", "#e4a43a", "#4a7ab0", "#d9534f", "#f2f2f2"].forEach((c, i) => arm.add(cil(.05, .05, .16, c, -.6 + i * .3, -.21, 0)));
      [0, 1, 2, 3].forEach(i => arm.add(caixa(.18, .1, .06, ["#fff", "#cfe3f5", "#f5e3cf", "#fff"][i], -.5 + i * .33, .23, 0)));
      em(arm, 0, 1.6, -2.03); cena.add(arm);
      const fech = grupo(caixa(.12, .16, .04, mat("#b8962e", { metalness: .9, roughness: .3 }), 0, 0, 0), malha(new THREE.TorusGeometry(.05, .012, 8, 16, Math.PI), mat("#9aa0a8", { metalness: .9, roughness: .3 }), 0, .1, 0));
      em(fech, 0, 1.6, -1.8); cena.add(fech);
      cena.add(caixa(1.8, .9, .55, "#7a8a86", 0, .45, -1.95));
      cena.add(caixa(1.84, .04, .58, "#e9e6df", 0, .92, -1.95));
      const cad = grupo(livroCaixa("#7a1e1e"), em(caixa(.2, .006, .12, new THREE.MeshStandardMaterial({ map: texCanvas(64, 40, (g) => { g.fillStyle = "#dfe6ec"; g.fillRect(0, 0, 64, 40); g.fillStyle = "#b8c2cc"; for (let x = 0; x < 4; x++) for (let y = 0; y < 2; y++) { g.beginPath(); g.arc(10 + x * 15, 12 + y * 16, 5, 0, 7); g.fill(); } }) }), 0, 0, 0), .2, .035, .05, .4));
      em(cad, -.45, .94, -1.85); cena.add(cad);
      // quadro de chaves na parede
      const chaves = grupo(caixa(.5, .35, .03, "#4a2c18", 0, 0, 0));
      [-.15, 0, .15].forEach((x, i) => { chaves.add(cil(.01, .01, .05, "#aaa", x, .08, .03)); if (i !== 1) chaves.add(caixa(.03, .1, .01, mat("#c9a24a", { metalness: .9, roughness: .3 }), x, 0, .03)); });
      em(chaves, 1.9, 1.5, -2.2); cena.add(chaves);
      const cama = grupo(caixa(.9, .45, 1.9, "#d8d2c4", 0, .23, 0), caixa(.9, .1, .3, "#f3efe6", 0, .5, -.75));
      em(cama, -2.2, 0, .3); cena.add(cama);
      return {
        alvo: [0, 1.2, -1.2], camera: [0, 2.2, 3.6],
        objetos: [
          { indice: 0, obj: cad, nome: "Cartela de comprimidos e caderno de controle", lupa: [-.4, 1.3, -1.8] },
          { indice: 1, obj: grupo(), alvoObjs: [fech, chaves], nome: "Fechadura do armário e quadro de chaves", lupa: [.25, 2.05, -1.75] }
        ]
      };
    },
    // Sala da lareira: pista 0 = papéis nas cinzas; pista 1 = registro da chaminé
    l4(cena) {
      sala(cena, { largura: 7, fundo: 5.5, piso: texMadeira("#4a2f1b", "#40281a"), parede: texPapelParede("#3b2a2a", "#4e3636"), janela: { x: 2.2, y: 1.8, l: 1, a: 1.4 } });
      tapete(cena, 2.8, 1.8, 0, .4, "#2a3550", "#a8823a");
      const lar = grupo(caixa(2, 1.4, .6, new THREE.MeshStandardMaterial({ map: texPedra(), roughness: .95 }), 0, .7, 0), caixa(2.3, .12, .75, "#3b2617", 0, 1.46, .05));
      lar.add(caixa(1, .8, .62, "#0d0907", 0, .45, .02));
      lar.add(caixa(.5, 1.7, .5, new THREE.MeshStandardMaterial({ map: texPedra() }), 0, 2.35, -.05));
      em(lar, 0, 0, -2.45); cena.add(lar);
      const brasa = new THREE.PointLight(0xff6a2a, 2.2, 3, 2); brasa.position.set(0, .4, -2); cena.add(brasa);
      const cinzas = grupo(cil(.42, .45, .06, "#3a3532", 0, .03, 0));
      for (let i = 0; i < 7; i++) {
        const p = malha(new THREE.PlaneGeometry(.12 + Math.random() * .08, .09), mat(i % 3 ? "#d9d2c0" : "#5a4a3a", { side: THREE.DoubleSide }), (Math.random() - .5) * .5, .07, (Math.random() - .5) * .3);
        p.rotation.x = -Math.PI / 2 + (Math.random() - .5) * .5; p.rotation.z = Math.random() * 3; cinzas.add(p);
      }
      em(cinzas, 0, .05, -2.22); cena.add(cinzas);
      const registro = grupo(caixa(.06, .5, .06, "#1c1c1c", 0, 0, 0), em(caixa(.2, .04, .06, "#2a2a2a", 0, 0, 0), .07, .22, 0), cil(.035, .035, .05, mat("#b8962e", { metalness: .9, roughness: .3 }), .16, .22, 0));
      em(registro, .72, 1.05, -2.1); cena.add(registro);
      const sofa = grupo(caixa(2, .45, .9, "#5a2626", 0, .23, 0), caixa(2, .6, .2, "#5a2626", 0, .7, -.35), caixa(.2, .55, .9, "#4a1e1e", -.95, .5, 0), caixa(.2, .55, .9, "#4a1e1e", .95, .5, 0));
      em(sofa, 0, 0, 1.9, Math.PI); cena.add(sofa);
      const poltrona = grupo(caixa(.8, .45, .8, "#3a4a2a", 0, .23, 0), caixa(.8, .6, .18, "#3a4a2a", 0, .7, -.3));
      em(poltrona, -2.4, 0, -.6, Math.PI / 3); cena.add(poltrona);
      const quadro = malha(new THREE.PlaneGeometry(.9, .7), new THREE.MeshStandardMaterial({ map: texCanvas(90, 70, (g) => { const gr = g.createLinearGradient(0, 0, 0, 70); gr.addColorStop(0, "#6a7a8a"); gr.addColorStop(1, "#3a4a2a"); g.fillStyle = gr; g.fillRect(0, 0, 90, 70); g.fillStyle = "#2a3a1a"; g.beginPath(); g.moveTo(0, 50); g.lineTo(30, 30); g.lineTo(60, 45); g.lineTo(90, 28); g.lineTo(90, 70); g.lineTo(0, 70); g.fill(); g.strokeStyle = "#b8962e"; g.lineWidth = 6; g.strokeRect(0, 0, 90, 70); }) }), -2, 1.9, -2.74);
      cena.add(quadro);
      return {
        alvo: [0, 1, -1.4], camera: [0, 2.4, 4],
        objetos: [
          { indice: 0, obj: cinzas, nome: "Papéis queimados nas cinzas", lupa: [0, .7, -2.1] },
          { indice: 1, obj: registro, nome: "Registro da chaminé", lupa: [.85, 1.6, -2.05] }
        ],
        extra: brasa
      };
    },
    // Garagem: pista 0 = pasta no banco do carro; pista 1 = papel-alumínio no tapete
    l5(cena) {
      sala(cena, { largura: 8, fundo: 6, altura: 3, piso: texConcreto(), parede: texCanvas(64, 64, (g) => { g.fillStyle = "#6e6a62"; g.fillRect(0, 0, 64, 64); ruido(g, 64, 64, .2); }), rodape: "#4a4740" });
      const corC = mat("#7a2222", { metalness: .5, roughness: .35 });
      const luzG = new THREE.PointLight(0xdfe8ff, 7, 9, 1.4); luzG.position.set(.5, 2.7, -.4); cena.add(luzG);
      cena.add(caixa(1.2, .05, .2, mat("#f4f6ff", { emissive: "#dfe8ff", emissiveIntensity: 1 }), .5, 2.95, -.4));
      const vidro = mat("#0f1a24", { metalness: .3, roughness: .1, transparent: true, opacity: .75 });
      const carro = grupo(caixa(1.8, .55, 4, corC, 0, .55, 0), caixa(1.6, .5, 2, vidro, 0, 1.07, -.2));
      [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]].forEach(([a, b]) => { const r = cil(.33, .33, .22, "#151515", a * .92, .33, b); r.rotation.z = Math.PI / 2; carro.add(r); });
      carro.add(caixa(.4, .1, .05, "#fff4c0", -.55, .6, 2.01)); carro.add(caixa(.4, .1, .05, "#fff4c0", .55, .6, 2.01));
      carro.add(caixa(.4, .08, .05, "#a01a1a", -.6, .65, -2.01)); carro.add(caixa(.4, .08, .05, "#a01a1a", .6, .65, -2.01));
      // porta do motorista aberta, com o banco à mostra
      const porta = caixa(.06, .7, 1.1, corC, 0, 0, 0); porta.position.set(1.25, .75, .55); porta.rotation.y = -.9; carro.add(porta);
      carro.add(caixa(.6, .12, .6, "#3a2a20", .45, .85, .1));
      carro.add(caixa(.6, .55, .12, "#3a2a20", .45, 1.15, -.2));
      em(carro, -.3, 0, -.4, .25); cena.add(carro);
      const pasta = grupo(caixa(.36, .04, .26, "#7a5a2a", 0, 0, 0), caixa(.3, .01, .2, "#efe8d6", .02, .025, 0));
      pasta.position.set(.15, .93, .1); carro.add(pasta);
      const tapeteCarro = malha(new THREE.PlaneGeometry(.7, .5), mat("#222"), 1.15, .012, .85); tapeteCarro.rotation.x = -Math.PI / 2;
      cena.add(tapeteCarro);
      const aluminio = malha(new THREE.PlaneGeometry(.1, .07), mat("#e4e8ee", { metalness: 1, roughness: .15, side: THREE.DoubleSide }), 1.2, .018, .9);
      aluminio.rotation.x = -Math.PI / 2; aluminio.rotation.z = .6; cena.add(aluminio);
      const alvoAl = grupo(); alvoAl.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .4), new THREE.MeshBasicMaterial({ visible: false }))); em(alvoAl, 1.15, .05, .85); cena.add(alvoAl);
      const prat = grupo(caixa(1.6, 2, .4, "#4a3f33", 0, 1, 0));
      [.5, 1.1, 1.7].forEach(y => prat.add(caixa(1.5, .03, .38, "#3a3128", 0, y, .02)));
      prat.add(cil(.1, .1, .25, "#b53a2a", -.5, .66, 0)); prat.add(cil(.1, .1, .25, "#2a6ab5", -.2, .66, 0)); prat.add(caixa(.4, .2, .25, "#6a7a3a", .4, 1.25, 0));
      em(prat, 3.6, 0, -1.5, -Math.PI / 2); cena.add(prat);
      return {
        alvo: [.3, .8, .2], camera: [3.2, 2.6, 4.2],
        objetos: [
          { indice: 0, obj: pasta, nome: "Pasta no banco do carro", lupa: [.55, 1.45, .25] },
          { indice: 1, obj: alvoAl, nome: "Tapete do carro", lupa: [1.2, .45, .9] }
        ]
      };
    }
  }
};

export const TEM_3D = { brinde: ["l1", "l2", "l3", "l4", "l5"] };

/* ---------------- O visualizador ---------------- */
export function abrir(opts) {
  const montar = CENAS[opts.casoId] && CENAS[opts.casoId][opts.localId];
  if (!montar) throw new Error("Esta cena ainda não tem versão 3D.");
  const leve = !!opts.leve;
  const raiz = document.createElement("div");
  raiz.className = "cena3d";
  raiz.innerHTML = `<div class="c3-topo"><div class="c3-titulo"><span>${opts.icone || ""}</span> ${opts.nome || ""}</div><button class="c3-fechar" aria-label="Fechar">✕</button></div>
    <div class="c3-palco"></div>
    <div class="c3-rodape"><div class="c3-dica">Arraste para olhar em volta · dois dedos para aproximar · toque na 🔍 para examinar</div><div class="c3-acoes"></div></div>`;
  document.body.appendChild(raiz);
  const palco = raiz.querySelector(".c3-palco");

  const renderer = new THREE.WebGLRenderer({ antialias: !leve, powerPreference: "high-performance" });
  renderer.setPixelRatio(leve ? 1 : Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = !leve;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  palco.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x07080b);
  cena.fog = new THREE.Fog(0x07080b, 10, 26);
  cena.add(new THREE.HemisphereLight(0x8fa6c8, 0x2a1d12, .55));
  const info = montar(cena);
  const lampada = luminaria(cena, info.alvo[0] * .3, 2.7, info.alvo[2] + .6, 0xffc070, 14, !leve);
  // lanterna do detetive, presa à câmera
  const camera = new THREE.PerspectiveCamera(55, 1, .05, 50);
  camera.position.set(...info.camera);
  const lanterna = new THREE.SpotLight(0xfff2d6, 8, 12, .5, .6, 1.2);
  camera.add(lanterna); lanterna.position.set(.2, -.2, 0); lanterna.target.position.set(0, 0, -1); camera.add(lanterna.target);
  cena.add(camera);

  const controles = new OrbitControls(camera, renderer.domElement);
  controles.target.set(...info.alvo);
  controles.enableDamping = true; controles.dampingFactor = .08;
  controles.enablePan = false;
  controles.minDistance = 1.2; controles.maxDistance = 6.5;
  controles.minPolarAngle = .25; controles.maxPolarAngle = 1.48;
  const az = Math.atan2(info.camera[0] - info.alvo[0], info.camera[2] - info.alvo[2]);
  controles.minAzimuthAngle = az - 1.25; controles.maxAzimuthAngle = az + 1.25;
  controles.update();

  // afasta a câmera até todas as lupas caberem na tela (importante no celular em pé)
  function enquadrar() {
    const pts = info.objetos.map(o => new THREE.Vector3(...o.lupa)).concat([new THREE.Vector3(...info.alvo)]);
    const alvo = controles.target.clone();
    const dir = new THREE.Vector3(...info.camera).sub(alvo).normalize();
    let d = Math.max(2.5, new THREE.Vector3(...info.camera).distanceTo(alvo));
    for (let i = 0; i < 40; i++) {
      camera.position.copy(alvo).addScaledVector(dir, d); camera.lookAt(alvo); camera.updateMatrixWorld();
      const cabe = pts.every(p => { const v = p.clone().project(camera); return Math.abs(v.x) < .88 && Math.abs(v.y) < .8 && v.z < 1; });
      if (cabe) break;
      d *= 1.07;
    }
    controles.maxDistance = Math.max(6.5, d * 1.2);
    controles.update();
  }

  // marcadores
  const vistas = new Set(opts.vistas || []);
  const alvos = [];
  info.objetos.forEach((o) => {
    const lupa = spriteLupa(); lupa.position.set(...o.lupa); lupa.userData.obj = o; cena.add(lupa);
    o.lupaSprite = lupa;
    const malhas = [];
    [o.obj].concat(o.alvoObjs || []).forEach(x => x.traverse(m => { if (m.isMesh) { m.userData.obj = o; malhas.push(m); } }));
    o.malhas = malhas;
    alvos.push(lupa, ...malhas);
    if (vistas.has(o.indice)) marcarVisto(o, false);
  });
  function marcarVisto(o, animar) {
    o.visto = true;
    o.lupaSprite.visible = false;
    if (!o.placa) {
      const p = placaEvidencia(o.indice + 1);
      p.position.set(o.lupa[0] + .18, Math.max(.0, o.lupa[1] - .55), o.lupa[2] + .15);
      // a placa fica apoiada na superfície mais próxima abaixo da lupa
      const ray = new THREE.Raycaster(new THREE.Vector3(o.lupa[0] + .18, o.lupa[1], o.lupa[2] + .15), new THREE.Vector3(0, -1, 0));
      ray.camera = camera;
      const hits = ray.intersectObjects(cena.children, true).filter(h => h.object.isMesh && !h.object.isSprite);
      if (hits.length) p.position.y = hits[0].point.y;
      cena.add(p); o.placa = p;
      if (animar) { p.scale.set(.01, .01, .01); o.crescer = 0; }
    }
  }

  // tamanho
  function ajustar() {
    const w = palco.clientWidth || window.innerWidth, h = palco.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  ajustar();
  enquadrar();
  window.addEventListener("resize", ajustar);

  // toque (sem arrastar) = examinar
  const ray = new THREE.Raycaster(), ponto = new THREE.Vector2();
  let ini = null;
  renderer.domElement.addEventListener("pointerdown", e => { ini = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!ini) return;
    const mov = Math.hypot(e.clientX - ini.x, e.clientY - ini.y), dt = performance.now() - ini.t; ini = null;
    if (mov > 10 || dt > 500) return;
    const r = renderer.domElement.getBoundingClientRect();
    ponto.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ponto, camera);
    const hit = ray.intersectObjects(alvos, false)[0];
    if (!hit) return;
    const o = hit.object.userData.obj;
    destacar(o);
    opts.aoTocar && opts.aoTocar(o.indice, o.nome, !!o.visto);
  });
  function destacar(o) {
    o.malhas.forEach(m => {
      if (!m.material || !m.material.emissive) return;
      if (!m.userData.matOrig) { m.userData.matOrig = m.material; m.material = m.material.clone(); }
      m.material.emissive = new THREE.Color(0xd6a548); m.material.emissiveIntensity = .9;
    });
    o.brilho = 1;
  }

  // animação
  let parar = false, t0 = performance.now(), quadros = 0, fotoTirada = false;
  const relogio = new THREE.Clock();
  function quadro() {
    if (parar) return;
    requestAnimationFrame(quadro);
    const dt = relogio.getDelta(), t = (performance.now() - t0) / 1000;
    controles.update();
    // a lâmpada tremula um pouco
    lampada.intensity = 14 * (.9 + Math.sin(t * 7) * .03 + (Math.random() < .02 ? -.35 : 0));
    if (info.extra) info.extra.intensity = 2 + Math.sin(t * 9) * .4 + Math.random() * .3;
    info.objetos.forEach(o => {
      if (o.lupaSprite.visible) { const s = .085 + Math.sin(t * 3 + o.indice) * .01; o.lupaSprite.scale.set(s, s, 1); }
      if (o.brilho > 0) {
        o.brilho = Math.max(0, o.brilho - dt * 1.2);
        o.malhas.forEach(m => { if (m.userData.matOrig) { m.material.emissiveIntensity = o.brilho * .9; if (o.brilho === 0) { m.material.dispose(); m.material = m.userData.matOrig; delete m.userData.matOrig; } } });
      }
      if (o.placa && o.crescer != null) { o.crescer = Math.min(1, o.crescer + dt * 3); const s = .01 + o.crescer * .99; o.placa.scale.set(s, s, s); if (o.crescer >= 1) o.crescer = null; }
    });
    renderer.render(cena, camera);
    quadros++;
    if (!fotoTirada && quadros === 20 && opts.aoFoto) { fotoTirada = true; opts.aoFoto(tirarFoto()); }
  }
  quadro();

  function tirarFoto() {
    try {
      renderer.render(cena, camera);
      const src = renderer.domElement, c = document.createElement("canvas");
      c.width = 640; c.height = 480;
      const g = c.getContext("2d"), r = Math.max(640 / src.width, 480 / src.height);
      g.drawImage(src, (640 - src.width * r) / 2, (480 - src.height * r) / 2, src.width * r, src.height * r);
      return c.toDataURL("image/jpeg", .75);
    } catch (e) { return null; }
  }
  function fechar() {
    if (parar) return;
    parar = true;
    window.removeEventListener("resize", ajustar);
    controles.dispose();
    cena.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== MATS) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!Object.values(MATS).includes(m)) m.dispose(); }); } });
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) {}
    raiz.remove();
    opts.aoFechar && opts.aoFechar();
  }
  raiz.querySelector(".c3-fechar").addEventListener("click", fechar);

  return {
    marcar(indice) { const o = info.objetos.find(x => x.indice === indice); if (o) marcarVisto(o, true); },
    acoes(txt) { raiz.querySelector(".c3-acoes").innerHTML = txt; },
    foto: tirarFoto,
    // posição na tela de cada lupa ainda não examinada (usado nos testes)
    posicoes() {
      const r = renderer.domElement.getBoundingClientRect();
      return info.objetos.filter(o => !o.visto).map(o => {
        const v = new THREE.Vector3(...o.lupa).project(camera);
        return { indice: o.indice, x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
      });
    },
    fechar
  };
}

window.Cena3D = { abrir, TEM_3D };
