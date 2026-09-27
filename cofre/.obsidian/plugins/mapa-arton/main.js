/* Mapa de Arton: um plugin do Obsidian para o cofre de campanha do Tito.
 * Etapa 1 (básico) do projeto "Mapa de Arton": mapa com zoom e arrastar, marcadores
 * clicáveis que criam notas no cofre, camadas por tipo, régua de viagem e galeria
 * de imagens em tela cheia. As próximas etapas (tela dos jogadores, neblina, combate,
 * dados) estão descritas em `99 Sistema/Projeto - Mapa de Arton.md`. */
'use strict';

const obsidian = require('obsidian');

const VIEW_TYPE = 'mapa-arton-view';
const IMAGEM_PATH = '99 Sistema/Anexos/mapa-arton.jpg';

// Tipos de marcador que podem ser criados clicando no mapa (decisão "Camadas e
// filtros": reinos, cidades/masmorras/locais (tipo local) e NPCs).
const TIPOS_CRIAVEIS = [
  { id: 'reino', nome: 'Reino', icone: '👑', pasta: '02 Mundo/Reinos e Regiões', modelo: 'Reino' },
  { id: 'local', nome: 'Local', icone: '📍', pasta: '02 Mundo/Locais', modelo: 'Local' },
  { id: 'npc', nome: 'NPC', icone: '🧑', pasta: '03 Personagens/NPCs', modelo: 'NPC' },
];
const TIPO_OUTRO = { id: 'outro', nome: 'Outros', icone: '✦' };
const TIPO_POR_ID = Object.fromEntries(TIPOS_CRIAVEIS.map((t) => [t.id, t]));
function tipoInfo(id) { return TIPO_POR_ID[id] || TIPO_OUTRO; }

const PADRAO_DADOS = { kmPorPixel: null, velocidades: { pe: 24, cavalo: 48, barco: 64 } };

function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

function hojeISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function nomeSeguro(s) { return s.replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').trim(); }

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

// Insere linhas extras no frontmatter (entre os `---`) sem mexer no resto do modelo.
function inserirFrontmatter(texto, linhasExtras) {
  const m = /^---\n([\s\S]*?)\n---/.exec(texto);
  if (!m) return `---\n${linhasExtras}\n---\n\n${texto}`;
  const bloco = m[0].replace(/\n---$/, `\n${linhasExtras}\n---`);
  return texto.slice(0, m.index) + bloco + texto.slice(m.index + m[0].length);
}

/* ---------- Dados: notas com posição no mapa ---------- */

function coletarMarcadores(app) {
  const marcadores = [];
  for (const f of app.vault.getMarkdownFiles()) {
    const cache = app.metadataCache.getFileCache(f);
    const fm = (cache && cache.frontmatter) || {};
    const x = Number(fm.mapa_x), y = Number(fm.mapa_y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const tipo = tipoInfo(String(fm.tipo || '').toLowerCase().trim());
    const galeria = [];
    for (const l of (cache && cache.frontmatterLinks) || []) {
      if (l.key === 'galeria' || l.key.startsWith('galeria.')) {
        const dest = app.metadataCache.getFirstLinkpathDest(l.link, f.path);
        if (dest) galeria.push(dest);
      }
    }
    marcadores.push({ file: f, nome: f.basename, tipo, x: clamp(x, 0, 100), y: clamp(y, 0, 100), galeria });
  }
  return marcadores;
}

/* ---------- Modais ---------- */

class ModalMarcador extends obsidian.Modal {
  constructor(app, aoConfirmar) { super(app); this.aoConfirmar = aoConfirmar; this.tipo = TIPOS_CRIAVEIS[0].id; }
  onOpen() {
    this.titleEl.textContent = 'Criar marcador no mapa';
    const c = this.contentEl;
    c.classList.add('arton-modal');
    el('p', null, c, 'O que é este lugar?');
    const chips = el('div', 'arton-mapa-modal-chips', c);
    const botoes = TIPOS_CRIAVEIS.map((t) => {
      const b = el('button', 'arton-mapa-pill' + (t.id === this.tipo ? ' is-ativo' : ''), chips, `${t.icone} ${t.nome}`);
      b.addEventListener('click', () => {
        this.tipo = t.id;
        botoes.forEach((bt, i) => bt.classList.toggle('is-ativo', TIPOS_CRIAVEIS[i].id === this.tipo));
      });
      return b;
    });
    el('p', null, c, 'Nome:');
    const input = el('input', 'arton-modal-input', c);
    input.type = 'text';
    const ok = el('button', 'mod-cta', c, 'Criar');
    const ir = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      this.close();
      this.aoConfirmar(this.tipo, v);
    };
    ok.addEventListener('click', ir);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(); });
    setTimeout(() => input.focus(), 30);
  }
  onClose() { this.contentEl.textContent = ''; }
}

