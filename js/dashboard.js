// js/dashboard.js
const DashboardModule = (() => {
  let projetosMap = {};
  let servicosMap = {};
  let segredosLista = [];

  function init() {
    const unsubProj = db.collection(COLLECTIONS.PROJETOS).onSnapshot((snap) => {
      projetosMap = {};
      snap.forEach((doc) => {
        projetosMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      document.getElementById("kpi-projetos").textContent = snap.size;
      renderAtalhosRapidos();
      renderAlertas();
    });

    const unsubServ = db.collection(COLLECTIONS.SERVICOS).onSnapshot((snap) => {
      servicosMap = {};
      snap.forEach((doc) => {
        servicosMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      renderAtalhosRapidos();
      renderAlertas();
    });

    const unsubSec = db.collection(COLLECTIONS.SEGREDOS).onSnapshot((snap) => {
      segredosLista = [];
      snap.forEach((doc) => {
        segredosLista.push({ id: doc.id, ...doc.data() });
      });
      renderAlertas();
    });

    Router.registrarListener(unsubProj);
    Router.registrarListener(unsubServ);
    Router.registrarListener(unsubSec);
  }

  function renderAlertas() {
    const container = document.getElementById("dashboard-alertas-lista");
    if (!container) return;

    let criticos = 0;
    let atencao = 0;
    let ok = 0;

    const avaliados = segredosLista.map((sec) => {
      const av = Utils.avaliarVencimento(sec.dataExpiracao);
      if (av.status === "vencido" || av.status === "critico") criticos++;
      else if (av.status === "atencao") atencao++;
      else ok++;

      return { ...sec, avaliacao: av };
    });

    document.getElementById("kpi-criticos").textContent = criticos;
    document.getElementById("kpi-atencao").textContent = atencao;
    document.getElementById("kpi-ok").textContent = ok;

    // Filtra vencidos, críticos e atenção (ou mostra os mais próximos)
    const prioritarios = avaliados
      .filter((item) => item.avaliacao.dias !== null)
      .sort((a, b) => a.avaliacao.dias - b.avaliacao.dias)
      .slice(0, 6);

    if (prioritarios.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
          Nenhum segredo com data de validade cadastrado ainda.
        </div>
      `;
      return;
    }

    container.innerHTML = prioritarios
      .map((item) => {
        const servico = servicosMap[item.servicoId] || {};
        const projeto = projetosMap[servico.projetoId] || { nome: "Projeto Geral" };
        const urlRenovacao = servico.urlAtalho || "";

        return `
          <div class="osync-card ${item.avaliacao.cardClass} p-4 flex flex-col justify-between gap-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    ${Utils.escaparHTML(projeto.nome)}
                  </span>
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    ${Utils.escaparHTML(servico.provedor || "SaaS")}
                  </span>
                </div>
                <h3 class="font-bold text-slate-900 text-sm mt-1.5">${Utils.escaparHTML(item.nomeChave)}</h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  Conta: <strong class="text-slate-700">${Utils.escaparHTML(servico.contaLogin || "Não informada")}</strong> • Expira em: <strong>${Utils.formatarDataBR(item.dataExpiracao)}</strong>
                </p>
              </div>
              <span class="shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${item.avaliacao.badgeClass}">
                ${item.avaliacao.label}
              </span>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <button onclick="Router.navegarPara('cofre')" class="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1">
                <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
                <span>Ver no Cofre</span>
              </button>

              ${
                urlRenovacao
                  ? `<a href="${Utils.escaparHTML(urlRenovacao)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#0B1120] text-[#00E5B0] hover:bg-[#131C31] text-xs font-bold flex items-center gap-1.5 transition">
                      <span>Abrir Painel para Renovar</span>
                      <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                    </a>`
                  : `<span class="text-[11px] text-slate-400 italic">Sem URL de atalho</span>`
              }
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  function renderAtalhosRapidos() {
    const container = document.getElementById("dashboard-atalhos-lista");
    if (!container) return;

    const projetos = Object.values(projetosMap).slice(0, 6);
    if (projetos.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
          Cadastre seu primeiro sistema na aba <strong>Sistemas & Atalhos</strong>.
        </div>
      `;
      return;
    }

    const todosServicos = Object.values(servicosMap);

    container.innerHTML = projetos
      .map((proj) => {
        const servs = todosServicos.filter((s) => s.projetoId === proj.id);
        const badgesServicos = servs
          .map(
            (s) => `
            <a href="${Utils.escaparHTML(s.urlAtalho || "#")}" target="_blank" rel="noopener noreferrer"
              title="Conta: ${Utils.escaparHTML(s.contaLogin || "N/A")}"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-bold transition">
              <span>${Utils.escaparHTML(s.provedor)}</span>
              <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
            </a>
          `
          )
          .join("");

        return `
          <div class="osync-card p-4 flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-bold text-slate-900 text-sm truncate">${Utils.escaparHTML(proj.nome)}</h3>
                ${
                  proj.urlProducao
                    ? `<a href="${Utils.escaparHTML(proj.urlProducao)}" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-blue-600" title="Abrir Sistema em Produção">
                        <i data-lucide="globe" class="w-4 h-4"></i>
                      </a>`
                    : ""
                }
              </div>
              <p class="text-xs text-slate-500 mt-0.5">${Utils.escaparHTML(proj.cliente || "Uso Interno / SaaS")}</p>
            </div>

            <div class="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              ${badgesServicos || `<span class="text-[11px] text-slate-400">Nenhum serviço vinculado</span>`}
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  return { init };
})();
