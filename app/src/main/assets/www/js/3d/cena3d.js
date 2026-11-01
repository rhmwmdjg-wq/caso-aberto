/* =========================================================
   CASO ABERTO — Cenas em 3D realistas (piloto: "O Último Brinde")
   Three.js (MIT) + modelos do Khronos glTF Sample Assets (CC0/CC-BY)
   + iluminação HDRI do Poly Haven (CC0). Créditos em CREDITOS-3D.md.
   ========================================================= */
import * as THREE from "./three.module.min.js";
import { OrbitControls } from "./OrbitControls.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { EXRLoader } from "./EXRLoader.js";
import { RoundedBoxGeometry } from "./RoundedBoxGeometry.js";

const BASE = new URL("./", import.meta.url).href;

/* ---------------- Carregamento com cache ---------------- */
const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const cacheTex = {}, cacheModelo = {};
let envPromessa = null;

function tex(nome, rep = [1, 1], cor = false) {
  const k = nome + rep.join("x");
  if (!cacheTex[k]) {
    const t = texLoader.load(BASE + "tex/" + nome + ".jpg");
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
    t.anisotropy = 4;
    if (cor) t.colorSpace = THREE.SRGBColorSpace;
    cacheTex[k] = t;
  }
  return cacheTex[k];
}
// material PBR a partir das texturas geradas
function pbr(nome, rep, op = {}) {
  const m = new THREE.MeshStandardMaterial(Object.assign({
    map: tex(nome + "_cor", rep, true),
    normalMap: tex(nome + "_nrm", rep),
    roughness: 1
  }, op));
  if (op.semRug !== true && ["piso_madeira", "madeira_escura", "ladrilho", "azulejo_branco", "concreto"].includes(nome)) m.roughnessMap = tex(nome + "_rug", rep);
  delete m.semRug;
  return m;
}
function modelo(nome) {
  if (!cacheModelo[nome]) cacheModelo[nome] = new Promise((ok, falha) => gltfLoader.load(BASE + "modelos/" + nome + ".glb", g => ok(g.scene), undefined, falha));
  return cacheModelo[nome].then(cena => {
    const c = cena.clone(true);
    c.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      // vidro com "transmission" exige uma renderização extra: no celular, trocamos por transparência simples
      [].concat(o.material).forEach(m => {
        if (m && m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = .3; m.depthWrite = false; m.roughness = Math.min(m.roughness, .1); }
      });
    });
    return c;
  });
}
// coloca o modelo no chão (ou numa superfície) com a altura/largura desejada
function ajustarModelo(obj, { altura, largura, x = 0, y = 0, z = 0, ry = 0 }) {
  obj.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(obj, true), tam = caixa.getSize(new THREE.Vector3());
  const esc = altura ? altura / tam.y : largura / Math.max(tam.x, tam.z);
  obj.scale.multiplyScalar(esc);
  obj.updateMatrixWorld(true);
  const c2 = new THREE.Box3().setFromObject(obj, true), centro = c2.getCenter(new THREE.Vector3());
  const pivo = new THREE.Group();
  obj.position.sub(new THREE.Vector3(centro.x, c2.min.y, centro.z));
  pivo.add(obj); pivo.position.set(x, y, z); pivo.rotation.y = ry;
  return pivo;
}
function ambienteHDR(renderer) {
  if (!envPromessa) envPromessa = new Promise(ok => {
    new EXRLoader().load(BASE + "hdri/apartment.exr", t => {
      const pm = new THREE.PMREMGenerator(renderer);
      t.mapping = THREE.EquirectangularReflectionMapping;
      const env = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose();
      ok(env);
    }, undefined, () => ok(null));
  });
  return envPromessa;
}

/* ---------------- Peças ---------------- */
function malha(geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function bloco(w, h, d, m, x, y, z, raio = .02) { return malha(new RoundedBoxGeometry(w, h, d, 2, Math.min(raio, w / 2.1, h / 2.1, d / 2.1)), m, x, y, z); }
function liso(cor, op = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: .6 }, op)); }
function torneado(perfil, m, x, y, z, seg = 32) {
  return malha(new THREE.LatheGeometry(perfil.map(p => new THREE.Vector2(p[0], p[1])), seg), m, x, y, z);
}
const METAL_PRATA = () => liso("#d7d9dd", { metalness: 1, roughness: .18 });
const METAL_LATAO = () => liso("#c49a45", { metalness: 1, roughness: .28 });
const VIDRO = () => new THREE.MeshPhysicalMaterial({ color: "#e8f2ff", metalness: 0, roughness: .05, transparent: true, opacity: .28, clearcoat: 1, envMapIntensity: 1.5 });

