// js/auth.js
const Auth = (() => {
  let currentUser = null;

  function init() {
    auth.onAuthStateChanged((user) => {
      if (!user || user.email !== OWNER_EMAIL) {
        if (user) auth.signOut();
        window.location.href = "login.html";
        return;
      }

      currentUser = user;
      document.body.classList.remove("auth-loading");
      atualizarBadgeCofre();
      bindEventos();

      // Carrega a rota inicial (via hash ou dashboard)
      const rotaInicial = window.location.hash.replace("#", "") || "dashboard";
      Router.navegarPara(rotaInicial);
    });
  }

  function bindEventos() {
    const formUnlock = document.getElementById("form-unlock-vault");
    if (formUnlock && !formUnlock.dataset.bound) {
      formUnlock.dataset.bound = "true";
      formUnlock.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("input-master-password");
        const senha = input.value;

        try {
          await CryptoVault.unlockVault(senha, currentUser.uid);
          input.value = "";
          fecharModalCofre();
          atualizarBadgeCofre();
          Utils.showToast("Cofre AES-256 desbloqueado nesta sessão!", "sucesso");

          // Recarrega a tela atual se estiver no cofre para liberar descriptografia
          if (Router.getRotaAtual() === "cofre" && typeof CofreModule !== "undefined") {
            CofreModule.renderLista();
          }
        } catch (err) {
          Utils.showToast(err.message, "erro");
        }
      });
    }
  }

  function atualizarBadgeCofre() {
    const btn = document.getElementById("btn-vault-status");
    const txt = document.getElementById("vault-status-text");
    if (!btn || !txt) return;

    if (CryptoVault.isUnlocked()) {
      btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition";
      btn.innerHTML = `<i data-lucide="unlock" class="w-3.5 h-3.5"></i><span id="vault-status-text">Cofre Ativo</span>`;
    } else {
      btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition";
      btn.innerHTML = `<i data-lucide="lock" class="w-3.5 h-3.5"></i><span id="vault-status-text">Cofre Bloqueado</span>`;
    }
    lucide.createIcons();
  }

  function abrirModalCofre() {
    if (CryptoVault.isUnlocked()) {
      CryptoVault.lockVault();
      atualizarBadgeCofre();
      Utils.showToast("Cofre bloqueado manualmente.", "info");
      if (Router.getRotaAtual() === "cofre" && typeof CofreModule !== "undefined") {
        CofreModule.renderLista();
      }
      return;
    }
    const modal = document.getElementById("modal-master-password");
    if (modal) {
      modal.classList.remove("hidden");
      document.getElementById("input-master-password").focus();
    }
  }

  function fecharModalCofre() {
    const modal = document.getElementById("modal-master-password");
    if (modal) modal.classList.add("hidden");
  }

  async function logout() {
    CryptoVault.lockVault();
    await auth.signOut();
    window.location.href = "login.html";
  }

  function getUser() {
    return currentUser;
  }

  return {
    init,
    abrirModalCofre,
    fecharModalCofre,
    atualizarBadgeCofre,
    logout,
    getUser
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  Auth.init();
});
