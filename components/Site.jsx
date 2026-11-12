'use client';
/* Branding7 — página única. Linguagem de cinema: abertura em tela cheia
   com a marca gigante, projetos em tela cheia que empilham ao rolar,
   processo preso na rolagem e navegação em pílula flutuante. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { carregar, CFG_PADRAO, SERVICOS_PADRAO, linkWpp, tipoLink, embed, enviarLead, origemDaVisita, evento, registrar } from '@/lib/dados';

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

export default function Site() {
  const [cfg, setCfg] = useState(CFG_PADRAO);
  const [itens, setItens] = useState([]);
  const [player, setPlayer] = useState(null);
  const [ativo, setAtivo] = useState('inicio');

  useEffect(() => { carregar().then(({ cfg, itens }) => { setCfg(cfg); setItens(itens); rastreadores(cfg); }); }, []);

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
  const servicos = de('servico').length ? de('servico') : SERVICOS_PADRAO;
  const palavras = (cfg.palavras && cfg.palavras.length ? cfg.palavras : CFG_PADRAO.palavras);
  const heroi = videos.find(v => v.destaque && tipoLink(v.video_url) === 'arquivo') || videos.find(v => tipoLink(v.video_url) === 'arquivo');
  const wpp = useMemo(() => linkWpp(cfg), [cfg]);
  const insta = 'https://www.instagram.com/' + String(cfg.instagram || 'b7.agencia').replace(/^@/, '') + '/';
  const regioes = (cfg.regioes || []).filter(Boolean);
  const numeros = (cfg.numeros || []).filter(n => n && n.valor);
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
  const fita = lista(cfg.fita, ['VENDER', 'VIRALIZAR', 'PERFORMAR', 'ROTEIRO', 'GRAVAÇÃO', 'EDIÇÃO', 'CRIATIVOS', 'ANÚNCIOS']).map(w => String(w).toUpperCase());
  const manifesto = lista(cfg.manifesto, ['PRENDA A ATENÇÃO.', 'CONTE A SUA HISTÓRIA.', 'FAÇA VENDER.']);
  const notas = lista(cfg.notas, ['Os primeiros 3 segundos decidem se a pessoa fica.', 'Vídeo bom é o que traz cliente, não só curtida.']);
  const cta = cfg.cta || 'Quero vídeos assim';
  const sobreTexto = cfg.sobre_texto ? String(cfg.sobre_texto).split(/\n\s*\n/).map(t => t.trim()).filter(Boolean) : null;
  const insta_ = () => evento('Instagram');

  /* seção ativa na pílula + aparecer ao rolar */
  useEffect(() => {
    const ids = ['inicio', 'trabalhos', 'processo', 'servicos', 'contato'];
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
    const passo = () => {
      raf = 0;
      const y = scrollY, alt = raiz.scrollHeight - innerHeight;
      vel += ((y - yAnt) - vel) * .2; yAnt = y;
      raiz.style.setProperty('--rol', (alt > 0 ? y / alt : 0).toFixed(4));
      raiz.style.setProperty('--vel', Math.max(-1, Math.min(1, vel / 60)).toFixed(3));
      const h = document.querySelector('.heroi');
      if (h) { const r = h.getBoundingClientRect(); h.style.setProperty('--hy', Math.min(1, Math.max(0, -r.top / r.height)).toFixed(4)); }
      const m = document.querySelector('.manifesto');
      if (m) { const r = m.getBoundingClientRect(); m.style.setProperty('--mp', Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * .45))).toFixed(4)); }
      document.querySelectorAll('.projeto').forEach(p => { const prox = p.nextElementSibling; if (!prox) { p.style.setProperty('--sai', 0); return; }
        const rp = prox.getBoundingClientRect(); p.style.setProperty('--sai', Math.min(1, Math.max(0, 1 - rp.top / innerHeight)).toFixed(4)); });
      if (Math.abs(vel) > .5) raf = requestAnimationFrame(passo); else raiz.style.setProperty('--vel', 0);
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(passo); };
    addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); passo();

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
    return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); cancelAnimationFrame(raf); io.disconnect();
      document.removeEventListener('pointermove', mover); document.removeEventListener('pointerout', sair); };
  }, [itens, cfg]);

  /* links internos (#contato, #trabalhos...) rolam até a seção sem deixar
     o "#..." na barra de endereço */
  useEffect(() => {
    const limpa = () => { if (location.hash) history.replaceState(null, '', location.pathname + location.search); };
    const ir = id => { const el = document.getElementById(id); if (!el) return false;
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return true; };
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
      sec.style.setProperty('--p', p.toFixed(4));
      sec.dataset.fase = p < .28 ? '0' : '1';
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); medir();
    return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); cancelAnimationFrame(raf); };
  }, []);

  const progressoProcesso = useCallback(() => {
    const sec = typeof document !== 'undefined' && document.getElementById('processo');
    return sec ? parseFloat(sec.style.getPropertyValue('--p')) || 0 : 0;
  }, []);

  const abrir = u => {
    if (!u) return;
    if (tipoLink(u) !== 'arquivo' && !embed(u)) { window.open(u, '_blank', 'noopener'); return; }
    setPlayer(u); evento('ViewContent', { tipo: 'video' });
  };
  useEffect(() => {
    document.body.style.overflow = player ? 'hidden' : '';
    const k = e => { if (e.key === 'Escape') setPlayer(null); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [player]);

  const PASSOS = (Array.isArray(cfg.passos) && cfg.passos.length) ? cfg.passos.slice(0, 6).map(x => [x.t, x.d]) : [
    ['Diagnóstico', 'Entendemos o seu negócio, o seu público e o que precisa vender.'],
    ['Roteiro', 'Ganchos, falas e cenas pensados para prender a atenção e converter.'],
    ['Gravação', 'Captação profissional, com direção para você ficar à vontade na câmera.'],
    ['Edição', 'Cortes no ritmo das redes, legendas, trilha e a identidade da marca.'],
    ['Publicação', 'Versões para Reels, TikTok, Stories e anúncios, prontas para subir.'],
    ['Performance', 'Olhamos o que funcionou e ajustamos o próximo vídeo para vender mais.']
  ];
  const FAQ = (Array.isArray(cfg.faq) && cfg.faq.length) ? cfg.faq.map(x => [x.p, x.r]) : [
    ['Vocês gravam na minha cidade?', regioes.length ? 'Gravamos presencialmente em ' + regioes.join(', ') + '. Edição e criativos atendemos todo o Brasil.' : 'Fale com a gente pelo WhatsApp: dizemos na hora se a sua cidade está na nossa rota de gravação. Edição e criativos atendemos todo o Brasil.'],
    ['Eu preciso saber falar na câmera?', 'Não. A gente escreve o roteiro, dirige a gravação e deixa você à vontade. Muitos clientes nunca tinham gravado antes.'],
    ['Quanto tempo leva para o vídeo ficar pronto?', 'Depende do volume, mas o normal é receber os primeiros vídeos editados poucos dias depois da gravação.'],
    ['Os vídeos servem para anúncio?', 'Sim. Entregamos versões pensadas para tráfego pago, com ganchos diferentes para testar e achar o que vende mais.'],
    ['Como funciona o orçamento?', 'Você conta o que precisa, a gente entende o seu momento e monta um plano do tamanho do seu negócio. Sem compromisso.']
  ];

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
          <img src="/marca/logo-white.png" alt="Branding7" width="132" height="52" />
          <a className="topo-link" href={insta} target="_blank" rel="noopener" onClick={insta_}>@{String(cfg.instagram || 'b7.agencia').replace(/^@/, '')}</a>
        </header>
        <div className="heroi-base">
          <h1><span className="h1-l"><span>O vídeo que faz</span></span><span className="h1-l"><span>você <Giro palavras={palavras} />.</span></span></h1>
          <div className="heroi-lado">
            <p>{cfg.subtitulo}</p>
            <div className="heroi-acoes">
              <Botao href={wpp} alvo onClick={() => evento('Contact', { canal: 'whatsapp' })} claro>Solicitar orçamento</Botao>
              {mostra('trabalhos') && <a className="pilula-simples" href="#trabalhos">Trabalhos</a>}
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
        {numeros.length > 0 && <div className="manifesto-num">{numeros.map((n, k) => <div key={k} className="aparece"><b data-conta={n.valor}>{n.valor}</b><small>{n.rotulo}</small></div>)}</div>}
      </section>

      {/* ============ SOBRE (claro) ============ */}
      {mostra('sobre') && <section className="sobre" id="sobre">
        <div className="lim sobre-novo">
          <div className="sobre-topo aparece">
            <span className="sobre-cartao">
              <span className="sobre-av"><img src="/marca/symbol-white.png" alt="" width="40" height="47" /></span>
              <span><b>Branding7</b><small>Vídeo, criativos e marketing digital</small></span>
            </span>
            <span className="sobre-linha" />
          </div>
          <h2 className="sobre-titulo aparece">{cfg.sobre_titulo ? cfg.sobre_titulo : <>Muito além de <em>gravar um vídeo</em>.</>}</h2>
          <TextoAcende paragrafos={sobreTexto || ['Na Branding7, cada vídeo nasce de uma estratégia: quem vai assistir, o que precisa sentir e o que tem que fazer depois. Roteiro, gravação e edição trabalham juntos para isso.',
            'O resultado é conteúdo que a sua marca tem orgulho de postar e que faz o cliente chamar no WhatsApp.']} />
          <div className="sobre-pe aparece">
            <Botao href={wpp} alvo onClick={() => evento('Contact', { canal: 'whatsapp' })}>{cta}</Botao>
            <span className="sobre-selos"><span>Roteiro</span><span>Gravação</span><span>Edição</span><span>Anúncios</span></span>
          </div>
        </div>
      </section>}

      {/* ============ TRABALHOS: Reels lado a lado ============ */}
      {mostra('trabalhos') && <section className="trabalhos" id="trabalhos">
        {videos.length > 0 ? <Obras videos={videos} abrir={abrir} insta={insta} insta_={insta_} /> : (
          <div className="trabalhos-vazio lim aparece">
            <p className="rotulo">Projetos selecionados</p>
            <h2>Os vídeos dos nossos clientes <em>estão chegando aqui</em>.</h2>
            <Botao href={insta} alvo onClick={insta_}>Ver no Instagram</Botao>
            {midiasCelular.length > 0 && <div className="trilho-reels" aria-hidden="true"><div className="trilho-in">{[0, 1].map(r => midiasCelular.map((m, k) => <Reel key={r + '-' + k} m={m} />))}</div></div>}
          </div>
        )}
      </section>}

      {/* ============ PROCESSO (preso na rolagem) ============ */}
      {mostra('processo') && <section className="processo" id="processo">
        <div className="processo-palco">
          <div className="processo-ceu" aria-hidden="true" />
          <p className="rotulo centro">Processo de criação</p>
          <h2 className="processo-titulo" aria-label="Do roteiro ao resultado: seis passos">DO ROTEIRO<br />AO RESULTADO<br /><em>SEIS PASSOS</em></h2>
          <div className="processo-centro"><Celular3D progresso={progressoProcesso} midias={midiasCelular.filter(m => m.video || m.capa)} /></div>
          <ol className="processo-passos">
            {PASSOS.map(([t, d], k) => (
              <li key={t} style={{ '--k': k }}><span>{String(k + 1).padStart(2, '0')}</span><b>{t}</b><p>{d}</p></li>
            ))}
          </ol>
          <p className="processo-pe">✦ Do primeiro papo ao vídeo no ar</p>
        </div>
      </section>}

      {/* ============ SERVIÇOS ============ */}
      {mostra('servicos') && <section className="servicos" id="servicos">
        <div className="lim">
          <p className="rotulo aparece">Serviços</p>
          <h2 className="aparece">Tudo que o seu vídeo precisa para <em>performar</em>.</h2>
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
            <p className="rotulo aparece">Depoimentos</p>
            <h2 className="aparece">Quem fez, <em>recomenda</em>.</h2>
            <div className="depo-lista">
              {depo.map(d => d.video_url ? (
                <button className="depo-video aparece" key={d.id} onClick={() => abrir(d.video_url)}>
                  <VideoFundo src={d.video_url} capa={d.capa_url} />
                  <span className="depo-play"><Play /></span>
                  <span className="depo-quem"><b>{d.cliente_nome}</b>{d.cliente_arroba && <small>@{String(d.cliente_arroba).replace(/^@/, '')}</small>}</span>
                </button>
              ) : (
                <figure className="depo-tx aparece inclina luz" key={d.id}>
                  <blockquote>{d.texto}</blockquote>
                  <figcaption><span className="depo-av">{(d.cliente_nome || '?').charAt(0)}</span><span><b>{d.cliente_nome}</b><small>{d.cliente_arroba ? '@' + String(d.cliente_arroba).replace(/^@/, '') : d.titulo}</small></span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CLIENTES ============ */}
      {mostra('clientes') && clientes.length > 0 && (
        <section className="clientes" aria-label="Clientes">
          <p className="rotulo centro">Marcas que confiam na Branding7</p>
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
            <div><p className="rotulo aparece">Onde atendemos</p><h2 className="aparece">Gravação presencial na <em>sua cidade</em>.</h2><p className="aparece">Edição e criativos para todo o Brasil.</p></div>
            <ul>{regioes.map(r => <li key={r} className="aparece">{r}</li>)}</ul>
          </div>
        </section>
      )}

      {/* ============ PERGUNTAS ============ */}
      {mostra('faq') && <section className="faq">
        <div className="lim faq-in">
          <div><p className="rotulo aparece">Dúvidas</p><h2 className="aparece">Antes de começar, <em>tire suas dúvidas</em>.</h2></div>
          <div className="faq-lista">
            {FAQ.map(([p, r], k) => (
              <details key={k} className="aparece"><summary>{p}<i aria-hidden="true">+</i></summary><p>{r}</p></details>
            ))}
          </div>
        </div>
      </section>}

      {/* ============ CONTATO ============ */}
      <Contato cfg={cfg} wpp={wpp} />

      <footer className="rodape">
        <div className="lim rodape-in">
          <img src="/marca/logo-white.png" alt="Branding7" width="120" height="47" />
          <nav aria-label="Rodapé">
            <a href={insta} target="_blank" rel="noopener" onClick={insta_}>Instagram</a>
            <a href={wpp} target="_blank" rel="noopener">WhatsApp</a>
            <a href="https://sistema.branding7.com.br/">Área do cliente</a>
          </nav>
          <small>© {new Date().getFullYear()} Branding7 · Núcleo7</small>
        </div>
      </footer>

      <MenuCelular wpp={wpp} insta={insta} />

      {/* navegação em pílula flutuante */}
      <nav className="pilula-nav" aria-label="Principal">
        <img src="/marca/symbol-white.png" alt="" width="20" height="24" />
        {[['inicio', 'Início'], ['trabalhos', 'Trabalhos'], ['processo', 'Processo'], ['servicos', 'Serviços']].filter(([id]) => id === 'inicio' || mostra(id)).map(([id, r]) =>
          <a key={id} href={'#' + id} className={ativo === id ? 'on' : ''}>{r}</a>)}
        <a className="pn-cta" href="#contato">Orçamento<i><Seta /></i></a>
      </nav>

      <a className="wpp-flutua" href={wpp} target="_blank" rel="noopener" aria-label="Falar no WhatsApp" onClick={() => evento('Contact', { canal: 'whatsapp' })}><Zap /></a>

      {player && (
        <div className="player" role="dialog" aria-modal="true" aria-label="Vídeo" onClick={e => { if (e.target === e.currentTarget) setPlayer(null); }}>
          <button className="player-x" onClick={() => setPlayer(null)} aria-label="Fechar">×</button>
          <div className="player-cx">
            {tipoLink(player) === 'arquivo' ? <video src={player} controls autoPlay playsInline /> : <iframe src={embed(player)} allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="Vídeo" />}
          </div>
        </div>
      )}
    </>
  );
}

const INTERESSES_PADRAO = ['Vídeos para Reels e TikTok', 'Criativos para anúncios', 'Gravação e edição', 'Casamento', 'Evento', 'Vídeo institucional',
  'Gestão de redes sociais', 'Ainda não sei, quero conversar'];

function Contato({ cfg, wpp }) {
  const [msg, setMsg] = useState({ t: '', c: '' });
  const [enviando, setEnviando] = useState(false);
  const [tel, setTel] = useState('');
  const abriu = useRef(false);
  const interesses = (Array.isArray(cfg.interesses) && cfg.interesses.filter(Boolean).length) ? cfg.interesses.filter(Boolean) : INTERESSES_PADRAO;
  const mascara = v => {
    const d = v.replace(/\D/g, '').slice(0, 13), n = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
    return n.length > 6 ? `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}` : n.length > 2 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : n;
  };
  async function enviar(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    if ((d.nome || '').trim().length < 2) return setMsg({ t: 'Coloque o seu nome.', c: 'erro' });
    if ((d.whatsapp || '').replace(/\D/g, '').length < 10) return setMsg({ t: 'Coloque o WhatsApp com DDD.', c: 'erro' });
    setEnviando(true); setMsg({ t: '', c: '' });
    try {
      await enviarLead(d, origemDaVisita());
      evento('Lead', { interesse: d.interesse || '' });
      setMsg({ t: 'Recebido! Abrindo o WhatsApp para você falar com o comercial…', c: 'ok' });
      const resumo = `Sou ${d.nome.trim()}${d.empresa ? ', da ' + d.empresa.trim() : ''}${d.cidade ? ' (' + d.cidade.trim() + ')' : ''}.${d.interesse ? ' Tenho interesse em: ' + d.interesse + '.' : ''}`;
      setTimeout(() => window.open(linkWpp(cfg, resumo), '_blank', 'noopener'), 700);
      e.currentTarget && e.currentTarget.reset(); setTel('');
    } catch (err) { setMsg({ t: 'erro-envio', c: 'erro' }); }
    setEnviando(false);
  }
  return (
    <section className="contato" id="contato">
      <div className="contato-luz" aria-hidden="true" />
      <div className="lim contato-in">
        <div className="contato-tx">
          <p className="rotulo">Vamos conversar</p>
          <h2>Seu negócio pode <em>ir mais longe</em>.</h2>
          <p>Conte um pouco do que você precisa. O nosso comercial responde rapidinho pelo WhatsApp.</p>
          <a className="wpp-cartao" href={wpp} target="_blank" rel="noopener" onClick={() => evento('Contact', { canal: 'whatsapp' })}>
            <span className="wpp-av">{(cfg.whatsapp_nome || 'G').charAt(0)}</span>
            <span><b>{cfg.whatsapp_nome}</b><small>{cfg.whatsapp_cargo} · Branding7</small></span>
            <span className="wpp-ic"><Zap /></span>
          </a>
        </div>
        <form className="form" onSubmit={enviar} noValidate onFocus={() => { if (!abriu.current) { abriu.current = true; evento('Formulario'); } }}>
          <h3>Pedir um orçamento</h3>
          <p className="form-dica">Preencha em poucas palavras o que você precisa. O comercial responde no seu WhatsApp.</p>
          <label>Seu nome<input name="nome" autoComplete="name" required maxLength={120} /></label>
          <label>WhatsApp com DDD<input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="(77) 99999-9999" value={tel} onChange={e => setTel(mascara(e.target.value))} /></label>
          <div className="form-2">
            <label>Empresa<input name="empresa" autoComplete="organization" maxLength={120} /></label>
            <label>Cidade<input name="cidade" autoComplete="address-level2" maxLength={120} /></label>
          </div>
          <label>O que você precisa?
            <select name="interesse" defaultValue="">
              <option value="">Escolha uma opção</option>
              {interesses.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Conte rapidinho <small>(opcional)</small><textarea name="mensagem" rows={3} maxLength={1000} placeholder="Ex.: casamento dia 20/12 em Vitória da Conquista, quero o vídeo de melhores momentos." /></label>
          <button className="pilula clara larga" type="submit" disabled={enviando}><span>{enviando ? 'Enviando…' : 'Enviar e falar com o comercial'}</span><i><Seta /></i></button>
          <p className={'form-msg ' + msg.c} role="status">
            {msg.t === 'erro-envio' ? <>Não foi possível enviar agora. <a href={wpp} target="_blank" rel="noopener">Fale direto no WhatsApp</a>.</> : msg.t}
          </p>
        </form>
      </div>
    </section>
  );
}

/* Pixel da Meta e Google Analytics: os códigos ficam no sistema (tela Site) */
function rastreadores(cfg) {
  if (typeof window === 'undefined' || window.__b7Rastro) return; window.__b7Rastro = 1;
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

/* cantos de visor, REC piscando e o tempo correndo na abertura */
/* trabalhos: filtros por categoria + trilho de Reels (capa, cliente, play) */
function Obras({ videos, abrir, insta, insta_ }) {
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
          <p className="rotulo aparece">Projetos selecionados</p>
          <h2 className="aparece">Vídeos que já estão <em>fazendo resultado</em>.</h2>
        </div>
        <div className="obras-nav">
          <button onClick={() => andar(-1)} aria-label="Voltar"><Seta /></button>
          <button onClick={() => andar(1)} aria-label="Avançar"><Seta /></button>
        </div>
      </div>
      {cats.length > 1 && <div className="lim obras-filtro aparece">{[''].concat(cats).map(c =>
        <button key={c || 'todos'} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c || 'Todos'}</button>)}</div>}
      <div className="obras-trilho" ref={trilho}>
        {lista.map((v, k) => (
          <article className="obra aparece" key={v.id} style={{ '--k': k }}>
            <button className="obra-cx inclina" onClick={() => abrir(v.video_url || v.link)} aria-label={'Ver vídeo: ' + (v.titulo || v.cliente_nome || '')}>
              {v.capa_url ? <img src={v.capa_url} alt="" loading="lazy" draggable="false" />
                : tipoLink(v.video_url) === 'arquivo' ? <video src={v.video_url + '#t=0.5'} muted playsInline preload="metadata" />
                : <span className="obra-arte"><img src="/marca/symbol-white.png" alt="" /></span>}
              <span className="obra-sombra" />
              {v.categoria && <span className="obra-cat">{v.categoria}</span>}
              <span className="obra-play"><Play /></span>
              <span className="obra-base">
                <b>{v.avatar_url && <img className="obra-av" src={v.avatar_url} alt="" />}{v.cliente_nome || v.titulo}</b>
                {v.titulo && v.cliente_nome && <small>{v.titulo}</small>}
                {v.cliente_arroba && <small className="obra-arroba">@{String(v.cliente_arroba).replace(/^@/, '')}</small>}
              </span>
            </button>
          </article>
        ))}
        <a className="obra obra-mais" href={insta} target="_blank" rel="noopener" onClick={insta_}><span>Ver mais no Instagram<Seta /></span></a>
      </div>
    </div>
  );
}

/* abertura: muro de Reels em 3D — colunas que sobem e descem em
   velocidades diferentes; ao rolar, o muro endireita e se afasta (--hy) */
function MuroReels({ itens, heroi }) {
  const [cols, setCols] = useState(6);
  useEffect(() => { const f = () => setCols(innerWidth < 640 ? 4 : innerWidth < 1100 ? 5 : 7); f(); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []);
  const capas = itens.filter(i => (i.tipo === 'video' || i.tipo === 'depoimento') && (i.capa_url || tipoLink(i.video_url) === 'arquivo'))
    .map(i => i.capa_url ? { capa: i.capa_url } : { video: i.video_url });
  if (heroi && !capas.some(c => c.video === heroi.video_url)) capas.unshift({ video: heroi.video_url });
  const logos = itens.filter(i => i.tipo === 'cliente' && i.capa_url).map(i => ({ logo: i.capa_url, nome: i.cliente_nome }));
  if (!capas.length && !logos.length) return null;
  /* cada coluna mistura capas e logos, começando de um ponto diferente */
  const base = [];
  const n = Math.max(capas.length, Math.ceil(logos.length / 2), 3);
  for (let k = 0; k < n; k++) { if (capas.length) base.push(capas[k % capas.length]); if (logos.length) base.push(logos[(k * 2) % logos.length]); if (logos.length > 1) base.push(logos[(k * 2 + 1) % logos.length]); }
  const porCol = 6;
  return (
    <div className="muro" aria-hidden="true">
      <div className="muro-plano">
        {Array.from({ length: cols }).map((_, c) => {
          const lista = Array.from({ length: porCol }).map((_, j) => base[(c * 3 + j * (c % 2 ? 2 : 1)) % base.length]);
          return (
            <div className="muro-col" key={c} style={{ '--dur': (38 + (c % 3) * 9) + 's', '--dir': c % 2 ? 'reverse' : 'normal', '--y': (c % 3) * -9 + '%' }}>
              <div className="muro-in">{[0, 1].map(r => lista.map((t, j) => (
                <div className={'muro-t' + (t.logo ? ' logo' : '')} key={r + '-' + j}>
                  {t.video ? <video src={t.video} muted loop autoPlay playsInline preload="metadata" />
                    : t.capa ? <img src={t.capa} alt="" decoding="async" />
                    : <img src={t.logo} alt="" decoding="async" />}
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
    const medir = () => { raf = 0; const r = el.getBoundingClientRect();
      el.style.setProperty('--ap', Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35))).toFixed(4)); };
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
function MenuCelular({ wpp, insta }) {
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
        <a href="#inicio" onClick={ir}><img src="/marca/logo-white.png" alt="Branding7" width="102" height="40" /></a>
        <button className={'cel-menu-bt' + (aberto ? ' x' : '')} aria-label={aberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={aberto} onClick={() => setAberto(a => !a)}><i /><i /></button>
      </header>
      <nav className={'cel-menu' + (aberto ? ' aberto' : '')} aria-hidden={!aberto}>
        {[['inicio', 'Início'], ['trabalhos', 'Trabalhos'], ['processo', 'Processo'], ['servicos', 'Serviços'], ['contato', 'Contato']].map(([id, rot], k) =>
          <a key={id} href={'#' + id} onClick={ir} style={{ '--k': k }}><small>0{k + 1}</small>{rot}</a>)}
        <div className="cel-menu-pe"><a href={insta} target="_blank" rel="noopener">Instagram</a><a href="https://sistema.branding7.com.br/">Área do cliente</a></div>
      </nav>
      <div className="cel-acoes">
        <a className="cel-zap" href={wpp} target="_blank" rel="noopener" onClick={() => evento('Contact', { canal: 'whatsapp' })}><Zap />WhatsApp</a>
        <a className="cel-orc" href="#contato">Orçamento<Seta /></a>
      </div>
    </>
  );
}
