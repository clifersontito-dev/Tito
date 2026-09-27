/* Globo de Arton: um plugin do Obsidian para o cofre de campanha do Tito.
 * Mostra as notas do cofre como pontos brilhantes na superfície de um globo 3D,
 * ligados pelos links entre as notas, e cria notas novas a partir dos modelos. */
'use strict';

const obsidian = require('obsidian');
/*__THREE__*/

const VIEW_TYPE = 'globo-arton-view';

// Ordem, nome, cor e pasta de cada tipo de nota. A ordem define onde cada grupo nasce no globo.
const TIPOS = [
  { id: 'indice',  nome: 'Índices',        cor: '#ffffff', pasta: null },
  { id: 'deus',    nome: 'Deuses',         cor: '#ffc857', pasta: '02 Mundo/Deuses',            modelo: 'Deus' },
  { id: 'raca',    nome: 'Raças',          cor: '#ff9ebb', pasta: '02 Mundo/Raças',             modelo: 'Raça' },
  { id: 'reino',   nome: 'Reinos',         cor: '#c77dff', pasta: '02 Mundo/Reinos e Regiões',  modelo: 'Reino' },
  { id: 'local',   nome: 'Locais',         cor: '#9d6bff', pasta: '02 Mundo/Locais',            modelo: 'Local' },
  { id: 'faccao',  nome: 'Facções',        cor: '#ff5d8f', pasta: '02 Mundo/Facções',           modelo: 'Facção' },
  { id: 'evento',  nome: 'Eventos',        cor: '#8fb8ff', pasta: '02 Mundo/Eras e Eventos',    modelo: 'Evento' },
  { id: 'monstro', nome: 'Bestiário',      cor: '#ff4fd8', pasta: '04 Bestiário',               modelo: 'Monstro' },
  { id: 'item',    nome: 'Itens',          cor: '#5eead4', pasta: '05 Itens e Artefatos',       modelo: 'Item' },
  { id: 'npc',     nome: 'NPCs',           cor: '#7dd3fc', pasta: '03 Personagens/NPCs',        modelo: 'NPC' },
  { id: 'pj',      nome: 'Jogadores',      cor: '#fde68a', pasta: '03 Personagens/Jogadores',   modelo: 'Jogador' },
  { id: 'arco',    nome: 'Arcos',          cor: '#ffa94d', pasta: '01 Campanha/Arcos',          modelo: 'Arco' },
  { id: 'caminho', nome: 'Caminhos',       cor: '#e0aaff', pasta: '01 Campanha/Caminhos',       modelo: 'Caminho' },
  { id: 'ameaca',  nome: 'Ameaças',        cor: '#ff3b5c', pasta: '01 Campanha/Ameaças',        modelo: 'Ameaça' },
  { id: 'segredo', nome: 'Segredos',       cor: '#b8f2e6', pasta: '01 Campanha/Segredos e Pistas', modelo: 'Segredo' },
  { id: 'sessao',  nome: 'Sessões',        cor: '#f5f3ff', pasta: '01 Campanha/Sessões',        modelo: 'Sessão' },
  { id: 'ideia',   nome: 'Inbox',          cor: '#ffd6a5', pasta: '00 Inbox',                   modelo: 'Ideia' },
  { id: 'outro',   nome: 'Outros',         cor: '#94a3b8', pasta: null },
];
const TIPO = Object.fromEntries(TIPOS.map((t) => [t.id, t]));

// Botões de "criar" (ordem em que aparecem no painel).
const CRIAVEIS = ['sessao', 'npc', 'local', 'caminho', 'ameaca', 'segredo', 'ideia', 'monstro', 'item',
  'faccao', 'evento', 'arco', 'pj', 'reino', 'deus', 'raca'];

const IGNORAR = ['99 Sistema/', 'CLAUDE.md', 'COMO-ABRIR.md'];

