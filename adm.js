"use strict";

/* ============================================================
   Biblioteca Escolar - lógica da aplicação
   Persistência via localStorage.
   ============================================================ */

const STORAGE_KEY = "biblioteca.livros";

const ACERVO_INICIAL = [
  { id: 1, nome: "Dom Casmurro", autor: "Machado de Assis", img: "", alugado: false },
  { id: 2, nome: "O Pequeno Príncipe", autor: "Antoine de Saint-Exupéry", img: "", alugado: false },
  { id: 3, nome: "Capitães da Areia", autor: "Jorge Amado", img: "", alugado: true },
  { id: 4, nome: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis", img: "", alugado: false },
];

/** @type {Array<{id:number,nome:string,autor:string,img:string,alugado:boolean}>} */
let livros = [];
let ehAdmin = false;

/* ---------- Persistência ---------- */

function carregar() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    livros = salvo ? JSON.parse(salvo) : structuredClone(ACERVO_INICIAL);
  } catch {
    livros = structuredClone(ACERVO_INICIAL);
  }
}

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(livros));
  } catch {
    /* armazenamento indisponível: segue apenas em memória */
  }
}

function proximoId() {
  return livros.reduce((max, l) => Math.max(max, l.id), 0) + 1;
}

/* ---------- Utilidades ---------- */

/** Escapa texto para inserção segura em atributos/HTML. */
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ---------- Renderização ---------- */

function livrosFiltrados() {
  const termo = normalizar(document.getElementById("pesquisa").value.trim());
  const filtro = document.getElementById("filtro").value;

  return livros.filter((livro) => {
    const casaBusca =
      !termo ||
      normalizar(livro.nome).includes(termo) ||
      normalizar(livro.autor).includes(termo);

    const casaFiltro =
      filtro === "todos" ||
      (filtro === "livre" && !livro.alugado) ||
      (filtro === "alugado" && livro.alugado);

    return casaBusca && casaFiltro;
  });
}

function render() {
  const lista = document.getElementById("lista");
  const vazio = document.getElementById("vazio");
  const contador = document.getElementById("contador");
  const filtrados = livrosFiltrados();

  lista.innerHTML = "";

  filtrados.forEach((livro) => {
    const li = document.createElement("li");
    li.className = "livro";

    const capa = livro.img
      ? `<img src="${escapar(livro.img)}" alt="Capa do livro ${escapar(livro.nome)}" loading="lazy" onerror="this.style.visibility='hidden'">`
      : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='170'%3E%3Crect width='100%25' height='100%25' fill='%23334155'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffd54a' font-size='48' text-anchor='middle' dominant-baseline='middle'%3E📖%3C/text%3E%3C/svg%3E" alt="Sem capa disponível">`;

    const statusClasse = livro.alugado ? "statusAlugado" : "statusLivre";
    const statusTexto = livro.alugado ? "Emprestado" : "Disponível";

    const acaoPrincipal = livro.alugado
      ? `<button type="button" class="btn btn-acao btn-devolver" data-acao="devolver" data-id="${livro.id}">↩️ Devolver</button>`
      : `<button type="button" class="btn btn-acao" data-acao="alugar" data-id="${livro.id}">📕 Emprestar</button>`;

    const acaoAdmin = `<button type="button" class="btn btn-remover admin-only" data-acao="remover" data-id="${livro.id}">🗑️ Remover</button>`;

    li.innerHTML = `
      ${capa}
      <h3>${escapar(livro.nome)}</h3>
      <p class="autor">${livro.autor ? escapar(livro.autor) : "Autor desconhecido"}</p>
      <p class="info">Status: <span class="status ${statusClasse}">${statusTexto}</span></p>
      <div class="acoes">
        ${acaoPrincipal}
        ${acaoAdmin}
      </div>
    `;

    lista.appendChild(li);
  });

  const n = filtrados.length;
  contador.textContent = `${n} ${n === 1 ? "livro" : "livros"}`;
  vazio.hidden = n !== 0;
}

/* ---------- Ações ---------- */

function alternarEmprestimo(id, alugado) {
  const livro = livros.find((l) => l.id === id);
  if (!livro) return;
  livro.alugado = alugado;
  salvar();
  render();
}

function removerLivro(id) {
  const livro = livros.find((l) => l.id === id);
  if (!livro) return;
  if (!confirm(`Remover "${livro.nome}" do acervo?`)) return;
  livros = livros.filter((l) => l.id !== id);
  salvar();
  render();
}

function addLivro(evento) {
  evento.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const autor = document.getElementById("autor").value.trim();
  const img = document.getElementById("img").value.trim();
  const erro = document.getElementById("formErro");

  if (!nome) {
    erro.textContent = "Informe o título do livro.";
    document.getElementById("nome").focus();
    return;
  }

  livros.push({ id: proximoId(), nome, autor, img, alugado: false });
  salvar();
  render();

  erro.textContent = "";
  evento.target.reset();
  document.getElementById("nome").focus();
}

function alternarAdmin() {
  ehAdmin = !ehAdmin;
  document.body.classList.toggle("is-admin", ehAdmin);
  document.getElementById("adminArea").hidden = !ehAdmin;
  const btn = document.getElementById("btnAdminToggle");
  btn.setAttribute("aria-pressed", String(ehAdmin));
}

function logout() {
  if (confirm("Deseja realmente sair?")) {
    window.location.href = "index.html";
  }
}

/* ---------- Inicialização ---------- */

document.addEventListener("DOMContentLoaded", () => {
  carregar();
  render();

  document.getElementById("pesquisa").addEventListener("input", render);
  document.getElementById("filtro").addEventListener("change", render);
  document.getElementById("formLivro").addEventListener("submit", addLivro);
  document.getElementById("btnAdminToggle").addEventListener("click", alternarAdmin);
  document.getElementById("btnLogout").addEventListener("click", logout);

  // Delegação de eventos para os botões dos cartões.
  document.getElementById("lista").addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-acao]");
    if (!botao) return;
    const id = Number(botao.dataset.id);
    switch (botao.dataset.acao) {
      case "alugar": alternarEmprestimo(id, true); break;
      case "devolver": alternarEmprestimo(id, false); break;
      case "remover": removerLivro(id); break;
    }
  });
});
