import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('afripoks.user', JSON.stringify(data.user));
            localStorage.setItem('afripoks.bankroll', String(data.user.solde || data.user.chips || 0));
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('afripoks.user');
    localStorage.removeItem('afripoks.token');
    localStorage.removeItem('afripoks.bankroll');
    setUser(null);
    window.location.reload();
  };

  useEffect(() => {
    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cv = document.getElementById('fx');
    if (reduce || !cv || !cv.getContext) {
      if (cv) cv.style.display = 'none';
      return;
    }

    var ctx = cv.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var GOLD   = ['#FFF8DC', '#F5DA92', '#E7C879', '#D9AE4B', '#C79A2E', '#FFFFFF'];
    var DEBRIS = ['#A5121A', '#8E1219', '#6E0A11', '#F3E7CC', '#FFFDF6', '#D9AE4B', '#E7C879'];

    var parts = [];
    var running = false;
    var drizzle = false;
    var animationFrameId;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function spawnBurst(cx, cy) {
      // paillettes
      for (var i = 0; i < 1500; i++) {
        var ang = rnd(0, Math.PI * 2);
        var sp  = Math.pow(Math.random(), 0.55) * rnd(4, 30);
        parts.push({
          x: cx + rnd(-30, 30), y: cy + rnd(-30, 30),
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rnd(1, 7),
          r: rnd(1, 3.6), g: rnd(0.10, 0.30), d: rnd(0.988, 0.997),
          c: GOLD[(Math.random() * GOLD.length) | 0],
          tw: rnd(0, 6.28), tws: rnd(0.10, 0.28),
          rot: 0, vr: 0, shard: false, life: 1
        });
      }
      // débris de cartes et de jetons
      for (var j = 0; j < 320; j++) {
        var a2 = rnd(0, Math.PI * 2);
        var s2 = Math.pow(Math.random(), 0.6) * rnd(3, 22);
        parts.push({
          x: cx + rnd(-40, 40), y: cy + rnd(-40, 40),
          vx: Math.cos(a2) * s2, vy: Math.sin(a2) * s2 - rnd(2, 9),
          w: rnd(5, 20), h: rnd(4, 14), g: rnd(0.22, 0.42), d: rnd(0.990, 0.997),
          c: DEBRIS[(Math.random() * DEBRIS.length) | 0],
          rot: rnd(0, 6.28), vr: rnd(-0.22, 0.22),
          tw: 0, tws: 0, shard: true, life: 1
        });
      }
      if (!running) { running = true; animationFrameId = requestAnimationFrame(tick); }
    }

    function spawnDust() {
      for (var i = 0; i < 2; i++) {
        parts.push({
          x: rnd(0, W), y: -12,
          vx: rnd(-0.5, 0.5), vy: rnd(0.5, 1.6),
          r: rnd(0.8, 2.4), g: rnd(0.004, 0.012), d: 0.999,
          c: GOLD[(Math.random() * GOLD.length) | 0],
          tw: rnd(0, 6.28), tws: rnd(0.05, 0.14),
          rot: 0, vr: 0, shard: false, life: 1
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      if (drizzle && parts.length < 90 && Math.random() < 0.5) spawnDust();

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += p.g;
        p.vx *= p.d; p.vy *= p.d;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr;
        p.tw += p.tws;

        if (p.y > H + 60 || p.x < -120 || p.x > W + 120) { parts.splice(i, 1); continue; }

        var fade = p.y > H * 0.86 ? Math.max(0, (H + 40 - p.y) / (H * 0.14 + 40)) : 1;

        if (p.shard) {
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        } else {
          ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(p.tw));
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (parts.length === 0 && !drizzle) { running = false; return; }
      animationFrameId = requestAnimationFrame(tick);
    }

    // --- déclenchement du choc ---
    var IMPACT = 3300; // ms : durée d'approche des grosses cartes et jetons
    var timer1 = setTimeout(function () {
      var stage = document.getElementById('stage');
      var col   = document.getElementById('collide');
      if (!stage || !col) return;
      var r = stage.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height * 0.46;

      stage.classList.add('fire');   // flash + ondes
      col.classList.add('gone');     // les grosses pièces volent en éclats
      spawnBurst(cx, cy);

      timer2 = setTimeout(function () { drizzle = true; }, 2600); // poussière d'or continue
    }, IMPACT);

    var timer2;

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="page-index">
      <header className="topbar">
        <div className="wrap">
          <Link className="logo" to="/"><b>♠</b>Afripoks</Link>
          <div className="account">
            {user ? (
              <div className="user-connected-bar">
                <span className="solde-badge">
                  💰 {Number(user.solde !== undefined ? user.solde : (user.chips || 0)).toLocaleString('fr-FR')} Ar
                </span>
                <span className="user-name-badge">
                  👤 {user.name || user.pseudo || 'Joueur'}
                </span>
                <a className="btn btn-gold" href="/lobby.html">Jouer</a>
                <a className="btn btn-ghost" href="/account.html">Compte</a>
                <button type="button" className="btn btn-ghost btn-logout" onClick={handleLogout}>
                  Déconnexion
                </button>
              </div>
            ) : (
              <>
                <Link className="btn btn-ghost" to="/connexion">Connexion</Link>
                <Link className="btn btn-gold" to="/inscription">S'inscrire</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="subnav">
        <div className="wrap">
          <Link className="on" to="/">Accueil</Link>
          <a href="/lobby.html"><span className="tag">JOUER</span>Cash games</a>
          <a href="/lobby.html#tournois"><span className="tag">JOUER</span>Tournois</a>
          {user && <a href="/account.html">Mon profil</a>}
        </div>
      </nav>

      <section className="stage" id="stage">
        <div className="rings" aria-hidden="true">
          <div className="ring ring-out">
            <div className="slot" style={{ '--a': '0deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '30deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '60deg', '--d': '400px' }}><div className="card face"><i className="">♠</i></div></div>
            <div className="slot" style={{ '--a': '90deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '120deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '150deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '180deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '210deg', '--d': '400px' }}><div className="card face"><i className="r">♥</i></div></div>
            <div className="slot" style={{ '--a': '240deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '270deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '300deg', '--d': '400px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '330deg', '--d': '400px' }}><div className="card back"></div></div>
          </div>
          <div className="ring ring-in">
            <div className="slot" style={{ '--a': '22deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '67deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '112deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '157deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '202deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '247deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '292deg', '--d': '265px' }}><div className="card back"></div></div>
            <div className="slot" style={{ '--a': '337deg', '--d': '265px' }}><div className="card back"></div></div>
          </div>
        </div>

        <div className="collide" id="collide" aria-hidden="true">
          <div className="big bigcard" style={{ '--fx': '-1180px', '--fy': '-560px', '--r0': '510deg', '--r1': '13deg', '--t': '0.045s' }}><i className="">♠</i></div>
          <div className="big bigcard" style={{ '--fx': '1220px', '--fy': '-500px', '--r0': '-620deg', '--r1': '-4deg', '--t': '0.018s' }}><i className="r">♥</i></div>
          <div className="big bigchip" style={{ '--fx': '-1280px', '--fy': '340px', '--r0': '-620deg', '--r1': '14deg', '--t': '0.063s' }}></div>
          <div className="big bigcard" style={{ '--fx': '1240px', '--fy': '460px', '--r0': '-430deg', '--r1': '-10deg', '--t': '0.045s' }}><i className="r">♦</i></div>
          <div className="big bigchip" style={{ '--fx': '-40px', '--fy': '-880px', '--r0': '-430deg', '--r1': '-11deg', '--t': '0.054s' }}></div>
          <div className="big bigcard" style={{ '--fx': '-980px', '--fy': '760px', '--r0': '600deg', '--r1': '-14deg', '--t': '0.06s' }}><i className="">♣</i></div>
          <div className="big bigchip" style={{ '--fx': '1020px', '--fy': '780px', '--r0': '510deg', '--r1': '12deg', '--t': '0.065s' }}></div>
          <div className="big bigcard" style={{ '--fx': '-1340px', '--fy': '-90px', '--r0': '-620deg', '--r1': '-6deg', '--t': '0.062s' }}><i className="r">♥</i></div>
          <div className="big bigchip" style={{ '--fx': '1360px', '--fy': '-40px', '--r0': '-620deg', '--r1': '-12deg', '--t': '0.006s' }}></div>
        </div>

        <div className="flash" aria-hidden="true"></div>
        <div className="wave" aria-hidden="true"></div>
        <div className="wave w2" aria-hidden="true"></div>
        <div className="wave w3" aria-hidden="true"></div>

        <div className="pitch">
          <span className="eyebrow">Tables ouvertes 24h/24</span>
          <h1>Tu penses savoir bluffer&nbsp;?<br /><em>Prouve-le à la table</em></h1>
          <div className="rule"></div>
          <div className="cta-row">
            {user ? (
              <a className="btn btn-gold btn-lg" href="/lobby.html">Rejoindre une table</a>
            ) : (
              <Link className="btn btn-gold btn-lg" to="/inscription">Créer un compte</Link>
            )}
            <a className="btn btn-white btn-lg" href="#telecharger">Télécharger l'application</a>
          </div>
          <p className="fineprint">Réservé aux personnes de 18 ans et plus. Jouer comporte des risques : endettement, isolement, dépendance.</p>
        </div>
      </section>

      <canvas id="fx" aria-hidden="true"></canvas>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Deux façons de jouer</h2>
            <p>Des tables ouvertes en permanence, du premier tapis à la table finale.</p>
          </div>
          <div className="grid">
            <article className="offer">
              <span className="suit">♦</span>
              <h3>Cash games</h3>
              <p>Vous entrez et sortez quand vous voulez, avec les jetons que vous décidez d'amener. Le format le plus libre.</p>
              <a className="link" href="/lobby.html">Voir les parties en cours →</a>
            </article>
            <article className="offer">
              <span className="suit">♠</span>
              <h3>Tournois</h3>
              <p>Un buy-in fixe, des centaines de joueurs, une place à la table finale. Le rendez-vous du dimanche soir à 20h.</p>
              <a className="link" href="/lobby.html#tournois">Consulter le calendrier →</a>
            </article>
          </div>
        </div>
      </section>

      <section className="strip">
        <div className="wrap">
          <h2>Votre siège vous attend</h2>
          <p>Il commence à croire que vous avez peur. 😂</p>
          {user ? (
            <a className="btn btn-gold btn-lg" href="/lobby.html">Rejoindre une table</a>
          ) : (
            <Link className="btn btn-gold btn-lg" to="/inscription">Créer un compte</Link>
          )}
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-links">
            <a href="#">À propos</a>
            <a href="#">Conditions générales</a>
            <a href="#">Confidentialité</a>
            <a href="#">Jeu responsable</a>
            <a href="#">Nous contacter</a>
          </div>
          <p className="legal">
            <span className="age">18+</span>
            Afripoks est réservé aux personnes majeures. Le jeu d'argent peut entraîner une dépendance : fixez-vous des limites de dépôt et de temps de jeu. Numéro de licence et autorité de régulation à afficher ici avant toute ouverture au public.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