function semAcento(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function tipoDaNota(path, fm) {
  const t = semAcento(fm && fm.tipo);
  if (t && TIPO[t]) return t;
  for (const tp of TIPOS) if (tp.pasta && path.startsWith(tp.pasta + '/')) return tp.id;
  return 'outro';
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

function hojeISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- Dados: notas e links do cofre ---------- */

function coletarGrafo(app) {
  const nodes = [];
  const porId = new Map();
  for (const f of app.vault.getMarkdownFiles()) {
    if (IGNORAR.some((p) => f.path === p || f.path.startsWith(p))) continue;
    const cache = app.metadataCache.getFileCache(f);
    const fm = (cache && cache.frontmatter) || {};
    const n = { id: f.path, nome: f.basename, tipo: tipoDaNota(f.path, fm), file: f, grau: 0, viz: [] };
    nodes.push(n);
    porId.set(n.id, n);
  }
  const links = [];
  const vistos = new Set();
  const rl = app.metadataCache.resolvedLinks || {};
  for (const src in rl) {
    const a = porId.get(src);
    if (!a) continue;
    for (const dst in rl[src]) {
      const b = porId.get(dst);
      if (!b || a === b) continue;
      const k = a.id < b.id ? a.id + '\n' + b.id : b.id + '\n' + a.id;
      if (vistos.has(k)) continue;
      vistos.add(k);
      links.push({ a, b });
      a.grau++; b.grau++;
      a.viz.push(b); b.viz.push(a);
    }
  }
  return { nodes, links };
}

/* ---------- Layout: força dirigida presa à superfície da esfera ---------- */

function centrosDosTipos() {
  // Pontos bem espalhados (espiral de Fibonacci) para cada tipo.
  // Intercala grupos grandes (cânone) e da campanha para cobrir o globo inteiro.
  const ids = ['indice', 'deus', 'ameaca', 'raca', 'caminho', 'reino', 'npc', 'monstro', 'sessao', 'local',
    'faccao', 'segredo', 'evento', 'arco', 'item', 'pj', 'ideia', 'outro'];
  const n = ids.length;
  const out = {};
  const ouro = Math.PI * (3 - Math.sqrt(5));
  ids.forEach((id, i) => {
    const y = 0.85 - (i / (n - 1)) * 1.7;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ouro * i;
    out[id] = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).normalize();
  });
  return out;
}

function calcularLayout(nodes, links, anteriores) {
  const centros = centrosDosTipos();
  const P = nodes.map((n) => {
    const antes = anteriores && anteriores.get(n.id);
    if (antes) return antes.clone();
    const c = centros[n.tipo] || centros.outro;
    const j = new THREE.Vector3(hash(n.id + 'x') - 0.5, hash(n.id + 'y') - 0.5, hash(n.id + 'z') - 0.5).multiplyScalar(0.55);
    return c.clone().add(j).normalize();
  });
  const idx = new Map(nodes.map((n, i) => [n, i]));
  const L = links.map((l) => [idx.get(l.a), idx.get(l.b)]);
  const N = P.length;
  const iter = anteriores && anteriores.size ? 80 : (N > 600 ? 140 : 260);
  const F = P.map(() => new THREE.Vector3());
  const d = new THREE.Vector3();
  const kRep = 0.16 / Math.max(N, 60);
  for (let it = 0; it < iter; it++) {
    const temp = 0.06 * (1 - it / iter) + 0.004;
    for (const f of F) f.set(0, 0, 0);
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        d.subVectors(P[i], P[j]);
        const d2 = d.lengthSq() + 0.0008;
        d.multiplyScalar(kRep / Math.sqrt(d2));
        F[i].add(d); F[j].sub(d);
      }
    }
    for (const [a, b] of L) {
      d.subVectors(P[b], P[a]);
      const dist = d.length() + 1e-6;
      d.multiplyScalar(((dist - 0.06) * 0.03) / dist);
      F[a].add(d); F[b].sub(d);
    }
    for (let i = 0; i < N; i++) {
      const c = centros[nodes[i].tipo] || centros.outro;
      d.subVectors(c, P[i]).multiplyScalar(nodes[i].tipo === 'indice' ? 0.004 : 0.055);
      F[i].add(d);
      const m = F[i].length();
      if (m > temp) F[i].multiplyScalar(temp / m);
      P[i].add(F[i]).normalize();
    }
  }
  const out = new Map();
  nodes.forEach((n, i) => out.set(n.id, P[i]));
  return out;
}

/* ---------- Texturas e shaders ---------- */

function texturaBrilho(cor) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, cor);
  gr.addColorStop(0.25, cor);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

const VERT_PONTOS = `
attribute float size;
attribute float alpha;
attribute vec3 cor;
uniform float escala;
varying vec3 vCor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 mundo = (modelMatrix * vec4(position, 1.0)).xyz;
  float frente = dot(normalize(mundo), normalize(cameraPosition - mundo));
  vAlpha = alpha * mix(0.18, 1.0, smoothstep(-0.25, 0.35, frente));
  vCor = cor;
  gl_PointSize = size * escala / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG_PONTOS = `