class ModalCampos extends obsidian.Modal {
  constructor(app, titulo, campos, aoConfirmar) { super(app); this.titulo = titulo; this.campos = campos; this.aoConfirmar = aoConfirmar; }
  onOpen() {
    this.titleEl.textContent = this.titulo;
    const c = this.contentEl;
    c.classList.add('arton-modal');
    const inputs = this.campos.map((campo) => {
      el('p', null, c, campo.label);
      const input = el('input', 'arton-modal-input', c);
      input.type = 'number';
      input.value = campo.valor;
      return input;
    });
    const ok = el('button', 'mod-cta', c, 'Confirmar');
    const ir = () => {
      const valores = {};
      this.campos.forEach((campo, i) => { valores[campo.id] = Number(inputs[i].value); });
      if (Object.values(valores).some((v) => !Number.isFinite(v) || v <= 0)) { new obsidian.Notice('Preencha números maiores que zero.'); return; }
      this.close();
      this.aoConfirmar(valores);
    };
    ok.addEventListener('click', ir);
    inputs.forEach((input) => input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(); }));
    setTimeout(() => inputs[0].focus(), 30);
  }
  onClose() { this.contentEl.textContent = ''; }
}

/* ---------- Galeria em tela cheia ---------- */

class Lightbox {
  constructor(app, imagens, indice) {
    this.app = app;
    this.imagens = imagens;
    this.i = indice || 0;
    this.root = el('div', 'arton-mapa-lightbox', document.body);
    this.img = el('img', null, this.root);
    const fechar = el('button', 'arton-mapa-lightbox-fechar', this.root, '×');
    fechar.addEventListener('click', () => this.destruir());
    if (imagens.length > 1) {
      const ant = el('button', 'arton-mapa-lightbox-nav is-ant', this.root, '‹');
      const prox = el('button', 'arton-mapa-lightbox-nav is-prox', this.root, '›');
      ant.addEventListener('click', () => this.mover(-1));
      prox.addEventListener('click', () => this.mover(1));
    }
    this._onKey = (e) => {
      if (e.key === 'Escape') this.destruir();
      else if (e.key === 'ArrowLeft') this.mover(-1);
      else if (e.key === 'ArrowRight') this.mover(1);
    };
    document.addEventListener('keydown', this._onKey);
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.destruir(); });
    this.mostrar();
  }
  mover(d) { this.i = (this.i + d + this.imagens.length) % this.imagens.length; this.mostrar(); }
  mostrar() { this.img.src = this.app.vault.getResourcePath(this.imagens[this.i]); }
  destruir() { document.removeEventListener('keydown', this._onKey); this.root.remove(); }
}

/* ---------- O mapa ---------- */

