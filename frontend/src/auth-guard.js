/**
 * Afripoks Auth Guard
 * Vérifie l'authentification auprès du serveur MySQL.
 * Redirige automatiquement vers la page de connexion si l'utilisateur n'est pas connecté.
 */
(function () {
  async function checkSession() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Non authentifié');
      }

      const data = await response.json();
      if (!data.success || !data.user) {
        throw new Error('Utilisateur introuvable');
      }

      // Sauvegarde des données utilisateur et solde à jour depuis MySQL
      window.currentUser = data.user;
      localStorage.setItem('afripoks.user', JSON.stringify(data.user));
      localStorage.setItem('afripoks.bankroll', String(data.user.solde || data.user.chips || 0));

      // Émettre un événement pour que la page mette à jour l'UI avec le solde réel
      window.dispatchEvent(new CustomEvent('afripoks:auth', { detail: data.user }));

      // Mettre à jour l'interface si les éléments sont déjà présents
      updateAuthUI(data.user);
    } catch (error) {
      console.warn('[AuthGuard] Non connecté, redirection vers la page de connexion...');
      localStorage.removeItem('afripoks.user');
      localStorage.removeItem('afripoks.token');
      localStorage.removeItem('afripoks.bankroll');
      window.location.replace('/connexion');
    }
  }

  function updateAuthUI(user) {
    const pseudoEls = document.querySelectorAll('#who-name, .user-name, [data-user-name]');
    pseudoEls.forEach(el => el.textContent = user.name || user.pseudo || 'Joueur');

    const soldeEls = document.querySelectorAll('#who-solde, .user-solde, [data-user-solde]');
    const soldeFormatte = Number(user.solde || user.chips || 0).toLocaleString('fr-FR');
    soldeEls.forEach(el => {
      if (el.id === 'who-solde') {
        el.textContent = `Votre solde : ${soldeFormatte} Ar`;
      } else {
        el.textContent = `${soldeFormatte} Ar`;
      }
    });

    if (document.body) {
      document.body.classList.add('is-in');
    }
  }

  // Fonction globale de déconnexion accessible partout
  window.afripoksLogout = async function () {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    localStorage.removeItem('afripoks.user');
    localStorage.removeItem('afripoks.token');
    localStorage.removeItem('afripoks.bankroll');
    window.location.replace('/connexion');
  };

  // Exécution immédiate
  checkSession();
})();
