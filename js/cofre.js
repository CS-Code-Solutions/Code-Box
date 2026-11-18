// js/cofre.js
const CofreModule = (() => {
  let projetosMap = {};
  let servicosMap = {};
  let segredos = [];

  function init() {
    bindEventos();

    const unsubProj = db.collection(COLLECTIONS.PROJETOS).onSnapshot((snap) => {
      projetosMap = {};
      snap.forEach((doc) => (projetosMap[doc.id] = { id: doc.id, ...doc.data() }));
      popularSelectServicos();
      renderLista();
    });

    const unsubServ = db.collection(COLLECTIONS.SERVICOS).onSnapshot((snap) => {
      servicosMap = {};
      snap.forEach((doc) => (servicosMap[doc.id] = { id: doc.id, ...doc.data() }));
      popularSelectServicos();
      renderLista();
    });

    const unsubSec = db.collection(COLLECTIONS.SEGREDOS).onSnapshot((snap) => {
      segredos = [];
      snap.forEach((doc) => segredos.push({ id: doc.id, ...doc.data() }));
      renderLista();
    });

    Router.registrarListener(unsubProj);
    Router.registrarListener(unsubServ);
    Router.registrarListener(unsubSec);
  }

  function bindEventos() {
    const busca = document.getElementById("busca-segredos");
    if (busca && !busca.dataset.bound) {
      busca.dataset.bound = "true";
      busca.addEventListener("input", renderLista);
    }

    const filtro = document.getElementById("filtro-status-segredo");
    if (filtro && !filtro.dataset.bound) {
      filtro.dataset.bound = "true";
      filtro.addEventListener("change", renderLista);
    }

    const form = document.getElementById("form-segredo");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "true";
      form.addEventListener("submit", salvarSegredo);
    }
  }

  function atualizarBannerStatus() {
    const banner = document.getElementById("banner-cofre-status");
    if (!banner) return;

    if (CryptoVault.isUnlocked()) {
      banner.className = "rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border bg-emerald-50 border-emerald-200";
      banner.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <i data-lucide="unlock" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-emerald-900">Cofre Desbloqueado na Sessão (AES-256-GCM)</p>
            <p class="text-[11px] text-emerald-700">Você já pode copiar, revelar ou cadastrar novos Client Secrets criptografados.</p>
          </div>
        </div>
        <button onclick="Auth.abrirModalCofre()" class="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 self-start sm:self-auto">
          Bloquear Agora
        </button>
      `;
    } else {
      banner.className = "rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border bg-amber-50 border-amber-200";
      banner.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <i data-lucide="lock" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-amber-900">Cofre Criptografado Bloqueado</p>
            <p class="text-[11px] text-amber-700">Desbloqueie com sua Senha Mestra para visualizar ou copiar os segredos armazenados.</p>
          </div>
        </div>
        <button onclick="Auth.abrirModalCofre()" class="px-3.5 py-2 rounded-lg bg-[#0B1120] text-[#00E5B0] text-xs font-bold hover:bg-[#131C31] self-start sm:self-auto">
          Desbloquear Cofre
        </button>
      `;
    }
  }

  function popularSelectServicos() {
    const select = document.getElementById("segredo-servico-id");
    if (!select) return;

    const valorAtual = select.value;
    const opcoes = Object.values(servicosMap)
      .map((s) => {
        const proj = projetosMap[s.projetoId] || { nome: "Sem Projeto" };
        return `<option value="${s.id}">${Utils.escaparHTML(proj.nome)} — ${Utils.escaparHTML(s.provedor)} (${Utils.escaparHTML(s.contaLogin || "")})</option>`;
      })
      .join("");

    select.innerHTML = `<option value="">Selecione um serviço vinculado...</option>${opcoes}`;
    if (valorAtual) select.value = valorAtual;
  }

  function renderLista() {
    atualizarBannerStatus();

    const container = document.getElementById("lista-segredos-container");
    if (!container) return;

    const termo = (document.getElementById("busca-segredos")?.value || "").toLowerCase().trim();
    const filtroStatus = document.getElementById("filtro-status-segredo")?.value || "todos";
    const desbloqueado = CryptoVault.isUnlocked();

    const filtrados = segredos
      .map((sec) => ({ ...sec, avaliacao: Utils.avaliarVencimento(sec.dataExpiracao) }))
      .filter((sec) => {
        const serv = servicosMap[sec.servicoId] || {};
        const proj = projetosMap[serv.projetoId] || {};
        const matchTexto =
          sec.nomeChave.toLowerCase().includes(termo) ||
          (serv.provedor || "").toLowerCase().includes(termo) ||
          (proj.nome || "").toLowerCase().includes(termo);

        if (!matchTexto) return false;

        if (filtroStatus === "vencendo") {
          return ["vencido", "critico", "atencao"].includes(sec.avaliacao.status);
        }
        if (filtroStatus === "ok") {
          return sec.avaliacao.status === "ok" || sec.avaliacao.status === "sem-data";
        }
        return true;
      })
      .sort((a, b) => (a.avaliacao.dias ?? 9999) - (b.avaliacao.dias ?? 9999));

    if (filtrados.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p class="text-sm font-bold text-slate-700">Nenhum segredo encontrado.</p>
          <p class="text-xs text-slate-500 mt-1">Cadastre suas chaves do Azure, tokens de API ou senhas administrativas.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = filtrados
      .map((sec) => {
        const serv = servicosMap[sec.servicoId] || {};
        const proj = projetosMap[serv.projetoId] || { nome: "Sistema Geral" };

        return `
          <div class="osync-card ${sec.avaliacao.cardClass} p-5 flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    ${Utils.escaparHTML(proj.nome)}
                  </span>
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    ${Utils.escaparHTML(serv.provedor || "SaaS")}
                  </span>
                </div>
                <span class="shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${sec.avaliacao.badgeClass}">
                  ${sec.avaliacao.label}
                </span>
              </div>

              <h3 class="text-base font-bold text-slate-900 mt-2">${Utils.escaparHTML(sec.nomeChave)}</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Conta: <strong class="text-slate-700">${Utils.escaparHTML(serv.contaLogin || "N/A")}</strong> • Validade: <strong>${Utils.formatarDataBR(sec.dataExpiracao)}</strong>
              </p>

              <!-- Caixa do Segredo Criptografado -->
              <div class="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <code id="secret-display-${sec.id}" class="text-xs font-mono text-slate-700 truncate">
                  ••••••••••••••••••••••••
                </code>
                <div class="flex items-center gap-1 shrink-0">
                  <button onclick="CofreModule.toggleRevelar('${sec.id}')" title="${desbloqueado ? "Mostrar/Ocultar" : "Desbloqueie o cofre primeiro"}"
                    class="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                  <button onclick="CofreModule.copiarSegredo('${sec.id}')" title="Copiar Segredo Descriptografado"
                    class="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition">
                    <i data-lucide="copy" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Barra de Ações e Renovação -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <div class="flex items-center gap-1">
                <button onclick="CofreModule.editarSegredo('${sec.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>Renovar / Editar</span>
                </button>
                <button onclick="CofreModule.excluirSegredo('${sec.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Excluir">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              ${
                serv.urlAtalho
                  ? `<a href="${Utils.escaparHTML(serv.urlAtalho)}" target="_blank" rel="noopener noreferrer"
                      class="px-3 py-1.5 rounded-lg bg-[#0B1120] text-[#00E5B0] hover:bg-[#131C31] text-xs font-bold flex items-center gap-1.5 transition">
                      <span>Ir ao Painel</span>
                      <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                    </a>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  async function toggleRevelar(id) {
    if (!CryptoVault.isUnlocked()) {
      Auth.abrirModalCofre();
      return;
    }

    const display = document.getElementById(`secret-display-${id}`);
    if (!display) return;

    if (display.dataset.revealed === "true") {
      display.textContent = "••••••••••••••••••••••••";
      display.dataset.revealed = "false";
      return;
    }

    const sec = segredos.find((s) => s.id === id);
    if (!sec) return;

    try {
      const textoPlano = await CryptoVault.decryptSecret(sec.cipherText, sec.iv);
      display.textContent = textoPlano;
      display.dataset.revealed = "true";

      // Oculta automaticamente após 15 segundos por segurança
      setTimeout(() => {
        if (display && display.dataset.revealed === "true") {
          display.textContent = "••••••••••••••••••••••••";
          display.dataset.revealed = "false";
        }
      }, 15000);
    } catch (err) {
      Utils.showToast(err.message, "erro");
    }
  }

  async function copiarSegredo(id) {
    if (!CryptoVault.isUnlocked()) {
      Auth.abrirModalCofre();
      return;
    }

    const sec = segredos.find((s) => s.id === id);
    if (!sec) return;

    try {
      const textoPlano = await CryptoVault.decryptSecret(sec.cipherText, sec.iv);
      await Utils.copiarTexto(textoPlano, sec.nomeChave);
    } catch (err) {
      Utils.showToast(err.message, "erro");
    }
  }

  function abrirModalSegredo() {
    if (!CryptoVault.isUnlocked()) {
      Utils.showToast("Desbloqueie o cofre com sua Senha Mestra antes de cadastrar.", "info");
      Auth.abrirModalCofre();
      return;
    }

    document.getElementById("form-segredo").reset();
    document.getElementById("segredo-id").value = "";
    document.getElementById("segredo-valor").required = true;
    document.getElementById("segredo-valor-hint").textContent = "Será criptografado com AES-256-GCM localmente antes do envio.";
    document.getElementById("modal-segredo-titulo").textContent = "Cadastrar Secret / Credencial";
    popularSelectServicos();
    document.getElementById("modal-segredo").classList.remove("hidden");
  }

  function fecharModalSegredo() {
    document.getElementById("modal-segredo").classList.add("hidden");
  }

  function editarSegredo(id) {
    if (!CryptoVault.isUnlocked()) {
      Auth.abrirModalCofre();
      return;
    }

    const sec = segredos.find((s) => s.id === id);
    if (!sec) return;

    popularSelectServicos();
    document.getElementById("segredo-id").value = sec.id;
    document.getElementById("segredo-servico-id").value = sec.servicoId || "";
    document.getElementById("segredo-nome").value = sec.nomeChave || "";
    document.getElementById("segredo-expiracao").value = sec.dataExpiracao || "";
    document.getElementById("segredo-valor").value = "";
    document.getElementById("segredo-valor").required = false;
    document.getElementById("segredo-valor-hint").textContent = "Deixe em branco para manter a chave atual ou cole a nova chave renovada.";
    document.getElementById("modal-segredo-titulo").textContent = "Renovar / Editar Secret";
    document.getElementById("modal-segredo").classList.remove("hidden");
  }

  async function salvarSegredo(e) {
    e.preventDefault();
    if (!CryptoVault.isUnlocked()) {
      Auth.abrirModalCofre();
      return;
    }

    const id = document.getElementById("segredo-id").value;
    const valorBruto = document.getElementById("segredo-valor").value;

    const payload = {
      servicoId: document.getElementById("segredo-servico-id").value,
      nomeChave: document.getElementById("segredo-nome").value.trim(),
      dataExpiracao: document.getElementById("segredo-expiracao").value || null,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (valorBruto) {
        const criptografado = await CryptoVault.encryptSecret(valorBruto);
        payload.cipherText = criptografado.cipherText;
        payload.iv = criptografado.iv;
      } else if (!id) {
        return Utils.showToast("Informe o valor do segredo.", "erro");
      }

      if (id) {
        await db.collection(COLLECTIONS.SEGREDOS).doc(id).update(payload);
        Utils.showToast("Credencial atualizada/renovada com sucesso!", "sucesso");
      } else {
        payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(COLLECTIONS.SEGREDOS).add(payload);
        Utils.showToast("Segredo criptografado e salvo no cofre!", "sucesso");
      }

      fecharModalSegredo();
    } catch (err) {
      Utils.showToast("Erro ao criptografar ou salvar credencial.", "erro");
    }
  }

  async function excluirSegredo(id) {
    if (!confirm("Tem certeza que deseja excluir esta credencial do cofre?")) return;
    try {
      await db.collection(COLLECTIONS.SEGREDOS).doc(id).delete();
      Utils.showToast("Credencial removida do cofre.", "info");
    } catch (err) {
      Utils.showToast("Erro ao excluir credencial.", "erro");
    }
  }

  return {
    init,
    toggleRevelar,
    copiarSegredo,
    abrirModalSegredo,
    fecharModalSegredo,
    editarSegredo,
    excluirSegredo
  };
})();