class Mapa {
  constructor(plugin, container, opcoes) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.opc = Object.assign({ compacto: false }, opcoes || {});
    this.root = el('div', 'arton-mapa' + (this.opc.compacto ? ' is-compacto' : ''), container);
    this.ocultos = new Set();
    this.selecionado = null;
    this.modo = null; // null | 'marcador' | 'regua'
    this.pontosRegua = [];
    this.calibrando = false;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.montarUI();
    this.carregarImagem();
    this._onResize = () => this.redimensionar();
    this.ro = new ResizeObserver(this._onResize);
  }

  montarUI() {
    const topo = el('div', 'arton-mapa-topo', this.root);
    const tit = el('div', 'arton-mapa-titulo', topo);
    el('span', 'arton-mapa-marca', tit, '🗺️');
    el('span', null, tit, 'Mapa de Arton');
    this.stats = el('span', 'arton-mapa-stats', tit, '');

    const acoes = el('div', 'arton-mapa-acoes', topo);
    this.btnMarcador = el('button', 'arton-mapa-pill', acoes, '+ Marcador');
    this.btnMarcador.addEventListener('click', () => this.alternarModo('marcador'));
    this.btnRegua = el('button', 'arton-mapa-pill', acoes, '📏 Régua');
    this.btnRegua.addEventListener('click', () => this.alternarModo('regua'));
    const btnCentro = el('button', 'arton-mapa-pill', acoes, '◎ Centralizar');
    btnCentro.addEventListener('click', () => this.centralizar());
    if (this.opc.compacto) {
      const btnTela = el('button', 'arton-mapa-pill', acoes, '⤢ Tela cheia');
      btnTela.addEventListener('click', () => this.plugin.abrirMapa());
    }

    this.viewport = el('div', 'arton-mapa-viewport', this.root);
    this.plano = el('div', 'arton-mapa-plano', this.viewport);
    this.img = el('img', 'arton-mapa-img', this.plano);
    this.camadaMarcadores = el('div', 'arton-mapa-marcadores', this.plano);
    this.svgRegua = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgRegua.setAttribute('class', 'arton-mapa-regua-svg');
    this.plano.appendChild(this.svgRegua);

    this.legenda = el('div', 'arton-mapa-legenda', this.root);
    this.card = el('div', 'arton-mapa-card', this.root);
    this.card.style.display = 'none';
    this.dica = el('div', 'arton-mapa-dica', this.root, 'Arraste para mover · rodinha para zoom · clique num marcador para abrir');

    this._arrastando = null;
    this.viewport.addEventListener('pointerdown', (e) => {
      this._arrastando = { x: e.clientX, y: e.clientY, moveu: false };
      this.viewport.setPointerCapture(e.pointerId);
    });
    this.viewport.addEventListener('pointermove', (e) => {
      if (!this._arrastando) return;
      const dx = e.clientX - this._arrastando.x, dy = e.clientY - this._arrastando.y;
      this._arrastando.x = e.clientX; this._arrastando.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this._arrastando.moveu = true;
      this.pan.x += dx; this.pan.y += dy;
      this.aplicarTransform();
    });
    this.viewport.addEventListener('pointerup', (e) => {
      const a = this._arrastando;
      this._arrastando = null;
      if (a && !a.moveu) this.clicarNoMapa(e);
    });
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomEm(e.clientX, e.clientY, Math.pow(1.0015, -e.deltaY));
    }, { passive: false });
  }

  async carregarImagem() {
    const arq = this.app.vault.getAbstractFileByPath(IMAGEM_PATH);
    if (!arq) {
      el('div', 'arton-mapa-erro', this.viewport, `Não achei a imagem em "cofre/${IMAGEM_PATH}". Salve o mapa nesse caminho.`);
      return;
    }
    this.img.src = this.app.vault.getResourcePath(arq);
    await new Promise((r) => { this.img.onload = r; });
    this.nw = this.img.naturalWidth; this.nh = this.img.naturalHeight;
    this.plano.style.width = this.nw + 'px'; this.plano.style.height = this.nh + 'px';
    this.svgRegua.setAttribute('viewBox', `0 0 ${this.nw} ${this.nh}`);
    this.svgRegua.setAttribute('width', this.nw); this.svgRegua.setAttribute('height', this.nh);
    this.ro.observe(this.viewport);
    this.redimensionar();
    this.recarregar();
  }

  redimensionar() {
    if (!this.nw) return;
    const cw = this.viewport.clientWidth || 1, ch = this.viewport.clientHeight || 1;
    this.fitScale = Math.min(cw / this.nw, ch / this.nh);
    if (!this._centralizado) { this.centralizar(); this._centralizado = true; }
    else this.aplicarTransform();
  }

  centralizar() {
    if (!this.nw) return;
    this.zoom = 1;
    const cw = this.viewport.clientWidth || 1, ch = this.viewport.clientHeight || 1;
    const escala = this.fitScale;
    this.pan.x = (cw - this.nw * escala) / 2;
    this.pan.y = (ch - this.nh * escala) / 2;
    this.aplicarTransform();
  }

  escalaAtual() { return this.fitScale * this.zoom; }

  aplicarTransform() {
    this.plano.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.escalaAtual()})`;
  }

  zoomEm(clientX, clientY, fator) {
    if (!this.nw) return;
    const rect = this.viewport.getBoundingClientRect();
    const mx = clientX - rect.left, my = clientY - rect.top;
    const antes = this.telaParaNatural(mx, my);
    this.zoom = clamp(this.zoom * fator, 1, 6);
    const escala = this.escalaAtual();
    this.pan.x = mx - antes.x * escala;
    this.pan.y = my - antes.y * escala;
    this.aplicarTransform();
  }

  telaParaNatural(sx, sy) {
    const escala = this.escalaAtual();
    return { x: (sx - this.pan.x) / escala, y: (sy - this.pan.y) / escala };
  }

  clicarNoMapa(e) {
    const rect = this.viewport.getBoundingClientRect();
    const p = this.telaParaNatural(e.clientX - rect.left, e.clientY - rect.top);
    if (p.x < 0 || p.y < 0 || p.x > this.nw || p.y > this.nh) return;
    if (this.modo === 'marcador') this.criarMarcadorEm(p);
    else if (this.modo === 'regua') this.clicarRegua(p);
  }

  alternarModo(modo) {
    this.modo = this.modo === modo ? null : modo;
    this.btnMarcador.classList.toggle('is-ativo', this.modo === 'marcador');
    this.btnRegua.classList.toggle('is-ativo', this.modo === 'regua');
    this.pontosRegua = [];
    this.desenharRegua();
    this.viewport.style.cursor = this.modo ? 'crosshair' : '';
    if (this.modo === 'regua') {
      const dados = this.plugin.dados;
      new obsidian.Notice(dados.kmPorPixel
        ? 'Clique dois pontos no mapa para medir a distância.'
        : 'Ainda não sei a escala do mapa: clique nos dois extremos da régua de km impressa nele.');
    }
  }

  criarMarcadorEm(pNatural) {
    const x = (pNatural.x / this.nw) * 100, y = (pNatural.y / this.nh) * 100;
    new ModalMarcador(this.app, (tipo, nome) => {
      this.plugin.criarNotaComMarcador(tipo, nome, x, y).catch((err) => {
        console.error(err);
        new obsidian.Notice('Não consegui criar o marcador: ' + err.message);
      });
    }).open();
    this.alternarModo('marcador'); // desliga o modo depois de abrir o modal
  }

  clicarRegua(pNatural) {
    this.pontosRegua.push(pNatural);
    this.desenharRegua();
    if (this.pontosRegua.length < 2) return;
    const [a, b] = this.pontosRegua;
    const distPixel = Math.hypot(b.x - a.x, b.y - a.y);
    const dados = this.plugin.dados;
    if (!dados.kmPorPixel) {
      new ModalCampos(this.app, 'Calibrar a régua', [{ id: 'km', label: 'Quantos km reais tem essa distância?', valor: '' }], async (v) => {
        dados.kmPorPixel = v.km / distPixel;
        await this.plugin.saveData(dados);
        new obsidian.Notice('Régua calibrada! Clique dois pontos no mapa para medir uma distância.');
        this.pontosRegua = [];
        this.desenharRegua();
      }).open();
    } else {
      this.mostrarResultadoRegua(distPixel * dados.kmPorPixel);
      this.pontosRegua = [];
    }
  }

  desenharRegua() {
    this.svgRegua.textContent = '';
    if (this.pontosRegua.length === 0) return;
    const ns = 'http://www.w3.org/2000/svg';
    for (const p of this.pontosRegua) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', Math.max(4, this.nw * 0.003));
      c.setAttribute('class', 'arton-mapa-regua-ponto');
      this.svgRegua.appendChild(c);
    }
    if (this.pontosRegua.length === 2) {
      const [a, b] = this.pontosRegua;
      const linha = document.createElementNS(ns, 'line');
      linha.setAttribute('x1', a.x); linha.setAttribute('y1', a.y);
      linha.setAttribute('x2', b.x); linha.setAttribute('y2', b.y);
      linha.setAttribute('class', 'arton-mapa-regua-linha');
      this.svgRegua.appendChild(linha);
    }
  }

  mostrarResultadoRegua(km) {
    const v = this.plugin.dados.velocidades;
    const dias = (kmDia) => {
      const d = km / kmDia;
      return d < 1 ? 'menos de 1 dia' : `${Math.ceil(d)} dia${Math.ceil(d) > 1 ? 's' : ''}`;
    };
    const c = this.card;
    c.textContent = '';
    c.style.display = '';
    const cab = el('div', 'arton-mapa-card-cab', c);
    el('span', 'arton-mapa-tipo', cab, '📏 Régua');
    const fechar = el('button', 'arton-mapa-fechar', cab, '×');
    fechar.addEventListener('click', () => { c.style.display = 'none'; this.desenharRegua(); });
    el('div', 'arton-mapa-card-nome', c, `${km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'}`);
    const lista = el('div', 'arton-mapa-regua-lista', c);
    el('div', 'arton-item', lista, `🚶 A pé: ${dias(v.pe)}`);
    el('div', 'arton-item', lista, `🐎 A cavalo: ${dias(v.cavalo)}`);
    el('div', 'arton-item', lista, `⛵ De barco: ${dias(v.barco)}`);
    const recal = el('button', 'arton-mapa-pill', c, '🔧 Recalibrar régua');
    recal.addEventListener('click', async () => {
      this.plugin.dados.kmPorPixel = null;
      await this.plugin.saveData(this.plugin.dados);
      new obsidian.Notice('Régua zerada. Clique dois pontos na régua de km do mapa para calibrar de novo.');
    });
  }

  recarregar() {
    if (!this.nw) return;
    this.marcadores = coletarMarcadores(this.app);
    if (this.selecionado) this.selecionado = this.marcadores.find((m) => m.file.path === this.selecionado.file.path) || null;
    this.construirMarcadores();
    this.atualizarLegenda();
    this.stats.textContent = `${this.marcadores.length} marcador${this.marcadores.length === 1 ? '' : 'es'}`;
    if (this.selecionado) this.mostrarCard(this.selecionado); else this.card.style.display = 'none';
  }

  construirMarcadores() {
    this.camadaMarcadores.textContent = '';
    for (const m of this.marcadores) {
      const pino = el('button', 'arton-mapa-pino', this.camadaMarcadores);
      pino.style.left = m.x + '%'; pino.style.top = m.y + '%';
      pino.style.display = this.ocultos.has(m.tipo.id) ? 'none' : '';
      pino.title = m.nome;
      el('span', null, pino, m.tipo.icone);
      pino.addEventListener('click', (e) => { e.stopPropagation(); this.selecionar(m); });
      m._el = pino;
    }
  }

  atualizarLegenda() {
    this.legenda.textContent = '';
    const cont = {};
    for (const m of this.marcadores) cont[m.tipo.id] = (cont[m.tipo.id] || 0) + 1;
    for (const id of Object.keys(cont)) {
      const t = tipoInfo(id);
      const chip = el('button', 'arton-mapa-chip' + (this.ocultos.has(id) ? ' is-oculto' : ''), this.legenda);
      el('span', null, chip, `${t.icone} ${t.nome} ${cont[id]}`);
      chip.addEventListener('click', () => {
        if (this.ocultos.has(id)) this.ocultos.delete(id); else this.ocultos.add(id);
        chip.classList.toggle('is-oculto', this.ocultos.has(id));
        for (const m of this.marcadores) if (m.tipo.id === id) m._el.style.display = this.ocultos.has(id) ? 'none' : '';
      });
    }
  }

  selecionar(m) { this.selecionado = m; this.mostrarCard(m); }

  mostrarCard(m) {
    const c = this.card;
    c.textContent = '';
    c.style.display = '';
    const cab = el('div', 'arton-mapa-card-cab', c);
    el('span', 'arton-mapa-tipo', cab, `${m.tipo.icone} ${m.tipo.nome}`);
    const fechar = el('button', 'arton-mapa-fechar', cab, '×');
    fechar.addEventListener('click', () => { c.style.display = 'none'; this.selecionado = null; });
    el('div', 'arton-mapa-card-nome', c, m.nome);
    const bts = el('div', 'arton-mapa-card-bts', c);
    const abrir = el('button', 'arton-mapa-pill is-ativo', bts, 'Abrir nota');
    abrir.addEventListener('click', () => this.app.workspace.getLeaf('tab').openFile(m.file));
    if (m.galeria.length) {
      const gal = el('div', 'arton-mapa-galeria', c);
      m.galeria.forEach((f, i) => {
        const img = el('img', 'arton-mapa-galeria-item', gal);
        img.src = this.app.vault.getResourcePath(f);
        img.addEventListener('click', () => new Lightbox(this.app, m.galeria, i));
      });
    }
  }

  destruir() {
    if (this.ro) this.ro.disconnect();
    this.root.remove();
  }
}

