// Última sessão jogada.
const s = dv.pages('"01 Campanha/Sessões"').where(p => p.numero).sort(p => p.numero, "desc").first();
if (!s) { dv.paragraph("_Nenhuma sessão ainda. Depois de jogar, clique em **+ Sessão**._"); }
else {
  const box = dv.container.createDiv({ cls: "arton-ultima" });
  dv.el("div", `**[[${s.file.path}|${s.file.name}]]** · ${s.data ?? ""}`, { container: box, cls: "arton-ultima-tit" });
  if (s.resumo) box.createDiv({ cls: "arton-ultima-resumo", text: s.resumo });
  const chips = [...(s.npcs || []), ...(s.locais || []), ...(s.jogadores || [])];
  if (chips.length) dv.el("div", chips.map(l => String(l)).join(" · "), { container: box, cls: "arton-ultima-chips" });
}
