/* Mapa de Arton: um plugin do Obsidian para o cofre de campanha do Tito.
 * Etapa 1 (básico): mapa com zoom e arrastar, marcadores clicáveis que criam notas no
 * cofre, camadas por tipo, régua de viagem e galeria de imagens em tela cheia.
 * Etapa 2 (mesa): tela dos jogadores em janela separada (segue o mestre, botão
 * congelar), três estados por marcador (oculto/rumor/revelado), neblina com raio
 * próprio por marcador, revelação dramática (a neblina se dissolve e a câmera foca
 * no marcador), rastro do grupo e som ambiente por lugar.
 * Etapa 3 (combate): mapa de batalha aberto a partir de um marcador (imagem da
 * galeria + grade), fichas de PJ/monstro arrastáveis, iniciativa com rodadas,
 * PV e condições (jogadores só veem o estado qualitativo), neblina de sala em volta
 * dos PJs e efeito de abertura escolhido pelo mestre.
 * Etapa 4 (dados): rolador com botões rápidos e expressões (1d20+7), rolar pelos
 * ataques da ficha, crítico/falha com efeito e som, na tela dos jogadores.
 * Etapa 5 (magia): comando que lê os `locais` de cada Sessão e atualiza o rastro e a
 * revelação automaticamente, e um botão para ver a nota selecionada no Globo de Arton.
 * Tudo isso está descrito em `99 Sistema/Projeto - Mapa de Arton.md`. */
'use strict';

const obsidian = require('obsidian');

const VIEW_TYPE = 'mapa-arton-view';
const VIEW_TYPE_JOGADORES = 'mapa-arton-jogadores-view';
const VIEW_TYPE_COMBATE = 'mapa-arton-combate-view';
const IMAGEM_PATH = '99 Sistema/Anexos/mapa-arton.jpg';

// Tipos de marcador que podem ser criados clicando no mapa, e o raio padrão (% da
// largura do mapa) da neblina de cada um quando a nota não define o próprio raio.
const TIPOS_CRIAVEIS = [
  { id: 'reino', nome: 'Reino', icone: '👑', pasta: '02 Mundo/Reinos e Regiões', modelo: 'Reino', raioPct: 12 },
  { id: 'local', nome: 'Local', icone: '📍', pasta: '02 Mundo/Locais', modelo: 'Local', raioPct: 5 },
  { id: 'npc', nome: 'NPC', icone: '🧑', pasta: '03 Personagens/NPCs', modelo: 'NPC', raioPct: 3 },
];
const TIPO_OUTRO = { id: 'outro', nome: 'Outros', icone: '✦', raioPct: 5 };
const TIPO_POR_ID = Object.fromEntries(TIPOS_CRIAVEIS.map((t) => [t.id, t]));
function tipoInfo(id) { return TIPO_POR_ID[id] || TIPO_OUTRO; }

// Os três estados de um marcador na tela dos jogadores (decisão "três estados por
// marcador" do projeto). O padrão de uma nota sem `mapa_estado` é "revelado", para
// não esconder de repente os marcadores da etapa 1 quando a tela dos jogadores nasce.
const ESTADOS = [
  { id: 'oculto', icone: '🔒', nome: 'Oculto' },
  { id: 'rumor', icone: '❓', nome: 'Rumor' },
  { id: 'revelado', icone: '👁️', nome: 'Revelado' },
];
const ESTADO_POR_ID = Object.fromEntries(ESTADOS.map((e) => [e.id, e]));
function estadoInfo(id) { return ESTADO_POR_ID[id] || ESTADO_POR_ID.revelado; }

const PADRAO_DADOS = { kmPorPixel: null, velocidades: { pe: 24, cavalo: 48, barco: 64 }, trilha: [] };

// Condições que dá pra marcar numa ficha em combate (ícone só, sem mecânica própria).
const CONDICOES = [
  { id: 'caido', icone: '⬇️', nome: 'Caído' },
  { id: 'atordoado', icone: '💫', nome: 'Atordoado' },
  { id: 'envenenado', icone: '🤢', nome: 'Envenenado' },
  { id: 'cego', icone: '🙈', nome: 'Cego' },
  { id: 'agarrado', icone: '🪢', nome: 'Agarrado' },
  { id: 'amedrontado', icone: '😱', nome: 'Amedrontado' },
];
const CONDICAO_POR_ID = Object.fromEntries(CONDICOES.map((c) => [c.id, c]));

// Estilos de abertura de combate (decisão "abertura do combate" do projeto).
const ABERTURAS = [
  { id: 'videogame', nome: '🎮 Videogame' },
  { id: 'cinema', nome: '🎬 Cinematográfico' },
  { id: 'chefe', nome: '👑 Chefe' },
];

// PV -> o que os jogadores veem (nunca o número).
function estadoPV(pv, pvMax) {
  if (pvMax <= 0) return { rotulo: '—', classe: 'is-cheio' };
  if (pv <= 0) return { rotulo: 'caído', classe: 'is-caido' };
  const frac = pv / pvMax;
  if (frac <= 0.33) return { rotulo: 'quase morto', classe: 'is-critico' };
  if (frac <= 0.66) return { rotulo: 'ferido', classe: 'is-ferido' };
  return { rotulo: 'ileso', classe: 'is-cheio' };
}

// `ataques` no frontmatter do Monstro/PJ: uma lista de linhas "Nome: +bônus, dano".
function parseAtaque(linha) {
  const m = /^(.*?):\s*([+-]?\d+)\s*,\s*(.+)$/.exec(String(linha || '').trim());
  if (!m) return null;
  return { nome: m[1].trim(), bonus: Number(m[2]), dano: m[3].trim() };
}

// "2d6+3", "1d20", "d8-1"... qtd default 1, modificador opcional.
function rolarExpressao(expr) {
  const m = /^(\d*)\s*d\s*(\d+)\s*([+-]\s*\d+)?$/i.exec(String(expr || '').trim());
  if (!m) return null;
  const qtd = clamp(m[1] ? Number(m[1]) : 1, 1, 100);
  const lados = clamp(Number(m[2]), 1, 1000);
  const mod = m[3] ? Number(m[3].replace(/\s+/g, '')) : 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) rolagens.push(1 + Math.floor(Math.random() * lados));
  const total = rolagens.reduce((a, b) => a + b, 0) + mod;
  const critico = qtd === 1 && lados === 20 && rolagens[0] === 20;
  const falha = qtd === 1 && lados === 20 && rolagens[0] === 1;
  return { expr: `${qtd}d${lados}${mod ? (mod > 0 ? '+' : '') + mod : ''}`, qtd, lados, mod, rolagens, total, critico, falha };
}

// Um efeito sonoro curtinho sintetizado (sem precisar de nenhum arquivo de áudio).
let _ctxAudio = null;
function tocarEfeito(tipo) {
  try {
    _ctxAudio = _ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _ctxAudio;
    const t0 = ctx.currentTime;
    const tom = (freq, inicio, dur, tipoOnda, ganho) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = tipoOnda || 'sine'; osc.frequency.setValueAtTime(freq, t0 + inicio);
      g.gain.setValueAtTime(0, t0 + inicio);
      g.gain.linearRampToValueAtTime(ganho == null ? 0.16 : ganho, t0 + inicio + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + inicio + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0 + inicio); osc.stop(t0 + inicio + dur + 0.02);
    };
    if (tipo === 'rolando') { for (let i = 0; i < 6; i++) tom(180 + Math.random() * 120, i * 0.08, 0.05, 'square', 0.05); }
    else if (tipo === 'critico') { tom(660, 0, 0.12, 'triangle'); tom(880, 0.1, 0.12, 'triangle'); tom(1320, 0.2, 0.3, 'triangle'); }
    else if (tipo === 'falha') { tom(220, 0, 0.35, 'sawtooth', 0.12); tom(140, 0.15, 0.4, 'sawtooth', 0.12); }
    else if (tipo === 'impacto') { tom(320, 0, 0.18, 'sine'); }
    else if (tipo === 'videogame') { tom(140, 0, 0.3, 'sawtooth', 0.14); }
    else if (tipo === 'cinema') { tom(90, 0, 0.9, 'sine', 0.1); }
    else if (tipo === 'chefe') { tom(80, 0, 0.5, 'sawtooth', 0.14); tom(120, 0.2, 0.6, 'sawtooth', 0.12); }
  } catch (e) { /* sem áudio disponível (ex.: sem interação do usuário ainda); tudo bem, segue só visual */ }
}

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

function ehVerdadeiro(v) { return v === true || String(v).toLowerCase().trim() === 'true'; }

// Insere linhas extras no frontmatter (entre os `---`) sem mexer no resto do modelo.
// Só usado na criação da nota; edições depois disso passam por processFrontMatter.
function inserirFrontmatter(texto, linhasExtras) {
  const m = /^---\n([\s\S]*?)\n---/.exec(texto);
  if (!m) return `---\n${linhasExtras}\n---\n\n${texto}`;
  const bloco = m[0].replace(/\n---$/, `\n${linhasExtras}\n---`);
  return texto.slice(0, m.index) + bloco + texto.slice(m.index + m[0].length);
}