/* ---------- Telas ---------- */

class MapaView extends obsidian.ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Mapa de Arton'; }
  getIcon() { return 'map'; }
  async onOpen() {
    this.contentEl.textContent = '';
    this.contentEl.classList.add('arton-mapa-view');
    this.mapa = new Mapa(this.plugin, this.contentEl, { compacto: false });
    this.plugin.mapas.add(this.mapa);
  }
  async onClose() {
    if (this.mapa) { this.plugin.mapas.delete(this.mapa); this.mapa.destruir(); this.mapa = null; }
  }
}

class MapaEmbutido extends obsidian.MarkdownRenderChild {
  constructor(el, plugin, altura) { super(el); this.plugin = plugin; this.altura = altura; }
  onload() {
    this.containerEl.classList.add('arton-mapa-embutido');
    this.containerEl.style.height = this.altura + 'px';
    this.mapa = new Mapa(this.plugin, this.containerEl, { compacto: true });
    this.plugin.mapas.add(this.mapa);
  }
  onunload() {
    if (this.mapa) { this.plugin.mapas.delete(this.mapa); this.mapa.destruir(); this.mapa = null; }
  }
}

/* ---------- Plugin ---------- */

module.exports = class MapaArtonPlugin extends obsidian.Plugin {
  async onload() {
    this.mapas = new Set();
    this.dados = Object.assign({}, PADRAO_DADOS, await this.loadData());
    this.dados.velocidades = Object.assign({}, PADRAO_DADOS.velocidades, this.dados.velocidades);

    this.registerView(VIEW_TYPE, (leaf) => new MapaView(leaf, this));
    this.addRibbonIcon('map', 'Abrir o Mapa de Arton', () => this.abrirMapa());
    this.addCommand({ id: 'abrir-mapa', name: 'Abrir o Mapa de Arton', callback: () => this.abrirMapa() });
    this.addCommand({
      id: 'ajustar-velocidades',
      name: 'Ajustar velocidades de viagem (km/dia)',
      callback: () => {
        const v = this.dados.velocidades;
        new ModalCampos(this.app, 'Velocidades de viagem (km/dia)', [
          { id: 'pe', label: 'A pé', valor: v.pe },
          { id: 'cavalo', label: 'A cavalo', valor: v.cavalo },
          { id: 'barco', label: 'De barco', valor: v.barco },
        ], async (novas) => {
          this.dados.velocidades = novas;
          await this.saveData(this.dados);
          new obsidian.Notice('Velocidades de viagem atualizadas.');
        }).open();
      },
    });

    this.registerMarkdownCodeBlockProcessor('mapa-arton', (src, elx, ctx) => {
      const m = /altura\s*:\s*(\d+)/i.exec(src || '');
      ctx.addChild(new MapaEmbutido(elx, this, m ? Math.max(260, Math.min(1200, +m[1])) : 460));
    });

    let timer = null;
    this.registerEvent(this.app.metadataCache.on('resolved', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { for (const m of this.mapas) m.recarregar(); }, 1200);
    }));
  }

  onunload() {
    for (const m of this.mapas) m.destruir();
    this.mapas.clear();
  }

  async abrirMapa() {
    const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (existente) { this.app.workspace.revealLeaf(existente); return; }
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async criarNotaComMarcador(tipo, nomeDigitado, x, y) {
    const t = TIPO_POR_ID[tipo];
    const vault = this.app.vault;
    const nome = nomeSeguro(nomeDigitado);
    if (!nome) throw new Error('nome vazio');
    const modeloPath = `99 Sistema/Templates/${t.modelo}.md`;
    const modeloArq = vault.getAbstractFileByPath(modeloPath);
    let texto = modeloArq ? await vault.read(modeloArq) : `---\ntipo: ${tipo}\n---\n\n# {{titulo}}\n`;
    texto = texto.replace(/\{\{titulo\}\}/g, nome).replace(/\{\{data\}\}/g, hojeISO()).replace(/\{\{numero\}\}/g, '');
    texto = inserirFrontmatter(texto, `mapa_x: ${x.toFixed(2)}\nmapa_y: ${y.toFixed(2)}`);
    if (!vault.getAbstractFileByPath(t.pasta)) await vault.createFolder(t.pasta);
    let caminho = obsidian.normalizePath(`${t.pasta}/${nome}.md`);
    let k = 2;
    while (vault.getAbstractFileByPath(caminho)) caminho = obsidian.normalizePath(`${t.pasta}/${nome} ${k++}.md`);
    const arq = await vault.create(caminho, texto);
    await this.app.workspace.getLeaf('tab').openFile(arq);
    new obsidian.Notice(`Marcador criado: ${arq.basename}`);
  }
};
