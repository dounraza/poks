import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Connexion = () => {
  useEffect(() => {
    // Injected script logic to handle form submission and animations
    const script = document.createElement('script');
    script.innerHTML = `
    (function () {
      var reduce = window.matchMedia &&
                   window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
      /* ---------- paillettes sur toute la page ---------- */
      var cv = document.getElementById('fx');
      var ctx = (cv && cv.getContext && !reduce) ? cv.getContext('2d') : null;
      var DPR = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0, parts = [], running = false, drizzle = true;
      var GOLD   = ['#FFF8DC', '#F5DA92', '#E7C879', '#D9AE4B', '#C79A2E', '#FFFFFF'];
      var DEBRIS = ['#A5121A', '#8E1219', '#6E0A11', '#F3E7CC', '#FFFDF6', '#D9AE4B', '#E7C879'];
    
      function rnd(a, b) { return a + Math.random() * (b - a); }
    
      function resize() {
        if (!ctx) return;
        W = window.innerWidth; H = window.innerHeight;
        cv.width = W * DPR; cv.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    
      function spawnDust() {
        parts.push({
          x: rnd(0, W), y: -12, vx: rnd(-0.4, 0.4), vy: rnd(0.4, 1.4),
          r: rnd(0.8, 2.4), g: rnd(0.003, 0.010), d: 0.999,
          c: GOLD[(Math.random() * GOLD.length) | 0],
          tw: rnd(0, 6.28), tws: rnd(0.04, 0.13), rot: 0, vr: 0, shard: false
        });
      }
    
      function burst(cx, cy) {
        for (var i = 0; i < 2000; i++) {
          var a = rnd(0, Math.PI * 2), s = Math.pow(Math.random(), 0.55) * rnd(4, 32);
          parts.push({
            x: cx + rnd(-30, 30), y: cy + rnd(-30, 30),
            vx: Math.cos(a) * s, vy: Math.sin(a) * s - rnd(1, 8),
            r: rnd(1, 3.8), g: rnd(0.10, 0.30), d: rnd(0.988, 0.997),
            c: GOLD[(Math.random() * GOLD.length) | 0],
            tw: rnd(0, 6.28), tws: rnd(0.10, 0.28), rot: 0, vr: 0, shard: false
          });
        }
        for (var j = 0; j < 340; j++) {
          var a2 = rnd(0, Math.PI * 2), s2 = Math.pow(Math.random(), 0.6) * rnd(3, 24);
          parts.push({
            x: cx + rnd(-40, 40), y: cy + rnd(-40, 40),
            vx: Math.cos(a2) * s2, vy: Math.sin(a2) * s2 - rnd(2, 10),
            w: rnd(5, 20), h: rnd(4, 14), g: rnd(0.22, 0.44), d: rnd(0.990, 0.997),
            c: DEBRIS[(Math.random() * DEBRIS.length) | 0],
            rot: rnd(0, 6.28), vr: rnd(-0.24, 0.24), shard: true
          });
        }
        if (!running) { running = true; requestAnimationFrame(tick); }
      }
    
      function tick() {
        ctx.clearRect(0, 0, W, H);
        if (drizzle && parts.length < 70 && Math.random() < 0.45) spawnDust();
    
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.vy += p.g; p.vx *= p.d; p.vy *= p.d;
          p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.tw += p.tws;
    
          if (p.y > H + 60 || p.x < -120 || p.x > W + 120) { parts.splice(i, 1); continue; }
          var fade = p.y > H * 0.86 ? Math.max(0, (H + 40 - p.y) / (H * 0.14 + 40)) : 1;
    
          if (p.shard) {
            ctx.save(); ctx.globalAlpha = fade;
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          } else {
            ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(p.tw));
            ctx.fillStyle = p.c;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(tick);
      }
    
      if (ctx) {
        resize();
        window.addEventListener('resize', resize);
        running = true;
        requestAnimationFrame(tick);
      } else if (cv) {
        cv.style.display = 'none';
      }
    
      /* ---------- écran de réussite ---------- */
      function celebrer() {
        var vic = document.getElementById('victoire');
        vic.classList.add('on');
        document.body.style.overflow = 'hidden';
    
        if (reduce) { vic.classList.add('boom'); return; }
    
        setTimeout(function () {
          vic.classList.add('boom');
          document.getElementById('jetons').classList.add('gone');
          if (ctx) burst(window.innerWidth / 2, window.innerHeight * 0.46);
        }, 1250); // les jetons se rejoignent puis se percutent
      }
    
      /* aperçu de l'animation : ouvrir la page avec #demo à la fin de l'adresse */
      if (window.location.hash === '#demo') { setTimeout(celebrer, 400); }
    
      /* ---------- envoi du formulaire (inchangé côté serveur) ---------- */
      document.getElementById('formulaireConnexion').addEventListener('submit', async function (e) {
        e.preventDefault();
        var resultatDiv = document.getElementById('resultat');
        var bouton = document.getElementById('btnSubmit');
    
        resultatDiv.textContent = 'Connexion en cours...';
        resultatDiv.className = '';
        bouton.disabled = true;
    
        var donnees = {
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        };
    
        try {
          var reponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donnees)
          });
          var data = await reponse.json();
    
          if (data.success) {
            resultatDiv.textContent = '';
            e.target.reset();
            celebrer();
          } else {
            resultatDiv.textContent = (data.message || JSON.stringify(data.errors));
            resultatDiv.className = 'erreur';
            bouton.disabled = false;
          }
        } catch (err) {
          resultatDiv.textContent = "Impossible de contacter le serveur. Vérifiez qu'il tourne toujours.";
          resultatDiv.className = 'erreur';
          bouton.disabled = false;
        }
      });
    })();
    `;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="page-auth">
      <header className="topbar">
        <div className="wrap">
          <Link className="logo" to="/"><b>&spades;</b>Afripoks</Link>
          <div className="account">
            <Link className="btn btn-ghost" to="/">Retour à l'accueil</Link>
          </div>
        </div>
      </header>
    
      <nav className="subnav">
        <div className="wrap">
          <Link to="/">Accueil</Link>
          <a href="/lobby.html"><span className="tag">JOUER</span>Cash games</a>
          <a href="/lobby.html#tournois"><span className="tag">JOUER</span>Tournois</a>
          <Link to="/">Apprendre le poker</Link>
        </div>
      </nav>
    
      <section className="stage">
        <div className="panel">
          <h1>Connexion</h1>
          <p className="sub">La table n'attend plus que vous.</p>
    
          <form id="formulaireConnexion">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" required autoComplete="email"
                   placeholder="vous@exemple.com" />
    
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" required
                   autoComplete="current-password" placeholder="Votre mot de passe" />
    
            <button type="submit" className="btn btn-gold" id="btnSubmit">Jouer maintenant</button>
          </form>
    
          <div id="resultat"></div>
          <a className="retour" href="/mot-de-passe-oublie">Mot de passe oublié ?</a>
          <Link className="retour" to="/inscription">Pas encore de compte ? Créer un compte</Link>
        </div>
      </section>
    
      <div id="victoire" aria-live="polite">
        <div className="jetons" id="jetons" aria-hidden="true">
          <div className="jet" style={{'--fx':'-1150px','--fy':'-540px','--r0':'-480deg','--t':'0s'}}></div>
          <div className="jet" style={{'--fx':'1180px','--fy':'-480px','--r0':'430deg','--t':'.04s'}}></div>
          <div className="jet" style={{'--fx':'-1240px','--fy':'360px','--r0':'520deg','--t':'.02s'}}></div>
          <div className="jet" style={{'--fx':'1210px','--fy':'440px','--r0':'-450deg','--t':'.07s'}}></div>
          <div className="jet" style={{'--fx':'-30px','--fy':'-860px','--r0':'600deg','--t':'.05s'}}></div>
          <div className="jet" style={{'--fx':'-960px','--fy':'740px','--r0':'-560deg','--t':'.09s'}}></div>
          <div className="jet" style={{'--fx':'1000px','--fy':'760px','--r0':'470deg','--t':'.06s'}}></div>
        </div>
    
        <div className="vflash" aria-hidden="true"></div>
        <div className="vwave" aria-hidden="true"></div>
        <div className="vwave w2" aria-hidden="true"></div>
        <div className="vwave w3" aria-hidden="true"></div>
    
        <div className="vmsg">
          <div className="grosjeton" aria-hidden="true"><span>GO</span></div>
          <h2>Ah te revoilà</h2>
          <p>On commençait presque à gagner sans toi.<span className="emo">😏</span></p>
          <div className="cta">
            <a className="btn btn-gold" href="/lobby.html">Rejoindre une table</a>
          </div>
        </div>
      </div>
    
      <canvas id="fx" aria-hidden="true"></canvas>
    </div>
  );
};

export default Connexion;
