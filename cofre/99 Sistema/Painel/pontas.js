// Pontas soltas: nada pode se perder.
const grade = dv.container.createDiv({ cls: "arton-grade" });
const bloco = (icone, titulo, dica) => {
  const b = grade.createDiv({ cls: "arton-bloco" });
  b.createDiv({ cls: "arton-bloco-tit", text: `${icone} ${titulo}` });
  if (dica) b.createDiv({ cls: "arton-bloco-dica", text: dica });
  return b;
};
const lista = (b, ps, vazio) => {
  if (!ps.length) { b.createDiv({ cls: "arton-vazio", text: vazio }); return; }
  for (const p of ps) dv.el("div", `[[${p.file.path}|${p.file.name}]]`, { container: b, cls: "arton-item" });
};

lista(bloco("📥", "Inbox", "Ideias soltas esperando virar nota de verdade."),
  dv.pages('"00 Inbox"').sort(p => p.file.ctime, "desc").limit(10), "Inbox vazia.");

const sistema = p => p.file.path.startsWith("99 Sistema") || p.tipo == "indice" || p.file.name.startsWith("🏠")
  || ["CLAUDE", "COMO-ABRIR"].includes(p.file.name);
lista(bloco("🕸️", "Notas soltas", "Ninguém linka para elas. Ligue ao mundo."),
  dv.pages().where(p => !sistema(p) && !p.file.path.startsWith("00 Inbox") && p.file.inlinks.length == 0).limit(12), "Tudo conectado. ✨");

const sessoes = new Set(dv.pages('"01 Campanha/Sessões"').file.path.array());
lista(bloco("👤", "NPCs fora de cena", "Ainda não apareceram em nenhuma sessão."),
  dv.pages('"03 Personagens/NPCs"').where(p => !p.file.inlinks.some(l => sessoes.has(l.path))).limit(12), "Todos já entraram em cena.");
