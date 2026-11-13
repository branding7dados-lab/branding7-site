'use client';
/* Branding7 — página única. Linguagem de cinema: abertura em tela cheia
   com a marca gigante, projetos em tela cheia que empilham ao rolar,
   processo preso na rolagem e navegação em pílula flutuante. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Cinema from './Cinema';
import { gpuBoa } from '@/lib/gpu';
import { capaDe, carregar, CFG_PADRAO, SERVICOS_PADRAO, linkWpp, tipoLink, embed, enviarLead, origemDaVisita, evento, registrar, horariosLivres, agendar } from '@/lib/dados';
import { T } from '@/lib/textos';
import { Cookies, rastreadores } from './Casca';

/* a câmera 3D chega só no navegador e só quando a página já abriu */
const Celular3D = dynamic(() => import('./Celular3D'), { ssr: false });

const Seta = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Zap = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.6l4.9-1.3A9.8 9.8 0 1 0 12 2.2zm4.4 11.8c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.2z" /></svg>);
const Play = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>);

function Botao({ href, children, claro, onClick, alvo }) {
  return (
    <a className={'pilula ima' + (claro ? ' clara' : '')} href={href} onClick={onClick} target={alvo ? '_blank' : undefined} rel={alvo ? 'noopener' : undefined}>
      <span>{children}</span><i><Seta /></i>
    </a>
  );
}

/* palavra que gira no título */
function Giro({ palavras }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI(x => (x + 1) % palavras.length), 2300);
    return () => clearInterval(t);
  }, [palavras.length]);
  return <span className="giro"><b key={i}>{palavras[i]}</b></span>;
}

/* vídeo de fundo que só toca quando aparece */
function VideoFundo({ src, capa }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current; if (!v || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: .25 });
    io.observe(v); return () => io.disconnect();
  }, [src]);
  if (src && tipoLink(src) === 'arquivo') return <video ref={ref} className="fundo-midia" src={src} poster={capa || undefined} muted loop playsInline preload="metadata" />;
  if (capa) return <img className="fundo-midia" src={capa} alt="" loading="lazy" />;
  return null;
}

