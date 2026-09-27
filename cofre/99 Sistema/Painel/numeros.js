// O mundo em números.
const tipos = [
  ["deus", "Deuses", "#ffc857"], ["raca", "Raças", "#ff9ebb"], ["reino", "Reinos", "#c77dff"],
  ["local", "Locais", "#9d6bff"], ["faccao", "Facções", "#ff5d8f"], ["npc", "NPCs", "#7dd3fc"],
  ["monstro", "Bestiário", "#ff4fd8"], ["item", "Itens", "#5eead4"], ["sessao", "Sessões", "#f5f3ff"],
  ["caminho", "Caminhos", "#e0aaff"], ["ameaca", "Ameaças", "#ff3b5c"], ["segredo", "Segredos", "#b8f2e6"],
];
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const todas = dv.pages().where(p => !p.file.path.startsWith("99 Sistema"));
const box = dv.container.createDiv({ cls: "arton-numeros" });
for (const [id, nome, cor] of tipos) {
  const n = todas.where(p => norm(p.tipo) == id).length;
  const t = box.createDiv({ cls: "arton-numero" });
  t.style.setProperty("--cor", cor);
  t.createDiv({ cls: "arton-numero-v", text: String(n) });
  t.createDiv({ cls: "arton-numero-n", text: nome });
}