function sala(cena, o) {
  const L = o.largura, P = o.fundo, A = o.altura || 3;
  const piso = malha(new THREE.PlaneGeometry(L, P), o.piso); piso.rotation.x = -Math.PI / 2; piso.castShadow = false; cena.add(piso);
  const paredes = [
    [L, A, 0, A / 2, -P / 2, 0],
    [P, A, -L / 2, A / 2, 0, Math.PI / 2],
    [P, A, L / 2, A / 2, 0, -Math.PI / 2]
  ];
  paredes.forEach(([w, h, x, y, z, r]) => { const m = malha(new THREE.PlaneGeometry(w, h), o.parede, x, y, z); m.rotation.y = r; m.castShadow = false; cena.add(m); });
  if (o.barrado) {
    // meia-parede (azulejo ou lambri) até 1,1 m
    const hb = o.barradoAltura || 1.1;
    [[L, 0, -P / 2 + .005, 0], [P, -L / 2 + .005, 0, Math.PI / 2], [P, L / 2 - .005, 0, -Math.PI / 2]].forEach(([w, x, z, r]) => {
      const m = malha(new THREE.PlaneGeometry(w, hb), o.barrado, x, hb / 2, z); m.rotation.y = r; m.castShadow = false; cena.add(m);
    });
  }
  const madeiraRodape = o.rodapeMat || liso("#2b1d14", { roughness: .5 });
  [[L, 0, -P / 2 + .02, 0], [P, -L / 2 + .02, 0, Math.PI / 2], [P, L / 2 - .02, 0, Math.PI / 2]].forEach(([w, x, z, r]) => {
    const rod = bloco(w, .14, .03, madeiraRodape, x, .07, z, .01); rod.rotation.y = r; cena.add(rod);
    const corn = bloco(w, .09, .06, liso("#d9d2c2", { roughness: .8 }), x, A - .045, z, .01); corn.rotation.y = r; cena.add(corn);
  });
  const teto = malha(new THREE.PlaneGeometry(L, P), liso("#cfc8b8", { roughness: .95 }), 0, A, 0); teto.rotation.x = Math.PI / 2; teto.castShadow = false; cena.add(teto);
  return { L, P, A };
}
function janela(cena, x, y, z, w = 1.2, h = 1.5, ry = 0) {
  const g = new THREE.Group();
  const noite = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: "#0d1a2e" }));
  g.add(noite);
  const vidro = malha(new THREE.PlaneGeometry(w, h), VIDRO(), 0, 0, .02); vidro.castShadow = false; g.add(vidro);
  const mold = liso("#efe9dc", { roughness: .5 });
  g.add(bloco(w + .16, .08, .12, mold, 0, h / 2, .03)); g.add(bloco(w + .16, .08, .16, mold, 0, -h / 2, .05));
  g.add(bloco(.08, h, .12, mold, -w / 2, 0, .03)); g.add(bloco(.08, h, .12, mold, w / 2, 0, .03));
  g.add(bloco(.04, h, .06, mold, 0, 0, .03)); g.add(bloco(w, .04, .06, mold, 0, .1, .03));
  // cortinas
  const tecido = liso("#5b1f22", { roughness: .9, side: THREE.DoubleSide });
  [-1, 1].forEach(s => {
    const geo = new THREE.PlaneGeometry(.45, h + .5, 12, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 22) * .035);
    geo.computeVertexNormals();
    g.add(malha(geo, tecido, s * (w / 2 + .18), -.1, .12));
  });
  g.position.set(x, y, z); g.rotation.y = ry; cena.add(g);
  // luar entrando
  const lua = new THREE.SpotLight(0x8fb2ff, 25, 9, .55, .7, 1.2);
  lua.position.set(x + Math.sin(ry) * -1.5, y + 1.2, z + Math.cos(ry) * -1.5);
  lua.target.position.set(x + Math.sin(ry) * 2, 0, z + Math.cos(ry) * 2.2);
  lua.castShadow = true; lua.shadow.mapSize.set(512, 512); lua.shadow.bias = -.0005;
  cena.add(lua, lua.target);
  return g;
}
// luz do teto: um spot com sombra (barato) + um ponto de luz sem sombra para preencher
function lampadaTeto(cena, x, z, A, cor = 0xffc78a, forca = 18) {
  const s = new THREE.SpotLight(cor, forca * 2.2, 12, 1.15, .85, 1.6);
  s.position.set(x, A - .4, z); s.target.position.set(x, 0, z + .3);
  s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -.0006; s.shadow.radius = 3;
  cena.add(s, s.target);
  const p = new THREE.PointLight(cor, forca * .35, 9, 1.8); p.position.set(x, A - .6, z + 1.2); cena.add(p);
  return s;
}
function mesa(w, d, h, m) {
  const g = new THREE.Group();
  g.add(bloco(w, .05, d, m, 0, h - .025, 0, .015));
  g.add(bloco(w - .1, .1, d - .1, m, 0, h - .1, 0, .01));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(torneado([[0, 0], [.03, 0], [.035, .1], [.025, .3], [.03, h - .18], [0, h - .12]], m, a * (w / 2 - .07), 0, b * (d / 2 - .07), 10)));
  return g;
}
function estante(w, h, m, cores) {
  const g = new THREE.Group();
  g.add(bloco(w, h, .04, m, 0, h / 2, -.16)); g.add(bloco(.04, h, .36, m, -w / 2, h / 2, 0)); g.add(bloco(.04, h, .36, m, w / 2, h / 2, 0));
  const vao = h / 5;
  for (let i = 0; i <= 5; i++) g.add(bloco(w, .03, .36, m, 0, i * vao + .015, 0, .008));
  let semente = 3;
  const rnd = () => (semente = (semente * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 5; i++) {
    let x = -w / 2 + .05;
    while (x < w / 2 - .1) {
      const lw = .03 + rnd() * .04, lh = vao * (.6 + rnd() * .3);
      if (rnd() < .08) { x += .1; continue; }
      const livro = bloco(lw, lh, .22, liso(cores[Math.floor(rnd() * cores.length)], { roughness: .7 }), x + lw / 2, i * vao + .03 + lh / 2, .03, .005);
      livro.rotation.z = rnd() < .1 ? .15 : 0;
      g.add(livro); x += lw + .004;
    }
  }
  return g;
}
function tapete(cena, w, d, x, z, cor1, cor2) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 384;
  const g = c.getContext("2d");
  g.fillStyle = cor1; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = cor2; g.lineWidth = 18; g.strokeRect(20, 20, 472, 344); g.lineWidth = 5; g.strokeRect(52, 52, 408, 280);
  // treliça de losangos com pequenas flores, como um tapete persa simples
  g.lineWidth = 2; g.globalAlpha = .55;
  for (let x = 60; x < 460; x += 40) for (let y = 60; y < 330; y += 40) {
    g.beginPath(); g.moveTo(x + 20, y); g.lineTo(x + 40, y + 20); g.lineTo(x + 20, y + 40); g.lineTo(x, y + 20); g.closePath(); g.stroke();
    g.fillStyle = cor2; g.beginPath(); g.arc(x + 20, y + 20, 4, 0, 7); g.fill();
  }
  g.globalAlpha = 1; g.fillStyle = cor1; g.beginPath(); g.ellipse(256, 192, 70, 50, 0, 0, 7); g.fill();
  g.lineWidth = 6; g.beginPath(); g.ellipse(256, 192, 70, 50, 0, 0, 7); g.stroke();
  g.fillStyle = cor2; g.beginPath(); g.ellipse(256, 192, 26, 18, 0, 0, 7); g.fill();
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? "0,0,0" : "255,255,255"},${Math.random() * .08})`; g.fillRect(Math.random() * 512, Math.random() * 384, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = malha(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }), x, .006, z);
  m.rotation.x = -Math.PI / 2; m.castShadow = false; cena.add(m);
}
function castical() {
  const prata = METAL_PRATA();
  const g = new THREE.Group();
  g.add(torneado([[0, 0], [.1, 0], [.11, .02], [.06, .05], [.03, .09], [.02, .3], [.035, .32], [0, .33]], prata, 0, 0, 0));
  [-1, 1].forEach(s => {
    const braco = new THREE.Mesh(new THREE.TorusGeometry(.08, .009, 8, 20, Math.PI / 2), prata);
    braco.position.set(s * .08, .3, 0); braco.rotation.z = s > 0 ? Math.PI / 2 : Math.PI; braco.castShadow = true; g.add(braco);
  });
  [-.16, 0, .16].forEach(x => {
    g.add(torneado([[0, 0], [.03, 0], [.035, .03], [.02, .04], [0, .04]], prata, x, x ? .38 : .33, 0));
    g.add(malha(new THREE.CylinderGeometry(.014, .016, .16, 12), liso("#f1e8d2", { roughness: .7 }), x, (x ? .38 : .33) + .12, 0));
  });
  return g;
}
function taca() {
  return torneado([[0, 0], [.035, 0], [.036, .004], [.006, .012], [.005, .09], [.01, .1], [.04, .14], [.042, .2], [.04, .2], [.038, .14], [0, .1]], VIDRO(), 0, 0, 0);
}
function bule() {
  const m = liso("#f4efe6", { roughness: .25 });
  const g = new THREE.Group();
  g.add(torneado([[0, 0], [.07, 0], [.095, .04], [.1, .09], [.08, .14], [.03, .16], [.035, .175], [0, .18]], m, 0, 0, 0));
  const bico = malha(new THREE.CylinderGeometry(.012, .02, .12, 10), m, .1, .1, 0); bico.rotation.z = -.9; g.add(bico);
  const alca = malha(new THREE.TorusGeometry(.045, .01, 8, 16, Math.PI), m, -.1, .1, 0); alca.rotation.z = Math.PI / 2; g.add(alca);
  return g;
}
function caixaRotulo(w, h, d, fundo, texto, corTexto) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = c.getContext("2d"); g.fillStyle = fundo; g.fillRect(0, 0, 256, 256);
  g.fillStyle = corTexto; g.font = "bold 56px sans-serif"; g.textAlign = "center"; g.fillText(texto, 128, 120);
  g.font = "bold 28px sans-serif"; g.fillText("☠ VENENO", 128, 180);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return bloco(w, h, d, new THREE.MeshStandardMaterial({ map: t, roughness: .6 }), 0, h / 2, 0, .005);
}
function papelPlano(w, d, cor) { const m = malha(new THREE.PlaneGeometry(w, d), liso(cor, { roughness: .9, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; return m; }

/* ---------------- Marcadores ---------------- */
function texCanvas(w, h, f) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function spriteLupa() {
  const t = texCanvas(128, 128, (g) => {
    g.fillStyle = "rgba(214,165,72,.28)"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.strokeStyle = "#f3cf7a"; g.lineWidth = 8; g.beginPath(); g.arc(56, 56, 26, 0, 7); g.stroke();
    g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(76, 76); g.lineTo(100, 100); g.stroke();
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, sizeAttenuation: false }));
  s.scale.set(.085, .085, 1); s.renderOrder = 10; return s;
}
function placaEvidencia(n) {
  const t = texCanvas(64, 64, (g) => { g.fillStyle = "#f1c232"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#1b1b1b"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 32, 36); });
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ map: t, roughness: .6 });
  const a = malha(new THREE.PlaneGeometry(.12, .1), m, 0, .047, .03); a.rotation.x = -.35; g.add(a);
  const b = malha(new THREE.PlaneGeometry(.12, .1), m, 0, .047, -.03); b.rotation.x = .35; b.rotation.y = Math.PI; g.add(b);
  return g;
}

/* ---------------- As cenas de "O Último Brinde" ---------------- */
const CORES_LIVROS = ["#5a1e1e", "#1e3a5a", "#2e4a2a", "#6b5a2a", "#3a2a4a", "#7a6a4a", "#2a2a2a"];
const CENAS = {
  brinde: {
    // Escritório — pista 0: xícara e taça; pista 1: castiçal de prata
    async l1(cena) {
      const { A } = sala(cena, { largura: 6, fundo: 5, altura: 3, piso: pbr("piso_madeira", [3, 2.5]), parede: pbr("papel_parede", [3, 1.5], { roughness: .9 }), barrado: pbr("madeira_escura", [3, .6]) });
      const mad = pbr("madeira_escura", [1, 1], { roughness: .55 });
      janela(cena, -1.5, 1.75, -2.49);
      tapete(cena, 3, 2.1, .1, .1, "#5a1a1a", "#b48a3c");
      const est = estante(1.8, 2.3, mad, CORES_LIVROS); est.position.set(1.9, 0, -2.3); cena.add(est);
      const m = mesa(1.7, .85, .78, mad); m.position.set(.1, 0, -.7); cena.add(m);
      const [cad, cam, pend] = await Promise.all([modelo("ChairDamaskPurplegold"), modelo("AntiqueCamera"), modelo("AnisotropyBarnLamp")]);
      cena.add(ajustarModelo(cad, { altura: 1, x: .1, z: .05, ry: Math.PI }));
      cena.add(ajustarModelo(cam, { altura: .25, x: 2.2, y: 1.39, z: -2.25, ry: .5 }));
      cena.add(ajustarModelo(pend, { altura: .45, x: .1, y: A - .5, z: -.7 }));
      const mesinha = mesa(.55, .45, .72, mad); mesinha.position.set(-2.4, 0, -1.5); cena.add(mesinha);
      // livro-caixa, papéis e a xícara com a taça
      cena.add(bloco(.3, .035, .22, liso("#23395a", { roughness: .6 }), -.45, .8, -.75, .005));
      const folha = papelPlano(.21, .29, "#efe8d6"); folha.position.set(.55, .785, -.6); folha.rotation.z = .3; cena.add(folha);
      const xic = await modelo("DiffuseTransmissionTeacup");
      const xt = new THREE.Group();
      xt.add(ajustarModelo(xic, { largura: .17, x: 0, z: 0 }));
      const tc = taca(); tc.position.set(.2, 0, -.05); xt.add(tc);
      xt.position.set(-.15, .78, -.5); cena.add(xt);
      const ca = castical(); ca.position.set(-2.4, .72, -1.5); cena.add(ca);
      lampadaTeto(cena, .1, -.7, A, 0xffc78a, 16);
      return {
        alvo: [-.3, .95, -.7], camera: [.3, 2.2, 3.6],
        objetos: [
          { indice: 0, obj: xt, nome: "Xícara de chá e taça do brinde", lupa: [-.05, 1.2, -.5] },
          { indice: 1, obj: ca, nome: "Castiçal de prata", lupa: [-2.4, 1.4, -1.5] }
        ]
      };
    },
    // Cozinha — pista 0: bandeja no corredor; pista 1: veneno de rato na despensa
    async l2(cena) {
      const { A } = sala(cena, { largura: 6.5, fundo: 5, altura: 3, piso: pbr("ladrilho", [3, 2.3]), parede: pbr("gesso", [2, 1]), barrado: pbr("azulejo_branco", [5, .8], { roughness: .3 }), barradoAltura: 1.4 });
      const mad = pbr("madeira_escura", [1, 1], { roughness: .5 });
      const tampo = liso("#d8d2c6", { roughness: .25 });
      for (let i = 0; i < 4; i++) {
        cena.add(bloco(.88, .86, .6, mad, -1.4 + i * .9, .43, -2.18, .02));
        cena.add(bloco(.9, .04, .64, tampo, -1.4 + i * .9, .88, -2.16, .01));
        cena.add(bloco(.15, .02, .02, METAL_LATAO(), -1.4 + i * .9, .7, -1.87, .005));
      }
      janela(cena, -.5, 1.9, -2.49, 1.1, 1);
      // fogão a lenha esmaltado
      const fog = new THREE.Group();
      fog.add(bloco(1, .85, .65, liso("#e8e3d6", { roughness: .3 }), 0, .425, 0, .04));
      fog.add(bloco(1, .04, .65, liso("#1a1a1a", { roughness: .4, metalness: .6 }), 0, .87, 0));
      [-.25, .25].forEach(x => fog.add(torneado([[0, 0], [.13, 0], [.12, .14], [.13, .15], [0, .15]], liso("#8a6a4a", { metalness: .8, roughness: .35 }), x, .89, 0)));
      fog.position.set(2.5, 0, -2.15); cena.add(fog);
      cena.add(bloco(.8, 1.85, .7, liso("#efebe2", { roughness: .3 }), 2.8, .93, -.6, .08));
      // porta do corredor e a mesinha com a bandeja
      cena.add(bloco(1.05, 2.25, .06, liso("#0e0b08"), -3.22, 1.12, .7, .01));
      const m = mesa(.65, .42, .78, mad); m.position.set(-2.6, 0, .7); cena.add(m);
      const [xic, vaso] = await Promise.all([modelo("DiffuseTransmissionTeacup"), modelo("GlassVaseFlowers")]);
      const bandeja = new THREE.Group();
      bandeja.add(bloco(.46, .02, .32, METAL_PRATA(), 0, .01, 0, .008));
      bandeja.add(ajustarModelo(xic, { largura: .14, x: -.1, y: .02, z: 0 }));
      const b = bule(); b.position.set(.11, .02, .01); bandeja.add(b);
      bandeja.position.set(-2.6, .78, .7); cena.add(bandeja);
      cena.add(ajustarModelo(vaso, { altura: .45, x: .9, y: .9, z: -2.2 }));
      // despensa com a caixa de veneno
      const desp = new THREE.Group();
      desp.add(bloco(1.1, 2, .04, mad, 0, 1, -.2)); desp.add(bloco(.04, 2, .44, mad, -.55, 1, 0)); desp.add(bloco(.04, 2, .44, mad, .55, 1, 0));
      [.05, .55, 1.05, 1.55, 2].forEach(y => desp.add(bloco(1.1, .03, .44, mad, 0, y, 0, .005)));
      ["#c8a046", "#9a3b2c", "#e0d6b8", "#5b7a3a"].forEach((c, i) => desp.add(bloco(.16, .24, .12, liso(c, { roughness: .7 }), -.36 + i * .24, 1.19, 0, .01)));
      [0, 1, 2].forEach(i => desp.add(torneado([[0, 0], [.06, 0], [.06, .18], [.045, .2], [0, .2]], VIDRO(), -.3 + i * .3, .58, 0)));
      desp.position.set(2.75, 0, 1.2); desp.rotation.y = -Math.PI / 2; cena.add(desp);
      const veneno = caixaRotulo(.15, .2, .1, "#b8261c", "RATO", "#ffe36b");
      const vg = new THREE.Group(); vg.add(veneno); vg.position.set(2.75, 1.58, 1.0); vg.rotation.y = -Math.PI / 2; cena.add(vg);
      lampadaTeto(cena, 0, -.6, A, 0xffd9a8, 18);
      return {
        alvo: [0, 1, -.4], camera: [0, 2.2, 3.8],
        objetos: [
          { indice: 0, obj: bandeja, nome: "Bandeja do chá no corredor", lupa: [-2.6, 1.15, .7] },
          { indice: 1, obj: vg, nome: "Caixa de veneno de rato", lupa: [2.65, 2.0, 1.0] }
        ]
      };
    },
    // Armário de remédios — pista 0: cartela e caderno; pista 1: fechadura e quadro de chaves
    async l3(cena) {
      const { A } = sala(cena, { largura: 5.5, fundo: 4.5, altura: 3, piso: pbr("azulejo_branco", [4, 3.3], { roughness: .35 }), parede: pbr("papel_verde", [2.5, 1.4], { roughness: .9 }) });
      const branco = liso("#ece8df", { roughness: .4 });
      const arm = new THREE.Group();
      arm.add(bloco(1.6, 1.3, .03, branco, 0, 0, -.18)); arm.add(bloco(.04, 1.3, .4, branco, -.78, 0, 0)); arm.add(bloco(.04, 1.3, .4, branco, .78, 0, 0));
      arm.add(bloco(1.6, .04, .4, branco, 0, .65, 0)); arm.add(bloco(1.6, .04, .4, branco, 0, -.65, 0));
      [-.25, .2].forEach(y => arm.add(bloco(1.52, .02, .36, VIDRO(), 0, y, 0, .005)));
      const vd = VIDRO(); [-.39, .39].forEach(x => { const p = malha(new THREE.BoxGeometry(.76, 1.24, .01), vd, x, 0, .2); p.castShadow = false; arm.add(p); });
      ["#f6f6f6", "#c87f2a", "#3e6fa8", "#c9473e", "#f6f6f6"].forEach((c, i) => arm.add(torneado([[0, 0], [.045, 0], [.045, .13], [.03, .15], [.02, .17], [0, .17]], c === "#c87f2a" ? new THREE.MeshPhysicalMaterial({ color: c, transparent: true, opacity: .7, roughness: .1 }) : liso(c, { roughness: .35 }), -.6 + i * .3, -.23, 0)));
      [0, 1, 2, 3].forEach(i => arm.add(bloco(.18, .1, .06, liso(["#fff", "#cfe3f5", "#f5e3cf", "#fff"][i], { roughness: .6 }), -.5 + i * .33, .27, 0, .005)));
      arm.position.set(0, 1.65, -2.04); cena.add(arm);
      const fech = new THREE.Group();
      fech.add(bloco(.1, .13, .035, METAL_LATAO(), 0, 0, 0, .01));
      const arco = malha(new THREE.TorusGeometry(.04, .009, 10, 20, Math.PI), METAL_PRATA(), 0, .07, 0); fech.add(arco);
      fech.position.set(0, 1.62, -1.82); cena.add(fech);
      cena.add(bloco(1.9, .88, .55, liso("#6f7e78", { roughness: .5 }), 0, .44, -1.98, .02));
      cena.add(bloco(1.94, .04, .58, liso("#e7e2d8", { roughness: .25 }), 0, .9, -1.97, .01));
      const cad = new THREE.Group();
      cad.add(bloco(.28, .03, .2, liso("#7a1e1e", { roughness: .6 }), 0, .015, 0, .005));
      cad.add(bloco(.26, .028, .19, liso("#efe8d6"), .006, .017, 0, .003));
      const cart = bloco(.2, .006, .12, liso("#dfe6ec", { metalness: .6, roughness: .3 }), .2, .035, .06, .002); cart.rotation.y = .4; cad.add(cart);
      cad.position.set(-.45, .92, -1.85); cena.add(cad);
      const chaves = new THREE.Group();
      chaves.add(bloco(.5, .35, .03, pbr("madeira_escura", [.5, .4]), 0, 0, 0, .01));
      [-.15, 0, .15].forEach((x, i) => { chaves.add(malha(new THREE.CylinderGeometry(.008, .008, .05, 8), METAL_PRATA(), x, .08, .03)); if (i !== 1) chaves.add(bloco(.025, .09, .008, METAL_LATAO(), x, 0, .035, .004)); });
      chaves.position.set(1.85, 1.5, -2.2); cena.add(chaves);
      const cad2 = await modelo("SheenChair");
      cena.add(ajustarModelo(cad2, { altura: .85, x: -1.9, z: -.3, ry: .7 }));
      lampadaTeto(cena, 0, -1, A, 0xfff2dc, 16);
      return {
        alvo: [0, 1.25, -1.3], camera: [0, 1.9, 3],
        objetos: [
          { indice: 0, obj: cad, nome: "Cartela de comprimidos e caderno de controle", lupa: [-.4, 1.25, -1.8] },
          { indice: 1, obj: new THREE.Group(), alvoObjs: [fech, chaves], nome: "Fechadura do armário e quadro de chaves", lupa: [.3, 2.05, -1.75] }
        ]
      };
    },
    // Sala da lareira — pista 0: papéis nas cinzas; pista 1: registro da chaminé
    async l4(cena) {
      const { A } = sala(cena, { largura: 6.5, fundo: 5.5, altura: 3, piso: pbr("piso_madeira", [3, 2.6]), parede: pbr("papel_parede", [3.2, 1.5], { roughness: .9 }), barrado: pbr("madeira_escura", [3, .6]) });
      janela(cena, 2.2, 1.75, -2.74, 1, 1.4);
      tapete(cena, 2.8, 1.9, 0, .5, "#26314a", "#a8823a");
      const pedra = pbr("pedra", [1.5, 1]);
      const lar = new THREE.Group();
      lar.add(bloco(.55, 1.3, .6, pedra, -.725, .65, 0, .03)); lar.add(bloco(.55, 1.3, .6, pedra, .725, .65, 0, .03));
      lar.add(bloco(2, .35, .6, pedra, 0, 1.12, 0, .03));
      lar.add(bloco(2.3, .1, .75, pbr("madeira_escura", [1, .3]), 0, 1.35, .05, .02));
      lar.add(bloco(.9, .95, .1, liso("#0b0806", { roughness: 1 }), 0, .47, -.25));
      lar.add(bloco(2.1, .06, .9, pedra, 0, .03, .2, .02));
      lar.add(bloco(.7, 1.7, .5, pedra, 0, 2.15, -.05, .03));
      lar.position.set(0, 0, -2.45); cena.add(lar);
      const [braseiro, sofa, poltrona, lanterna] = await Promise.all([modelo("PotOfCoals"), modelo("GlamVelvetSofa"), modelo("SheenChair"), modelo("Lantern")]);
      const cinzas = new THREE.Group();
      cinzas.add(ajustarModelo(braseiro, { largura: .55 }));
      [[.08, .02, -.05, .3], [-.1, .03, .06, -.6], [.02, .025, .1, 1.2]].forEach(([x, y, z, r]) => {
        const p = papelPlano(.11, .08, Math.random() < .5 ? "#d9d2c0" : "#5a4a3a"); p.position.set(x, .2 + y, z); p.rotation.z = r; cinzas.add(p);
      });
      cinzas.position.set(0, .06, -2.3); cena.add(cinzas);
      const brasa = new THREE.PointLight(0xff6a2a, 4, 4, 2); brasa.position.set(0, .45, -2.1); cena.add(brasa);
      const registro = new THREE.Group();
      registro.add(bloco(.05, .45, .05, liso("#1c1c1c", { metalness: .7, roughness: .5 }), 0, 0, 0, .01));
      registro.add(bloco(.18, .035, .05, liso("#2a2a2a", { metalness: .7, roughness: .5 }), .07, .2, 0, .01));
      registro.add(torneado([[0, 0], [.03, 0], [.03, .04], [0, .05]], METAL_LATAO(), .16, .18, 0));
      registro.position.set(.62, .95, -2.1); cena.add(registro);
      cena.add(ajustarModelo(sofa, { largura: 2.1, x: 0, z: 1.9, ry: Math.PI }));
      cena.add(ajustarModelo(poltrona, { altura: .85, x: -2.2, z: -.7, ry: Math.PI / 3 }));
      cena.add(ajustarModelo(lanterna, { altura: .35, x: .85, y: 1.4, z: -2.35 }));
      const quadro = malha(new THREE.PlaneGeometry(.9, .7), new THREE.MeshStandardMaterial({ roughness: .8, map: texCanvas(180, 140, (g) => { const gr = g.createLinearGradient(0, 0, 0, 140); gr.addColorStop(0, "#5a6a7a"); gr.addColorStop(1, "#2a3a1a"); g.fillStyle = gr; g.fillRect(0, 0, 180, 140); g.fillStyle = "#1e2a12"; g.beginPath(); g.moveTo(0, 100); g.lineTo(60, 60); g.lineTo(120, 90); g.lineTo(180, 56); g.lineTo(180, 140); g.lineTo(0, 140); g.fill(); g.strokeStyle = "#b8962e"; g.lineWidth = 12; g.strokeRect(0, 0, 180, 140); }) }), -2, 1.85, -2.74);
      cena.add(quadro);
      lampadaTeto(cena, 0, .3, A, 0xffc078, 9);
      return {
        alvo: [0, .95, -1.4], camera: [0, 2, 3.6],
        objetos: [
          { indice: 0, obj: cinzas, nome: "Papéis queimados nas cinzas", lupa: [0, .75, -2.2] },
          { indice: 1, obj: registro, nome: "Registro da chaminé", lupa: [.8, 1.5, -2.05] }
        ],
        extra: brasa
      };
    },
    // Garagem — pista 0: pasta no carro; pista 1: papel-alumínio no tapete
    async l5(cena) {
      const { A } = sala(cena, { largura: 7.5, fundo: 6.5, altura: 3, piso: pbr("concreto", [2.5, 2.2]), parede: pbr("gesso", [6, 2.4], { color: "#c9c4ba", normalScale: new THREE.Vector2(.4, .4) }), rodapeMat: liso("#4a4740") });
      const [carroM, lamp] = await Promise.all([modelo("CarConcept"), modelo("Lantern")]);
      const carro = ajustarModelo(carroM, { largura: 4.3, x: -.4, z: -.3, ry: Math.PI / 2 + .12 });
      cena.add(carro);
      const pasta = new THREE.Group();
      pasta.add(bloco(.36, .04, .26, liso("#7a5a2a", { roughness: .6 }), 0, .02, 0, .01));
      pasta.add(bloco(.3, .01, .2, liso("#efe8d6"), .02, .045, 0, .003));
      pasta.position.set(-.15, .62, -.1); pasta.rotation.y = .3; cena.add(pasta);
      const tapeteCarro = malha(new THREE.PlaneGeometry(.7, .5), liso("#1e1e1e", { roughness: 1 }), 1.15, .008, .95); tapeteCarro.rotation.x = -Math.PI / 2; tapeteCarro.castShadow = false; cena.add(tapeteCarro);
      const alum = malha(new THREE.PlaneGeometry(.1, .07, 4, 4), liso("#e4e8ee", { metalness: 1, roughness: .2, side: THREE.DoubleSide }), 1.2, .015, 1);
      alum.rotation.x = -Math.PI / 2; alum.rotation.z = .6; cena.add(alum);
      const alvoAl = new THREE.Group(); alvoAl.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .4), new THREE.MeshBasicMaterial({ visible: false }))); alvoAl.position.set(1.15, .05, .95); cena.add(alvoAl);
      const metal = liso("#5a5248", { metalness: .6, roughness: .5 });
      const prat = new THREE.Group();
      prat.add(bloco(.05, 2, .05, metal, -.75, 1, -.18)); prat.add(bloco(.05, 2, .05, metal, .75, 1, -.18)); prat.add(bloco(.05, 2, .05, metal, -.75, 1, .18)); prat.add(bloco(.05, 2, .05, metal, .75, 1, .18));
      [.4, 1, 1.6].forEach(y => prat.add(bloco(1.55, .03, .4, metal, 0, y, 0, .005)));
      prat.add(torneado([[0, 0], [.1, 0], [.1, .25], [.03, .28], [.03, .3], [0, .3]], liso("#b53a2a", { metalness: .5, roughness: .4 }), -.45, .42, 0));
      prat.add(torneado([[0, 0], [.1, 0], [.1, .25], [.03, .28], [.03, .3], [0, .3]], liso("#2a6ab5", { metalness: .5, roughness: .4 }), -.15, .42, 0));
      prat.add(bloco(.45, .22, .3, liso("#6a7a3a", { roughness: .7 }), .4, 1.13, 0, .01));
      prat.position.set(3.5, 0, -1.6); prat.rotation.y = -Math.PI / 2; cena.add(prat);
      cena.add(ajustarModelo(lamp, { altura: .4, x: 3.55, y: 1.65, z: -.6 }));
      const tubo = bloco(1.3, .05, .12, liso("#ffffff", { emissive: "#eef4ff", emissiveIntensity: 2 }), .3, A - .03, .2); cena.add(tubo);
      const luzTubo = new THREE.SpotLight(0xe8f0ff, 40, 10, 1.1, .9, 1.5); luzTubo.position.set(.3, A - .1, .2); luzTubo.target.position.set(.3, 0, .2);
      luzTubo.castShadow = true; luzTubo.shadow.mapSize.set(1024, 1024); luzTubo.shadow.bias = -.0008; cena.add(luzTubo, luzTubo.target);
      return {
        alvo: [.1, .7, .1], camera: [4.4, 2.9, 5.4],
        objetos: [
          { indice: 0, obj: pasta, alvoObjs: [carro], nome: "Pasta no banco do carro", lupa: [-.15, 1.45, -.1] },
          { indice: 1, obj: alvoAl, nome: "Tapete do carro", lupa: [1.2, .4, 1] }
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
    <div class="c3-palco"><div class="c3-carregando"><div class="girando"></div><div>Montando a cena…</div></div></div>
    <div class="c3-rodape"><div class="c3-dica">Arraste para olhar em volta · dois dedos para aproximar · toque na 🔍 para examinar</div><div class="c3-acoes"></div></div>`;
  document.body.appendChild(raiz);
  const palco = raiz.querySelector(".c3-palco");

  const renderer = new THREE.WebGLRenderer({ antialias: !leve, powerPreference: "high-performance" });
  renderer.setPixelRatio(leve ? 1 : Math.min(1.75, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = !leve;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  palco.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x050608);
  cena.fog = new THREE.Fog(0x050608, 12, 30);
  const camera = new THREE.PerspectiveCamera(50, 1, .05, 60);
  const lanterna = new THREE.SpotLight(0xfff2d6, 6, 12, .45, .7, 1.3);
  camera.add(lanterna); lanterna.position.set(.2, -.2, 0); lanterna.target.position.set(0, 0, -1); camera.add(lanterna.target);
  cena.add(camera);
  const controles = new OrbitControls(camera, renderer.domElement);
  controles.enableDamping = true; controles.dampingFactor = .08; controles.enablePan = false;
  controles.minDistance = 1; controles.minPolarAngle = .25; controles.maxPolarAngle = 1.5;

  let info = null, parar = false, pendentes = [], quadros = 0, fotoTirada = false;
  const relogio = new THREE.Clock(), t0 = performance.now();
  const alvos = [];

  function ajustar() {
    const w = palco.clientWidth || window.innerWidth, h = palco.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  ajustar();
  window.addEventListener("resize", ajustar);

  function enquadrar() {
    const pts = info.objetos.map(o => new THREE.Vector3(...o.lupa)).concat([new THREE.Vector3(...info.alvo)]);
    const alvo = controles.target.clone();
    const dir = new THREE.Vector3(...info.camera).sub(alvo).normalize();
    let d = Math.max(2.2, new THREE.Vector3(...info.camera).distanceTo(alvo));
    for (let i = 0; i < 40; i++) {
      camera.position.copy(alvo).addScaledVector(dir, d); camera.lookAt(alvo); camera.updateMatrixWorld();
      if (pts.every(p => { const v = p.clone().project(camera); return Math.abs(v.x) < .86 && Math.abs(v.y) < .8 && v.z < 1; })) break;
      d *= 1.06;
    }
    controles.maxDistance = Math.max(6, d * 1.25);
    controles.update();
  }
  function marcarVisto(o, animar) {
    o.visto = true; o.lupaSprite.visible = false;
    if (o.placa) return;
    const p = placaEvidencia(o.indice + 1);
    const ray = new THREE.Raycaster(new THREE.Vector3(o.lupa[0] + .15, o.lupa[1], o.lupa[2] + .12), new THREE.Vector3(0, -1, 0));
    ray.camera = camera;
    const hits = ray.intersectObjects(cena.children, true).filter(h => h.object.isMesh && h.object.visible !== false && h.object.material && h.object.material.visible !== false);
    p.position.set(o.lupa[0] + .15, hits.length ? hits[0].point.y : 0, o.lupa[2] + .12);
    cena.add(p); o.placa = p;
    if (animar) { p.scale.set(.01, .01, .01); o.crescer = 0; }
  }
  function destacar(o) {
    o.malhas.forEach(m => {
      if (!m.material || !m.material.emissive) return;
      if (!m.userData.matOrig) { m.userData.matOrig = m.material; m.material = m.material.clone(); }
      m.material.emissive = new THREE.Color(0xd6a548); m.material.emissiveIntensity = .6;
    });
    o.brilho = 1;
  }

  // toque sem arrastar = examinar
  const ray = new THREE.Raycaster(), ponto = new THREE.Vector2();
  let ini = null;
  renderer.domElement.addEventListener("pointerdown", e => { ini = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!ini || !info) return;
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

  function quadro() {
    if (parar) return;
    requestAnimationFrame(quadro);
    if (!info) return;
    const dt = relogio.getDelta(), t = (performance.now() - t0) / 1000;
    controles.update();
    if (info.extra) info.extra.intensity = 4 + Math.sin(t * 9) * .7 + Math.random() * .5;
    info.objetos.forEach(o => {
      if (o.lupaSprite.visible) { const s = .085 + Math.sin(t * 3 + o.indice) * .01; o.lupaSprite.scale.set(s, s, 1); }
      if (o.brilho > 0) {
        o.brilho = Math.max(0, o.brilho - dt * 1.2);
        o.malhas.forEach(m => { if (m.userData.matOrig) { m.material.emissiveIntensity = o.brilho * .6; if (o.brilho === 0) { m.material.dispose(); m.material = m.userData.matOrig; delete m.userData.matOrig; } } });
      }
      if (o.placa && o.crescer != null) { o.crescer = Math.min(1, o.crescer + dt * 3); const s = .01 + o.crescer * .99; o.placa.scale.set(s, s, s); if (o.crescer >= 1) o.crescer = null; }
    });
    renderer.render(cena, camera);
    quadros++;
    if (!fotoTirada && quadros === 25 && opts.aoFoto) { fotoTirada = true; opts.aoFoto(tirarFoto()); }
  }
  quadro();

  // monta a cena (modelos e iluminação carregam em paralelo)
  Promise.all([montar(cena), ambienteHDR(renderer)]).then(([inf, env]) => {
    if (parar) return;
    info = inf;
    if (env) { cena.environment = env; cena.environmentIntensity = .35; }
    cena.add(new THREE.HemisphereLight(0x9bb0d0, 0x2a1d12, .25));
    camera.position.set(...info.camera);
    controles.target.set(...info.alvo);
    const az = Math.atan2(info.camera[0] - info.alvo[0], info.camera[2] - info.alvo[2]);
    controles.minAzimuthAngle = az - 1.2; controles.maxAzimuthAngle = az + 1.2;
    controles.update();
    const vistas = new Set(opts.vistas || []);
    info.objetos.forEach((o) => {
      const lupa = spriteLupa(); lupa.position.set(...o.lupa); lupa.userData.obj = o; cena.add(lupa); o.lupaSprite = lupa;
      const malhas = [];
      [o.obj].concat(o.alvoObjs || []).forEach(x => x.traverse(m => { if (m.isMesh) { m.userData.obj = o; malhas.push(m); } }));
      o.malhas = malhas; alvos.push(lupa, ...malhas);
    });
    if (leve) cena.traverse(o => { if (o.isLight) o.castShadow = false; });
    enquadrar();
    info.objetos.forEach(o => { if (vistas.has(o.indice)) marcarVisto(o, false); });
    const c = palco.querySelector(".c3-carregando"); if (c) c.remove();
    pendentes.forEach(f => f()); pendentes = [];
  }).catch((e) => {
    const c = palco.querySelector(".c3-carregando");
    if (c) c.innerHTML = "Não deu para montar a cena neste celular.";
    console.error(e);
  });

  function tirarFoto() {
    try {
      renderer.render(cena, camera);
      const src = renderer.domElement, c = document.createElement("canvas"); c.width = 640; c.height = 480;
      const g = c.getContext("2d"), r = Math.max(640 / src.width, 480 / src.height);
      g.drawImage(src, (640 - src.width * r) / 2, (480 - src.height * r) / 2, src.width * r, src.height * r);
      return c.toDataURL("image/jpeg", .78);
    } catch (e) { return null; }
  }
  function fechar() {
    if (parar) return;
    parar = true;
    window.removeEventListener("resize", ajustar);
    controles.dispose();
    cena.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) {}
    raiz.remove();
    opts.aoFechar && opts.aoFechar();
  }
  raiz.querySelector(".c3-fechar").addEventListener("click", fechar);

  return {
    marcar(indice) { const f = () => { const o = info.objetos.find(x => x.indice === indice); if (o) marcarVisto(o, true); }; info ? f() : pendentes.push(f); },
    acoes(txt) { raiz.querySelector(".c3-acoes").innerHTML = txt; },
    pronta() { return !!info; },
    foto: tirarFoto,
    posicoes() {
      if (!info) return [];
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