varying vec3 vCor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float nucleo = smoothstep(0.16, 0.0, d);
  float halo = exp(-d * d * 14.0);
  vec3 c = vCor * halo + vec3(1.0) * nucleo * 0.85;
  gl_FragColor = vec4(c * vAlpha, vAlpha * halo);
}`;

/* ---------- O globo ---------- */

class Globo {
  constructor(plugin, container, opcoes) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.opc = Object.assign({ compacto: false }, opcoes || {});
    this.root = el('div', 'arton-globo' + (this.opc.compacto ? ' is-compacto' : ''), container);
    this.ocultos = new Set();
    this.selecionado = null;
    this.hover = null;
    this.girando = true;
    this.ultimoToque = 0;
    this.layout = null;
    this.vel = { x: 0, y: 0 };
    this.foco = null;
    this.yaw = 0;
    this.pitch = 0.14;
    this.montarCena();
    this.montarUI();
    this.recarregar();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  montarCena() {
    const canvasBox = el('div', 'arton-globo-canvas', this.root);
    this.canvasBox = canvasBox;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setClearColor(0x000000, 0);
    canvasBox.appendChild(r.domElement);
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
    this.camera.position.set(0, 0, this.opc.compacto ? 3.25 : 3.0);
    this.globo = new THREE.Group();
    this.globo.rotation.set(0.14, 0, 0, 'XYZ');
    this.scene.add(this.globo);

    // Grade de latitude e longitude.
    const gradeMat = new THREE.LineBasicMaterial({ color: 0x8f7fe6, transparent: true, opacity: 0.16, depthWrite: false });
    const pts = [];
    const circulo = (fn) => {
      const seg = 128;
      for (let i = 0; i < seg; i++) {
        pts.push(fn(i / seg), fn((i + 1) / seg));
      }
    };
    for (let lat = -75; lat <= 75; lat += 15) {
      if (lat === 0) continue;
      const y = Math.sin((lat * Math.PI) / 180), rr = Math.cos((lat * Math.PI) / 180);
      circulo((t) => new THREE.Vector3(Math.cos(t * 2 * Math.PI) * rr, y, Math.sin(t * 2 * Math.PI) * rr));
    }
    for (let lon = 0; lon < 180; lon += 15) {
      const a = (lon * Math.PI) / 180;
      circulo((t) => {
        const th = t * 2 * Math.PI;
        return new THREE.Vector3(Math.cos(th) * Math.cos(a), Math.sin(th), Math.cos(th) * Math.sin(a));
      });
    }
    const gradeGeo = new THREE.BufferGeometry().setFromPoints(pts);
    this.globo.add(new THREE.LineSegments(gradeGeo, gradeMat));

    // Equador brilhante e o disco em volta, como no vídeo.
    const eqPts = [];
    for (let i = 0; i <= 256; i++) {
      const t = (i / 256) * Math.PI * 2;
      eqPts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t)));
    }
    const eq = new THREE.Line(new THREE.BufferGeometry().setFromPoints(eqPts),
      new THREE.LineBasicMaterial({ color: 0xd9ccff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.globo.add(eq);
    const anel = new THREE.Mesh(new THREE.RingGeometry(0.985, 1.16, 160),
      new THREE.MeshBasicMaterial({ color: 0xb49cff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    anel.rotation.x = Math.PI / 2;
    this.globo.add(anel);
    const anelFino = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.03, 160),
      new THREE.MeshBasicMaterial({ color: 0xe9e0ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    anelFino.rotation.x = Math.PI / 2;
    this.globo.add(anelFino);
    for (const s of [1, -1]) {
      const polo = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.045, 48),
        new THREE.MeshBasicMaterial({ color: 0xd9ccff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
      polo.rotation.x = Math.PI / 2;
      polo.position.y = s * 0.999;
      this.globo.add(polo);
    }

    // Brilho do núcleo.
    const nucleo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrilho('rgba(255,90,170,0.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    nucleo.scale.set(0.8, 0.8, 1);
    this.scene.add(nucleo);
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrilho('rgba(120,90,255,0.22)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    aura.scale.set(3.4, 3.4, 1);
    this.scene.add(aura);

    // Estrelas ao fundo.
    const est = [];
    for (let i = 0; i < 900; i++) {
      const v = new THREE.Vector3(hash('e' + i) - 0.5, hash('f' + i) - 0.5, hash('g' + i) - 0.5).normalize().multiplyScalar(14 + hash('h' + i) * 10);
      est.push(v.x, v.y, v.z);
    }
    const estGeo = new THREE.BufferGeometry();
    estGeo.setAttribute('position', new THREE.Float32BufferAttribute(est, 3));
    this.estrelas = new THREE.Points(estGeo, new THREE.PointsMaterial({ color: 0xbfb5ff, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false }));
    this.scene.add(this.estrelas);

    // Eventos do mouse.
    const cv = r.domElement;
    let arrasto = null;
    this._on(cv, 'pointerdown', (e) => {
      arrasto = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moveu: false };
      cv.setPointerCapture(e.pointerId);
      this.ultimoToque = performance.now();
      this.foco = null;
    });
    this._on(cv, 'pointermove', (e) => {
      if (arrasto) {
        const dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y;
        arrasto.x = e.clientX; arrasto.y = e.clientY;
        if (Math.abs(e.clientX - arrasto.x0) + Math.abs(e.clientY - arrasto.y0) > 4) arrasto.moveu = true;
        this.girar(dx * 0.0055, dy * 0.0055);
        this.vel = { x: dx * 0.0055, y: dy * 0.0055 };
        this.ultimoToque = performance.now();
      } else {
        this.hover = this.pegar(e);
        cv.style.cursor = this.hover ? 'pointer' : 'grab';
      }
    });
    this._on(cv, 'pointerup', (e) => {
      if (arrasto && !arrasto.moveu) {
        const n = this.pegar(e);
        this.selecionar(n, false);
      }
      arrasto = null;
    });
    this._on(cv, 'dblclick', (e) => {
      const n = this.pegar(e);
      if (n) this.abrir(n, false);
    });
    this._on(cv, 'pointerleave', () => { this.hover = null; });
    this._on(cv, 'wheel', (e) => {
      e.preventDefault();
      const z = this.camera.position.z * Math.pow(1.0012, e.deltaY);
      this.camera.position.z = Math.min(7, Math.max(1.45, z));
      this.ultimoToque = performance.now();
    }, { passive: false });

    this.ro = new ResizeObserver(() => this.redimensionar());
    this.ro.observe(canvasBox);
    this.redimensionar();
  }

  _on(alvo, ev, fn, opt) {
    alvo.addEventListener(ev, fn, opt);
    (this._evs = this._evs || []).push([alvo, ev, fn, opt]);
  }

  montarUI() {
    const topo = el('div', 'arton-globo-topo', this.root);
    const tit = el('div', 'arton-globo-titulo', topo);
    el('span', 'arton-globo-marca', tit, '✦');
    el('span', null, tit, 'Globo de Arton');
    this.stats = el('span', 'arton-globo-stats', tit, '');

    const acoes = el('div', 'arton-globo-acoes', topo);
    this.busca = el('input', 'arton-globo-busca', acoes);
    this.busca.type = 'search';
    this.busca.placeholder = 'Buscar nota…';
    this._on(this.busca, 'keydown', (e) => {
      if (e.key === 'Enter') {
        const q = semAcento(this.busca.value);
        if (!q) return;
        const achado = this.grafo.nodes.find((n) => semAcento(n.nome) === q)
          || this.grafo.nodes.find((n) => semAcento(n.nome).includes(q));
        if (achado) this.selecionar(achado, true);
        else new obsidian.Notice('Nenhuma nota com esse nome.');
      }
    });
    this.btnGirar = el('button', 'arton-pill is-ativo', acoes, '⟳ Girar');
    this._on(this.btnGirar, 'click', () => {
      this.girando = !this.girando;
      this.btnGirar.classList.toggle('is-ativo', this.girando);
    });
    const btnCentro = el('button', 'arton-pill', acoes, '◎ Centralizar');
    this._on(btnCentro, 'click', () => {
      this.selecionar(null);
      this.camera.position.z = this.opc.compacto ? 3.25 : 3.0;
      this.yaw = 0; this.pitch = 0.14;
    });
    if (this.opc.compacto) {
      const btnTela = el('button', 'arton-pill', acoes, '⤢ Tela cheia');
      this._on(btnTela, 'click', () => this.plugin.abrirGlobo());
    }

    this.legenda = el('div', 'arton-globo-legenda', this.root);
    this.card = el('div', 'arton-globo-card', this.root);
    this.card.style.display = 'none';
    this.rotulos = el('div', 'arton-globo-rotulos', this.root);
    this.poolRotulos = [];
    this.dica = el('div', 'arton-globo-dica', this.root, this.opc.compacto
      ? 'Arraste para girar · clique num ponto para ver as ligações'
      : 'Arraste para girar · rodinha para zoom · clique para ver ligações · duplo clique abre a nota');
  }

  recarregar() {
    const antigo = this.grafo;
    this.grafo = coletarGrafo(this.app);
    const anteriores = this.layout;
    this.layout = calcularLayout(this.grafo.nodes, this.grafo.links, anteriores);
    if (this.selecionado) this.selecionado = this.grafo.nodes.find((n) => n.id === this.selecionado.id) || null;
    this.construirGeometria();
    this.atualizarLegenda();
    this.stats.textContent = `${this.grafo.nodes.length} notas · ${this.grafo.links.length} conexões`;
    this.aplicarDestaque();
    if (this.selecionado) this.mostrarCard(this.selecionado);
    void antigo;
  }

  construirGeometria() {
    if (this.pontos) { this.globo.remove(this.pontos); this.pontos.geometry.dispose(); this.pontos.material.dispose(); }
    if (this.linhas) { this.globo.remove(this.linhas); this.linhas.geometry.dispose(); this.linhas.material.dispose(); }
    const { nodes, links } = this.grafo;
    const R = 1.004;
    const pos = new Float32Array(nodes.length * 3);
    const cor = new Float32Array(nodes.length * 3);
    const tam = new Float32Array(nodes.length);
    const alf = new Float32Array(nodes.length);
    const c = new THREE.Color();
    nodes.forEach((n, i) => {
      const p = this.layout.get(n.id);
      n.pos = p.clone().multiplyScalar(R);
      pos.set([n.pos.x, n.pos.y, n.pos.z], i * 3);
      c.set((TIPO[n.tipo] || TIPO.outro).cor);
      cor.set([c.r, c.g, c.b], i * 3);
      n.tamBase = 10 + Math.min(26, Math.sqrt(n.grau) * 5) + (n.tipo === 'indice' ? 8 : 0);
      tam[i] = n.tamBase;
      alf[i] = 1;
      n.i = i;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('cor', new THREE.BufferAttribute(cor, 3));
    g.setAttribute('size', new THREE.BufferAttribute(tam, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(alf, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { escala: { value: this.renderer.getPixelRatio() * 2.2 } },
      vertexShader: VERT_PONTOS, fragmentShader: FRAG_PONTOS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.pontos = new THREE.Points(g, mat);
    this.pontos.renderOrder = 2;
    this.globo.add(this.pontos);

    // Links como arcos sobre a superfície.
    const lp = [], lc = [];
    const ca = new THREE.Color(), cb = new THREE.Color();
    this.segLinks = [];
    for (const l of links) {
      const a = l.a.pos.clone().normalize(), b = l.b.pos.clone().normalize();
      const ang = a.angleTo(b);
      const seg = Math.max(4, Math.min(28, Math.ceil(ang * 18)));
      // Links curtos brilham (as "explosões"); links longos ficam discretos.
      const forca = Math.max(0.22, Math.min(1.15, 1.35 - ang * 0.75));
      ca.set((TIPO[l.a.tipo] || TIPO.outro).cor).multiplyScalar(forca);
      cb.set((TIPO[l.b.tipo] || TIPO.outro).cor).multiplyScalar(forca);
      const ini = lc.length / 3;
      let prev = null;
      for (let s = 0; s <= seg; s++) {
        const t = s / seg;
        const v = new THREE.Vector3().copy(a).lerp(b, t);
        if (v.lengthSq() < 1e-6) v.set(0, 1, 0);
        v.normalize().multiplyScalar(1.004 + Math.sin(Math.PI * t) * Math.min(0.07, ang * 0.045));
        if (prev) {
          lp.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
          const c1 = ca.clone().lerp(cb, (s - 1) / seg), c2 = ca.clone().lerp(cb, t);
          lc.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        }
        prev = v;
      }
      this.segLinks.push({ l, ini, fim: lc.length / 3 });
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
    this.corLinksBase = Float32Array.from(lc);
    this.linhas = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.linhas.renderOrder = 1;
    this.globo.add(this.linhas);
  }

  atualizarLegenda() {
    this.legenda.textContent = '';
    const cont = {};
    for (const n of this.grafo.nodes) cont[n.tipo] = (cont[n.tipo] || 0) + 1;
    for (const t of TIPOS) {
      if (!cont[t.id]) continue;
      const chip = el('button', 'arton-globo-chip' + (this.ocultos.has(t.id) ? ' is-oculto' : ''), this.legenda);
      const bola = el('span', 'arton-globo-bola', chip);
      bola.style.background = t.cor;
      bola.style.boxShadow = `0 0 8px ${t.cor}`;
      el('span', null, chip, `${t.nome} ${cont[t.id]}`);
      chip.title = 'Clique para mostrar ou esconder';
      this._on(chip, 'click', () => {
        if (this.ocultos.has(t.id)) this.ocultos.delete(t.id); else this.ocultos.add(t.id);
        chip.classList.toggle('is-oculto', this.ocultos.has(t.id));
        this.aplicarDestaque();
      });
    }
  }

  // Esconde tipos ocultos e, com uma nota selecionada, apaga tudo que não é vizinho dela.
  aplicarDestaque() {
    if (!this.pontos) return;
    const sel = this.selecionado;
    const vizinhos = new Set(sel ? [sel, ...sel.viz] : []);
    const alf = this.pontos.geometry.getAttribute('alpha');
    const tam = this.pontos.geometry.getAttribute('size');
    for (const n of this.grafo.nodes) {
      let a = this.ocultos.has(n.tipo) ? 0 : 1;
      if (sel && a) a = vizinhos.has(n) ? 1 : 0.12;
      alf.array[n.i] = a;
      tam.array[n.i] = n.tamBase * (sel === n ? 1.9 : 1);
    }
    alf.needsUpdate = true; tam.needsUpdate = true;
    const cor = this.linhas.geometry.getAttribute('color');
    for (const s of this.segLinks) {
      let f = (this.ocultos.has(s.l.a.tipo) || this.ocultos.has(s.l.b.tipo)) ? 0 : 1;
      if (sel && f) f = (s.l.a === sel || s.l.b === sel) ? 2.2 : 0.07;
      for (let k = s.ini * 3; k < s.fim * 3; k++) cor.array[k] = this.corLinksBase[k] * f;
    }
    cor.needsUpdate = true;
  }

  selecionar(n, focar) {
    this.selecionado = n || null;
    this.aplicarDestaque();
    if (n) {
      this.mostrarCard(n);
      if (focar) this.foco = n;
    } else {
      this.card.style.display = 'none';
    }
  }

  mostrarCard(n) {
    const t = TIPO[n.tipo] || TIPO.outro;
    const c = this.card;
    c.textContent = '';
    c.style.display = '';
    const cab = el('div', 'arton-globo-card-cab', c);
    const chip = el('span', 'arton-globo-tipo', cab, t.nome);
    chip.style.color = t.cor;
    chip.style.borderColor = t.cor;
    const fechar = el('button', 'arton-globo-fechar', cab, '×');
    this._onCard(fechar, () => this.selecionar(null));
    el('div', 'arton-globo-card-nome', c, n.nome);
    const bts = el('div', 'arton-globo-card-bts', c);
    this._onCard(el('button', 'arton-pill is-ativo', bts, 'Abrir nota'), () => this.abrir(n, false));
    this._onCard(el('button', 'arton-pill', bts, 'Abrir ao lado'), () => this.abrir(n, true));
    el('div', 'arton-globo-card-sub', c, `${n.viz.length} ${n.viz.length === 1 ? 'conexão' : 'conexões'}`);
    const lista = el('div', 'arton-globo-card-lista', c);
    const ord = [...n.viz].sort((a, b) => TIPOS.findIndex((x) => x.id === a.tipo) - TIPOS.findIndex((x) => x.id === b.tipo) || a.nome.localeCompare(b.nome));
    for (const v of ord) {
      const it = el('button', 'arton-globo-card-item', lista);
      const bola = el('span', 'arton-globo-bola', it);
      bola.style.background = (TIPO[v.tipo] || TIPO.outro).cor;
      el('span', null, it, v.nome);
      this._onCard(it, () => this.selecionar(v, true));
    }
  }

  _onCard(b, fn) { b.addEventListener('click', fn); }

  abrir(n, aoLado) {
    const leaf = this.app.workspace.getLeaf(aoLado ? 'split' : 'tab');
    leaf.openFile(n.file);
  }

  // Nota mais próxima do ponteiro, só entre as que estão na frente do globo.
  pegar(e) {
    if (!this.grafo) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let melhor = null, md = 16 * 16;
    const v = new THREE.Vector3(), cam = this.camera.position;
    for (const n of this.grafo.nodes) {
      if (this.ocultos.has(n.tipo)) continue;
      v.copy(n.pos).applyQuaternion(this.globo.quaternion);
      if (v.clone().normalize().dot(cam.clone().sub(v).normalize()) < 0.05) continue;
      v.project(this.camera);
      const sx = (v.x * 0.5 + 0.5) * rect.width, sy = (-v.y * 0.5 + 0.5) * rect.height;
      const dd = (sx - mx) ** 2 + (sy - my) ** 2;
      if (dd < md) { md = dd; melhor = n; }
    }
    return melhor;
  }

  girar(dx, dy) {
    this.yaw += dx;
    this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch + dy));
  }

  redimensionar() {
    const w = this.canvasBox.clientWidth || 1, h = this.canvasBox.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  loop(t) {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.root.isConnected) return;
    const parado = performance.now() - this.ultimoToque > 2500;
    if (this.foco) {
      // Gira o globo até a nota ficar de frente (guinada) e na altura dos olhos (inclinação).
      const p = this.foco.pos;
      const r = Math.hypot(p.x, p.z);
      let alvoYaw = Math.atan2(-p.x, p.z);
      const alvoPitch = Math.max(-1.25, Math.min(1.25, Math.atan2(p.y, r) - 0.1));
      let dy = alvoYaw - this.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const dp = alvoPitch - this.pitch;
      if (Math.abs(dy) < 0.002 && Math.abs(dp) < 0.002) this.foco = null;
      else { this.yaw += dy * 0.1; this.pitch += dp * 0.1; }
    } else if (Math.abs(this.vel.x) + Math.abs(this.vel.y) > 0.0001 && !parado) {
      this.vel.x *= 0.94; this.vel.y *= 0.94;
      if (performance.now() - this.ultimoToque > 60) this.girar(this.vel.x, this.vel.y);
    } else if (this.girando && parado) {
      this.yaw += 0.0016;
    }
    this.globo.rotation.set(this.pitch, this.yaw, 0, 'XYZ');
    this.globo.updateMatrixWorld();
    this.estrelas.rotation.y = (t || 0) * 0.000008;
    this.renderer.render(this.scene, this.camera);
    this.desenharRotulos();
  }

  desenharRotulos() {
    if (!this.grafo) return;
    const alvos = new Set();
    const porGrau = this.grafo.nodes.filter((n) => !this.ocultos.has(n.tipo)).sort((a, b) => b.grau - a.grau);
    const qtd = this.opc.compacto ? 7 : 14;
    if (!this.selecionado) porGrau.slice(0, qtd).forEach((n) => alvos.add(n));
    if (this.selecionado) { alvos.add(this.selecionado); this.selecionado.viz.forEach((n) => { if (!this.ocultos.has(n.tipo)) alvos.add(n); }); }
    if (this.hover) alvos.add(this.hover);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3(), cam = this.camera.position;
    let i = 0;
    for (const n of alvos) {
      v.copy(n.pos).applyQuaternion(this.globo.quaternion);
      const frente = v.clone().normalize().dot(cam.clone().sub(v).normalize());
      if (frente < 0.08 && n !== this.hover) continue;
      v.project(this.camera);
      let r = this.poolRotulos[i];
      if (!r) { r = el('div', 'arton-globo-rotulo', this.rotulos); this.poolRotulos.push(r); }
      if (r.textContent !== n.nome) r.textContent = n.nome;
      r.style.display = '';
      r.style.transform = `translate(${(v.x * 0.5 + 0.5) * rect.width}px, ${(-v.y * 0.5 + 0.5) * rect.height}px) translate(-50%, -150%)`;
      r.style.opacity = String(Math.min(1, 0.35 + frente));
      r.classList.toggle('is-forte', n === this.selecionado || n === this.hover);
      r.style.setProperty('--cor', (TIPO[n.tipo] || TIPO.outro).cor);
      i++;
    }
    for (; i < this.poolRotulos.length; i++) this.poolRotulos[i].style.display = 'none';
  }

  destruir() {
    cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    for (const [a, ev, fn, opt] of this._evs || []) a.removeEventListener(ev, fn, opt);
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    this.renderer.dispose();
    if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
    this.root.remove();
  }
}

/* ---------- Tela cheia ---------- */

class GloboView extends obsidian.ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Globo de Arton'; }
  getIcon() { return 'globe'; }
  async onOpen() {
    this.contentEl.textContent = '';
    this.contentEl.classList.add('arton-globo-view');
    this.globo = new Globo(this.plugin, this.contentEl, { compacto: false });
    this.plugin.globos.add(this.globo);
  }
  async onClose() {
    if (this.globo) { this.plugin.globos.delete(this.globo); this.globo.destruir(); this.globo = null; }
  }
}

/* ---------- Globo dentro de uma nota (bloco ```globo-arton```) ---------- */

class GloboEmbutido extends obsidian.MarkdownRenderChild {
  constructor(el, plugin, altura) { super(el); this.plugin = plugin; this.altura = altura; }
  onload() {
    this.containerEl.classList.add('arton-globo-embutido');
    this.containerEl.style.height = this.altura + 'px';
    this.globo = new Globo(this.plugin, this.containerEl, { compacto: true });
    this.plugin.globos.add(this.globo);
  }
  onunload() {
    if (this.globo) { this.plugin.globos.delete(this.globo); this.globo.destruir(); this.globo = null; }
  }
}

/* ---------- Criar notas a partir dos modelos ---------- */

class ModalNome extends obsidian.Modal {
  constructor(app, tipo, aoConfirmar) { super(app); this.tipo = tipo; this.aoConfirmar = aoConfirmar; }
  onOpen() {
    const t = TIPO[this.tipo];
    this.titleEl.textContent = `Criar: ${t.modelo}`;
    const c = this.contentEl;
    c.classList.add('arton-modal');
    el('p', null, c, this.tipo === 'sessao' ? 'Título da sessão (ex.: "A emboscada na ponte"):' : 'Nome:');
    const input = el('input', 'arton-modal-input', c);
    input.type = 'text';
    const ok = el('button', 'mod-cta', c, 'Criar');
    const ir = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      this.close();
      this.aoConfirmar(v);
    };
    ok.addEventListener('click', ir);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(); });
    setTimeout(() => input.focus(), 30);
  }
  onClose() { this.contentEl.textContent = ''; }
}

function nomeSeguro(s) { return s.replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').trim(); }

/* ---------- Plugin ---------- */

module.exports = class GloboArtonPlugin extends obsidian.Plugin {
  async onload() {
    this.globos = new Set();
    this.registerView(VIEW_TYPE, (leaf) => new GloboView(leaf, this));
    this.addRibbonIcon('globe', 'Abrir o Globo de Arton', () => this.abrirGlobo());
    this.addCommand({ id: 'abrir-globo', name: 'Abrir o Globo de Arton', callback: () => this.abrirGlobo() });
    for (const id of CRIAVEIS) {
      const t = TIPO[id];
      this.addCommand({ id: 'criar-' + id, name: `Criar ${t.modelo}`, callback: () => this.pedirNovaNota(id) });
    }

    this.registerMarkdownCodeBlockProcessor('globo-arton', (src, elx, ctx) => {
      const m = /altura\s*:\s*(\d+)/i.exec(src || '');
      ctx.addChild(new GloboEmbutido(elx, this, m ? Math.max(260, Math.min(1200, +m[1])) : 460));
    });
    this.registerMarkdownCodeBlockProcessor('arton-criar', (src, elx) => {
      const box = el('div', 'arton-criar', elx);
      for (const id of CRIAVEIS) {
        const t = TIPO[id];
        const b = el('button', 'arton-pill arton-criar-bt', box);
        const bola = el('span', 'arton-globo-bola', b);
        bola.style.background = t.cor;
        el('span', null, b, '+ ' + t.modelo);
        b.addEventListener('click', () => this.pedirNovaNota(id));
      }
    });

    let timer = null;
    this.registerEvent(this.app.metadataCache.on('resolved', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { for (const g of this.globos) g.recarregar(); }, 1200);
    }));
  }

  onunload() {
    for (const g of this.globos) g.destruir();
    this.globos.clear();
  }

  async abrirGlobo() {
    const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (existente) { this.app.workspace.revealLeaf(existente); return; }
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  pedirNovaNota(tipo) {
    new ModalNome(this.app, tipo, (nome) => this.criarNota(tipo, nome).catch((e) => {
      console.error(e);
      new obsidian.Notice('Não consegui criar a nota: ' + e.message);
    })).open();
  }

  async criarNota(tipo, nomeDigitado) {
    const t = TIPO[tipo];
    const vault = this.app.vault;
    let numero = '';
    let nome = nomeSeguro(nomeDigitado);
    if (tipo === 'sessao') {
      let max = 0;
      for (const f of vault.getMarkdownFiles()) {
        if (!f.path.startsWith(t.pasta + '/')) continue;
        const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter || {};
        const n = parseInt(fm.numero, 10);
        if (!isNaN(n) && n > max) max = n;
      }
      numero = String(max + 1);
      nome = `Sessão ${String(max + 1).padStart(2, '0')} - ${nome}`;
    }
    if (!nome) throw new Error('nome vazio');
    const modeloPath = `99 Sistema/Templates/${t.modelo}.md`;
    const modeloArq = vault.getAbstractFileByPath(modeloPath);
    let texto = modeloArq ? await vault.read(modeloArq) : `---\ntipo: ${tipo}\n---\n\n# {{titulo}}\n`;
    texto = texto.replace(/\{\{titulo\}\}/g, nome).replace(/\{\{data\}\}/g, hojeISO()).replace(/\{\{numero\}\}/g, numero);
    if (!vault.getAbstractFileByPath(t.pasta)) await vault.createFolder(t.pasta);
    let caminho = obsidian.normalizePath(`${t.pasta}/${nome}.md`);
    let k = 2;
    while (vault.getAbstractFileByPath(caminho)) caminho = obsidian.normalizePath(`${t.pasta}/${nome} ${k++}.md`);
    const arq = await vault.create(caminho, texto);
    await this.app.workspace.getLeaf('tab').openFile(arq);
    new obsidian.Notice(`Criado: ${arq.basename}`);
  }
};
