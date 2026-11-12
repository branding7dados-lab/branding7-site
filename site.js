/* Branding7 — site institucional
   O conteúdo vem do Sistema B7 (tela "Site"): textos, WhatsApp, vídeos,
   depoimentos, serviços, clientes e regiões. Só o que está publicado,
   com a chave pública do banco (leitura). O formulário cai em "Contatos". */
(function () {
  'use strict';
  const SB = 'https://rartcafydsaocdzshqcx.supabase.co';
  const CHAVE = 'sb_publishable_N9Ha9Gwmh-jJsXaI5oY7Lw_dY4XAb8e';
  const H = { apikey: CHAVE, Authorization: 'Bearer ' + CHAVE };
  const $ = s => document.querySelector(s);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let cfg = { whatsapp: '5577981223827', whatsapp_msg: 'Olá! Vim pelo site da Branding7 e quero saber mais sobre os vídeos.', instagram: 'b7.agencia' };

  /* ---------- origem do visitante (anúncio) ---------- */
  const origem = (() => {
    const p = new URLSearchParams(location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(k => { if (p.get(k)) o[k] = p.get(k).slice(0, 120); });
    try {
      if (Object.keys(o).length) sessionStorage.setItem('b7_origem', JSON.stringify(o));
      else Object.assign(o, JSON.parse(sessionStorage.getItem('b7_origem') || '{}'));
    } catch (e) {}
    if (document.referrer && !/branding7\.com\.br/.test(document.referrer)) o.referrer = document.referrer.slice(0, 200);
    return o;
  })();

  /* ---------- WhatsApp ---------- */
  const linkWpp = (extra) => 'https://wa.me/' + String(cfg.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent((cfg.whatsapp_msg || '') + (extra ? '\n\n' + extra : ''));
  function ligarWpp() {
    document.querySelectorAll('[data-wpp]').forEach(a => {
      a.href = linkWpp(); a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', () => evento('Contact', { canal: 'whatsapp' }));
    });
    if (cfg.instagram) document.querySelectorAll('[data-insta]').forEach(a => { a.href = 'https://www.instagram.com/' + String(cfg.instagram).replace(/^@/, '') + '/'; });
  }

  /* ---------- pixel / analytics (configurados no sistema) ---------- */
  function evento(nome, dados) {
    try { if (window.fbq) window.fbq('track', nome, dados || {}); } catch (e) {}
    try { if (window.gtag) window.gtag('event', nome === 'Lead' ? 'generate_lead' : nome === 'Contact' ? 'contact' : nome, dados || {}); } catch (e) {}
  }
  function rastreadores() {
    const px = String(cfg.pixel_meta || '').replace(/\D/g, '');
    if (px) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', px); window.fbq('track', 'PageView');
    }
    const ga = String(cfg.ga4 || '').trim();
    if (/^G-[A-Z0-9]+$/i.test(ga)) {
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ga; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', ga);
    }
  }

  /* ---------- palavra girando no título ---------- */
  function giro() {
    const b = $('.giro-ativo'); if (!b) return;
    const palavras = (cfg.palavras && cfg.palavras.length ? cfg.palavras : ['vender', 'viralizar', 'performar']);
    let i = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInterval(() => {
      b.classList.remove('entra'); b.classList.add('sai');
      setTimeout(() => { i = (i + 1) % palavras.length; b.textContent = palavras[i]; b.classList.remove('sai'); void b.offsetWidth; b.classList.add('entra'); }, 330);
    }, 2400);
  }

  /* ---------- vídeos ---------- */
  function tipoLink(u) {
    u = String(u || '');
    if (/instagram\.com\/(reel|p|tv)\//i.test(u)) return 'instagram';
    if (/youtu\.?be/i.test(u)) return 'youtube';
    if (/drive\.google\.com/i.test(u)) return 'drive';
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u) || /supabase\.co\/storage/i.test(u)) return 'arquivo';
    return 'link';
  }
  function embed(u) {
    const t = tipoLink(u);
    if (t === 'instagram') { const m = u.match(/instagram\.com\/(reel|p|tv)\/([^/?#]+)/i); return m ? 'https://www.instagram.com/' + (m[1] === 'tv' ? 'p' : m[1]) + '/' + m[2] + '/embed/' : null; }
    if (t === 'youtube') { const m = u.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{6,})/); return m ? 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0&playsinline=1' : null; }
    if (t === 'drive') { const m = u.match(/\/d\/([\w-]+)/) || u.match(/id=([\w-]+)/); return m ? 'https://drive.google.com/file/d/' + m[1] + '/preview' : null; }
    return null;
  }
  const IC_PLAY = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5v14l12-7z"/></svg>';
  function cartaoVideo(v, depo) {
    const arquivo = tipoLink(v.video_url) === 'arquivo';
    const capa = v.capa_url ? '<img src="' + esc(v.capa_url) + '" alt="" loading="lazy">'
      : arquivo ? '<video src="' + esc(v.video_url) + '#t=0.5" muted playsinline preload="metadata" data-previa></video>' : '';
    return '<button class="v-card aparece" type="button" data-video="' + esc(v.video_url || v.link || '') + '" aria-label="Assistir ' + esc(v.titulo || 'vídeo') + '">' + capa +
      (v.categoria || depo ? '<span class="v-tag">' + esc(depo ? 'Depoimento' : v.categoria) + '</span>' : '') +
      '<span class="v-play">' + IC_PLAY + '</span>' +
      '<span class="v-info"><b>' + esc(v.titulo || v.cliente_nome || '') + '</b>' +
        (v.cliente_arroba ? '<small>@' + esc(String(v.cliente_arroba).replace(/^@/, '')) + '</small>' : v.cliente_nome && v.titulo ? '<small>' + esc(v.cliente_nome) + '</small>' : '') + '</span></button>';
  }
  function abrirVideo(u) {
    if (!u) return;
    const cx = $('#player-cx'), p = $('#player');
    const e = embed(u);
    if (tipoLink(u) === 'arquivo') cx.innerHTML = '<video src="' + esc(u) + '" controls autoplay playsinline></video>';
    else if (e) cx.innerHTML = '<iframe src="' + esc(e) + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen loading="lazy"></iframe>';
    else { window.open(u, '_blank', 'noopener'); return; }
    p.hidden = false; document.body.style.overflow = 'hidden';
    evento('ViewContent', { tipo: 'video' });
  }
  function fecharVideo() { $('#player').hidden = true; $('#player-cx').innerHTML = ''; document.body.style.overflow = ''; }

  /* previa: o vídeo do cartão toca mudo quando aparece na tela */
  function previas() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target; if (e.isIntersecting) { v.play().catch(() => {}); } else v.pause();
    }), { threshold: .6 });
    document.querySelectorAll('video[data-previa]').forEach(v => { v.loop = true; io.observe(v); });
  }

  /* ---------- seções que vêm do sistema ---------- */
  const SERVICOS_PADRAO = [
    { icone: '🎬', titulo: 'Vídeos para Reels e TikTok', texto: 'Conteúdo vertical com gancho forte, ritmo e legenda, feito para prender e engajar.' },
    { icone: '🎯', titulo: 'Criativos para anúncios', texto: 'Versões pensadas para tráfego pago: testes de gancho, chamadas e formatos que convertem.' },
    { icone: '🎥', titulo: 'Gravação profissional', texto: 'Equipe, câmera, luz e direção. Você só aparece; a gente cuida do resto.' },
    { icone: '✂️', titulo: 'Edição e pós-produção', texto: 'Cortes no tempo das redes, trilha, legendas e identidade visual da sua marca.' },
    { icone: '📝', titulo: 'Roteiro e estratégia', texto: 'Linha editorial e roteiros que falam com o seu público e levam à venda.' },
    { icone: '📈', titulo: 'Gestão de redes', texto: 'Planejamento, publicação e acompanhamento dos resultados mês a mês.' }
  ];
  function pintar(itens) {
    const de = t => itens.filter(i => i.tipo === t);
    /* serviços */
    const serv = de('servico').length ? de('servico') : SERVICOS_PADRAO;
    $('#servicos-lista').innerHTML = serv.map(s => '<article class="serv aparece"><div class="serv-ic" aria-hidden="true">' + esc(s.icone || '✦') + '</div><h3>' + esc(s.titulo) + '</h3>' + (s.texto ? '<p>' + esc(s.texto) + '</p>' : '') + '</article>').join('');
    /* vídeos */
    const vids = de('video');
    const cats = [...new Set(vids.map(v => v.categoria).filter(Boolean))];
    $('#videos').innerHTML = vids.map(v => cartaoVideo(v)).join('');
    $('#videos-vazio').hidden = vids.length > 0;
    if (cats.length > 1) {
      const f = $('#filtros'); f.hidden = false;
      f.innerHTML = '<button class="on" data-cat="">Todos</button>' + cats.map(c => '<button data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('');
      f.querySelectorAll('button').forEach(b => b.onclick = () => {
        f.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        $('#videos').innerHTML = vids.filter(v => !b.dataset.cat || v.categoria === b.dataset.cat).map(v => cartaoVideo(v)).join('');
        aparecer(); previas();
      });
    }
    /* vídeo do celular no topo: o destaque (ou o primeiro em arquivo) */
    const topo = vids.find(v => v.destaque && tipoLink(v.video_url) === 'arquivo') || vids.find(v => tipoLink(v.video_url) === 'arquivo');
    if (topo && !matchMedia('(prefers-reduced-motion: reduce)').matches) $('#heroi-video').innerHTML = '<video src="' + esc(topo.video_url) + '" autoplay muted loop playsinline></video>';
    /* depoimentos: em vídeo e em texto */
    const dep = de('depoimento');
    if (dep.length) {
      $('#depoimentos').hidden = false;
      $('#depo-lista').innerHTML = dep.map(d => d.video_url ? cartaoVideo(d, true)
        : '<figure class="depo-tx aparece"><q>' + esc(d.texto) + '</q><figcaption class="depo-quem"><span class="depo-av">' + esc((d.cliente_nome || '?').charAt(0)) + '</span><span><b>' + esc(d.cliente_nome || '') + '</b>' +
          (d.cliente_arroba ? '<small>@' + esc(String(d.cliente_arroba).replace(/^@/, '')) + '</small>' : d.titulo ? '<small>' + esc(d.titulo) + '</small>' : '') + '</span></figcaption></figure>').join('');
    }
    /* clientes (logos ou nomes), em faixa correndo */
    const cli = de('cliente');
    if (cli.length) {
      $('#clientes').hidden = false;
      const um = cli.map(c => c.capa_url ? '<img src="' + esc(c.capa_url) + '" alt="' + esc(c.cliente_nome || c.titulo || '') + '" loading="lazy">' : '<span>' + esc(c.cliente_nome || c.titulo) + '</span>').join('');
      $('#clientes-lista').innerHTML = um + um;
    }
  }
  function pintarConfig() {
    document.querySelectorAll('[data-cfg]').forEach(el => { const v = cfg[el.dataset.cfg]; if (v) el.textContent = v; });
    if (cfg.titulo && !/vender\.?$/i.test(cfg.titulo)) { /* título próprio: sem a palavra girando */
      const h = $('.heroi h1'); if (h) h.textContent = cfg.titulo;
    }
    const reg = Array.isArray(cfg.regioes) ? cfg.regioes.filter(Boolean) : [];
    if (reg.length) { $('#regioes').hidden = false; $('#regioes-lista').innerHTML = reg.map(r => '<li>' + esc(r) + '</li>').join(''); }
    const num = Array.isArray(cfg.numeros) ? cfg.numeros.filter(n => n && n.valor) : [];
    if (num.length) { $('#numeros').hidden = false; $('#numeros-lista').innerHTML = num.map(n => '<div><b>' + esc(n.valor) + '</b><small>' + esc(n.rotulo || '') + '</small></div>').join(''); }
    ligarWpp();
  }

  /* ---------- aparecer ao rolar ---------- */
  let io2 = null;
  function aparecer() {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('.aparece').forEach(e => e.classList.add('visivel')); return; }
    io2 = io2 || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); io2.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.aparece:not(.visivel)').forEach(e => io2.observe(e));
  }

  /* ---------- formulário ---------- */
  function ligarForm() {
    const f = $('#form'), msg = $('#form-msg');
    const tel = f.querySelector('[name="whatsapp"]');
    tel.addEventListener('input', () => {
      const d = tel.value.replace(/\D/g, '').slice(0, 13);
      const n = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
      tel.value = n.length > 6 ? '(' + n.slice(0, 2) + ') ' + n.slice(2, n.length - 4) + '-' + n.slice(-4) : n.length > 2 ? '(' + n.slice(0, 2) + ') ' + n.slice(2) : n;
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      msg.className = 'form-msg'; msg.textContent = '';
      if ((d.nome || '').trim().length < 2) { msg.className = 'form-msg erro'; msg.textContent = 'Coloque o seu nome.'; return; }
      if ((d.whatsapp || '').replace(/\D/g, '').length < 10) { msg.className = 'form-msg erro'; msg.textContent = 'Coloque o WhatsApp com DDD.'; return; }
      const bt = f.querySelector('button'); bt.disabled = true; bt.textContent = 'Enviando…';
      try {
        const r = await fetch(SB + '/rest/v1/rpc/site_lead_enviar', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, H),
          body: JSON.stringify({ p_nome: d.nome, p_whatsapp: d.whatsapp, p_empresa: d.empresa || null, p_cidade: d.cidade || null, p_interesse: d.interesse || null, p_mensagem: d.mensagem || null, p_origem: origem }) });
        if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || 'falhou'); }
        evento('Lead', { interesse: d.interesse || '' });
        msg.className = 'form-msg ok'; msg.textContent = 'Recebido! Abrindo o WhatsApp para você falar com o comercial…';
        const resumo = 'Sou ' + d.nome.trim() + (d.empresa ? ', da ' + d.empresa.trim() : '') + (d.cidade ? ' (' + d.cidade.trim() + ')' : '') + '.' + (d.interesse ? ' Tenho interesse em: ' + d.interesse + '.' : '');
        setTimeout(() => { window.open(linkWpp(resumo), '_blank', 'noopener'); }, 700);
        f.reset();
      } catch (err) {
        msg.className = 'form-msg erro';
        msg.innerHTML = 'Não foi possível enviar agora. <a href="' + esc(linkWpp()) + '" target="_blank" rel="noopener">Fale direto no WhatsApp</a>.';
      }
      bt.disabled = false; bt.textContent = 'Enviar e falar com o comercial';
    });
  }

  /* ---------- topo e menu ---------- */
  function ligarTopo() {
    const t = $('#topo'), b = $('#menu-bt'), m = $('#menu');
    const rolar = () => t.classList.toggle('rolou', scrollY > 20);
    addEventListener('scroll', rolar, { passive: true }); rolar();
    b.onclick = () => { const a = !m.classList.contains('aberto'); m.classList.toggle('aberto', a); b.setAttribute('aria-expanded', String(a)); };
    m.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { m.classList.remove('aberto'); b.setAttribute('aria-expanded', 'false'); }));
  }

  /* ---------- começo ---------- */
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-video]'); if (c) { e.preventDefault(); abrirVideo(c.dataset.video); }
  });
  $('#player-x').onclick = fecharVideo;
  $('#player').addEventListener('click', e => { if (e.target.id === 'player') fecharVideo(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#player').hidden) fecharVideo(); });
  $('#ano').textContent = new Date().getFullYear();
  ligarTopo(); ligarForm(); ligarWpp();
  document.querySelectorAll('.secao-cab, .passos li, .contato-tx, .form').forEach(e => e.classList.add('aparece'));
  pintar([]); aparecer(); giro();

  Promise.all([
    fetch(SB + '/rest/v1/site_config?id=eq.1&select=dados', { headers: H }).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(SB + '/rest/v1/site_itens?publicado=eq.true&select=*&order=ordem.asc,created_at.desc', { headers: H }).then(r => r.ok ? r.json() : []).catch(() => [])
  ]).then(([c, itens]) => {
    if (c && c[0] && c[0].dados) cfg = Object.assign(cfg, c[0].dados);
    pintarConfig(); rastreadores(); pintar(itens || []); aparecer(); previas();
  });
})();