// `mapa_som`: um link do YouTube ou um anexo do cofre (caminho ou `[[wikilink]]`).
function resolverSom(app, file, valorBruto) {
  const v = String(valorBruto || '').trim();
  if (!v) return null;
  const yt = /(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(v);
  if (yt) return { tipo: 'youtube', id: yt[1] };
  const linkMatch = /^\[\[(.+?)(?:\|.*)?\]\]$/.exec(v);
  const linktext = linkMatch ? linkMatch[1] : v;
  const dest = app.metadataCache.getFirstLinkpathDest(linktext, file.path);
  return dest ? { tipo: 'arquivo', file: dest } : null;
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
    const estado = estadoInfo(fm.mapa_estado ? String(fm.mapa_estado).toLowerCase().trim() : 'revelado');
    const neblina = ehVerdadeiro(fm.mapa_neblina);
    const raioBruto = Number(fm.mapa_raio);
    const raio = Number.isFinite(raioBruto) && raioBruto > 0 ? raioBruto : (tipo.raioPct || TIPO_OUTRO.raioPct);
    const som = resolverSom(app, f, fm.mapa_som);
    marcadores.push({
      file: f, nome: f.basename, tipo, x: clamp(x, 0, 100), y: clamp(y, 0, 100), galeria,
      estado, neblina, raio, somBruto: fm.mapa_som || '', som,
    });
  }
  return marcadores;
}

// Notas que podem virar ficha em combate: Bestiário (monstro) ou Jogadores (pj).
function coletarCandidatosFicha(app, tipo) {
  const pasta = tipo === 'pj' ? '03 Personagens/Jogadores/' : '04 Bestiário/';
  const candidatos = [];
  for (const f of app.vault.getMarkdownFiles()) {
    if (!f.path.startsWith(pasta)) continue;
    const cache = app.metadataCache.getFileCache(f);
    const fm = (cache && cache.frontmatter) || {};
    const pv = Number(fm.pv), defesa = Number(fm.defesa);
    const ataques = Array.isArray(fm.ataques) ? fm.ataques.map(parseAtaque).filter(Boolean) : [];
    candidatos.push({
      file: f, nome: f.basename,
      pv: Number.isFinite(pv) && pv > 0 ? pv : 10,
      defesa: Number.isFinite(defesa) ? defesa : 10,
      ataques,
    });
  }
  return candidatos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

let proximoIdFicha = 1;
function criarFicha(tipo, dados) {
  return Object.assign({
    id: 'f' + proximoIdFicha++,
    tipo, // 'pj' | 'monstro'
    nome: 'Sem nome',
    x: 50, y: 50,
    pv: 10, pvMax: 10, defesa: 10,
    ataques: [],
    condicoes: [],
    file: null,
  }, dados);
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

class ModalTexto extends obsidian.Modal {
  constructor(app, titulo, label, valorInicial, aoConfirmar) {
    super(app); this.titulo = titulo; this.label = label; this.valorInicial = valorInicial || ''; this.aoConfirmar = aoConfirmar;
  }
  onOpen() {
    this.titleEl.textContent = this.titulo;
    const c = this.contentEl;
    c.classList.add('arton-modal');
    if (this.label) el('p', null, c, this.label);
    const input = el('input', 'arton-modal-input', c);
    input.type = 'text'; input.value = this.valorInicial;
    const ok = el('button', 'mod-cta', c, 'Confirmar');
    const ir = () => { const v = input.value.trim(); this.close(); this.aoConfirmar(v); };
    ok.addEventListener('click', ir);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(); });
    setTimeout(() => { input.focus(); input.select(); }, 30);
  }
  onClose() { this.contentEl.textContent = ''; }
}

// Escolhe uma das imagens da galeria do marcador pra virar o mapa de batalha.
class ModalEscolherImagem extends obsidian.Modal {
  constructor(app, imagens, aoConfirmar) { super(app); this.imagens = imagens; this.aoConfirmar = aoConfirmar; }
  onOpen() {
    this.titleEl.textContent = 'Qual imagem é o mapa de batalha?';
    const c = this.contentEl;
    c.classList.add('arton-modal');
    const grade = el('div', 'arton-mapa-galeria', c);
    for (const f of this.imagens) {
      const img = el('img', 'arton-mapa-galeria-item', grade);
      img.src = this.app.vault.getResourcePath(f);
      img.style.width = '110px'; img.style.height = '110px';
      img.addEventListener('click', () => { this.close(); this.aoConfirmar(f); });
    }
  }
  onClose() { this.contentEl.textContent = ''; }
}

// Escolhe o estilo de abertura do combate (decisão "abertura do combate").
class ModalAbertura extends obsidian.Modal {
  constructor(app, aoConfirmar) { super(app); this.aoConfirmar = aoConfirmar; }
  onOpen() {
    this.titleEl.textContent = 'Como o combate começa, na tela dos jogadores?';
    const c = this.contentEl;
    c.classList.add('arton-modal');
    const box = el('div', 'arton-mapa-modal-chips', c);
    for (const a of ABERTURAS) {
      const b = el('button', 'arton-mapa-pill', box, a.nome);
      b.addEventListener('click', () => { this.close(); this.aoConfirmar(a.id); });
    }
  }
  onClose() { this.contentEl.textContent = ''; }
}

