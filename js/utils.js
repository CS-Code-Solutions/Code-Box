// js/utils.js
const Utils = {
  escaparHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatarDataBR(isoDate) {
    if (!isoDate) return "Sem vencimento";
    const [ano, mes, dia] = isoDate.split("-");
    if (!ano || !mes || !dia) return isoDate;
    return `${dia}/${mes}/${ano}`;
  },

  // Calcula status de validade de segredos/certificados
  avaliarVencimento(isoDate) {
    if (!isoDate) {
      return {
        dias: null,
        status: "sem-data",
        label: "PERMANENTE",
        badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
        cardClass: ""
      };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [ano, mes, dia] = isoDate.split("-").map(Number);
    const vencimento = new Date(ano, mes - 1, dia);

    const diffTime = vencimento - hoje;
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dias < 0) {
      return {
        dias,
        status: "vencido",
        label: `VENCIDO HÁ ${Math.abs(dias)}D`,
        badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
        cardClass: "status-critico"
      };
    }
    if (dias <= 15) {
      return {
        dias,
        status: "critico",
        label: dias === 0 ? "VENCE HOJE" : `VENCE EM ${dias}D`,
        badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
        cardClass: "status-critico"
      };
    }
    if (dias <= 45) {
      return {
        dias,
        status: "atencao",
        label: `RENOVAR EM ${dias}D`,
        badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
        cardClass: "status-atencao"
      };
    }

    return {
      dias,
      status: "ok",
      label: `VÁLIDO (${dias}D)`,
      badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      cardClass: "status-ok"
    };
  },

  showToast(mensagem, tipo = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const cores = {
      sucesso: "bg-[#0B1120] border-[#00E5B0] text-white",
      erro: "bg-rose-950 border-rose-500 text-white",
      info: "bg-[#0B1120] border-blue-500 text-white"
    };

    const toast = document.createElement("div");
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 shadow-xl text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${cores[tipo] || cores.info}`;
    toast.innerHTML = `<span>${this.escaparHTML(mensagem)}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  async copiarTexto(texto, label = "Conteúdo") {
    try {
      await navigator.clipboard.writeText(texto);
      this.showToast(`${label} copiado para a área de transferência!`, "sucesso");
    } catch (err) {
      this.showToast("Não foi possível copiar automaticamente.", "erro");
    }
  },

  renderSkeletonCards(qtd = 3) {
    return Array.from({ length: qtd })
      .map(
        () => `
        <div class="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
          <div class="flex justify-between items-center mb-3">
            <div class="h-4 bg-slate-200 rounded w-1/3"></div>
            <div class="h-5 bg-slate-200 rounded-full w-20"></div>
          </div>
          <div class="h-3 bg-slate-100 rounded w-2/3 mb-4"></div>
          <div class="flex gap-2">
            <div class="h-8 bg-slate-200 rounded-lg w-24"></div>
            <div class="h-8 bg-slate-100 rounded-lg w-24"></div>
          </div>
        </div>
      `
      )
      .join("");
  }
};
