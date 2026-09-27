// Relógios das ameaças: uma barra por ameaça, com o próximo presságio.
const am = dv.pages('"01 Campanha/Ameaças"').where(p => p.status != "resolvida")
  .sort(p => (p.relogio_atual || 0) / (p.relogio_total || 1), "desc");
if (!am.length) { dv.paragraph("_Nenhuma ameaça ativa. Crie uma com o botão **+ Ameaça**._"); }
const box = dv.container.createDiv({ cls: "arton-relogios" });
for (const p of am) {
  const atual = Number(p.relogio_atual || 0), total = Math.max(1, Number(p.relogio_total || 6));
  const pct = atual / total;
  const r = box.createDiv({ cls: "arton-relogio" + (pct >= 0.66 ? " is-critico" : pct >= 0.5 ? " is-quente" : "") });
  const cab = r.createDiv({ cls: "arton-relogio-cab" });
  dv.el("span", `[[${p.file.path}|${p.file.name}]]`, { container: cab, cls: "arton-relogio-nome" });
  cab.createSpan({ cls: "arton-relogio-num", text: `${atual}/${total}` });
  const barra = r.createDiv({ cls: "arton-relogio-barra" });
  for (let i = 0; i < total; i++) barra.createDiv({ cls: "arton-seg" + (i < atual ? " is-cheio" : "") });
  const pres = p.presagios || [];
  const prox = atual < total ? pres[atual] : null;
  r.createDiv({ cls: "arton-relogio-prox", text: atual >= total ? "💥 Estourou!" : prox ? `Próximo presságio: ${prox}` : "Próximo presságio: (escreva em presagios)" });
}