// Escolhe uma nota (Bestiário ou Jogadores) pra virar ficha, ou cria uma na hora.
class ModalEscolherFicha extends obsidian.Modal {
  constructor(app, tipo, candidatos, aoConfirmarNota, aoConfirmarNova) {
    super(app); this.tipo = tipo; this.candidatos = candidatos; this.aoConfirmarNota = aoConfirmarNota; this.aoConfirmarNova = aoConfirmarNova;
  }
  onOpen() {
    this.titleEl.textContent = this.tipo === 'pj' ? 'Adicionar PJ ao combate' : 'Adicionar monstro ao combate';
    const c = this.contentEl;
    c.classList.add('arton-modal');
    const busca = el('input', 'arton-modal-input', c);
    busca.type = 'search'; busca.placeholder = 'Buscar pelo nome…';
    const lista = el('div', 'arton-mapa-lista-fichas', c);
    const redesenhar = () => {
      lista.textContent = '';
      const q = busca.value.trim().toLowerCase();
      for (const cand of this.candidatos) {
        if (q && !cand.nome.toLowerCase().includes(q)) continue;
        const item = el('button', 'arton-mapa-pill', lista, `${cand.nome} (PV ${cand.pv})`);
        item.addEventListener('click', () => { this.close(); this.aoConfirmarNota(cand); });
      }
    };
    busca.addEventListener('input', redesenhar);
    redesenhar();
    el('p', null, c, this.candidatos.length ? 'Ou crie uma ficha na hora:' : `Nenhuma nota encontrada — crie uma ficha na hora:`);
    const nomeInput = el('input', 'arton-modal-input', c);
    nomeInput.type = 'text'; nomeInput.placeholder = 'Nome';
    const pvInput = el('input', 'arton-modal-input', c);
    pvInput.type = 'number'; pvInput.placeholder = 'PV'; pvInput.value = '10';
    const criar = el('button', 'mod-cta', c, 'Criar ficha na hora');
    criar.addEventListener('click', () => {
      const nome = nomeInput.value.trim();
      const pv = Number(pvInput.value);
      if (!nome || !Number.isFinite(pv) || pv <= 0) { new obsidian.Notice('Preencha nome e PV.'); return; }
      this.close();
      this.aoConfirmarNova(nome, pv);
    });
    setTimeout(() => busca.focus(), 30);
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

let proximoUid = 1;

class Mapa {
  constructor(plugin, container, opcoes) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.opc = Object.assign({ compacto: false, papel: 'mestre' }, opcoes || {});
    this.mestre = this.opc.papel !== 'jogadores';
    this.uid = proximoUid++;
    this.root = el('div', 'arton-mapa' + (this.opc.compacto ? ' is-compacto' : '') + (this.mestre ? '' : ' is-jogadores'), container);
    this.ocultos = new Set();
    this.selecionado = null;
    this.modo = null; // null | 'marcador' | 'regua' | 'trilha'
    this.pontosRegua = [];
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this._ultimoFocoSeq = 0;
    this._neblinaVista = new Set();
    this.montarUI();
    this.carregarImagem();
    this._onResize = () => this.redimensionar();
    this.ro = new ResizeObserver(this._onResize);
  }

  montarUI() {
    const topo = el('div', 'arton-mapa-topo', this.root);
    const tit = el('div', 'arton-mapa-titulo', topo);
    el('span', 'arton-mapa-marca', tit, '🗺️');
    el('span', null, tit, this.mestre ? 'Mapa de Arton' : 'Mapa de Arton — jogadores');
    this.stats = el('span', 'arton-mapa-stats', tit, '');

    const acoes = el('div', 'arton-mapa-acoes', topo);
    if (this.mestre) {
      this.btnMarcador = el('button', 'arton-mapa-pill', acoes, '+ Marcador');
      this.btnMarcador.addEventListener('click', () => this.alternarModo('marcador'));
      this.btnRegua = el('button', 'arton-mapa-pill', acoes, '📏 Régua');
      this.btnRegua.addEventListener('click', () => this.alternarModo('regua'));
      this.btnTrilha = el('button', 'arton-mapa-pill', acoes, '🧭 Trilha');
      this.btnTrilha.addEventListener('click', () => this.alternarModo('trilha'));
      const btnDesfazer = el('button', 'arton-mapa-pill', acoes, '↩️');
      btnDesfazer.title = 'Desfazer o último ponto da trilha';
      btnDesfazer.addEventListener('click', () => this.plugin.desfazerTrilha());
      const btnLimpar = el('button', 'arton-mapa-pill', acoes, '🗑️');
      btnLimpar.title = 'Limpar a trilha do grupo';
      btnLimpar.addEventListener('click', () => this.plugin.limparTrilha());
      const btnCentro = el('button', 'arton-mapa-pill', acoes, '◎ Centralizar');
      btnCentro.addEventListener('click', () => this.centralizar());
      this.btnCongelar = el('button', 'arton-mapa-pill', acoes, '❄️ Congelar');
      this.btnCongelar.addEventListener('click', () => this.plugin.congelarAlternar());
      this.atualizarBotaoCongelar();
      const btnTelaJogadores = el('button', 'arton-mapa-pill', acoes, '🖥️ Jogadores');
      btnTelaJogadores.title = 'Abrir a tela dos jogadores (arraste para outra janela/TV)';
      btnTelaJogadores.addEventListener('click', () => this.plugin.abrirTelaJogadores());
      const btnDados = el('button', 'arton-mapa-pill', acoes, '🎲 Dados');
      btnDados.addEventListener('click', () => new ModalDados(this.app, this.plugin).open());
      if (this.opc.compacto) {
        const btnTela = el('button', 'arton-mapa-pill', acoes, '⤢ Tela cheia');
        btnTela.addEventListener('click', () => this.plugin.abrirMapa());
      }
    }

    this.viewport = el('div', 'arton-mapa-viewport', this.root);
    this.plano = el('div', 'arton-mapa-plano', this.viewport);
    this.img = el('img', 'arton-mapa-img', this.plano);

    if (!this.mestre) {
      this.svgNeblina = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgNeblina.setAttribute('class', 'arton-mapa-neblina-svg');
      this.plano.appendChild(this.svgNeblina);
    }

    this.camadaMarcadores = el('div', 'arton-mapa-marcadores', this.plano);

    if (this.mestre) {
      this.svgCobertura = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgCobertura.setAttribute('class', 'arton-mapa-cobertura-svg');
      this.plano.insertBefore(this.svgCobertura, this.camadaMarcadores);

      this.svgRegua = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgRegua.setAttribute('class', 'arton-mapa-regua-svg');
      this.plano.appendChild(this.svgRegua);
    }

    if (this.mestre) {
      this.legenda = el('div', 'arton-mapa-legenda', this.root);
      this.card = el('div', 'arton-mapa-card', this.root);
      this.card.style.display = 'none';
      this.dica = el('div', 'arton-mapa-dica', this.root, 'Arraste para mover · rodinha para zoom · clique num marcador para abrir');
    } else {
      this.dica = el('div', 'arton-mapa-dica', this.root, 'Esta tela segue o mestre — ninguém mexe por aqui.');
      // Som ambiente: um áudio (anexo do cofre) e um iframe escondido para vídeos do YouTube.
      this.audioEl = el('audio', null, this.root);
      this.audioEl.style.display = 'none';
      this.iframeSom = el('iframe', 'arton-mapa-iframe-som', this.root);
      this.iframeSom.style.display = 'none';
      this.iframeSom.allow = 'autoplay';
    }

    if (this.mestre) {
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
    for (const svg of [this.svgRegua, this.svgCobertura, this.svgNeblina]) {
      if (!svg) continue;
      svg.setAttribute('viewBox', `0 0 ${this.nw} ${this.nh}`);
      svg.setAttribute('width', this.nw); svg.setAttribute('height', this.nh);
    }
    this.ro.observe(this.viewport);
    this.redimensionar();
    this.recarregar();
    if (!this.mestre) {
      // Ao abrir uma tela dos jogadores nova, ela pula (sem drama) para o estado
      // atual do jogo em vez de tocar de novo a revelação de algo que já é notícia velha.
      const eg = this.plugin.estadoJogo;
      if (eg.vista) this.aplicarVistaExterna(eg.vista); else this.centralizar();
      if (eg.foco) { this._ultimoFocoSeq = eg.foco.seq; this.focarNoMarcador(eg.foco.path, false); }
    }
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
    if (this.mestre && this.plugin) {
      this.plugin.estadoJogo.vista = {
        centroNatural: this.telaParaNatural((this.viewport.clientWidth || 1) / 2, (this.viewport.clientHeight || 1) / 2),
        zoom: this.zoom,
      };
      this.plugin.aplicarEstadoJogo();
    }
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

  // Aplica, sem animação, a vista transmitida pelo mestre (centro em coordenada
  // natural do mapa + nível de zoom), recalculando o pan para o tamanho desta tela.
  aplicarVistaExterna(vista) {
    if (!this.nw || !vista || !vista.centroNatural) return;
    this.zoom = clamp(vista.zoom, 1, 6);
    const escala = this.escalaAtual();
    const cw = this.viewport.clientWidth || 1, ch = this.viewport.clientHeight || 1;
    this.pan.x = cw / 2 - vista.centroNatural.x * escala;
    this.pan.y = ch / 2 - vista.centroNatural.y * escala;
    this.plano.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${escala})`;
  }

  // Anima a câmera desta tela até centralizar o marcador com esse caminho. `dramatico`
  // deixa a animação mais longa e acende o marcador (a neblina em si já se dissolve
  // sozinha: veja o rastreio de "_neblinaVista" em desenharNeblina).
  focarNoMarcador(path, dramatico) {
    if (!this.nw) return;
    const m = (this.marcadores || []).find((x) => x.file.path === path);
    if (!m) return;
    const natX = (m.x / 100) * this.nw, natY = (m.y / 100) * this.nh;
    this._animarPara(natX, natY, 3.2, dramatico ? 1600 : 700);
    if (dramatico && m._el) {
      m._el.classList.add('is-revelando');
      setTimeout(() => { if (m._el) m._el.classList.remove('is-revelando'); }, 2000);
      const flash = el('div', 'arton-mapa-flash', this.camadaMarcadores);
      flash.style.left = m.x + '%'; flash.style.top = m.y + '%';
      setTimeout(() => flash.remove(), 1800);
    }
    if (m.som) this.tocarSom(m.som);
  }

  _animarPara(natX, natY, zoomAlvo, ms) {
    const zoomInicial = this.zoom;
    const cw = this.viewport.clientWidth || 1, ch = this.viewport.clientHeight || 1;
    const centro0 = this.telaParaNatural(cw / 2, ch / 2);
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const passo = () => {
      const agora = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const p = clamp((agora - t0) / ms, 0, 1);
      const s = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      this.zoom = zoomInicial + (zoomAlvo - zoomInicial) * s;
      const cx = centro0.x + (natX - centro0.x) * s, cy = centro0.y + (natY - centro0.y) * s;
      const escala = this.escalaAtual();
      this.pan.x = cw / 2 - cx * escala;
      this.pan.y = ch / 2 - cy * escala;
      this.plano.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${escala})`;
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  tocarSom(som) {
    this.pararSom();
    if (som.tipo === 'arquivo') {
      this.audioEl.src = this.app.vault.getResourcePath(som.file);
      this.audioEl.style.display = '';
      this.audioEl.play().catch(() => {});
    } else if (som.tipo === 'youtube') {
      this.iframeSom.src = `https://www.youtube.com/embed/${som.id}?autoplay=1&controls=0`;
      this.iframeSom.style.display = '';
    }
  }

  pararSom() {
    if (this.audioEl) { this.audioEl.pause(); this.audioEl.removeAttribute('src'); this.audioEl.style.display = 'none'; }
    if (this.iframeSom) { this.iframeSom.src = 'about:blank'; this.iframeSom.style.display = 'none'; }
  }

  clicarNoMapa(e) {
    const rect = this.viewport.getBoundingClientRect();
    const p = this.telaParaNatural(e.clientX - rect.left, e.clientY - rect.top);
    if (p.x < 0 || p.y < 0 || p.x > this.nw || p.y > this.nh) return;
    if (this.modo === 'marcador') this.criarMarcadorEm(p);
    else if (this.modo === 'regua') this.clicarRegua(p);
    else if (this.modo === 'trilha') this.plugin.adicionarPontoTrilha((p.x / this.nw) * 100, (p.y / this.nh) * 100);
  }

  alternarModo(modo) {
    this.modo = this.modo === modo ? null : modo;
    this.btnMarcador.classList.toggle('is-ativo', this.modo === 'marcador');
    this.btnRegua.classList.toggle('is-ativo', this.modo === 'regua');
    this.btnTrilha.classList.toggle('is-ativo', this.modo === 'trilha');
    this.pontosRegua = [];
    this.desenharRegua();
    this.viewport.style.cursor = this.modo ? 'crosshair' : '';
    if (this.modo === 'regua') {
      const dados = this.plugin.dados;
      new obsidian.Notice(dados.kmPorPixel
        ? 'Clique dois pontos no mapa para medir a distância.'
        : 'Ainda não sei a escala do mapa: clique nos dois extremos da régua de km impressa nele.');
    } else if (this.modo === 'trilha') {
      new obsidian.Notice('Clique no mapa para marcar por onde o grupo passou. Clique de novo em "🧭 Trilha" para parar.');
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
    if (this.mestre) {
      this.atualizarLegenda();
      this.desenharCobertura();
      this.stats.textContent = `${this.marcadores.length} marcador${this.marcadores.length === 1 ? '' : 'es'}`;
      if (this.selecionado) this.mostrarCard(this.selecionado); else this.card.style.display = 'none';
    } else {
      this.desenharNeblina();
    }
  }

  construirMarcadores() {
    this.camadaMarcadores.textContent = '';
    for (const m of this.marcadores) {
      const visivelParaMim = this.mestre || m.estado.id !== 'oculto';
      if (!visivelParaMim) continue;
      const pino = el('button', 'arton-mapa-pino', this.camadaMarcadores);
      pino.style.left = m.x + '%'; pino.style.top = m.y + '%';
      const escondidoPeloFiltro = this.mestre && this.ocultos.has(m.tipo.id);
      pino.style.display = escondidoPeloFiltro ? 'none' : '';
      if (!this.mestre && m.estado.id === 'rumor') {
        pino.classList.add('is-rumor');
        pino.title = '';
        el('span', null, pino, '❓');
      } else {
        pino.title = m.nome;
        el('span', null, pino, m.tipo.icone);
        if (this.mestre && m.estado.id !== 'revelado') {
          pino.classList.add('is-' + m.estado.id);
          el('span', 'arton-mapa-pino-selo', pino, m.estado.icone);
        }
      }
      if (this.mestre) pino.addEventListener('click', (e) => { e.stopPropagation(); this.selecionar(m); });
      else pino.disabled = true;
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

  // Círculos pontilhados no mapa do mestre, só pra lembrar onde a neblina já está
  // aberta pros jogadores (a tela dos jogadores é que mostra a neblina de verdade).
  desenharCobertura() {
    this.svgCobertura.textContent = '';
    const ns = 'http://www.w3.org/2000/svg';
    for (const m of this.marcadores) {
      if (!m.neblina) continue;
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', (m.x / 100) * this.nw); c.setAttribute('cy', (m.y / 100) * this.nh);
      c.setAttribute('r', (m.raio / 100) * this.nw);
      c.setAttribute('class', 'arton-mapa-cobertura-circ');
      this.svgCobertura.appendChild(c);
    }
  }

  // A neblina de verdade, só na tela dos jogadores: um retângulo preto com buracos
  // (raio próprio de cada marcador aberto) e um túnel ao longo da trilha do grupo.
  // Marcadores que abriram a neblina NESTE recarregamento crescem de 0 até o raio
  // final (a transição fica na regra CSS `.arton-mapa-neblina-circ`), o que é a
  // "revelação dramática" da neblina — sem precisar animar nada em JS.
  desenharNeblina() {
    if (!this.nw) return;
    const ns = 'http://www.w3.org/2000/svg';
    this.svgNeblina.textContent = '';
    const maskId = `arton-neblina-mask-${this.uid}`;
    const defs = document.createElementNS(ns, 'defs');
    const mask = document.createElementNS(ns, 'mask');
    mask.setAttribute('id', maskId);
    const fundo = document.createElementNS(ns, 'rect');
    fundo.setAttribute('width', this.nw); fundo.setAttribute('height', this.nh); fundo.setAttribute('fill', 'white');
    mask.appendChild(fundo);

    const abertosAgora = new Set();
    for (const m of this.marcadores) {
      if (!m.neblina) continue;
      abertosAgora.add(m.file.path);
      const raioPx = (m.raio / 100) * this.nw;
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', (m.x / 100) * this.nw); c.setAttribute('cy', (m.y / 100) * this.nh);
      c.setAttribute('fill', 'black');
      c.setAttribute('class', 'arton-mapa-neblina-circ');
      const novo = !this._neblinaVista.has(m.file.path);
      c.setAttribute('r', novo ? 0 : raioPx);
      mask.appendChild(c);
      if (novo) requestAnimationFrame(() => requestAnimationFrame(() => c.setAttribute('r', raioPx)));
    }
    this._neblinaVista = abertosAgora;

    const trilha = (this.plugin.dados && this.plugin.dados.trilha) || [];
    if (trilha.length) {
      const pontos = trilha.map((p) => `${(p.x / 100) * this.nw},${(p.y / 100) * this.nh}`).join(' ');
      const linha = document.createElementNS(ns, 'polyline');
      linha.setAttribute('points', pontos);
      linha.setAttribute('fill', 'none');
      linha.setAttribute('stroke', 'black');
      linha.setAttribute('stroke-width', Math.max(6, this.nw * 0.012));
      linha.setAttribute('stroke-linecap', 'round');
      linha.setAttribute('stroke-linejoin', 'round');
      linha.setAttribute('class', 'arton-mapa-neblina-trilha');
      mask.appendChild(linha);
      for (const p of trilha) {
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', (p.x / 100) * this.nw); c.setAttribute('cy', (p.y / 100) * this.nh);
        c.setAttribute('r', Math.max(6, this.nw * 0.012));
        c.setAttribute('fill', 'black');
        c.setAttribute('class', 'arton-mapa-neblina-trilha');
        mask.appendChild(c);
      }
    }

    defs.appendChild(mask);
    this.svgNeblina.appendChild(defs);
    const capa = document.createElementNS(ns, 'rect');
    capa.setAttribute('width', this.nw); capa.setAttribute('height', this.nh);
    capa.setAttribute('fill', 'black');
    capa.setAttribute('mask', `url(#${maskId})`);
    this.svgNeblina.appendChild(capa);
  }

  atualizarBotaoCongelar() {
    if (!this.btnCongelar) return;
    const congelado = this.plugin.estadoJogo.congelado;
    this.btnCongelar.textContent = congelado ? '🔥 Soltar' : '❄️ Congelar';
    this.btnCongelar.classList.toggle('is-ativo', congelado);
    this.btnCongelar.title = congelado
      ? 'A tela dos jogadores está congelada: clique para soltar e mostrar tudo de novo.'
      : 'Congela a tela dos jogadores pra você preparar coisas sem eles verem ainda.';
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
    const focar = el('button', 'arton-mapa-pill', bts, '🎯 Focar nos jogadores');
    focar.addEventListener('click', () => this.plugin.focar(m.file.path, false));
    const verGlobo = el('button', 'arton-mapa-pill', bts, '🌐 Ver no globo');
    verGlobo.addEventListener('click', () => this.plugin.abrirNoGlobo(m.file));
    const combate = el('button', 'arton-mapa-pill', bts, '⚔️ Mapa de batalha');
    combate.addEventListener('click', () => this.plugin.iniciarCombateDeMarcador(m));

    if (m.galeria.length) {
      const gal = el('div', 'arton-mapa-galeria', c);
      m.galeria.forEach((f, i) => {
        const img = el('img', 'arton-mapa-galeria-item', gal);
        img.src = this.app.vault.getResourcePath(f);
        img.addEventListener('click', () => new Lightbox(this.app, m.galeria, i));
      });
    }

    el('div', 'arton-mapa-card-rotulo', c, 'Estado na tela dos jogadores:');
    const chipsEstado = el('div', 'arton-mapa-card-bts', c);
    for (const e of ESTADOS) {
      const chip = el('button', 'arton-mapa-pill' + (m.estado.id === e.id ? ' is-ativo' : ''), chipsEstado, `${e.icone} ${e.nome}`);
      chip.addEventListener('click', () => this.plugin.definirEstado(m, e.id));
    }

    el('div', 'arton-mapa-card-rotulo', c, 'Neblina (raio próprio):');
    const linhaNeblina = el('div', 'arton-mapa-card-bts', c);
    const chipNeblina = el('button', 'arton-mapa-pill' + (m.neblina ? ' is-ativo' : ''), linhaNeblina, m.neblina ? '🌫️ Aberta' : '🌫️ Fechada');
    chipNeblina.addEventListener('click', () => this.plugin.alternarNeblina(m));
    const raioInput = el('input', 'arton-mapa-campo arton-mapa-campo-raio', linhaNeblina);
    raioInput.type = 'number'; raioInput.min = '0.5'; raioInput.step = '0.5'; raioInput.value = m.raio;
    raioInput.title = 'Raio da neblina, em % da largura do mapa';
    raioInput.addEventListener('change', () => {
      const v = Number(raioInput.value);
      if (Number.isFinite(v) && v > 0) this.plugin.salvarRaio(m, v);
    });

    el('div', 'arton-mapa-card-rotulo', c, 'Som deste lugar (anexo ou link do YouTube):');
    const linhaSom = el('div', 'arton-mapa-card-bts', c);
    const somInput = el('input', 'arton-mapa-campo', linhaSom);
    somInput.type = 'text'; somInput.value = m.somBruto; somInput.placeholder = 'taverna.mp3 ou link do YouTube';
    const salvarSom = el('button', 'arton-mapa-pill', linhaSom, '💾');
    salvarSom.title = 'Salvar o som';
    salvarSom.addEventListener('click', () => this.plugin.salvarSom(m, somInput.value));
    if (m.som) {
      const testar = el('button', 'arton-mapa-pill', linhaSom, '▶️');
      testar.title = 'Testar (só toca aqui, no seu ecrã)';
      testar.addEventListener('click', () => this.tocarSom(m.som));
      const parar = el('button', 'arton-mapa-pill', linhaSom, '⏹');
      parar.addEventListener('click', () => this.pararSom());
    }
  }

  mostrarRolagem(evento) { mostrarRolagemEm(this.root, evento); }

  destruir() {
    if (this.ro) this.ro.disconnect();
    this.pararSom();
    this.root.remove();
  }
}

// A silhueta do dado muda com o número de lados — não é um poliedro geometricamente
// certo (um d20 de verdade tem 20 faces triangulares, não dá pra modelar isso só em
// CSS com um ganho que valha a pena), mas pelo menos um d4 não fica com cara de d6.
function classeFormaDado(lados) {
  if (lados <= 4) return 'is-forma-tri';
  if (lados <= 6) return 'is-forma-quad';
  if (lados <= 8) return 'is-forma-octo';
  if (lados <= 12) return 'is-forma-penta';
  return 'is-forma-redondo';
}

// Rolagem de dados animada + som sintetizado, usada tanto no mapa-múndi quanto no
// combate (por isso é uma função à parte, não um método de uma classe só).
function mostrarRolagemEm(root, evento) {
  const overlay = el('div', 'arton-dado-overlay', root);
  const caixa = el('div', 'arton-dado-caixa', overlay);
  el('div', 'arton-dado-rotulo', caixa, evento.rotulo || evento.expr);
  const cubo = el('div', 'arton-dado-cubo3d ' + classeFormaDado(evento.lados), caixa);
  const numeros = ['frente', 'tras', 'direita', 'esquerda', 'cima', 'baixo'].map((lado) => {
    const face = el('div', 'arton-dado-face is-' + lado, cubo);
    return el('span', 'arton-dado-numero', face, '?');
  });
  tocarEfeito('rolando');
  let tique = 0;
  const giro = setInterval(() => {
    const v = String(1 + Math.floor(Math.random() * Math.max(20, evento.lados)));
    for (const n of numeros) n.textContent = v;
    tique++;
    if (tique > 12) {
      clearInterval(giro);
      cubo.classList.add('is-parado');
      for (const n of numeros) n.textContent = String(evento.total);
      caixa.classList.add(evento.critico ? 'is-critico' : evento.falha ? 'is-falha' : 'is-normal');
      el('div', 'arton-dado-detalhe', caixa, `${evento.expr}: [${evento.rolagens.join(', ')}]${evento.mod ? (evento.mod > 0 ? '+' : '') + evento.mod : ''}`);
      tocarEfeito(evento.critico ? 'critico' : evento.falha ? 'falha' : 'impacto');
    }
  }, 90);
  setTimeout(() => overlay.remove(), 3600);
}

class ModalDados extends obsidian.Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    this.titleEl.textContent = '🎲 Rolar dados (aparece em todas as telas abertas)';
    const c = this.contentEl;
    c.classList.add('arton-modal');
    const chips = el('div', 'arton-mapa-modal-chips', c);
    for (const expr of ['1d20', '1d4', '1d6', '1d8', '1d10', '1d12', '2d6', '1d100']) {
      const b = el('button', 'arton-mapa-pill', chips, expr);
      b.addEventListener('click', () => this.plugin.rolarEBroadcast(expr));
    }
    const linha = el('div', 'arton-mapa-card-bts', c);
    const input = el('input', 'arton-modal-input', linha);
    input.type = 'text'; input.placeholder = 'ex.: 1d20+7';
    const rolar = el('button', 'mod-cta', linha, 'Rolar');
    const ir = () => { if (input.value.trim()) this.plugin.rolarEBroadcast(input.value.trim()); };
    rolar.addEventListener('click', ir);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(); });
    setTimeout(() => input.focus(), 30);
  }
  onClose() { this.contentEl.textContent = ''; }
}

/* ---------- Combate (etapa 3) ---------- */

const RAIO_LUZ_PJ = 16; // % da largura da imagem de batalha, "neblina de sala" ao redor de cada PJ

class CombateTela {
  constructor(plugin, container, opc) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.mestre = !!(opc && opc.mestre);
    this.root = el('div', 'arton-combate' + (this.mestre ? '' : ' is-jogadores'), container);
    this._ultimaAberturaSeq = 0;
    this._neblinaVista = new Set();
    this.selecionada = null;
    this.montarUI();
    this.render();
  }

  montarUI() {
    if (this.mestre) {
      const topo = el('div', 'arton-combate-topo', this.root);
      el('span', 'arton-mapa-marca', topo, '⚔️');
      el('span', null, topo, 'Mapa de batalha');
      const btnPJ = el('button', 'arton-mapa-pill', topo, '+ PJ');
      btnPJ.addEventListener('click', () => this.plugin.abrirEscolhaFicha('pj'));
      const btnMonstro = el('button', 'arton-mapa-pill', topo, '+ Monstro');
      btnMonstro.addEventListener('click', () => this.plugin.abrirEscolhaFicha('monstro'));
      const btnDados = el('button', 'arton-mapa-pill', topo, '🎲 Dados');
      btnDados.addEventListener('click', () => new ModalDados(this.app, this.plugin).open());
      const btnProximo = el('button', 'arton-mapa-pill is-ativo', topo, '▶️ Próximo turno');
      btnProximo.addEventListener('click', () => this.plugin.avancarTurno());
      const btnFechar = el('button', 'arton-mapa-pill', topo, '✕ Fechar combate');
      btnFechar.addEventListener('click', () => this.plugin.encerrarCombate());
    }

    this.corpo = el('div', 'arton-combate-corpo', this.root);
    this.cena = el('div', 'arton-combate-cena', this.corpo);
    this.imgEl = el('img', 'arton-combate-img', this.cena);
    this.svgGrade = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgGrade.setAttribute('class', 'arton-combate-grade-svg');
    this.svgGrade.setAttribute('preserveAspectRatio', 'none');
    this.cena.appendChild(this.svgGrade);
    if (!this.mestre) {
      this.svgNeblina = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgNeblina.setAttribute('class', 'arton-combate-neblina-svg');
      this.svgNeblina.setAttribute('preserveAspectRatio', 'none');
      this.cena.appendChild(this.svgNeblina);
    }
    this.camadaFichas = el('div', 'arton-combate-fichas', this.cena);
    this.banner = el('div', 'arton-combate-banner', this.cena);
    this.aberturaEl = el('div', 'arton-combate-abertura', this.root);

    if (this.mestre) this.painel = el('div', 'arton-combate-painel', this.corpo);
    else this.dica = el('div', 'arton-mapa-dica', this.root, 'Combate — segue o mestre.');
  }

  garantirImagem(combate) {
    if (this.imgEl.dataset.src === combate.imagem) return;
    this.imgEl.dataset.src = combate.imagem;
    this.imgEl.src = combate.imagem;
    this.imgEl.onload = () => {
      this.nw = this.imgEl.naturalWidth; this.nh = this.imgEl.naturalHeight;
      this.cena.style.aspectRatio = `${this.nw} / ${this.nh}`;
      this.altoViewBox = 100 * (this.nh / this.nw);
      for (const svg of [this.svgGrade, this.svgNeblina]) {
        if (!svg) continue;
        svg.setAttribute('viewBox', `0 0 100 ${this.altoViewBox}`);
      }
      this.render();
    };
  }

  render() {
    const combate = this.plugin.combate;
    this.root.style.display = combate ? 'flex' : 'none';
    if (!combate) return;
    this.garantirImagem(combate);
    this.desenharGrade(combate);
    this.desenharFichas(combate);
    if (this.mestre) this.desenharPainel(combate);
    else this.desenharNeblina(combate);
    this.atualizarBanner(combate);
    if (!this.mestre && combate.aberturaSeq > this._ultimaAberturaSeq) {
      this._ultimaAberturaSeq = combate.aberturaSeq;
      this.tocarAbertura(combate.aberturaEstilo);
    }
  }

  desenharGrade(combate) {
    this.svgGrade.textContent = '';
    if (!this.altoViewBox) return;
    const ns = 'http://www.w3.org/2000/svg';
    const tam = combate.quadradoPct;
    for (let x = 0; x <= 100 + 0.01; x += tam) {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', x); l.setAttribute('y1', 0); l.setAttribute('x2', x); l.setAttribute('y2', this.altoViewBox);
      l.setAttribute('class', 'arton-combate-grade-linha');
      this.svgGrade.appendChild(l);
    }
    for (let y = 0; y <= this.altoViewBox + 0.01; y += tam) {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', 0); l.setAttribute('y1', y); l.setAttribute('x2', 100); l.setAttribute('y2', y);
      l.setAttribute('class', 'arton-combate-grade-linha');
      this.svgGrade.appendChild(l);
    }
  }

  desenharFichas(combate) {
    this.camadaFichas.textContent = '';
    const idAtual = combate.iniciativa[combate.turno] && combate.iniciativa[combate.turno].fichaId;
    for (const f of combate.fichas) {
      const tok = el('div', 'arton-combate-token is-' + f.tipo, this.camadaFichas);
      tok.style.left = f.x + '%'; tok.style.top = f.y + '%';
      if (f.id === idAtual) tok.classList.add('is-atual');
      if (f.id === this.selecionada) tok.classList.add('is-selecionada');
      el('span', 'arton-combate-token-emoji', tok, f.tipo === 'pj' ? '🛡️' : '👹');
      if (this.mestre) {
        el('span', 'arton-combate-token-rotulo', tok, `${f.nome} · ${f.pv}/${f.pvMax}`);
      } else {
        const est = estadoPV(f.pv, f.pvMax);
        el('span', 'arton-combate-token-rotulo', tok, `${f.tipo === 'pj' ? f.nome : ''} ${est.rotulo}`.trim());
        tok.classList.add(est.classe);
      }
      if (f.condicoes.length) {
        const selos = el('div', 'arton-combate-token-selos', tok);
        for (const cid of f.condicoes) el('span', null, selos, (CONDICAO_POR_ID[cid] || {}).icone || '');
      }
      if (this.mestre) {
        tok.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.selecionada = f.id;
          const mover = (ev) => {
            const rect = this.cena.getBoundingClientRect();
            f.x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100);
            f.y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100);
            tok.style.left = f.x + '%'; tok.style.top = f.y + '%';
          };
          const soltar = () => {
            document.removeEventListener('pointermove', mover);
            document.removeEventListener('pointerup', soltar);
            this.plugin.sincronizarCombate();
          };
          document.addEventListener('pointermove', mover);
          document.addEventListener('pointerup', soltar);
          this.desenharPainel(combate);
        });
      }
    }
  }

  // "Neblina de sala": um círculo de luz em volta de cada PJ, igual em espírito à
  // neblina do mapa-múndi, mas sempre acompanhando onde o token do PJ está agora.
  desenharNeblina(combate) {
    if (!this.altoViewBox) return;
    const ns = 'http://www.w3.org/2000/svg';
    this.svgNeblina.textContent = '';
    if (!combate.neblina) return;
    const maskId = 'arton-combate-neblina-mask';
    const defs = document.createElementNS(ns, 'defs');
    const mask = document.createElementNS(ns, 'mask');
    mask.setAttribute('id', maskId);
    const fundo = document.createElementNS(ns, 'rect');
    fundo.setAttribute('width', 100); fundo.setAttribute('height', this.altoViewBox); fundo.setAttribute('fill', 'white');
    mask.appendChild(fundo);
    for (const f of combate.fichas) {
      if (f.tipo !== 'pj') continue;
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', f.x); c.setAttribute('cy', (f.y / 100) * this.altoViewBox);
      c.setAttribute('r', RAIO_LUZ_PJ); c.setAttribute('fill', 'black');
      mask.appendChild(c);
    }
    defs.appendChild(mask);
    this.svgNeblina.appendChild(defs);
    const capa = document.createElementNS(ns, 'rect');
    capa.setAttribute('width', 100); capa.setAttribute('height', this.altoViewBox);
    capa.setAttribute('fill', 'black'); capa.setAttribute('mask', `url(#${maskId})`);
    this.svgNeblina.appendChild(capa);
  }

  atualizarBanner(combate) {
    const entrada = combate.iniciativa[combate.turno];
    const ficha = entrada && combate.fichas.find((f) => f.id === entrada.fichaId);
    this.banner.textContent = ficha ? `Rodada ${combate.rodada} — vez de ${ficha.nome}` : `Rodada ${combate.rodada}`;
  }

  tocarAbertura(estilo) {
    tocarEfeito(estilo);
    const el2 = this.aberturaEl;
    el2.textContent = '';
    el2.className = 'arton-combate-abertura is-ativa is-' + estilo;
    const txt = estilo === 'chefe' ? '👑 CHEFE' : estilo === 'cinema' ? '' : '⚔️ COMBATE!';
    if (txt) el('div', 'arton-combate-abertura-txt', el2, txt);
    setTimeout(() => { el2.className = 'arton-combate-abertura'; }, 1600);
  }

  mostrarRolagem(evento) { mostrarRolagemEm(this.root, evento); }

  desenharPainel(combate) {
    const p = this.painel;
    p.textContent = '';
    el('div', 'arton-mapa-card-rotulo', p, 'Iniciativa (clique numa ficha no mapa pra selecionar):');
    const lista = el('div', 'arton-combate-iniciativa', p);
    combate.iniciativa.forEach((entrada, i) => {
      const ficha = combate.fichas.find((f) => f.id === entrada.fichaId);
      if (!ficha) return;
      const linha = el('div', 'arton-combate-linha' + (i === combate.turno ? ' is-atual' : ''), lista);
      const valorInput = el('input', 'arton-mapa-campo arton-mapa-campo-raio', linha);
      valorInput.type = 'number'; valorInput.value = entrada.valor;
      valorInput.addEventListener('change', () => { entrada.valor = Number(valorInput.value) || 0; this.plugin.sincronizarCombate(); });
      el('span', 'arton-combate-linha-nome', linha, `${ficha.tipo === 'pj' ? '🛡️' : '👹'} ${ficha.nome}`);
      const cima = el('button', 'arton-mapa-fechar', linha, '▲');
      cima.addEventListener('click', () => this.plugin.moverIniciativa(i, -1));
      const baixo = el('button', 'arton-mapa-fechar', linha, '▼');
      baixo.addEventListener('click', () => this.plugin.moverIniciativa(i, 1));
      const atrasar = el('button', 'arton-mapa-pill', linha, 'Atrasar');
      atrasar.addEventListener('click', () => this.plugin.atrasarNaIniciativa(i));
    });

    const f = combate.fichas.find((x) => x.id === this.selecionada);
    if (!f) { el('div', 'arton-vazio', p, 'Clique numa ficha no mapa pra ver os detalhes.'); return; }
    el('div', 'arton-mapa-card-rotulo', p, `${f.nome}${f.file ? '' : ' (ficha avulsa)'}`);
    const pvLinha = el('div', 'arton-mapa-card-bts', p);
    el('span', null, pvLinha, 'PV:');
    const menos = el('button', 'arton-mapa-pill', pvLinha, '−'); menos.addEventListener('click', () => this.plugin.ajustarPV(f.id, -1));
    el('span', 'arton-combate-pv', pvLinha, `${f.pv}/${f.pvMax}`);
    const mais = el('button', 'arton-mapa-pill', pvLinha, '+'); mais.addEventListener('click', () => this.plugin.ajustarPV(f.id, 1));
    const menos5 = el('button', 'arton-mapa-pill', pvLinha, '−5'); menos5.addEventListener('click', () => this.plugin.ajustarPV(f.id, -5));
    const mais5 = el('button', 'arton-mapa-pill', pvLinha, '+5'); mais5.addEventListener('click', () => this.plugin.ajustarPV(f.id, 5));
    const remover = el('button', 'arton-mapa-pill', pvLinha, '🗑️ Remover');
    remover.addEventListener('click', () => { this.selecionada = null; this.plugin.removerFicha(f.id); });

    el('div', 'arton-mapa-card-rotulo', p, 'Condições:');
    const condLinha = el('div', 'arton-mapa-card-bts', p);
    for (const cnd of CONDICOES) {
      const ativa = f.condicoes.includes(cnd.id);
      const chip = el('button', 'arton-mapa-pill' + (ativa ? ' is-ativo' : ''), condLinha, `${cnd.icone} ${cnd.nome}`);
      chip.addEventListener('click', () => this.plugin.alternarCondicao(f.id, cnd.id));
    }

    if (f.ataques.length) {
      el('div', 'arton-mapa-card-rotulo', p, 'Ataques:');
      const atLinha = el('div', 'arton-mapa-card-bts', p);
      f.ataques.forEach((a, idx) => {
        const acerto = el('button', 'arton-mapa-pill', atLinha, `🎯 ${a.nome} (${a.bonus >= 0 ? '+' : ''}${a.bonus})`);
        acerto.addEventListener('click', () => this.plugin.rolarAtaque(f.id, idx, 'acerto'));
        const dano = el('button', 'arton-mapa-pill', atLinha, `💥 Dano (${a.dano})`);
        dano.addEventListener('click', () => this.plugin.rolarAtaque(f.id, idx, 'dano'));
      });
    }
  }

  destruir() { this.root.remove(); }
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
    this.mapa = new Mapa(this.plugin, this.contentEl, { compacto: false, papel: 'mestre' });
    this.plugin.mapas.add(this.mapa);
  }
  async onClose() {
    if (this.mapa) { this.plugin.mapas.delete(this.mapa); this.mapa.destruir(); this.mapa = null; }
  }
}

