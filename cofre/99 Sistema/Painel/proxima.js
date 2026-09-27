// Próxima sessão: caminhos em aberto, ameaças perto de estourar e segredos ainda guardados.
const grade = dv.container.createDiv({ cls: "arton-grade" });
const bloco = (icone, titulo) => {
  const b = grade.createDiv({ cls: "arton-bloco" });
  b.createDiv({ cls: "arton-bloco-tit", text: `${icone} ${titulo}` });
  return b;
};
const item = (b, p, extra) => {
  const it = b.createDiv({ cls: "arton-item" });
  dv.el("span", `[[${p.file.path}|${p.file.name}]]`, { container: it });
  if (extra) it.createSpan({ cls: "arton-item-extra", text: extra });
};
const vazio = (b, t) => b.createDiv({ cls: "arton-vazio", text: t });

const cam = dv.pages('"01 Campanha/Caminhos"').where(p => p.status == "ativo").sort(p => p.passo);
const b1 = bloco("🧭", "Caminhos em aberto");
cam.length ? cam.forEach(p => item(b1, p, `passo ${p.passo ?? "?"}`)) : vazio(b1, "Nenhum caminho ativo.");

const am = dv.pages('"01 Campanha/Ameaças"')
  .where(p => p.status != "resolvida" && p.relogio_total)
  .sort(p => p.relogio_atual / p.relogio_total, "desc");
const b2 = bloco("🔥", "Ameaças mais quentes");
am.length ? am.limit(4).forEach(p => item(b2, p, `${p.relogio_atual}/${p.relogio_total}`)) : vazio(b2, "Nenhuma ameaça ativa.");

const seg = dv.pages('"01 Campanha/Segredos e Pistas"').where(p => p.revelado !== true);
const b3 = bloco("🗝️", "Segredos guardados");
seg.length ? seg.forEach(p => item(b3, p, `${(p.pistas_em || []).length} pistas`)) : vazio(b3, "Todos os segredos foram revelados.");
