// js/router.js
const Router = (() => {
  let rotaAtual = "dashboard";
  let activeUnsubscribers = []; // Armazena funções unsubscribe() do Firestore

  const ROTAS_VALIDAS = ["dashboard", "projetos", "cofre"];

  function registrarListener(unsubFn) {
    if (typeof unsubFn === "function") {
      activeUnsubscribers.push(unsubFn);
    }
  }

  function limparListeners() {
    activeUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn("Erro ao limpar listener:", e);
      }
    });
    activeUnsubscribers = [];
  }

  function atualizarMenuAtivo(rota) {
    document.querySelectorAll("[data-route]").forEach((btn) => {
      if (btn.dataset.route === rota) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  async function navegarPara(rota) {
    const destino = ROTAS_VALIDAS.includes(rota) ? rota : "dashboard";
    const container = document.getElementById("app-content");
    if (!container) return;

    limparListeners();
    rotaAtual = destino;
    window.location.hash = destino;
    atualizarMenuAtivo(destino);

    container.innerHTML = Utils.renderSkeletonCards(3);

    try {
      const response = await fetch(`pages/${destino}.html?v=1`);
      if (!response.ok) throw new Error("Página não encontrada.");
      const html = await response.text();
      container.innerHTML = html;

      lucide.createIcons();

      // Dispara inicializador do módulo correspondente
      if (destino === "dashboard" && typeof DashboardModule !== "undefined") {
        DashboardModule.init();
      } else if (destino === "projetos" && typeof ProjetosModule !== "undefined") {
        ProjetosModule.init();
      } else if (destino === "cofre" && typeof CofreModule !== "undefined") {
        CofreModule.init();
      }
    } catch (err) {
      container.innerHTML = `
        <div class="osync-card status-critico p-6 text-center">
          <p class="text-sm font-bold text-rose-700">Erro ao carregar a tela "${Utils.escaparHTML(destino)}".</p>
          <p class="text-xs text-slate-500 mt-1">${Utils.escaparHTML(err.message)}</p>
        </div>
      `;
    }
  }

  function getRotaAtual() {
    return rotaAtual;
  }

  return {
    navegarPara,
    registrarListener,
    getRotaAtual
  };
})();