// A tela dos jogadores mostra o mapa-múndi OU o combate, nunca os dois — troca
// sozinha conforme `plugin.combate` existir ou não (ver `plugin.sincronizarCombate`).
class MapaJogadoresView extends obsidian.ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW_TYPE_JOGADORES; }
  getDisplayText() { return 'Mapa de Arton — tela dos jogadores'; }
  getIcon() { return 'tv'; }
  async onOpen() {
    this.contentEl.textContent = '';
    this.contentEl.classList.add('arton-mapa-view');
    this.mapa = new Mapa(this.plugin, this.contentEl, { compacto: false, papel: 'jogadores' });
    this.combate = new CombateTela(this.plugin, this.contentEl, { mestre: false });
    this.plugin.mapas.add(this.mapa);
    this.plugin.combates.add(this.combate);
    this.plugin.sincronizarCombate();
  }
  async onClose() {
    if (this.mapa) { this.plugin.mapas.delete(this.mapa); this.mapa.destruir(); this.mapa = null; }
    if (this.combate) { this.plugin.combates.delete(this.combate); this.combate.destruir(); this.combate = null; }
  }
}

class CombateView extends obsidian.ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW_TYPE_COMBATE; }
  getDisplayText() { return 'Mapa de batalha'; }
  getIcon() { return 'swords'; }
  async onOpen() {
    this.contentEl.textContent = '';
    this.contentEl.classList.add('arton-mapa-view');
    this.combate = new CombateTela(this.plugin, this.contentEl, { mestre: true });
    this.plugin.combates.add(this.combate);
  }
  async onClose() {
    if (this.combate) { this.plugin.combates.delete(this.combate); this.combate.destruir(); this.combate = null; }
  }
}

