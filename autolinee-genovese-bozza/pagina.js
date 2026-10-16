// Autolinee Genovese — comportamento della pagina. Nessun dato salvato, nessuna richiesta a terzi.
(() => {
  const riduci = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Numero WhatsApp della ditta: DA INSERIRE (solo cifre, con 39 davanti). Vuoto = WhatsApp chiede a chi mandarlo.
  const NUMERO_WA = '';

  // --- Entrate una volta sola, quando la sezione arriva sullo schermo
  const io = new IntersectionObserver((voci) => {
    for (const v of voci) if (v.isIntersecting) { v.target.classList.add('is-in'); io.unobserve(v.target); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  // le foto delle sezioni si aprono come un otturatore (classe messa solo se lo script gira)
  document.querySelectorAll('.cornice, .piede-foto, .ritratto .foto, .scheda img, .contatti > picture img').forEach((el) => el.classList.add('otturatore'));
  // le righe del biglietto appaiono una dopo l'altra
  document.querySelectorAll('[data-stampa] .tratte li').forEach((li, i) => li.style.setProperty('--i', i));
  document.querySelectorAll('[data-reveal], .mezzo, .maschera, [data-stampa], .offerta').forEach((el) => io.observe(el));
  // il nome in fondo sta all'ultimo pixel della pagina: senza margine, altrimenti non "entra" mai
  const nome = document.querySelector('.nome-gigante');
  if (nome) new IntersectionObserver(([v], o) => { if (v.isIntersecting) { nome.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.2 }).observe(nome);
  // un elemento tagliato a zero dall'otturatore per Chrome non è mai "visibile": si osserva il suo contenitore
  const ioFoto = new IntersectionObserver((voci) => {
    for (const v of voci) if (v.isIntersecting) { v.target.querySelectorAll(':scope > .otturatore, :scope > picture > .otturatore').forEach((f) => f.classList.add('is-in')); if (v.target.classList.contains('otturatore')) v.target.classList.add('is-in'); ioFoto.unobserve(v.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  new Set([...document.querySelectorAll('.otturatore')].map((f) => (f.parentElement.tagName === 'PICTURE' ? f.parentElement.parentElement : f.parentElement))).forEach((c) => ioFoto.observe(c));

  // i posti contano da zero quando la frase entra sullo schermo
  const cifre = document.querySelectorAll('[data-conta]');
  if (cifre.length && !riduci) {
    cifre.forEach((c) => { c.textContent = '0'; });
    new IntersectionObserver(([v], oss) => {
      if (!v.isIntersecting) return;
      oss.disconnect();
      const t0 = performance.now();
      const passo = (t) => {
        const k = Math.min((t - t0) / 1200, 1), f = 1 - Math.pow(1 - k, 3);
        cifre.forEach((c) => { c.textContent = Math.round(Number(c.dataset.conta) * f); });
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.4 }).observe(cifre[0].closest('.offerta'));
  }

  // --- Apertura: il rullo di foto scorre al centro mentre la frase resta ferma
  const apertura = document.querySelector('.apertura');
  const rullo = document.getElementById('rullo');
  const largo = matchMedia('(min-width: 901px)');
  let inAttesa = false;
  function muoviRullo() {
    inAttesa = false;
    if (!largo.matches || riduci) { rullo.style.transform = ''; return; }
    const r = apertura.getBoundingClientRect();
    const corsa = apertura.offsetHeight - innerHeight;
    const p = Math.min(Math.max(-r.top / corsa, 0), 1);
    const fig = rullo.firstElementChild.getBoundingClientRect().height + 24;
    const passi = rullo.children.length - 2;
    // parte con la seconda foto al centro (la prima si vede in alto), poi avanza di una cornice per ogni tratto
    rullo.style.transform = `translateY(${-(fig + fig / 2 - 12) - p * passi * fig}px)`;
  }
  addEventListener('scroll', () => { if (!inAttesa) { inAttesa = true; requestAnimationFrame(muoviRullo); } }, { passive: true });
  addEventListener('resize', muoviRullo);
  muoviRullo();

  // --- Quanti siete? Sceglie il mezzo più piccolo che basta e prepara il messaggio
  const mezzi = [...document.querySelectorAll('.mezzo')]
    .map((m) => ({ id: m.id, posti: Number(m.dataset.posti), nome: m.dataset.nome }))
    .sort((a, b) => a.posti - b.posti);
  const campo = document.getElementById('persone');
  const esito = document.getElementById('esito');
  const meta = document.getElementById('meta');
  const quando = document.getElementById('quando');
  const invia = document.getElementById('invia-wa');
  const vedi = document.getElementById('vedi-mezzo');
  const maxPosti = mezzi[mezzi.length - 1].posti;

  function aggiorna(anima) {
    let n = Math.round(Number(campo.value));
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > 200) n = 200;
    let testo, scelto;
    const basta = mezzi.find((m) => m.posti >= n);
    if (basta) {
      scelto = basta;
      testo = `Per ${n} ${n === 1 ? 'persona' : 'persone'} va bene il <strong>${basta.nome}</strong>.`;
    } else {
      const quanti = Math.ceil(n / maxPosti);
      scelto = mezzi[mezzi.length - 1];
      testo = `Per ${n} persone servono <strong>${quanti} pullman gran turismo</strong>.`;
    }
    esito.innerHTML = testo;
    vedi.href = '#' + scelto.id;
    if (anima && !riduci) { esito.classList.remove('cambia'); void esito.offsetWidth; esito.classList.add('cambia'); }
    const righe = [
      'Buongiorno, vorrei un preventivo.',
      `Siamo ${n} ${n === 1 ? 'persona' : 'persone'}.`,
      meta.value.trim() && `Destinazione: ${meta.value.trim()}.`,
      quando.value.trim() && `Data: ${quando.value.trim()}.`,
    ].filter(Boolean).join('\n');
    invia.href = `https://wa.me/${NUMERO_WA}?text=${encodeURIComponent(righe)}`;
  }
  document.querySelectorAll('.contatore button').forEach((b) => b.addEventListener('click', () => {
    campo.value = Math.min(200, Math.max(1, (Number(campo.value) || 0) + Number(b.dataset.passo)));
    aggiorna(true);
  }));
  campo.addEventListener('input', () => aggiorna(true));
  meta.addEventListener('input', () => aggiorna(false));
  quando.addEventListener('input', () => aggiorna(false));
  // "Chiedi questo mezzo": porta al calcolo con i posti di quel mezzo
  document.querySelectorAll('[data-scegli]').forEach((a) => a.addEventListener('click', () => {
    campo.value = a.dataset.scegli; aggiorna(true);
  }));
  aggiorna(false);

  // --- Dove siamo stati: una cornice, le foto si alternano; un tocco passa alla prossima
  const cornice = document.getElementById('cornice');
  const foto = [...cornice.querySelectorAll('img')];
  const didascalia = document.getElementById('didascalia');
  let attuale = 0, timer = null;
  function mostra(i) {
    foto[attuale].classList.remove('attiva');
    attuale = (i + foto.length) % foto.length;
    foto[attuale].classList.add('attiva');
    foto[attuale].loading = 'eager';
    foto[(attuale + 1) % foto.length].loading = 'eager';
    didascalia.textContent = foto[attuale].dataset.didascalia;
  }
  function avvia() { if (!riduci && !timer) timer = setInterval(() => mostra(attuale + 1), 3000); }
  function ferma() { clearInterval(timer); timer = null; }
  cornice.addEventListener('click', () => { mostra(attuale + 1); ferma(); avvia(); });
  cornice.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cornice.click(); } });
  new IntersectionObserver(([v]) => (v.isIntersecting ? avvia() : ferma()), { threshold: 0.2 }).observe(cornice);

  // --- Video: parte solo quando si vede, si ferma fuori schermo
  const video = document.querySelector('video');
  if (video && !riduci) {
    new IntersectionObserver(([v]) => {
      if (v.isIntersecting) { video.preload = 'auto'; video.play().catch(() => {}); } else video.pause();
    }, { threshold: 0.25 }).observe(video);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { ferma(); video && video.pause(); } });
})();