export default function Site({ lang = 'pt' }) {
  const t = T[lang], en = lang === 'en';
  const [cfg, setCfg] = useState(CFG_PADRAO);
  const [itens, setItens] = useState([]);
  const [player, setPlayer] = useState(null);
  const [ativo, setAtivo] = useState('inicio');

  const [numAuto, setNumAuto] = useState(null);
  useEffect(() => { carregar().then(({ cfg, itens, numeros }) => { setCfg(cfg); setItens(itens); setNumAuto(numeros); rastreadores(cfg); }); }, []);
  /* textos digitados no sistema são em português: no /en ficam os padrões em inglês */
  const txt = en ? {} : cfg;
  useEffect(() => { document.documentElement.lang = t.lang; }, [t.lang]);

  /* contagem própria: visita e "engajou" (rolou metade da página) */
  useEffect(() => {
    registrar('PageView');
    let foi = false;
    const rolar = () => {
      if (foi) return;
      const h = document.documentElement;
      if ((scrollY + innerHeight) / Math.max(1, h.scrollHeight) > .5) { foi = true; evento('Engajou'); removeEventListener('scroll', rolar); }
    };
    addEventListener('scroll', rolar, { passive: true });
    return () => removeEventListener('scroll', rolar);
  }, []);

  const de = t => itens.filter(i => i.tipo === t);
  const videos = de('video'), depo = de('depoimento'), clientes = de('cliente');
  const servicos = !en && de('servico').length ? de('servico') : en ? SERVICOS_EN : SERVICOS_PADRAO;
  const palavras = (txt.palavras && txt.palavras.length ? txt.palavras : t.palavras);
  const heroi = videos.find(v => v.destaque && tipoLink(v.video_url) === 'arquivo') || videos.find(v => tipoLink(v.video_url) === 'arquivo');
  const wpp = useMemo(() => linkWpp(cfg), [cfg]);
  const insta = 'https://www.instagram.com/' + String(cfg.instagram || 'b7.agencia').replace(/^@/, '') + '/';
  const regioes = (cfg.regioes || []).filter(Boolean);
  /* números: os digitados em Site → Página; sem eles, os reais do sistema */
  const redondo = n => n >= 100 ? '+' + Math.floor(n / 10) * 10 : n > 0 ? '+' + n : null;
  const numerosManuais = (txt.numeros || []).filter(n => n && n.valor);
  const numeros = numerosManuais.length ? numerosManuais : numAuto ? [
    { valor: redondo(numAuto.videos), rotulo: t.num.videos },
    { valor: redondo(numAuto.posts), rotulo: t.num.posts },
    { valor: redondo(numAuto.artes), rotulo: t.num.artes },
    { valor: numAuto.marcas > 0 ? String(numAuto.marcas) : null, rotulo: t.num.marcas }
  ].filter(n => n.valor) : [];
  /* tela do celular 3D: vídeos enviados (arquivo) e, depois, os clientes do site */
  const midiasCelular = useMemo(() => {
    const vids = itens.filter(i => (i.tipo === 'video' || i.tipo === 'depoimento') && (tipoLink(i.video_url) === 'arquivo' || i.capa_url))
      .map(i => tipoLink(i.video_url) === 'arquivo'
        ? { video: i.video_url, nome: i.cliente_nome || i.titulo, arroba: i.cliente_arroba, titulo: i.titulo, avatar: i.avatar_url }
        : { capa: i.capa_url, nome: i.cliente_nome || i.titulo, arroba: i.cliente_arroba, titulo: i.titulo, avatar: i.avatar_url });
    const cli = itens.filter(i => i.tipo === 'cliente' && i.capa_url).map(i => ({ logo: i.capa_url, nome: i.cliente_nome || i.titulo }));
    return vids.concat(cli).slice(0, 14);
  }, [itens]);

  /* personalização feita no Sistema B7 → Site → Página (vazio = padrão) */
  const mostra = k => !(cfg.secoes && cfg.secoes[k] === false);
  const lista = (v, pad) => (Array.isArray(v) && v.filter(Boolean).length ? v.filter(Boolean) : pad);
  const fita = lista(txt.fita, t.fita).map(w => String(w).toUpperCase());
  const manifesto = lista(txt.manifesto, t.manifesto);
  const notas = lista(txt.notas, t.notas);
  const cta = txt.cta || t.cta;
  const sobreTexto = txt.sobre_texto ? String(txt.sobre_texto).split(/\n\s*\n/).map(x => x.trim()).filter(Boolean) : null;
  const insta_ = () => evento('Instagram');
  /* menu: só as seções que existem no site */
  const NAV = [['inicio'], ['sobre', mostra('sobre')], ['trabalhos', mostra('trabalhos')], ['processo', mostra('processo')],
    ['servicos', mostra('servicos')], ['depoimentos', mostra('depoimentos') && itens.some(i => i.tipo === 'depoimento')],
    ['clientes', mostra('clientes') && itens.some(i => i.tipo === 'cliente')], ['faq', mostra('faq')], ['contato']]
    .filter(n => n[1] !== false).map(n => [n[0], t.nav[n[0]]]);
  const NAV_PILULA = NAV.filter(([id]) => ['inicio', 'trabalhos', 'processo', 'servicos', 'depoimentos'].includes(id));

  /* seção ativa na pílula + aparecer ao rolar */
  useEffect(() => {
    const ids = ['inicio', 'sobre', 'trabalhos', 'processo', 'servicos', 'depoimentos', 'clientes', 'faq', 'contato'];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setAtivo(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); io2.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.aparece:not(.visivel)').forEach(el => {
      /* irmãos que aparecem juntos entram em cascata */
      const irmaos = [...el.parentElement.children].filter(x => x.classList.contains('aparece'));
      el.style.setProperty('--atraso', (Math.min(irmaos.indexOf(el), 6) * 90) + 'ms');
      io2.observe(el);
    });
    return () => { io.disconnect(); io2.disconnect(); };
  }, [itens]);

  /* movimento ao rolar: um único laço que escreve variáveis CSS
     --rol  progresso da página (barra no topo)   --vel  velocidade da rolagem
     .heroi --hy (0 a 1 saindo)   .manifesto --mp   .projeto --sai (coberto pelo próximo) */
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const raiz = document.documentElement;
    let raf = 0, yAnt = scrollY, vel = 0;
    const barra = document.querySelector('.barra-rolagem'), fitaEl = document.querySelector('.fita');
    const h = document.querySelector('.heroi'), m = document.querySelector('.manifesto');
    const ult = {};
    /* escreve só quando muda (cada escrita custa um recálculo de estilo) */
    const poe = (el, k, v) => { if (!el || ult[k] === v) return; ult[k] = v; el.style.setProperty(k.split('|')[0], v); };
    const passo = () => {
      raf = 0;
      /* 1) só leituras */
      const y = scrollY, alt = raiz.scrollHeight - innerHeight, vh = innerHeight;
      const rh = h && h.getBoundingClientRect(), rm = m && m.getBoundingClientRect();
      vel += ((y - yAnt) - vel) * .2; yAnt = y;
      /* 2) só escritas */
      if (barra) barra.style.transform = 'scaleX(' + (alt > 0 ? y / alt : 0).toFixed(4) + ')';
      poe(fitaEl, '--vel|f', Math.abs(vel) > .5 ? Math.max(-1, Math.min(1, vel / 60)).toFixed(2) : '0');
      if (rh && rh.bottom > -50) poe(h, '--hy|h', Math.min(1, Math.max(0, -rh.top / rh.height)).toFixed(3));
      if (rm && rm.top < vh && rm.bottom > 0) poe(m, '--mp|m', Math.min(1, Math.max(0, (vh - rm.top) / (vh + rm.height * .45))).toFixed(3));
      if (Math.abs(vel) > .5) raf = requestAnimationFrame(passo);
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(passo); };
    addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); passo();

    /* partes fora da tela pausam as animações (classe .fora) */
    const ioFora = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('fora', !e.isIntersecting)), { rootMargin: '80px' });
    document.querySelectorAll('.heroi, .fita, .clientes, .trabalhos, .processo').forEach(el => ioFora.observe(el));

    /* mouse: luz que segue o cursor nos cartões, inclinação e botões "ímã" */
    const fino = matchMedia('(pointer: fine)').matches;
    const mover = e => {
      const alvo = e.target.closest && e.target.closest('.luz, .ima, .inclina'); if (!alvo) return;
      const r = alvo.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      alvo.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); alvo.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (alvo.classList.contains('ima')) alvo.style.transform = `translate(${((x - .5) * 10).toFixed(1)}px, ${((y - .5) * 8).toFixed(1)}px)`;
      if (alvo.classList.contains('inclina')) alvo.style.transform = `perspective(900px) rotateX(${((.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - .5) * 8).toFixed(2)}deg)`;
    };
    const sair = e => { const a = e.target.closest && e.target.closest('.ima, .inclina'); if (a && !a.contains(e.relatedTarget)) a.style.transform = ''; };
    if (fino) { document.addEventListener('pointermove', mover, { passive: true }); document.addEventListener('pointerout', sair, { passive: true }); }

    /* números que contam ao aparecer */
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, txt = el.dataset.conta || '', mt = txt.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/); if (!mt) return;
      const fim = parseFloat(mt[2].replace(',', '.')), dec = (mt[2].split(/[.,]/)[1] || '').length, t0 = performance.now();
      const anda = agora => { const k = Math.min(1, (agora - t0) / 1600), v = fim * (1 - Math.pow(1 - k, 4));
        el.textContent = mt[1] + v.toFixed(dec).replace('.', ',') + mt[3]; if (k < 1) requestAnimationFrame(anda); };
      requestAnimationFrame(anda);
    }), { threshold: .6 });
    document.querySelectorAll('[data-conta]').forEach(el => io.observe(el));
    return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); cancelAnimationFrame(raf); io.disconnect(); ioFora.disconnect();
      document.removeEventListener('pointermove', mover); document.removeEventListener('pointerout', sair); };
  }, [itens, cfg, numAuto]);

  /* links internos (#contato, #trabalhos...) rolam até a seção sem deixar
     o "#..." na barra de endereço */
  useEffect(() => {
    const limpa = () => { if (location.hash) history.replaceState(null, '', location.pathname + location.search); };
    const ir = id => { const el = document.getElementById(id); if (!el) return false;
      if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.6 });
      else el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      return true; };
    const clique = e => {
      const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.button) return;
      const id = a.getAttribute('href').slice(1); if (!id) return;
      if (ir(id)) { e.preventDefault(); limpa(); }
    };
    document.addEventListener('click', clique);
    /* quem chega com um link tipo branding7.com.br/#contato vai até lá e o endereço fica limpo */
    if (location.hash) { const id = decodeURIComponent(location.hash.slice(1)); setTimeout(() => { ir(id); limpa(); }, 400); }
    return () => document.removeEventListener('click', clique);
  }, []);

  /* processo: a rolagem dentro da seção vira --p (0 a 1) */
  useEffect(() => {
    const sec = document.getElementById('processo'); if (!sec) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      const cel = matchMedia('(max-width: 640px)').matches;
      const p = cel ? Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)))
                    : Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      const pv = p.toFixed(3);
      if (pv !== medir.ult) { medir.ult = pv; sec.style.setProperty('--p', pv); const f = p < .28 ? '0' : '1'; if (sec.dataset.fase !== f) sec.dataset.fase = f; }
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); medir();
    return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); cancelAnimationFrame(raf); };
  }, []);

  /* o 3D (three.js, o arquivo mais pesado) só é baixado quando a seção do
     celular está chegando — não pesa na abertura do site */
  const centroRef = useRef(null);
  const [perto3d, setPerto3d] = useState(false);
  useEffect(() => {
    const el = centroRef.current; if (!el || perto3d) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPerto3d(true); io.disconnect(); } }, { rootMargin: '1200px 0px' });
    io.observe(el); return () => io.disconnect();
  }, [perto3d, cfg]);

  const progressoProcesso = useCallback(() => {
    const sec = typeof document !== 'undefined' && document.getElementById('processo');
    return sec ? parseFloat(sec.style.getPropertyValue('--p')) || 0 : 0;
  }, []);

  /* player estilo Reels: abre a lista de vídeos do site e passa com seta,
     teclado ou deslizando; mostra cliente, números e o botão de orçamento */
  const tocaveis = useMemo(() => itens.filter(i => (i.tipo === 'video' || i.tipo === 'depoimento') && i.video_url &&
    (tipoLink(i.video_url) === 'arquivo' || embed(i.video_url))), [itens]);
  const abrir = u => {
    if (!u) return;
    if (tipoLink(u) !== 'arquivo' && !embed(u)) { window.open(u, '_blank', 'noopener'); return; }
    const k = tocaveis.findIndex(i => i.video_url === u);
    setPlayer(k >= 0 ? { i: k } : { url: u }); evento('ViewContent', { tipo: 'video' });
  };
  const passar = d => setPlayer(p => p && p.i != null && tocaveis.length ? { i: (p.i + d + tocaveis.length) % tocaveis.length } : p);
  useEffect(() => {
    if (window.__lenis) { player ? window.__lenis.stop() : window.__lenis.start(); }
    document.body.style.overflow = player ? 'hidden' : '';
    const k = e => { if (e.key === 'Escape') setPlayer(null); if (e.key === 'ArrowRight' || e.key === 'ArrowDown') passar(1); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') passar(-1); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [player, tocaveis.length]);

  const PASSOS = (Array.isArray(txt.passos) && txt.passos.length) ? txt.passos.slice(0, 6).map(x => [x.t, x.d]) : t.passos;
  const FAQ = (Array.isArray(txt.faq) && txt.faq.length) ? txt.faq.map(x => [x.p, x.r]) : t.faq(regioes);

  return (
    <>
      <div className="barra-rolagem" aria-hidden="true" />
      {/* ============ ABERTURA ============ */}
      <section className="heroi" id="inicio">
        <div className="heroi-fundo" aria-hidden="true">
          <div className="aurora"><i /><i /><i /></div>
          <MuroReels itens={itens} heroi={heroi} />
          <div className="grao" />
        </div>
        <Visor />
        <header className="heroi-topo">
          <img src="/marca/logo-white-300.png" alt="Branding7" width="132" height="52" />
          <span className="topo-dir">
            <a className="topo-lang" href={t.outra} hrefLang={en ? 'pt-BR' : 'en'} aria-label={t.outraRot}>{t.outraNome}</a>
            <a className="topo-link" href={insta} target="_blank" rel="noopener" onClick={insta_}>@{String(cfg.instagram || 'b7.agencia').replace(/^@/, '')}</a>
          </span>
        </header>
        <div className="heroi-base">
          <h1 aria-label={t.tituloAria(palavras[0] || '')}>
            <span className="h1-l" aria-hidden="true"><Letras texto={t.titulo1} de={0} /></span>
            <span className="h1-l" aria-hidden="true"><Letras texto={t.titulo2} de={15} />{' '}<Giro palavras={palavras} />.</span>
          </h1>
          <div className="heroi-lado">
            <p>{txt.subtitulo || t.subtitulo}</p>
            <div className="heroi-acoes">
              <Botao href={wpp} alvo onClick={() => evento('Contact', { canal: 'whatsapp' })} claro>{t.orcamento}</Botao>
              {mostra('trabalhos') && <a className="pilula-simples" href="#trabalhos">{t.trabalhosBt}</a>}
            </div>
          </div>
        </div>
      </section>

      {/* fita de palavras */}
      <div className="fita" aria-hidden="true"><div className="fita-in">{Array.from({ length: 2 }).map((_, k) => <span key={k}>{fita.map((w, i) => <b key={i}>{w}<em>✦</em></b>)}</span>)}</div></div>

      {/* ============ MANIFESTO ============ */}
      <section className="manifesto">
        <div className="manifesto-luz" aria-hidden="true" />
        <img className="manifesto-simbolo" src="/marca/symbol-white.png" alt="" aria-hidden="true" width="199" height="236" />
        <div className="manifesto-tx aparece">
          <h2 className="manifesto-h">{(() => { let n = 0; const total = manifesto.join(' ').split(/\s+/).length;
            return manifesto.map((l, k) => <span key={k} className={'m-linha' + (k === manifesto.length - 1 ? ' fim' : '')}>{l.split(/\s+/).map((w, j) =>
              <span key={j} className="m-pal" style={{ '--i': n++, '--n': total }}>{w} </span>)}</span>); })()}</h2>
        </div>
        {notas[0] && <p className="nota n1 aparece">{notas[0]}</p>}
        {notas[1] && <p className="nota n2 aparece">{notas[1]}</p>}

      </section>

      {/* ============ NÚMEROS ============ */}
      {numeros.length > 0 && (
        <section className="numeros" aria-label={t.numerosAria}>
          <div className="lim numeros-in">
            {numeros.slice(0, 4).map((n, k) => (
              <div className="numero aparece" key={k}>
                <b data-conta={n.valor}>{n.valor}</b>
                <small>{n.rotulo}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ SOBRE (claro) ============ */}
      {mostra('sobre') && <section className="sobre" id="sobre">
        <div className="lim sobre-novo">
          <div className="sobre-topo aparece">
            <span className="sobre-cartao">
              <span className="sobre-av"><img src="/marca/symbol-white.png" alt="" width="40" height="47" /></span>
              <span><b>Branding7</b><small>{t.sobreCartao}</small></span>
            </span>
            <span className="sobre-linha" />
          </div>
          <h2 className="sobre-titulo aparece">{txt.sobre_titulo ? txt.sobre_titulo : t.sobreTitulo}</h2>
          <TextoAcende paragrafos={sobreTexto || t.sobreTexto} />
          <div className="sobre-pe aparece">
            <Botao href={wpp} alvo onClick={() => evento('Contact', { canal: 'whatsapp' })}>{cta}</Botao>
            <a className="pilula-simples escura" href={t.sobrePag}>{t.conhecaEquipe}</a>
            <span className="sobre-selos">{t.selos.map(x => <span key={x}>{x}</span>)}</span>
          </div>
        </div>
      </section>}

      {/* ============ TRABALHOS: Reels lado a lado ============ */}
      {mostra('trabalhos') && <section className="trabalhos" id="trabalhos">
        {videos.length > 0 ? <Obras videos={videos} abrir={abrir} insta={insta} insta_={insta_} t={t} /> : (
          <div className="trabalhos-vazio lim aparece">
            <p className="rotulo">{t.projetos}</p>
            <h2>{t.projetosVazio}</h2>
            <Botao href={insta} alvo onClick={insta_}>{t.verInsta}</Botao>
            {midiasCelular.length > 0 && <div className="trilho-reels" aria-hidden="true"><div className="trilho-in">{[0, 1].map(r => midiasCelular.map((m, k) => <Reel key={r + '-' + k} m={m} />))}</div></div>}
          </div>
        )}
      </section>}

      {/* ============ PROCESSO (preso na rolagem) ============ */}
      {mostra('processo') && <section className="processo" id="processo">
        <div className="processo-palco">
          <div className="processo-ceu" aria-hidden="true" />
          <p className="rotulo centro">{t.processoRot}</p>
          <h2 className="processo-titulo" aria-label={t.processoAria}>{t.processoT[0]}<br />{t.processoT[1]}<br /><em>{t.processoT[2]}</em></h2>
          <div className="processo-centro" ref={centroRef}>{perto3d && <Celular3D progresso={progressoProcesso} midias={midiasCelular.filter(m => m.video || m.capa)} />}</div>
          <ol className="processo-passos">
            {PASSOS.map(([t, d], k) => (
              <li key={t} style={{ '--k': k }}><span>{String(k + 1).padStart(2, '0')}</span><b>{t}</b><p>{d}</p></li>
            ))}
          </ol>
          <p className="processo-pe">{t.processoPe}</p>
        </div>
      </section>}

      {/* ============ SERVIÇOS ============ */}
      {mostra('servicos') && <section className="servicos" id="servicos">
        <div className="lim">
          <p className="rotulo aparece">{t.servicosRot}</p>
          <h2 className="aparece">{t.servicosTit}</h2>
          <div className="servicos-lista">
            {servicos.map((s, k) => (
              <article className="servico aparece luz" key={s.id || k}>
                <span className="servico-n">{/^\d+$/.test(String(s.icone || '')) ? s.icone : (s.icone || String(k + 1).padStart(2, '0'))}</span>
                <h3>{s.titulo}</h3>
                {s.texto && <p>{s.texto}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>}

      {/* ============ DEPOIMENTOS ============ */}
      {mostra('depoimentos') && depo.length > 0 && (
        <section className="depoimentos" id="depoimentos">
          <div className="lim">
            <p className="rotulo aparece">{t.depoRot}</p>
            <h2 className="aparece">{t.depoTit}</h2>
            <div className="depo-grade">
              {depo.map((d, k) => <DepoCartao key={d.id} d={d} k={k} t={t} abrir={abrir} />)}
              <div className="depo-cta depo2 aparece">
                <span className="depo-cta-aspas">“</span>
                <b>{t.depoCtaB}</b>
                <p>{t.depoCtaP}</p>
                <a className="pilula" href="#contato"><span>{t.depoCtaBt}</span><i><Seta /></i></a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ CLIENTES ============ */}
      {mostra('clientes') && clientes.length > 0 && (
        <section className="clientes" id="clientes" aria-label={t.clientesAria}>
          <p className="rotulo centro">{t.clientesRot}</p>
          <div className="clientes-faixa"><div className="clientes-in">
            {[0, 1].map(r => clientes.map(c => c.capa_url
              ? <figure className="cli-logo" key={r + c.id} title={c.cliente_nome || c.titulo || ''}><img src={c.capa_url} alt={r ? '' : (c.cliente_nome || c.titulo || '')} /></figure>
              : <span className="cli-nome" key={r + c.id}>{c.cliente_nome || c.titulo}</span>))}
          </div></div>
        </section>
      )}

      {/* ============ REGIÕES ============ */}
      {mostra('regioes') && regioes.length > 0 && (
        <section className="regioes">
          <div className="lim regioes-in">
            <div><p className="rotulo aparece">{t.regioesRot}</p><h2 className="aparece">{t.regioesTit}</h2><p className="aparece">{t.regioesP}</p></div>
            <ul>{regioes.map(r => <li key={r} className="aparece">{r}</li>)}</ul>
          </div>
        </section>
      )}

      {/* ============ PERGUNTAS ============ */}
      {mostra('faq') && <section className="faq" id="faq">
        <div className="lim faq-in">
          <div><p className="rotulo aparece">{t.faqRot}</p><h2 className="aparece">{t.faqTit}</h2></div>
          <div className="faq-lista">
            {FAQ.map(([p, r], k) => (
              <details key={k} className="aparece"><summary>{p}<i aria-hidden="true">+</i></summary><p>{r}</p></details>
            ))}
          </div>
        </div>
      </section>}

      {/* ============ CONTATO ============ */}
      <Contato cfg={cfg} wpp={wpp} t={t} txt={txt} />

      <footer className="rodape">
        <div className="creditos" aria-hidden="true"><span>BRANDING</span><span className="c7">7</span></div>
        <div className="lim rodape-in">
          <img src="/marca/logo-white-300.png" alt="Branding7" width="120" height="47" />
          <nav aria-label={t.rodapeAria}>
            <a href={t.sobrePag}>{t.sobreNos}</a>
            <a href={insta} target="_blank" rel="noopener" onClick={insta_}>Instagram</a>
            <a href={wpp} target="_blank" rel="noopener">WhatsApp</a>
            <a href="https://sistema.branding7.com.br/">{t.areaCliente}</a>
            <a href={t.privPag}>{t.privacidade}</a>
            <a href={t.outra} hrefLang={en ? 'pt-BR' : 'en'}>{t.outraRot}</a>
          </nav>
          <small>© {new Date().getFullYear()} Branding7 · Núcleo7</small>
        </div>
      </footer>

      <MenuCelular wpp={wpp} insta={insta} nav={NAV} t={t} />
      <Cinema />
      <Cookies t={t} cfg={cfg} />

      {/* navegação em pílula flutuante */}
      <nav className="pilula-nav" aria-label={t.navAria}>
        <img src="/marca/symbol-white.png" alt="" width="20" height="24" />
        {NAV_PILULA.map(([id, r]) =>
          <a key={id} href={'#' + id} className={ativo === id ? 'on' : ''}>{r}</a>)}
        <a className="pn-entrar" href="https://sistema.branding7.com.br/"><IcEntrar />{t.entrar}</a>
        <a className="pn-cta" href="#contato">{t.orcCurto}<i><Seta /></i></a>
      </nav>

      <BalaoWpp wpp={wpp} cfg={cfg} t={t} />
      <a className="wpp-flutua" href={wpp} target="_blank" rel="noopener" aria-label={t.wppAria} onClick={() => evento('Contact', { canal: 'whatsapp' })}><Zap /></a>

      {player && (() => {
        const v = player.i != null ? tocaveis[player.i] : null, url = v ? v.video_url : player.url;
        let x0 = null;
        return (
          <div className="player" role="dialog" aria-modal="true" aria-label={t.video} onClick={e => { if (e.target === e.currentTarget) setPlayer(null); }}
            onTouchStart={e => { x0 = e.touches[0].clientX; }} onTouchEnd={e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) passar(dx < 0 ? 1 : -1); x0 = null; }}>
            <button className="player-x" onClick={() => setPlayer(null)} aria-label={t.fechar}>×</button>
            {v && tocaveis.length > 1 && <button className="player-seta ant" onClick={() => passar(-1)} aria-label={t.videoAnt}><Seta /></button>}
            <div className="player-palco" key={url}>
              <div className="player-cx">
                {tipoLink(url) === 'arquivo' ? <video src={url} controls autoPlay playsInline /> : <iframe src={embed(url)} allow="autoplay; encrypted-media; fullscreen" allowFullScreen title={t.video} />}
              </div>
              {v && (
                <aside className="player-info">
                  <span className="player-n">{String(player.i + 1).padStart(2, '0')} / {String(tocaveis.length).padStart(2, '0')}</span>
                  <div className="player-quem">
                    {v.avatar_url && <img src={v.avatar_url} alt="" />}
                    <span><b>{v.cliente_nome || v.titulo}</b>{v.cliente_arroba && <small>@{String(v.cliente_arroba).replace(/^@/, '')}</small>}</span>
                  </div>
                  {v.titulo && v.cliente_nome && <p className="player-tit">{v.titulo}</p>}
                  {v.tipo === 'depoimento' && v.texto && <blockquote className="player-depo">“{semAspas(v.texto)}”</blockquote>}
                  {(v.visualizacoes || v.curtidas || v.comentarios) && <div className="obra-num">
                    {v.visualizacoes && <span><IcOlho />{v.visualizacoes}</span>}
                    {v.curtidas && <span><IcCoracao />{v.curtidas}</span>}
                    {v.comentarios && <span><IcBalao />{v.comentarios}</span>}
                  </div>}
                  {v.resultado && <span className="obra-res"><IcSobe />{v.resultado}</span>}
                  <a className="pilula" href={linkWpp(cfg, t.wppVi(v.cliente_nome))} target="_blank" rel="noopener"
                    onClick={() => evento('Contact', { canal: 'whatsapp', origem: 'player' })}><span>{t.queroAssim}</span><i><Seta /></i></a>
                </aside>
              )}
            </div>
            {v && tocaveis.length > 1 && <button className="player-seta prox" onClick={() => passar(1)} aria-label={t.videoProx}><Seta /></button>}
          </div>
        );
      })()}
    </>
  );
}

const SERVICOS_EN = [
  { icone: '01', titulo: 'Reels and TikTok videos', texto: 'Vertical content with a strong hook, pacing and captions, made to hold attention and engage.' },
  { icone: '02', titulo: 'Ad creatives', texto: 'Versions made for paid traffic: hook tests, calls to action and formats that convert.' },
  { icone: '03', titulo: 'Professional shooting', texto: 'Crew, camera, lighting and direction. You just show up; we handle the rest.' },
  { icone: '04', titulo: 'Editing and post-production', texto: 'Cuts paced for social media, music, captions and your brand identity.' },
  { icone: '05', titulo: 'Script and strategy', texto: 'Editorial lines and scripts that speak to your audience and lead to sales.' },
  { icone: '06', titulo: 'Social media management', texto: 'Planning, publishing and tracking results month after month.' }
];

function Contato({ cfg, wpp, t, txt }) {
  const [msg, setMsg] = useState({ t: '', c: '' });
  const [enviando, setEnviando] = useState(false);
  const [tel, setTel] = useState('');
  const [aba, setAba] = useState('orc');
  const [agenda, setAgenda] = useState(null);
  const abriu = useRef(false);
  const interesses = (Array.isArray(txt.interesses) && txt.interesses.filter(Boolean).length) ? txt.interesses.filter(Boolean) : t.interesses;
  /* a aba "Marcar uma conversa" só aparece se a agenda estiver ligada no sistema */
  useEffect(() => { horariosLivres().then(setAgenda); }, []);
  /* links "#agendar" abrem direto a aba da agenda */
  useEffect(() => {
    const f = e => { const a = e.target.closest && e.target.closest('a[href$="#agendar"]'); if (a) setAba('agenda'); };
    document.addEventListener('click', f, true);
    if (location.hash === '#agendar') setAba('agenda');
    return () => document.removeEventListener('click', f, true);
  }, []);
  const temAgenda = agenda && agenda.ativo;
  async function enviar(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    if ((d.nome || '').trim().length < 2) return setMsg({ t: t.eNome, c: 'erro' });
    if ((d.whatsapp || '').replace(/\D/g, '').length < 10) return setMsg({ t: t.eWpp, c: 'erro' });
    setEnviando(true); setMsg({ t: '', c: '' });
    try {
      await enviarLead(d, origemDaVisita());
      evento('Lead', { interesse: d.interesse || '' });
      setMsg({ t: t.recebido, c: 'ok' });
      setTimeout(() => window.open(linkWpp(cfg, t.resumo(d)), '_blank', 'noopener'), 700);
      e.currentTarget && e.currentTarget.reset(); setTel('');
    } catch (err) { setMsg({ t: 'erro-envio', c: 'erro' }); }
    setEnviando(false);
  }
  return (
    <section className="contato" id="contato">
      <span id="agendar" className="ancora" aria-hidden="true" />
      <div className="contato-luz" aria-hidden="true" />
      <div className="lim contato-in">
        <div className="contato-tx">
          <p className="rotulo">{t.contatoRot}</p>
          <h2>{t.contatoTit}</h2>
          <p>{t.contatoP}</p>
          <a className="wpp-cartao" href={wpp} target="_blank" rel="noopener" onClick={() => evento('Contact', { canal: 'whatsapp' })}>
            <span className="wpp-av">{(cfg.whatsapp_nome || 'G').charAt(0)}</span>
            <span><b>{cfg.whatsapp_nome}</b><small>{cfg.whatsapp_cargo} · Branding7</small></span>
            <span className="wpp-ic"><Zap /></span>
          </a>
        </div>
        <div className="contato-cx">
          {temAgenda && <div className="contato-abas" role="tablist">
            <button role="tab" aria-selected={aba === 'orc'} className={aba === 'orc' ? 'on' : ''} onClick={() => setAba('orc')}>{t.abaOrc}</button>
            <button role="tab" aria-selected={aba === 'agenda'} className={aba === 'agenda' ? 'on' : ''} onClick={() => setAba('agenda')}><IcAgenda />{t.abaAgenda}</button>
          </div>}
          {temAgenda && aba === 'agenda' ? <Agenda agenda={agenda} recarregar={() => horariosLivres().then(setAgenda)} t={t} cfg={cfg} interesses={interesses} mascara={mascara} wpp={wpp} /> : (
          <form className="form" onSubmit={enviar} noValidate onFocus={() => { if (!abriu.current) { abriu.current = true; evento('Formulario'); } }}>
            <h3>{t.formTit}</h3>
            <p className="form-dica">{t.formDica}</p>
            <label>{t.fNome}<input name="nome" autoComplete="name" required maxLength={120} /></label>
            <label>{t.fWpp}<input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="(77) 99999-9999" value={tel} onChange={e => setTel(mascara(e.target.value))} /></label>
            <div className="form-2">
              <label>{t.fEmpresa}<input name="empresa" autoComplete="organization" maxLength={120} /></label>
              <label>{t.fCidade}<input name="cidade" autoComplete="address-level2" maxLength={120} /></label>
            </div>
            <label>{t.fPrecisa}
              <select name="interesse" defaultValue="">
                <option value="">{t.fEscolha}</option>
                {interesses.map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label>{t.fConte} <small>{t.opcional}</small><textarea name="mensagem" rows={3} maxLength={1000} placeholder={t.fContePh} /></label>
            <button className="pilula clara larga" type="submit" disabled={enviando}><span>{enviando ? t.enviando : t.enviar}</span><i><Seta /></i></button>
            <p className={'form-msg ' + msg.c} role="status">
              {msg.t === 'erro-envio' ? <>{t.erroEnvio} <a href={wpp} target="_blank" rel="noopener">{t.falarDireto}</a>.</> : msg.t}
            </p>
          </form>)}
        </div>
      </div>
    </section>
  );
}

/* telefone com máscara brasileira; número estrangeiro (com +) fica como digitado */
function mascara(v) {
  if (/^\s*\+/.test(v) && !/^\s*\+?55/.test(v)) return v.replace(/[^\d+\s()-]/g, '').slice(0, 24);
  const d = v.replace(/\D/g, '').slice(0, 13), n = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  return n.length > 6 ? `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}` : n.length > 2 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : n;
}

/* agendamento: o visitante escolhe o dia e o horário livres (Sistema B7 →
   Site → Agenda) e a conversa já entra na agenda e nos contatos */
function Agenda({ agenda, recarregar, t, cfg, interesses, wpp }) {
  const tz = 'America/Sao_Paulo';
  const dias = useMemo(() => {
    const m = new Map();
    (agenda.horarios || []).forEach(h => {
      const d = new Date(h), k = d.toLocaleDateString('en-CA', { timeZone: tz });
      if (!m.has(k)) m.set(k, []); m.get(k).push(h);
    });
    return [...m.entries()];
  }, [agenda]);
  const [dia, setDia] = useState(null);
  const [hora, setHora] = useState(null);
  const [tel, setTel] = useState('');
  const [msg, setMsg] = useState({ t: '', c: '' });
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(null);
  useEffect(() => { if (!dia && dias.length) setDia(dias[0][0]); }, [dias, dia]);
  const fmtDia = (k, op) => new Date(k + 'T12:00:00-03:00').toLocaleDateString(t.loc, { timeZone: tz, ...op });
  const fmtHora = h => new Date(h).toLocaleTimeString(t.loc, { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  const doDia = (dias.find(d => d[0] === dia) || [null, []])[1];
  async function marcar(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    if (!hora) return setMsg({ t: t.agEscolha, c: 'erro' });
    if ((d.nome || '').trim().length < 2) return setMsg({ t: t.eNome, c: 'erro' });
    if ((d.whatsapp || '').replace(/\D/g, '').length < 10) return setMsg({ t: t.eWpp, c: 'erro' });
    setEnviando(true); setMsg({ t: '', c: '' });
    try {
      await agendar({ ...d, inicio: hora }, origemDaVisita());
      evento('Lead', { interesse: d.interesse || '', agenda: 1 });
      setFeito({ hora, nome: d.nome });
    } catch (err) {
      setMsg({ t: (err && err.message) || t.erroEnvio, c: 'erro' });
      setHora(null); recarregar();
    }
    setEnviando(false);
  }
  if (feito) {
    const ini = new Date(feito.hora), fim = new Date(ini.getTime() + (agenda.duracao || 30) * 6e4);
    const g = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(t.agEvento) + '&dates=' + g(ini) + '/' + g(fim) + '&details=' + encodeURIComponent(t.agEventoTx + ' ' + wpp.split('?')[0]);
    const quando = fmtDia(ini.toLocaleDateString('en-CA', { timeZone: tz }), { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + fmtHora(feito.hora);
    return (
      <div className="form agenda-ok" role="status">
        <span className="agenda-ok-ic"><IcAgenda /></span>
        <h3>{t.agOk(quando)}</h3>
        <a className="pilula clara larga" href={cal} target="_blank" rel="noopener"><span>{t.agCal}</span><i><Seta /></i></a>
        <button className="agenda-link" onClick={() => { setFeito(null); setHora(null); recarregar(); }}>{t.agOutro}</button>
      </div>
    );
  }
  return (
    <form className="form agenda" onSubmit={marcar} noValidate>
      <h3>{t.agTit}</h3>
      <p className="form-dica">{t.agDica(agenda.duracao || 30)}</p>
      {!dias.length ? <p className="form-msg">{t.agSem} <a href={wpp} target="_blank" rel="noopener">{t.falarDireto}</a>.</p> : <>
        <span className="agenda-rot">{t.agDia}</span>
        <div className="agenda-dias" role="listbox" aria-label={t.agDia}>
          {dias.map(([k]) => (
            <button type="button" key={k} role="option" aria-selected={dia === k} className={dia === k ? 'on' : ''} onClick={() => { setDia(k); setHora(null); }}>
              <small>{fmtDia(k, { weekday: 'short' }).replace('.', '')}</small><b>{fmtDia(k, { day: '2-digit' })}</b><small>{fmtDia(k, { month: 'short' }).replace('.', '')}</small>
            </button>))}
        </div>
        <span className="agenda-rot">{t.agHora}</span>
        <div className="agenda-horas" role="listbox" aria-label={t.agHora}>
          {doDia.map(h => <button type="button" key={h} role="option" aria-selected={hora === h} className={hora === h ? 'on' : ''} onClick={() => setHora(h)}>{fmtHora(h)}</button>)}
        </div>
        <div className="form-2">
          <label>{t.fNome}<input name="nome" autoComplete="name" required maxLength={120} /></label>
          <label>{t.fWpp}<input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="(77) 99999-9999" value={tel} onChange={e => setTel(mascara(e.target.value))} /></label>
        </div>
        <label>{t.fPrecisa}
          <select name="interesse" defaultValue="">
            <option value="">{t.fEscolha}</option>
            {interesses.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <button className="pilula clara larga" type="submit" disabled={enviando}><span>{enviando ? t.agMarcando : t.agMarcar}{hora && !enviando ? ' · ' + fmtHora(hora) : ''}</span><i><Seta /></i></button>
      </>}
      <p className={'form-msg ' + msg.c} role="status">{msg.t}</p>
    </form>
  );
}

/* depoimento em pé, no formato dos Reels: capa com o vídeo, quem falou em
   cima e a fala do cliente embaixo (a fala inteira aparece no player) */
const semAspas = x => String(x || '').trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim();
function DepoCartao({ d, k, t, abrir }) {
  const capa = capaDe(d);
  const arroba = d.cliente_arroba ? '@' + String(d.cliente_arroba).replace(/^@/, '') : '';
  const quem = (
    <span className="depo2-quem">
      <span className="depo2-av">{d.avatar_url ? <img src={d.avatar_url} alt="" /> : (d.cliente_nome || '?').charAt(0)}</span>
      <span><b>{d.cliente_nome}</b><small>{arroba || d.titulo || t.depoCliente}</small></span>
    </span>
  );
  if (!d.video_url) return (
    <figure className="depo2 depo2-so-tx aparece" style={{ '--k': k }}>
      {quem}
      <span className="depo2-aspas" aria-hidden="true">“</span>
      <blockquote>{d.texto}</blockquote>
    </figure>
  );
  return (
    <figure className="depo2 aparece" style={{ '--k': k }} onClick={() => abrir(d.video_url)}>
      <button className="depo2-midia" onClick={e => { e.stopPropagation(); abrir(d.video_url); }} aria-label={t.depoVer(d.cliente_nome || '')}>
        {capa ? <img src={capa} alt="" loading="lazy" referrerPolicy="no-referrer" />
          : tipoLink(d.video_url) === 'arquivo' ? <video src={d.video_url + '#t=0.5'} muted playsInline preload="metadata" /> : null}
        <span className="depo2-play"><Play /></span>
      </button>
      {quem}
      <figcaption className="depo2-tx">
        {d.texto && <blockquote>“{semAspas(d.texto)}”</blockquote>}
        <span className="depo2-ver"><Play />{t.depoAssistir}</span>
      </figcaption>
    </figure>
  );
}

const IcAgenda = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12 13v3l2 1"/></svg>;

/* cantos de visor, REC piscando e o tempo correndo na abertura */
const IcEntrar = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l4-4-4-4M13 12H3"/></svg>;
const IcOlho = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7zm0 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>;
const IcCoracao = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21 3.6 12.9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 8.4 6.9z"/></svg>;
const IcBalao = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>;
const IcSobe = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>;

/* trabalhos: filtros por categoria + trilho de Reels (capa, cliente, play) */
function Obras({ videos, abrir, insta, insta_, t }) {
  const [cat, setCat] = useState('');
  const trilho = useRef(null);
  const cats = [...new Set(videos.map(v => v.categoria).filter(Boolean))];
  const lista = cat ? videos.filter(v => v.categoria === cat) : videos;
  const andar = d => { const t = trilho.current; if (t) t.scrollBy({ left: d * Math.min(t.clientWidth * .8, 620), behavior: 'smooth' }); };
  /* arrastar com o mouse (no celular o dedo já rola) */
  useEffect(() => {
    const t = trilho.current; if (!t || !matchMedia('(pointer: fine)').matches) return;
    let x0 = 0, s0 = 0, segura = false, moveu = 0;
    const d = e => { segura = true; moveu = 0; x0 = e.clientX; s0 = t.scrollLeft; t.classList.add('pegando'); };
    const m = e => { if (!segura) return; const dx = e.clientX - x0; moveu = Math.abs(dx); t.scrollLeft = s0 - dx; };
    const u = () => { segura = false; t.classList.remove('pegando'); };
    const c = e => { if (moveu > 6) { e.preventDefault(); e.stopPropagation(); } };
    t.addEventListener('pointerdown', d); addEventListener('pointermove', m); addEventListener('pointerup', u); t.addEventListener('click', c, true);
    return () => { t.removeEventListener('pointerdown', d); removeEventListener('pointermove', m); removeEventListener('pointerup', u); t.removeEventListener('click', c, true); };
  }, []);
  return (
    <div className="obras">
      <div className="lim obras-cab">
        <div>
          <p className="rotulo aparece">{t.projetos}</p>
          <h2 className="aparece">{t.projetosTit}</h2>
        </div>
        <div className="obras-nav">
          <button onClick={() => andar(-1)} aria-label={t.voltar}><Seta /></button>
          <button onClick={() => andar(1)} aria-label={t.avancar}><Seta /></button>
        </div>
      </div>
      {cats.length > 1 && <div className="lim obras-filtro aparece">{[''].concat(cats).map(c =>
        <button key={c || 'todos'} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c || t.todos}</button>)}</div>}
      <div className="obras-trilho" ref={trilho}>
        {lista.map((v, k) => (
          <article className="obra aparece" key={v.id} style={{ '--k': k }}>
            <button className="obra-cx inclina" onClick={() => abrir(v.video_url || v.link)} aria-label={t.verVideo + (v.titulo || v.cliente_nome || '')}>
              {capaDe(v) ? <img src={capaDe(v)} alt="" loading="lazy" draggable="false" referrerPolicy="no-referrer" />
                : tipoLink(v.video_url) === 'arquivo' ? <video src={v.video_url + '#t=0.5'} muted playsInline preload="metadata" />
                : <span className="obra-arte"><img src="/marca/symbol-white.png" alt="" /></span>}
              <span className="obra-sombra" />
              {v.categoria && <span className="obra-cat">{v.categoria}</span>}
              <span className="obra-play"><Play /></span>
              <span className="obra-base">
                <b>{v.avatar_url && <img className="obra-av" src={v.avatar_url} alt="" />}{v.cliente_nome || v.titulo}</b>
                {v.titulo && v.cliente_nome && <small>{v.titulo}</small>}
                {(v.visualizacoes || v.curtidas || v.comentarios) && <span className="obra-num">
                  {v.visualizacoes && <span title={t.visualizacoes}><IcOlho />{v.visualizacoes}</span>}
                  {v.curtidas && <span title={t.curtidas}><IcCoracao />{v.curtidas}</span>}
                  {v.comentarios && <span title={t.comentarios}><IcBalao />{v.comentarios}</span>}
                </span>}
                {v.resultado && <span className="obra-res"><IcSobe />{v.resultado}</span>}
                {v.cliente_arroba && <small className="obra-arroba">@{String(v.cliente_arroba).replace(/^@/, '')}</small>}
              </span>
            </button>
          </article>
        ))}
        <a className="obra obra-mais" href={insta} target="_blank" rel="noopener" onClick={insta_}><span>{t.verMaisInsta}<Seta /></span></a>
      </div>
    </div>
  );
}

/* abertura: muro de Reels em 3D — colunas que sobem e descem em
   velocidades diferentes; ao rolar, o muro endireita e se afasta (--hy) */
function MuroReels({ itens, heroi }) {
  const [cols, setCols] = useState(6);
  const [m3d, setM3d] = useState(false);
  /* 3D (perspectiva) só onde o vídeo é desenhado pela placa de vídeo; em
     computador sem aceleração ele fica plano (sem esticar) e leve */
  useEffect(() => {
    setM3d(gpuBoa() && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => { const f = () => setCols(innerWidth < 640 ? 4 : innerWidth < 1100 ? 5 : 6); f(); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []);
  const capas = itens.filter(i => (i.tipo === 'video' || i.tipo === 'depoimento') && (capaDe(i) || tipoLink(i.video_url) === 'arquivo'))
    .map(i => capaDe(i) ? { capa: capaDe(i) } : { video: i.video_url });
  if (heroi && !capas.some(c => c.video === heroi.video_url)) capas.unshift({ video: heroi.video_url });
  const logos = itens.filter(i => i.tipo === 'cliente' && i.capa_url).map(i => ({ logo: i.capa_url, nome: i.cliente_nome }));
  if (!capas.length && !logos.length) return null;
  /* distribuição justa: os logos entram em rodízio (cada cliente aparece
     quase o mesmo número de vezes) intercalados com as capas, e são
     distribuídos linha a linha entre as colunas, para o mesmo cliente
     nunca ficar colado nele mesmo */
  const porCol = 6, total = cols * porCol, seq = [];
  let iL = 0, iC = 0;
  for (let k = 0; k < total; k++) {
    const vezCapa = capas.length && (!logos.length || k % 3 === 0);
    if (vezCapa) seq.push(capas[iC++ % capas.length]); else seq.push(logos[iL++ % logos.length]);
  }
  return (
    <div className={'muro' + (m3d ? ' m3d' : '')} aria-hidden="true">
      <div className="muro-plano">
        {Array.from({ length: cols }).map((_, c) => {
          const lista = Array.from({ length: porCol }).map((_, j) => seq[j * cols + c]);
          return (
            <div className="muro-col" key={c} style={{ '--dur': (38 + (c % 3) * 9) + 's', '--dir': c % 2 ? 'reverse' : 'normal', '--y': (c % 3) * -9 + '%' }}>
              <div className="muro-in">{[0, 1].map(r => lista.map((t, j) => (
                <div className={'muro-t' + (t.logo ? ' logo' : '')} key={r + '-' + j}>
                  {t.video ? <video src={t.video} muted loop autoPlay playsInline preload="metadata" />
                    : <img src={t.capa || t.logo} alt="" decoding="async" loading="eager" width="190" height={t.logo ? 190 : 338} />}
                </div>)))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* sobre: o texto "acende" palavra por palavra conforme a rolagem */
function TextoAcende({ paragrafos }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.setProperty('--ap', 1); return; }
    let raf = 0;
    let ult = '';
    const medir = () => { raf = 0; const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const v = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35))).toFixed(3);
      if (v !== ult) { ult = v; el.style.setProperty('--ap', v); } };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    addEventListener('scroll', pedir, { passive: true }); medir();
    return () => { removeEventListener('scroll', pedir); cancelAnimationFrame(raf); };
  }, [paragrafos.join('|')]);
  const total = paragrafos.join(' ').split(/\s+/).length; let n = 0;
  return (
    <div className="acende" ref={ref}>
      {paragrafos.map((p, k) => <p key={k}>{p.split(/\s+/).map((w, j) => <span key={j} style={{ '--i': n++, '--n': total }}>{w} </span>)}</p>)}
    </div>
  );
}

/* cartão vertical de Reels: vídeo (arquivo) ou o logo do cliente */
function Reel({ m, ativo }) {
  const v = useRef(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }, { threshold: .2 });
    io.observe(el); return () => io.disconnect();
  }, [m && m.video]);
  if (!m) return null;
  return (
    <div className={'reel' + (ativo ? ' ativo' : '')}>
      {m.video ? <video ref={v} src={m.video} muted loop playsInline preload="metadata" />
        : m.capa ? <img className="reel-capa" src={m.capa} alt="" />
        : <div className="reel-logo"><img src={m.logo || '/marca/symbol-white.png'} alt="" /></div>}
      <div className="reel-ui">
        <span className="reel-barra"><i /></span>
        <span className="reel-quem"><b>{m.arroba ? '@' + String(m.arroba).replace(/^@/, '') : m.nome}</b></span>
        <span className="reel-acoes"><i className="c" /><i /><i /></span>
        <span className="reel-leg">{m.nome}</span>
      </div>
    </div>
  );
}

/* balão do WhatsApp: aparece uma vez por visita, depois de alguns segundos */
function BalaoWpp({ wpp, cfg, t }) {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem('b7_balao')) return; } catch (e) {}
    const t = setTimeout(() => { setVer(true); try { sessionStorage.setItem('b7_balao', '1'); } catch (e) {} }, 9000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { if (!ver) return; const t = setTimeout(() => setVer(false), 14000); return () => clearTimeout(t); }, [ver]);
  if (!ver) return null;
  const nome = String(cfg.whatsapp_nome || 'Gabriel').split(' ')[0];
  return (
    <div className="balao-wpp" role="status">
      <button className="balao-x" onClick={() => setVer(false)} aria-label={t.fechar}>×</button>
      <a href={wpp} target="_blank" rel="noopener" onClick={() => { evento('Contact', { canal: 'whatsapp', origem: 'balao' }); setVer(false); }}>
        <span className="balao-av">{nome.charAt(0)}<i /></span>
        <span><b>{nome} · Branding7</b><small>{t.balao}</small></span>
      </a>
    </div>
  );
}

/* título que entra letra por letra (cada letra sobe de trás de uma máscara) */
function Letras({ texto, de = 0 }) {
  /* cada palavra fica inteira na linha (as letras não quebram no meio) */
  let n = de;
  return texto.split(' ').map((p, w, arr) => (
    <span key={w} className="palavra">
      {p.split('').map((c, k) => <span key={k} className="let" style={{ '--d': (n++) * 32 + 'ms' }}><span>{c}</span></span>)}
      {w < arr.length - 1 && <span className="let-esp">{'\u00a0'}</span>}
    </span>
  ));
}

function Visor() {
  const [tc, setTc] = useState('00:00:00:00');
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now();
    const t = setInterval(() => {
      const s = (performance.now() - t0) / 1000, f = Math.floor((s % 1) * 30);
      setTc('00:' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(Math.floor(s) % 60).padStart(2, '0') + ':' + String(f).padStart(2, '0'));
    }, 1000 / 15);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="visor" aria-hidden="true">
      <i className="v-c v1" /><i className="v-c v2" /><i className="v-c v3" /><i className="v-c v4" />
      <span className="v-rec"><b />REC</span>
      <span className="v-tc">{tc}</span>
      <span className="v-info">4K · 30p · 16-50mm</span>
      <span className="v-mira" />
    </div>
  );
}

/* celular: topo de vidro com menu em tela cheia + barra de ações embaixo */
function MenuCelular({ wpp, insta, nav, t }) {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const f = () => setRolou(scrollY > innerHeight * .6);
    addEventListener('scroll', f, { passive: true }); f();
    return () => removeEventListener('scroll', f);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('menu-aberto', aberto); }, [aberto]);
  const ir = () => setAberto(false);
  return (
    <>
      <header className={'cel-topo' + (rolou || aberto ? ' visivel' : '')}>
        <a href="#inicio" onClick={ir}><img src="/marca/logo-white-300.png" alt="Branding7" width="102" height="40" /></a>
        <button className={'cel-menu-bt' + (aberto ? ' x' : '')} aria-label={aberto ? t.menuFechar : t.menuAbrir} aria-expanded={aberto} onClick={() => setAberto(a => !a)}><i /><i /></button>
      </header>
      <nav className={'cel-menu' + (aberto ? ' aberto' : '')} aria-hidden={!aberto}>
        {nav.map(([id, rot], k) =>
          <a key={id} href={'#' + id} onClick={ir} style={{ '--k': k }}><small>{String(k + 1).padStart(2, '0')}</small>{rot}</a>)}
        <div className="cel-menu-pe"><a href={t.sobrePag}>{t.sobreNos}</a><a href={insta} target="_blank" rel="noopener">Instagram</a><a href="https://sistema.branding7.com.br/">{t.areaCliente}</a><a href={t.outra} hrefLang={t.lang === 'en' ? 'pt-BR' : 'en'}>{t.outraRot}</a></div>
      </nav>
      <div className="cel-acoes">
        <a className="cel-zap" href={wpp} target="_blank" rel="noopener" onClick={() => evento('Contact', { canal: 'whatsapp' })}><Zap />WhatsApp</a>
        <a className="cel-orc" href="#contato">{t.orcCurto}<Seta /></a>
        <a className="cel-entrar" href="https://sistema.branding7.com.br/" aria-label={t.entrarAria}><IcEntrar /><span>{t.entrar}</span></a>
      </div>
    </>
  );
}
