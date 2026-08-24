(function () {
  async function syncSession() {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (r.ok) {
        const data = await r.json();
        if (data.success && data.user) {
          localStorage.setItem('afripoks.user', JSON.stringify(data.user));
          localStorage.setItem('afripoks.bankroll', String(data.user.solde || data.user.chips || 0));
        }
      }
    } catch (e) {}
  }

  function saveUser(u) {
    try { localStorage.setItem("afripoks.user", JSON.stringify(u)); } catch (e) {}
  }

  function readForm(form) {
    const fd = new FormData(form);
    const get = (...keys) => {
      for (const k of keys) {
        const v = fd.get(k);
        if (v) return String(v).trim();
      }
      const el = form.querySelector("input[type=email], input[name*=mail], input[name*=pseudo], input[name*=user]");
      return el ? el.value.trim() : "";
    };
    const ident = get("pseudo", "username", "name", "email", "ident", "login");
    const email = get("email", "mail");
    return { name: (ident || email || "Joueur").split("@")[0], email: email || ident };
  }

  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!/connexion|inscription|login|register|signup/i.test(location.pathname + (form.action || "") + (form.id || ""))) {
      if (!form.querySelector("input[type=password]")) return;
    }
    const user = readForm(form);
    saveUser(user);
  }, true);

  syncSession();
})();
