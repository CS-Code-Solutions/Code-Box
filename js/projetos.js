// js/projetos.js
const ProjetosModule = (() => {
  let projetos = [];
  let servicos = [];

  function init() {
    bindEventos();

    const unsubProj = db
      .collection(COLLECTIONS.PROJETOS)
      .orderBy("nome")
      .onSnapshot((snap) => {
        projetos = [];
        snap.forEach((doc) => projetos.push({ id: doc.id, ...doc.data() }));
        renderLista();
      });

    const unsubServ = db.collection(COLLECTIONS.SERVICOS).onSnapshot((snap) => {
      servicos = [];
      snap.forEach((doc) => servicos.push({ id: doc.id, ...doc.data() }));
      renderLista();
    });

    Router.registrarListener(unsubProj);
    Router.registrarListener(unsubServ);
  }

  function bindEventos() {
    const busca = document.getElementById("busca-projetos");
    if (busca && !busca.dataset.bound) {
      busca.dataset.bound = "true";
      busca.addEventListener("input", () => renderLista());
    }

    const formProj = document.getElementById("form-projeto");
    if (formProj && !formProj.dataset.bound) {
      formProj.dataset.bound = "true";
      formProj.addEventListener("submit", salvarProjeto);
    }

    const formServ = document.getElementById("form-servico");
    if (formServ && !formServ.dataset.bound) {
      formServ.dataset.bound = "true";
      formServ.addEventListener("submit", salvarServico);
    }
  }

  function renderLista() {
    const container = document.getElementById("lista-projetos-container");
    if (!container) return;

    const termo = (document.getElementById("busca-projetos")?.value || "").toLowerCase().trim();

    const filtrados = projetos.filter((p) => {
      const servsProj = servicos.filter((s) => s.projetoId === p.id);
      const textoServicos = servsProj.map((s) => `${s.provedor} ${s.contaLogin} ${s.obs || ""}`).join(" ").toLowerCase();
      return (
        p.nome.toLowerCase().includes(termo) ||
        (p.cliente || "").toLowerCase().includes(termo) ||
        textoServicos.includes(termo)
      );
    });

    if (filtrados.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p class="text-sm font-bold text-slate-700">Nenhum sistema encontrado.</p>
          <p class="text-xs text-slate-500 mt-1">Clique em "+ Novo Sistema" para começar a organizar seus SaaS.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtrados
      .map((proj) => {
        const servsProj = servicos.filter((s) => s.projetoId === proj.id);

        const listaServsHTML =
          servsProj.length === 0
            ? `<p class="text-xs text-slate-400 italic py-2">Nenhum serviço vinculado. Adicione Azure, Firebase, Vercel, etc.</p>`
            : `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                ${servsProj
                  .map(
                    (s) => `
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 hover:border-blue-400 transition">
                    <div>
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          ${Utils.escaparHTML(s.provedor)}
                        </span>
                        <div class="flex items-center gap-1">
                          <button onclick="ProjetosModule.editarServico('${s.id}')" title="Editar Serviço" class="p-1 text-slate-400 hover:text-blue-600">
                            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                          </button>
                          <button onclick="ProjetosModule.excluirServico('${s.id}')" title="Remover" class="p-1 text-slate-400 hover:text-rose-600">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </div>

                      <div class="mt-2 flex items-center justify-between gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span class="text-xs font-medium text-slate-700 truncate" title="${Utils.escaparHTML(s.contaLogin)}">
                          ${Utils.escaparHTML(s.contaLogin)}
                        </span>
                        <button onclick="Utils.copiarTexto('${Utils.escaparHTML(s.contaLogin)}', 'Conta/E-mail')" title="Copiar Conta" class="text-slate-400 hover:text-blue-600 shrink-0">
                          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>

                      ${s.obs ? `<p class="text-[11px] text-slate-500 mt-1.5 truncate">${Utils.escaparHTML(s.obs)}</p>` : ""}
                    </div>

                    <a href="${Utils.escaparHTML(s.urlAtalho)}" target="_blank" rel="noopener noreferrer"
                      class="w-full py-1.5 px-3 rounded-lg bg-[#0B1120] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                      <span>Acessar Console</span>
                      <i data-lucide="external-link" class="w-3.5 h-3.5 text-[#00E5B0]"></i>
                    </a>
                  </div>
                `
                  )
                  .join("")}
              </div>`;

        return `
          <div class="osync-card p-5 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-base font-bold text-slate-900">${Utils.escaparHTML(proj.nome)}</h2>
                  ${
                    proj.cliente
                      ? `<span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${Utils.escaparHTML(proj.cliente)}</span>`
                      : ""
                  }
                </div>
                <div class="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  ${
                    proj.urlProducao
                      ? `<a href="${Utils.escaparHTML(proj.urlProducao)}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 flex items-center gap-1">
                          <i data-lucide="globe" class="w-3.5 h-3.5"></i><span>Produção</span>
                        </a>`
                      : ""
                  }
                  ${
                    proj.repoGit
                      ? `<a href="${Utils.escaparHTML(proj.repoGit)}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 flex items-center gap-1">
                          <i data-lucide="git-branch" class="w-3.5 h-3.5"></i><span>GitHub</span>
                        </a>`
                      : ""
                  }
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button onclick="ProjetosModule.abrirModalServico('${proj.id}')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Vincular SaaS</span>
                </button>
                <button onclick="ProjetosModule.editarProjeto('${proj.id}')" title="Editar Sistema" class="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100">
                  <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="ProjetosModule.excluirProjeto('${proj.id}')" title="Excluir Sistema" class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            ${listaServsHTML}
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  // --- AÇÕES DE PROJETO ---
  function abrirModalProjeto() {
    document.getElementById("form-projeto").reset();
    document.getElementById("projeto-id").value = "";
    document.getElementById("modal-projeto-titulo").textContent = "Cadastrar Sistema";
    document.getElementById("modal-projeto").classList.remove("hidden");
  }

  function fecharModalProjeto() {
    document.getElementById("modal-projeto").classList.add("hidden");
  }

  function editarProjeto(id) {
    const proj = projetos.find((p) => p.id === id);
    if (!proj) return;
    document.getElementById("projeto-id").value = proj.id;
    document.getElementById("projeto-nome").value = proj.nome || "";
    document.getElementById("projeto-cliente").value = proj.cliente || "";
    document.getElementById("projeto-url").value = proj.urlProducao || "";
    document.getElementById("projeto-repo").value = proj.repoGit || "";
    document.getElementById("modal-projeto-titulo").textContent = "Editar Sistema";
    document.getElementById("modal-projeto").classList.remove("hidden");
  }

  async function salvarProjeto(e) {
    e.preventDefault();
    const id = document.getElementById("projeto-id").value;
    const payload = {
      nome: document.getElementById("projeto-nome").value.trim(),
      cliente: document.getElementById("projeto-cliente").value.trim(),
      urlProducao: document.getElementById("projeto-url").value.trim(),
      repoGit: document.getElementById("projeto-repo").value.trim(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (id) {
        await db.collection(COLLECTIONS.PROJETOS).doc(id).update(payload);
        Utils.showToast("Sistema atualizado com sucesso!", "sucesso");
      } else {
        payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(COLLECTIONS.PROJETOS).add(payload);
        Utils.showToast("Sistema cadastrado!", "sucesso");
      }
      fecharModalProjeto();
    } catch (err) {
      Utils.showToast("Erro ao salvar sistema.", "erro");
    }
  }

  async function excluirProjeto(id) {
    if (!confirm("Excluir este sistema? Os serviços e segredos vinculados ficarão órfãos.")) return;
    try {
      await db.collection(COLLECTIONS.PROJETOS).doc(id).delete();
      Utils.showToast("Sistema excluído.", "info");
    } catch (err) {
      Utils.showToast("Erro ao excluir sistema.", "erro");
    }
  }

  // --- AÇÕES DE SERVIÇO VINCULADO ---
  function abrirModalServico(projetoId) {
    document.getElementById("form-servico").reset();
    document.getElementById("servico-id").value = "";
    document.getElementById("servico-projeto-id").value = projetoId;
    document.getElementById("modal-servico").classList.remove("hidden");
  }

  function fecharModalServico() {
    document.getElementById("modal-servico").classList.add("hidden");
  }

  function editarServico(id) {
    const serv = servicos.find((s) => s.id === id);
    if (!serv) return;
    document.getElementById("servico-id").value = serv.id;
    document.getElementById("servico-projeto-id").value = serv.projetoId;
    document.getElementById("servico-provedor").value = serv.provedor || "";
    document.getElementById("servico-conta").value = serv.contaLogin || "";
    document.getElementById("servico-url").value = serv.urlAtalho || "";
    document.getElementById("servico-obs").value = serv.obs || "";
    document.getElementById("modal-servico").classList.remove("hidden");
  }

  async function salvarServico(e) {
    e.preventDefault();
    const id = document.getElementById("servico-id").value;
    const payload = {
      projetoId: document.getElementById("servico-projeto-id").value,
      provedor: document.getElementById("servico-provedor").value.trim(),
      contaLogin: document.getElementById("servico-conta").value.trim(),
      urlAtalho: document.getElementById("servico-url").value.trim(),
      obs: document.getElementById("servico-obs").value.trim(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (id) {
        await db.collection(COLLECTIONS.SERVICOS).doc(id).update(payload);
        Utils.showToast("Serviço atualizado!", "sucesso");
      } else {
        payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(COLLECTIONS.SERVICOS).add(payload);
        Utils.showToast("Serviço vinculado ao sistema!", "sucesso");
      }
      fecharModalServico();
    } catch (err) {
      Utils.showToast("Erro ao salvar vínculo.", "erro");
    }
  }

  async function excluirServico(id) {
    if (!confirm("Remover este vínculo de serviço?")) return;
    try {
      await db.collection(COLLECTIONS.SERVICOS).doc(id).delete();
      Utils.showToast("Serviço removido.", "info");
    } catch (err) {
      Utils.showToast("Erro ao remover serviço.", "erro");
    }
  }

  return {
    init,
    abrirModalProjeto,
    fecharModalProjeto,
    editarProjeto,
    excluirProjeto,
    abrirModalServico,
    fecharModalServico,
    editarServico,
    excluirServico
  };
})();
