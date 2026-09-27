// Caminhos à frente: uma coluna por passo (1 a 7), um cartão por caminho.
const cams = dv.pages('"01 Campanha/Caminhos"').where(p => p.status != "descartado");
const max = Math.max(7, ...cams.map(p => Number(p.passo) || 1).array());
const box = dv.container.createDiv({ cls: "arton-caminhos" });
for (let passo = 1; passo <= max; passo++) {
  const col = box.createDiv({ cls: "arton-coluna" });
  col.createDiv({ cls: "arton-coluna-tit", text: `Passo ${passo}` });
  const doPasso = cams.where(p => (Number(p.passo) || 1) === passo).sort(p => p.file.name);
  if (!doPasso.length) col.createDiv({ cls: "arton-vazio", text: "—" });
  for (const p of doPasso) {
    const st = String(p.status || "possível").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const c = col.createDiv({ cls: `arton-cartao is-${st}` });
    dv.el("div", `[[${p.file.path}|${p.file.name}]]`, { container: c, cls: "arton-cartao-nome" });
    if (p.gatilho) c.createDiv({ cls: "arton-cartao-gatilho", text: p.gatilho });
    const leva = (p.leva_a || []).map(l => l.path ? dv.page(l.path)?.file.name ?? l.path : String(l));
    if (leva.length) c.createDiv({ cls: "arton-cartao-leva", text: "→ " + leva.join(" · ") });
    c.createDiv({ cls: "arton-cartao-status", text: p.status || "possível" });
  }
}