class MapaEmbutido extends obsidian.MarkdownRenderChild {
  constructor(el, plugin, altura) { super(el); this.plugin = plugin; this.altura = altura; }
  onload() {
    this.containerEl.classList.add('arton-mapa-embutido');
    this.containerEl.style.height = this.altura + 'px';
    this.mapa = new Mapa(this.plugin, this.containerEl, { compacto: true, papel: 'mestre' });
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
    this.combates = new Set();
    this.dados = Object.assign({}, PADRAO_DADOS, await this.loadData());
    this.dados.velocidades = Object.assign({}, PADRAO_DADOS.velocidades, this.dados.velocidades);
    this.dados.trilha = Array.isArray(this.dados.trilha) ? this.dados.trilha : [];
    // Estado da mesa (foco da câmera, congelamento, combate em andamento): não fica
    // salvo em disco, é só da sessão de jogo acontecendo agora. Quem fica salvo
    // (estado/neblina/raio/som de cada marcador, o rastro) mora no frontmatter das
    // próprias notas ou em `data.json` (ver `this.dados`).
    this.estadoJogo = { congelado: false, vista: null, foco: null };
    this._focoSeq = 0;
    this.combate = null; // null = sem combate ativo; ver `iniciarCombate`/`encerrarCombate`

    this.registerView(VIEW_TYPE, (leaf) => new MapaView(leaf, this));
    this.registerView(VIEW_TYPE_JOGADORES, (leaf) => new MapaJogadoresView(leaf, this));
    this.registerView(VIEW_TYPE_COMBATE, (leaf) => new CombateView(leaf, this));
    this.addRibbonIcon('map', 'Abrir o Mapa de Arton', () => this.abrirMapa());
    this.addCommand({ id: 'abrir-mapa', name: 'Abrir o Mapa de Arton', callback: () => this.abrirMapa() });
    this.addCommand({ id: 'abrir-tela-jogadores', name: 'Abrir a tela dos jogadores do Mapa de Arton', callback: () => this.abrirTelaJogadores() });
    this.addCommand({ id: 'congelar-tela-jogadores', name: 'Congelar/soltar a tela dos jogadores', callback: () => this.congelarAlternar() });
    this.addCommand({ id: 'rolar-dados', name: 'Rolar dados', callback: () => new ModalDados(this.app, this).open() });
    this.addCommand({ id: 'atualizar-rastro-sessoes', name: 'Atualizar o rastro do grupo pelas sessões', callback: () => this.atualizarRastroDasSessoes() });
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
      timer = setTimeout(() => this.recarregarTudo(), 1200);
    }));
  }

  onunload() {
    for (const m of this.mapas) m.destruir();
    this.mapas.clear();
    for (const c of this.combates) c.destruir();
    this.combates.clear();
  }

  recarregarTudo() { for (const m of this.mapas) m.recarregar(); }

  // O metadataCache do Obsidian pode demorar um instante pra reprocessar o
  // frontmatter depois de um processFrontMatter; esta segunda passada evita que o
  // marcador pareça não ter mudado por causa dessa corrida.
  recarregarTudoDeNovoLogo() { setTimeout(() => this.recarregarTudo(), 300); }

  async abrirMapa() {
    const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (existente) { this.app.workspace.revealLeaf(existente); return; }
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async abrirTelaJogadores() {
    const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE_JOGADORES)[0];
    if (existente) { this.app.workspace.revealLeaf(existente); return; }
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE_JOGADORES, active: true });
    this.app.workspace.revealLeaf(leaf);
    new obsidian.Notice('Tela dos jogadores aberta. Arraste a aba pra fora (ou botão direito → "Abrir em nova janela") pra mandar pra TV.', 8000);
  }

  // Muda o estado (oculto/rumor/revelado) de um marcador. Revelar de verdade
  // (algo que não estava revelado) dispara a câmera com o efeito dramático.
  async definirEstado(m, estadoId) {
    const era = m.estado.id;
    await this.app.fileManager.processFrontMatter(m.file, (fm) => { fm.mapa_estado = estadoId; });
    this.recarregarTudo();
    this.recarregarTudoDeNovoLogo();
    if (estadoId === 'revelado' && era !== 'revelado') this.focar(m.file.path, true);
  }

  async alternarNeblina(m) {
    const abrindo = !m.neblina;
    await this.app.fileManager.processFrontMatter(m.file, (fm) => { fm.mapa_neblina = abrindo; });
    this.recarregarTudo();
    this.recarregarTudoDeNovoLogo();
    if (abrindo) this.focar(m.file.path, true);
  }

  async salvarRaio(m, raioPct) {
    await this.app.fileManager.processFrontMatter(m.file, (fm) => { fm.mapa_raio = raioPct; });
    this.recarregarTudo();
    this.recarregarTudoDeNovoLogo();
  }

  async salvarSom(m, valor) {
    const v = String(valor || '').trim();
    await this.app.fileManager.processFrontMatter(m.file, (fm) => {
      if (v) fm.mapa_som = v; else delete fm.mapa_som;
    });
    this.recarregarTudo();
    this.recarregarTudoDeNovoLogo();
    new obsidian.Notice(v ? 'Som salvo.' : 'Som removido.');
  }

  // Aponta a câmera das telas dos jogadores para um marcador (sem mexer na do
  // mestre). `dramatico` acende o marcador com um brilho; a neblina (se for o caso)
  // já se dissolve sozinha, veja `desenharNeblina`.
  focar(path, dramatico) {
    this._focoSeq++;
    this.estadoJogo.foco = { path, dramatico, seq: this._focoSeq };
    this.aplicarEstadoJogo();
  }

  aplicarEstadoJogo() {
    if (this.estadoJogo.congelado) return;
    for (const m of this.mapas) {
      if (m.mestre) continue;
      if (this.estadoJogo.vista) m.aplicarVistaExterna(this.estadoJogo.vista);
      const f = this.estadoJogo.foco;
      if (f && f.seq > (m._ultimoFocoSeq || 0)) { m._ultimoFocoSeq = f.seq; m.focarNoMarcador(f.path, f.dramatico); }
    }
  }

  congelarAlternar() {
    this.estadoJogo.congelado = !this.estadoJogo.congelado;
    for (const m of this.mapas) if (m.mestre) m.atualizarBotaoCongelar();
    new obsidian.Notice(this.estadoJogo.congelado
      ? '❄️ Tela dos jogadores congelada.'
      : '🔥 Tela dos jogadores solta de novo.');
    if (!this.estadoJogo.congelado) this.aplicarEstadoJogo();
  }

  async adicionarPontoTrilha(xPct, yPct) {
    this.dados.trilha.push({ x: xPct, y: yPct });
    await this.saveData(this.dados);
    this.recarregarTudo();
  }

  async desfazerTrilha() {
    if (!this.dados.trilha.length) return;
    this.dados.trilha.pop();
    await this.saveData(this.dados);
    this.recarregarTudo();
  }

  async limparTrilha() {
    if (!this.dados.trilha.length) return;
    this.dados.trilha = [];
    await this.saveData(this.dados);
    this.recarregarTudo();
    new obsidian.Notice('Trilha do grupo apagada.');
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

  /* ---------- Etapa 3: combate ---------- */

  iniciarCombateDeMarcador(m) {
    if (!m.galeria.length) { new obsidian.Notice('Adicione uma imagem na galeria dessa nota primeiro (frontmatter `galeria`).'); return; }
    const comImagem = (imagemFile) => {
      new ModalAbertura(this.app, (estilo) => this.iniciarCombate(m, imagemFile, estilo)).open();
    };
    if (m.galeria.length === 1) comImagem(m.galeria[0]);
    else new ModalEscolherImagem(this.app, m.galeria, comImagem).open();
  }

  async iniciarCombate(marcador, imagemFile, estilo) {
    this._aberturaSeq = (this._aberturaSeq || 0) + 1;
    this.combate = {
      origem: marcador.file.path,
      imagem: this.app.vault.getResourcePath(imagemFile),
      quadradoPct: 8,
      fichas: [],
      iniciativa: [],
      turno: 0,
      rodada: 1,
      aberturaEstilo: estilo,
      aberturaSeq: this._aberturaSeq,
      neblina: true,
    };
    await this.abrirCombateMestre();
    this.sincronizarCombate();
  }

  async abrirCombateMestre() {
    const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMBATE)[0];
    if (existente) { this.app.workspace.revealLeaf(existente); return; }
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE_COMBATE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  encerrarCombate() {
    this.combate = null;
    this.sincronizarCombate();
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMBATE)[0];
    if (leaf) leaf.detach();
    new obsidian.Notice('Combate encerrado. Nada foi registrado automaticamente.');
  }

  // A tela dos jogadores mostra o mapa-múndi OU o combate, nunca os dois.
  sincronizarCombate() {
    for (const c of this.combates) c.render();
    for (const m of this.mapas) if (!m.mestre) m.root.style.display = this.combate ? 'none' : '';
  }

  abrirEscolhaFicha(tipo) {
    if (!this.combate) return;
    const candidatos = coletarCandidatosFicha(this.app, tipo);
    new ModalEscolherFicha(this.app, tipo, candidatos,
      (cand) => this.adicionarFicha(tipo, { nome: cand.nome, pv: cand.pv, pvMax: cand.pv, defesa: cand.defesa, ataques: cand.ataques, file: cand.file }),
      (nome, pv) => this.adicionarFicha(tipo, { nome, pv, pvMax: pv, defesa: 10, ataques: [] }),
    ).open();
  }

  adicionarFicha(tipo, dados) {
    if (!this.combate) return;
    const f = criarFicha(tipo, Object.assign({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 }, dados));
    this.combate.fichas.push(f);
    const arr = this.combate.iniciativa;
    const valor = 10;
    let i = arr.findIndex((e) => e.valor < valor);
    if (i === -1) i = arr.length;
    arr.splice(i, 0, { fichaId: f.id, valor });
    this.sincronizarCombate();
  }

  removerFicha(fichaId) {
    if (!this.combate) return;
    this.combate.fichas = this.combate.fichas.filter((f) => f.id !== fichaId);
    this.combate.iniciativa = this.combate.iniciativa.filter((e) => e.fichaId !== fichaId);
    if (this.combate.turno >= this.combate.iniciativa.length) this.combate.turno = 0;
    this.sincronizarCombate();
  }

  ajustarPV(fichaId, delta) {
    if (!this.combate) return;
    const f = this.combate.fichas.find((x) => x.id === fichaId);
    if (!f) return;
    f.pv = clamp(f.pv + delta, 0, f.pvMax);
    this.sincronizarCombate();
  }

  alternarCondicao(fichaId, condId) {
    if (!this.combate) return;
    const f = this.combate.fichas.find((x) => x.id === fichaId);
    if (!f) return;
    const i = f.condicoes.indexOf(condId);
    if (i === -1) f.condicoes.push(condId); else f.condicoes.splice(i, 1);
    this.sincronizarCombate();
  }

  // Troca de posição preservando de quem é a vez atual (por identidade, não por índice).
  moverIniciativa(indice, delta) {
    if (!this.combate) return;
    const arr = this.combate.iniciativa;
    const alvo = indice + delta;
    if (alvo < 0 || alvo >= arr.length) return;
    const atual = arr[this.combate.turno];
    [arr[indice], arr[alvo]] = [arr[alvo], arr[indice]];
    this.combate.turno = arr.indexOf(atual);
    this.sincronizarCombate();
  }

  atrasarNaIniciativa(indice) {
    if (!this.combate) return;
    const arr = this.combate.iniciativa;
    const atual = arr[this.combate.turno];
    const [entrada] = arr.splice(indice, 1);
    arr.push(entrada);
    this.combate.turno = arr.indexOf(atual);
    this.sincronizarCombate();
    new obsidian.Notice('Atrasou o turno.');
  }

  avancarTurno() {
    const c = this.combate;
    if (!c || !c.iniciativa.length) { new obsidian.Notice('Adicione fichas e defina a iniciativa primeiro.'); return; }
    c.turno++;
    if (c.turno >= c.iniciativa.length) { c.turno = 0; c.rodada++; new obsidian.Notice(`Rodada ${c.rodada}`); }
    this.sincronizarCombate();
  }

  /* ---------- Etapa 4: dados ---------- */

  rolarEBroadcast(expr, rotulo) {
    const r = rolarExpressao(expr);
    if (!r) { new obsidian.Notice('Expressão inválida. Use algo como 1d20+7.'); return null; }
    const evento = Object.assign({ rotulo: rotulo || expr }, r);
    for (const tela of this._telasComDados()) tela.mostrarRolagem(evento);
    return r;
  }

  // A rolagem aparece em toda tela aberta — a do mestre e a dos jogadores, no
  // mapa-múndi e no combate — não só na dos jogadores.
  _telasComDados() {
    const alvos = [];
    for (const m of this.mapas) alvos.push(m);
    for (const c of this.combates) alvos.push(c);
    return alvos;
  }

  rolarAtaque(fichaId, idx, oQue) {
    if (!this.combate) return;
    const f = this.combate.fichas.find((x) => x.id === fichaId);
    const a = f && f.ataques[idx];
    if (!a) return;
    if (oQue === 'acerto') this.rolarEBroadcast(`1d20${a.bonus >= 0 ? '+' : ''}${a.bonus}`, `${f.nome} ataca: ${a.nome}`);
    else this.rolarEBroadcast(a.dano, `${f.nome}: dano de ${a.nome}`);
  }

  /* ---------- Etapa 5: rastro automático e ligação com o globo ---------- */

  abrirNoGlobo(file) {
    const globoPlugin = this.app.plugins && this.app.plugins.plugins && this.app.plugins.plugins['globo-arton'];
    if (!globoPlugin) { new obsidian.Notice('O plugin Globo de Arton não está ativo.'); return; }
    const irAchar = () => {
      const todos = [...(globoPlugin.globos || [])];
      const globo = todos.find((g) => g.opc && !g.opc.compacto) || todos[0];
      if (!globo) return;
      const no = (globo.grafo && globo.grafo.nodes || []).find((n) => n.id === file.path);
      if (no) globo.selecionar(no, true);
      else new obsidian.Notice('Essa nota ainda não aparece no Globo (crie um link pra ela em outra nota).');
    };
    if (globoPlugin.globos && globoPlugin.globos.size) { irAchar(); return; }
    globoPlugin.abrirGlobo().then(() => setTimeout(irAchar, 400));
  }

  // Lê `locais` (na ordem) de cada nota de Sessão, do número mais baixo pro mais alto,
  // e monta o rastro do grupo com quem tem posição no mapa — revelando de passagem
  // (estado + neblina) cada lugar por onde o grupo já esteve.
  async atualizarRastroDasSessoes() {
    const sessoes = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith('01 Campanha/Sessões/')) continue;
      const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter || {};
      const cache = this.app.metadataCache.getFileCache(f);
      const locaisLinks = (cache && cache.frontmatterLinks || []).filter((l) => l.key === 'locais' || l.key.startsWith('locais.'));
      const numero = Number(fm.numero);
      sessoes.push({ file: f, numero: Number.isFinite(numero) ? numero : 0, locaisLinks });
    }
    sessoes.sort((a, b) => a.numero - b.numero);

    const pontos = [];
    const paraRevelar = [];
    for (const s of sessoes) {
      for (const l of s.locaisLinks) {
        const dest = this.app.metadataCache.getFirstLinkpathDest(l.link, s.file.path);
        if (!dest) continue;
        const fm = (this.app.metadataCache.getFileCache(dest) || {}).frontmatter || {};
        const x = Number(fm.mapa_x), y = Number(fm.mapa_y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const ultimo = pontos[pontos.length - 1];
        if (!ultimo || ultimo.x !== x || ultimo.y !== y) pontos.push({ x, y });
        if (String(fm.mapa_estado || 'revelado') !== 'revelado' || !ehVerdadeiro(fm.mapa_neblina)) paraRevelar.push(dest);
      }
    }

    this.dados.trilha = pontos;
    await this.saveData(this.dados);
    for (const dest of paraRevelar) {
      await this.app.fileManager.processFrontMatter(dest, (fm) => { fm.mapa_estado = 'revelado'; fm.mapa_neblina = true; });
    }
    this.recarregarTudo();
    this.recarregarTudoDeNovoLogo();
    new obsidian.Notice(`Rastro atualizado: ${pontos.length} ponto(s) em ${sessoes.length} sessão(ões), ${paraRevelar.length} lugar(es) revelado(s) agora.`);
  }
};
