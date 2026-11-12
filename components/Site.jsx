'use client';
/* Branding7 — página única. Linguagem de cinema: abertura em tela cheia
   com a marca gigante, projetos em tela cheia que empilham ao rolar,
   processo preso na rolagem e navegação em pílula flutuante. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { carregar, CFG_PADRAO, SERVICOS_PADRAO, linkWpp, tipoLink, embed, enviarLead, origemDaVisita, evento } from '@/lib/dados';

const Seta = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Zap = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.6l4.9-1.3A9.8 9.8 0 1 0 12 2.2zm4.4 11.8c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.2z" /></svg>);
const Play = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>);

function Botao({ href, children, claro, onClick, alvo }) {
  return (
    <a className={'pilula' + (claro ? ' clara' : '')} href={href} onClick={onClick} target={alvo ? '_blank' : undefined} rel={alvo ? 'noopener' : undefined}>
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

  const de = t => itens.filter(i => i.tipo === t);
  const videos = de('video'), depo = de('depoimento'), clientes = de('cliente');
  const servicos = de('servico').length ? de('servico') : SERVICOS_PADRAO;
  const palavras = (cfg.palavras && cfg.palavras.length ? cfg.palavras : CFG_PADRAO.palavras);
  const heroi = videos.find(v => v.destaque && tipoLink(v.video_url) === 'arquivo') || videos.find(v => tipoLink(v.video_url) === 'arquivo');
  const wpp = useMemo(() => linkWpp(cfg), [cfg]);
  const insta = 'https://www.instagram.com/' + String(cfg.instagram || 'b7.agencia').replace(/^@/, '') + '/';
  const regioes = (cfg.regioes || []).filter(Boolean);
  const numeros = (cfg.numeros || []).filter(n => n && n.valor);

  /* seção ativa na pílula + aparecer ao rolar */
  useEffect(() => {
    const ids = ['inicio', 'trabalhos', 'processo', 'servicos', 'contato'];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setAtivo(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); io2.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.aparece:not(.visivel)').forEach(el => io2.observe(el));
    return () => { io.disconnect(); io2.disconnect(); };
  }, [itens]);

  /* processo: a rolagem dentro da seção vira --p (0 a 1) */
  useEffect(() => {
    const sec = document.getElementById('processo'); if (!sec) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      sec.style.setProperty('--p', p.toFixed(4));
      sec.dataset.fase = p < .28 ? '0' : '1';
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); medir();
    return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); cancelAnimationFrame(raf); };
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

  const PASSOS = [
    ['Diagnóstico', 'Entendemos o seu negócio, o seu público e o que precisa vender.'],
    ['Roteiro', 'Ganchos, falas e cenas pensados para prender a atenção e converter.'],
    ['Gravação', 'Captação profissional, com direção para você ficar à vontade na câmera.'],
    ['Edição', 'Cortes no ritmo das redes, legendas, trilha e a identidade da marca.'],
    ['Publicação', 'Versões para Reels, TikTok, Stories e anúncios, prontas para subir.'],
    ['Performance', 'Olhamos o que funcionou e ajustamos o próximo vídeo para vender mais.']
  ];
  const FAQ = [
    ['Vocês gravam na minha cidade?', regioes.length ? 'Gravamos presencialmente em ' + regioes.join(', ') + '. Edição e criativos atendemos todo o Brasil.' : 'Fale com a gente pelo WhatsApp: dizemos na hora se a sua cidade está na nossa rota de gravação. Edição e criativos atendemos todo o Brasil.'],
    ['Eu preciso saber falar na câmera?', 'Não. A gente escreve o roteiro, dirige a gravação e deixa você à vontade. Muitos clientes nunca tinham gravado antes.'],
    ['Quanto tempo leva para o vídeo ficar pronto?', 'Depende do volume, mas o normal é receber os primeiros vídeos editados poucos dias depois da gravação.'],
    ['Os vídeos servem para anúncio?', 'Sim. Entregamos versões pensadas para tráfego pago, com ganchos diferentes para testar e achar o que vende mais.'],
    ['Como funciona o orçamento?', 'Você conta o que precisa, a gente entende o seu momento e monta um plano do tamanho do seu negócio. Sem compromisso.']
  ];

  return (
    <>
      {/* ============ ABERTURA ============ */}
      <section className="heroi" id="inicio">
        <div className="heroi-fundo" aria-hidden="true">
          {heroi ? <VideoFundo src={heroi.video_url} capa={heroi.capa_url} /> : <div className="aurora"><i /><i /><i /></div>}
          <div className="grao" />
        </div>
        <div className="marca-gigante" aria-hidden="true">B7</div>
        <header className="heroi-topo">
          <img src="/marca/logo-white.png" alt="Branding7" width="132" height="52" />
          <a className="topo-link" href={insta} target="_blank" rel="noopener">@{String(cfg.instagram || 'b7.agencia').replace(/^@/, '')}</a>
        </header>
        <div className="heroi-base">
          <h1>O vídeo que faz<br />você <Giro palavras={palavras} />.</h1>
          <div className="heroi-lado">
            <p>{cfg.subtitulo}</p>
            <div className="heroi-acoes">
              <Botao href={wpp} alvo onClick={() => evento('Contact', { canal: 'whatsapp' })} claro>Solicitar orçamento</Botao>
              <a className="pilula-simples" href="#trabalhos">Trabalhos</a>
            </div>
          </div>
        </div>
      </section>

      {/* fita de palavras */}
      <div className="fita" aria-hidden="true"><div className="fita-in">{Array.from({ length: 2 }).map((_, k) => <span key={k}>{['VENDER', 'VIRALIZAR', 'PERFORMAR', 'ROTEIRO', 'GRAVAÇÃO', 'EDIÇÃO', 'CRIATIVOS', 'ANÚNCIOS'].map(w => <b key={w}>{w}<em>✦</em></b>)}</span>)}</div></div>

      {/* ============ MANIFESTO ============ */}
      <section className="manifesto">
        <div className="manifesto-luz" aria-hidden="true" />
        <img className="manifesto-simbolo" src="/marca/symbol-white.png" alt="" aria-hidden="true" width="199" height="236" />
        <div className="manifesto-tx aparece">
          <h2>PRENDA A ATENÇÃO.<br />CONTE A SUA HISTÓRIA.<br /><em>FAÇA VENDER.</em></h2>
        </div>
        <p className="nota n1 aparece">Os primeiros 3 segundos decidem se a pessoa fica.</p>
        <p className="nota n2 aparece">Vídeo bom é o que traz cliente, não só curtida.</p>
        {numeros.length > 0 && <div className="manifesto-num">{numeros.map((n, k) => <div key={k} className="aparece"><b>{n.valor}</b><small>{n.rotulo}</small></div>)}</div>}
      </section>

      {/* ============ SOBRE (claro) ============ */}
      <section className="sobre">
        <div className="lim sobre-in">
          <div className="sobre-cartao aparece">
            <span className="sobre-av"><img src="/marca/symbol-white.png" alt="" width="40" height="47" /></span>
            <span><b>Branding7</b><small>Vídeo, criativos e marketing digital</small></span>
          </div>
          <div className="sobre-tx">
            <h2 className="aparece">Muito além de <em>gravar um vídeo</em>.</h2>
            <div className="sobre-cols">
              <p className="aparece">Na Branding7, cada vídeo nasce de uma estratégia: quem vai assistir, o que precisa sentir e o que tem que fazer depois. Roteiro, gravação e edição trabalham juntos para isso.</p>
              <p className="aparece">O resultado é conteúdo que a sua marca tem orgulho de postar e que faz o cliente chamar no WhatsApp.</p>
            </div>
            <Botao href={wpp} alvo onClick={() => evento('Contact', { canal: 'whatsapp' })}>Quero vídeos assim</Botao>
          </div>
        </div>
      </section>

      {/* ============ TRABALHOS (empilham ao rolar) ============ */}
      <section className="trabalhos" id="trabalhos">
        {videos.length > 0 ? videos.slice(0, 8).map((v, k, arr) => (
          <article className="projeto" key={v.id} style={{ '--k': k }}>
            <div className="projeto-cx">
              <VideoFundo src={v.video_url} capa={v.capa_url} />
              {!v.capa_url && tipoLink(v.video_url) !== 'arquivo' && <div className="projeto-arte" aria-hidden="true"><img src="/marca/symbol-white.png" alt="" width="199" height="236" /></div>}
              <div className="projeto-sombra" />
              <span className="projeto-rot">Projetos selecionados</span>
              {v.categoria && <span className="projeto-cat">{v.categoria}</span>}
              <div className="projeto-base">
                <h3>{v.cliente_nome || v.titulo}</h3>
                <p>{[v.titulo && v.cliente_nome ? v.titulo : null, v.cliente_arroba ? '@' + String(v.cliente_arroba).replace(/^@/, '') : null].filter(Boolean).join(' · ')}</p>
                <button className="ver" onClick={() => abrir(v.video_url || v.link)}><i><Play /></i>Ver vídeo<Seta /></button>
              </div>
              <span className="projeto-n">{String(k + 1).padStart(2, '0')} / {String(arr.length).padStart(2, '0')}</span>
            </div>
          </article>
        )) : (
          <div className="trabalhos-vazio lim aparece">
            <p className="rotulo">Projetos selecionados</p>
            <h2>Os vídeos dos nossos clientes <em>estão chegando aqui</em>.</h2>
            <Botao href={insta} alvo>Ver no Instagram</Botao>
          </div>
        )}
      </section>

      {/* ============ PROCESSO (preso na rolagem) ============ */}
      <section className="processo" id="processo">
        <div className="processo-palco">
          <div className="processo-ceu" aria-hidden="true" />
          <p className="rotulo centro">Processo de criação</p>
          <h2 className="processo-titulo" aria-label="Do roteiro ao resultado: seis passos">DO ROTEIRO<br />AO RESULTADO<br /><em>SEIS PASSOS</em></h2>
          <div className="processo-centro" aria-hidden="true"><img src="/marca/symbol-white.png" alt="" width="199" height="236" /></div>
          <ol className="processo-passos">
            {PASSOS.map(([t, d], k) => (
              <li key={t} style={{ '--k': k }}><span>{String(k + 1).padStart(2, '0')}</span><b>{t}</b><p>{d}</p></li>
            ))}
          </ol>
          <p className="processo-pe">✦ Do primeiro papo ao vídeo no ar</p>
        </div>
      </section>

      {/* ============ SERVIÇOS ============ */}
      <section className="servicos" id="servicos">
        <div className="lim">
          <p className="rotulo aparece">Serviços</p>
          <h2 className="aparece">Tudo que o seu vídeo precisa para <em>performar</em>.</h2>
          <div className="servicos-lista">
            {servicos.map((s, k) => (
              <article className="servico aparece" key={s.id || k}>
                <span className="servico-n">{/^\d+$/.test(String(s.icone || '')) ? s.icone : (s.icone || String(k + 1).padStart(2, '0'))}</span>
                <h3>{s.titulo}</h3>
                {s.texto && <p>{s.texto}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DEPOIMENTOS ============ */}
      {depo.length > 0 && (
        <section className="depoimentos">
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
                <figure className="depo-tx aparece" key={d.id}>
                  <blockquote>{d.texto}</blockquote>
                  <figcaption><span className="depo-av">{(d.cliente_nome || '?').charAt(0)}</span><span><b>{d.cliente_nome}</b><small>{d.cliente_arroba ? '@' + String(d.cliente_arroba).replace(/^@/, '') : d.titulo}</small></span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CLIENTES ============ */}
      {clientes.length > 0 && (
        <section className="clientes" aria-label="Clientes">
          <p className="rotulo centro">Marcas que confiam na Branding7</p>
          <div className="clientes-faixa"><div className="clientes-in">
            {[0, 1].map(r => clientes.map(c => c.capa_url
              ? <img key={r + c.id} src={c.capa_url} alt={r ? '' : (c.cliente_nome || c.titulo || '')} loading="lazy" />
              : <span key={r + c.id}>{c.cliente_nome || c.titulo}</span>))}
          </div></div>
        </section>
      )}

      {/* ============ REGIÕES ============ */}
      {regioes.length > 0 && (
        <section className="regioes">
          <div className="lim regioes-in">
            <div><p className="rotulo aparece">Onde atendemos</p><h2 className="aparece">Gravação presencial na <em>sua cidade</em>.</h2><p className="aparece">Edição e criativos para todo o Brasil.</p></div>
            <ul>{regioes.map(r => <li key={r} className="aparece">{r}</li>)}</ul>
          </div>
        </section>
      )}

      {/* ============ PERGUNTAS ============ */}
      <section className="faq">
        <div className="lim faq-in">
          <div><p className="rotulo aparece">Dúvidas</p><h2 className="aparece">Antes de começar, <em>tire suas dúvidas</em>.</h2></div>
          <div className="faq-lista">
            {FAQ.map(([p, r], k) => (
              <details key={k} className="aparece"><summary>{p}<i aria-hidden="true">+</i></summary><p>{r}</p></details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTATO ============ */}
      <Contato cfg={cfg} wpp={wpp} />

      <footer className="rodape">
        <div className="lim rodape-in">
          <img src="/marca/logo-white.png" alt="Branding7" width="120" height="47" />
          <nav aria-label="Rodapé">
            <a href={insta} target="_blank" rel="noopener">Instagram</a>
            <a href={wpp} target="_blank" rel="noopener">WhatsApp</a>
            <a href="https://sistema.branding7.com.br/">Área do cliente</a>
          </nav>
          <small>© {new Date().getFullYear()} Branding7 · Núcleo7</small>
        </div>
      </footer>

      {/* navegação em pílula flutuante */}
      <nav className="pilula-nav" aria-label="Principal">
        <img src="/marca/symbol-white.png" alt="" width="20" height="24" />
        {[['inicio', 'Início'], ['trabalhos', 'Trabalhos'], ['processo', 'Processo'], ['servicos', 'Serviços']].map(([id, r]) =>
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

function Contato({ cfg, wpp }) {
  const [msg, setMsg] = useState({ t: '', c: '' });
  const [enviando, setEnviando] = useState(false);
  const [tel, setTel] = useState('');
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
        <form className="form" onSubmit={enviar} noValidate>
          <h3>Pedir um orçamento</h3>
          <label>Seu nome<input name="nome" autoComplete="name" required maxLength={120} /></label>
          <label>WhatsApp com DDD<input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="(77) 99999-9999" value={tel} onChange={e => setTel(mascara(e.target.value))} /></label>
          <div className="form-2">
            <label>Empresa<input name="empresa" autoComplete="organization" maxLength={120} /></label>
            <label>Cidade<input name="cidade" autoComplete="address-level2" maxLength={120} /></label>
          </div>
          <label>O que você precisa?
            <select name="interesse" defaultValue="">
              <option value="">Escolha uma opção</option>
              <option>Vídeos para Reels e TikTok</option>
              <option>Criativos para anúncios</option>
              <option>Gravação e edição</option>
              <option>Gestão de redes sociais</option>
              <option>Ainda não sei, quero conversar</option>
            </select>
          </label>
          <label>Mensagem <small>(opcional)</small><textarea name="mensagem" rows={3} maxLength={1000} /></label>
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
