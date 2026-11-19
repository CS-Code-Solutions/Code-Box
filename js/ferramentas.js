// js/ferramentas.js
const FerramentasModule = (() => {
  let ferramentas = [];

  function init() {
    bindEventos();

    const unsub = db
      .collection(COLLECTIONS.FERRAMENTAS)
      .orderBy("nome")
      .onSnapshot((snap) => {
        ferramentas = [];
        snap.forEach((doc) => ferramentas.push({ id: doc.id, ...doc.data() }));
        atualizarFiltroCategorias();
        renderBoxes();
      });

    Router.registrarListener(unsub);
  }

  function bindEventos() {
    const busca = document.getElementById("busca-ferramentas");
    if (busca && !busca.dataset.bound) {
      busca.dataset.bound = "true";
      busca.addEventListener("input", renderBoxes);
    }

    const filtro = document.getElementById("filtro-categoria-ferramenta");
    if (filtro && !filtro.dataset.bound) {
      filtro.dataset.bound = "true";
      filtro.addEventListener("change", renderBoxes);
    }

    const form = document.getElementById("form-ferramenta");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "true";
      form.addEventListener("submit", salvarFerramenta);
    }
  }

  // Extrai o domínio limpo para buscar o favicon oficial do site
  function obterFaviconUrl(url) {
    try {
      const dominio = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dominio)}&sz=64`;
    } catch (e) {
      return "";
    }
  }

  function atualizarFiltroCategorias() {
    const select = document.getElementById("filtro-categoria-ferramenta");
    if (!select) return;

    const atual = select.value;
    const categoriasUnicas = [...new Set(ferramentas.map((f) => f.categoria).filter(Boolean))].sort();

    select.innerHTML =
      `<option value="todas">Todos os Boxes (${categoriasUnicas.length})</option>` +
      categoriasUnicas
        .map((cat) => `<option value="${Utils.escaparHTML(cat)}">${Utils.escaparHTML(cat)}</option>`)
        .join("");

    if (categoriasUnicas.includes(atual)) {
      select.value = atual;
    }
  }

  function renderBoxes() {
    const container = document.getElementById("lista-ferramentas-boxes");
    if (!container) return;

    const termo = (document.getElementById("busca-ferramentas")?.value || "").toLowerCase().trim();
    const catFiltro = document.getElementById("filtro-categoria-ferramenta")?.value || "todas";

    const filtradas = ferramentas.filter((f) => {
      if (catFiltro !== "todas" && f.categoria !== catFiltro) return false;
      return (
        f.nome.toLowerCase().includes(termo) ||
        (f.categoria || "").toLowerCase().includes(termo) ||
        (f.descricao || "").toLowerCase().includes(termo) ||
        (f.acesso || "").toLowerCase().includes(termo)
      );
    });

    if (filtradas.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p class="text-sm font-bold text-slate-700">Nenhuma ferramenta cadastrada ainda.</p>
          <p class="text-xs text-slate-500 mt-1">Clique em "+ Nova Ferramenta" para montar seus boxes de IA, Imagem, Ícones e Texto.</p>
        </div>
      `;
      return;
    }

    // Agrupa por Categoria (Box)
    const grupos = {};
    filtradas.forEach((item) => {
      const cat = item.categoria || "Geral";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(item);
    });

    const categoriasOrdenadas = Object.keys(grupos).sort();

    container.innerHTML = categoriasOrdenadas
      .map((categoria) => {
        const itens = grupos[categoria];

        const cardsHTML = itens
          .map((item) => {
            const favicon = obterFaviconUrl(item.url);

            return `
              <div class="group relative bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition shadow-2xs hover:shadow-md">
                
                <!-- Ações rápidas no canto superior direito -->
                <div class="flex items-start justify-between gap-2">
                  <a href="${Utils.escaparHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-1.5">
                      <img src="${favicon}" alt="${Utils.escaparHTML(item.nome)}"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        class="w-6 h-6 object-contain" />
                      <span style="display:none" class="w-6 h-6 items-center justify-center text-blue-600 font-extrabold text-xs">
                        ${Utils.escaparHTML(item.nome.substring(0, 2).toUpperCase())}
                      </span>
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition flex items-center gap-1">
                        <span>${Utils.escaparHTML(item.nome)}</span>
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0"></i>
                      </h3>
                      <p class="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        ${Utils.escaparHTML(item.descricao)}
                      </p>
                    </div>
                  </a>

                  <div class="flex items-center gap-0.5 shrink-0">
                    <button onclick="FerramentasModule.editar('${item.id}')" title="Editar" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100">
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="FerramentasModule.excluir('${item.id}')" title="Excluir" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>

                <!-- Rodapé do Mini-Card: Conta/Acesso + Botão Abrir -->
                <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                  ${
                    item.acesso
                      ? `<button onclick="Utils.copiarTexto('${Utils.escaparHTML(item.acesso)}', 'Acesso')"
                          title="Clique para copiar: ${Utils.escaparHTML(item.acesso)}"
                          class="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-blue-600 truncate max-w-[65%]">
                          <i data-lucide="user-check" class="w-3 h-3 text-emerald-600 shrink-0"></i>
                          <span class="truncate">${Utils.escaparHTML(item.acesso)}</span>
                        </button>`
                      : `<span class="text-[11px] text-slate-400">Acesso direto</span>`
                  }

                  <a href="${Utils.escaparHTML(item.url)}" target="_blank" rel="noopener noreferrer"
                    class="px-2.5 py-1 rounded-lg bg-[#0B1120] hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition">
                    <span>Abrir</span>
                    <i data-lucide="external-link" class="w-3 h-3 text-[#00E5B0]"></i>
                  </a>
                </div>

              </div>
            `;
          })
          .join("");

        return `
          <section class="osync-card p-5 space-y-4">
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#00E5B0] ring-4 ring-[#00E5B0]/20"></span>
                <h2 class="text-base font-extrabold text-slate-900 tracking-tight">${Utils.escaparHTML(categoria)}</h2>
                <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  ${itens.length} ${itens.length === 1 ? "site" : "sites"}
                </span>
              </div>

              <button onclick="FerramentasModule.abrirModal('${Utils.escaparHTML(categoria)}')"
                class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Adicionar neste Box</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              ${cardsHTML}
            </div>
          </section>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  function abrirModal(categoriaPreSelecionada = "") {
    document.getElementById("form-ferramenta").reset();
    document.getElementById("ferramenta-id").value = "";
    if (categoriaPreSelecionada) {
      document.getElementById("ferramenta-categoria").value = categoriaPreSelecionada;
    }
    document.getElementById("modal-ferramenta-titulo").textContent = "Adicionar Ferramenta";
    document.getElementById("modal-ferramenta").classList.remove("hidden");
  }

  function fecharModal() {
    document.getElementById("modal-ferramenta").classList.add("hidden");
  }

  function editar(id) {
    const item = ferramentas.find((f) => f.id === id);
    if (!item) return;

    document.getElementById("ferramenta-id").value = item.id;
    document.getElementById("ferramenta-categoria").value = item.categoria || "";
    document.getElementById("ferramenta-nome").value = item.nome || "";
    document.getElementById("ferramenta-url").value = item.url || "";
    document.getElementById("ferramenta-descricao").value = item.descricao || "";
    document.getElementById("ferramenta-acesso").value = item.acesso || "";
    document.getElementById("modal-ferramenta-titulo").textContent = "Editar Ferramenta";
    document.getElementById("modal-ferramenta").classList.remove("hidden");
  }

  async function salvarFerramenta(e) {
    e.preventDefault();
    const id = document.getElementById("ferramenta-id").value;

    const payload = {
      categoria: document.getElementById("ferramenta-categoria").value.trim(),
      nome: document.getElementById("ferramenta-nome").value.trim(),
      url: document.getElementById("ferramenta-url").value.trim(),
      descricao: document.getElementById("ferramenta-descricao").value.trim(),
      acesso: document.getElementById("ferramenta-acesso").value.trim(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (id) {
        await db.collection(COLLECTIONS.FERRAMENTAS).doc(id).update(payload);
        Utils.showToast("Ferramenta atualizada!", "sucesso");
      } else {
        payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(COLLECTIONS.FERRAMENTAS).add(payload);
        Utils.showToast("Ferramenta adicionada ao box!", "sucesso");
      }
      fecharModal();
    } catch (err) {
      Utils.showToast("Erro ao salvar ferramenta.", "erro");
    }
  }

  async function excluir(id) {
    if (!confirm("Remover esta ferramenta do box?")) return;
    try {
      await db.collection(COLLECTIONS.FERRAMENTAS).doc(id).delete();
      Utils.showToast("Ferramenta removida.", "info");
    } catch (err) {
      Utils.showToast("Erro ao excluir ferramenta.", "erro");
    }
  }

  return {
    init,
    abrirModal,
    fecharModal,
    editar,
    excluir
  };
})();
