'use client';
/* Partes comuns às páginas internas (Sobre, Privacidade, 404) e o aviso de
   cookies (LGPD): o Pixel da Meta e o Google Analytics só carregam depois
   que o visitante aceita. A contagem própria do site (Sistema B7 → Métricas)
   não usa cookie nem dado pessoal, então roda sempre. */
import { useEffect, useState } from 'react';
import { CFG_PADRAO, linkWpp, evento } from '@/lib/dados';

const CHAVE = 'b7_cookies';
export const escolha = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
export function escolher(v) {
  try { localStorage.setItem(CHAVE, v); } catch (e) {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('b7-cookies'));
}
const temRastro = cfg => !!(String(cfg.pixel_meta || '').replace(/\D/g, '') || /^G-[A-Z0-9]+$/i.test(String(cfg.ga4 || '').trim()));

/* Pixel da Meta e Google Analytics: os códigos ficam no sistema (tela Site) */
export function rastreadores(cfg) {
  if (typeof window === 'undefined') return;
  window.__b7Cfg = cfg;
  if (escolha() !== 'sim' || window.__b7Rastro) return;
  window.__b7Rastro = 1;
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

/* aviso de cookies: só aparece se o site usa Pixel/Analytics e a pessoa
   ainda não escolheu */
export function Cookies({ t, cfg }) {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const f = () => setVer(temRastro(cfg) && !escolha());
    f(); addEventListener('b7-cookies', f); return () => removeEventListener('b7-cookies', f);
  }, [cfg]);
  if (!ver) return null;
  return (
    <div className="cookies" role="dialog" aria-live="polite" aria-label="Cookies">
      <p>{t.ckTx} <a href={t.privPag}>{t.ckMais}</a></p>
      <div>
        <button className="ck-nao" onClick={() => escolher('nao')}>{t.ckNao}</button>
        <button className="ck-sim" onClick={() => { escolher('sim'); rastreadores(cfg); }}>{t.ckSim}</button>
      </div>
    </div>
  );
}

const Seta = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
export const Zap = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.6l4.9-1.3A9.8 9.8 0 1 0 12 2.2zm4.4 11.8c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.2z" /></svg>);
export { Seta };

/* cabeçalho, rodapé, WhatsApp e cookies das páginas internas */
export function Casca({ t, cfg = CFG_PADRAO, children, outra }) {
  useEffect(() => { document.documentElement.lang = t.lang; }, [t.lang]);
  useEffect(() => { rastreadores(cfg); }, [cfg]);
  const wpp = linkWpp(cfg);
  const insta = 'https://www.instagram.com/' + String(cfg.instagram || 'b7.agencia').replace(/^@/, '') + '/';
  const zap = () => evento('Contact', { canal: 'whatsapp' });
  return (
    <div className="casca">
      <header className="casca-topo">
        <a href={t.raiz} aria-label="Branding7"><img src="/marca/logo-white-300.png" alt="Branding7" width="112" height="44" /></a>
        <nav aria-label={t.navAria}>
          <a href={t.raiz + '#trabalhos'}>{t.nav.trabalhos}</a>
          <a href={t.sobrePag}>{t.nav.sobre}</a>
          <Idiomas t={t} outra={outra} />
          <a className="casca-cta" href={t.raiz + '#contato'}>{t.orcCurto}<i><Seta /></i></a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="rodape casca-rodape">
        <div className="lim rodape-in">
          <img src="/marca/logo-white-300.png" alt="Branding7" width="120" height="47" />
          <nav aria-label={t.rodapeAria}>
            <a href={t.raiz}>{t.nav.inicio}</a>
            <a href={t.sobrePag}>{t.sobreNos}</a>
            <a href={insta} target="_blank" rel="noopener">Instagram</a>
            <a href={wpp} target="_blank" rel="noopener" onClick={zap}>WhatsApp</a>
            <a href={t.privPag}>{t.privacidade}</a>
          </nav>
          <small>© {new Date().getFullYear()} Branding7 · Núcleo7</small>
        </div>
      </footer>
      <a className="wpp-flutua casca-wpp" href={wpp} target="_blank" rel="noopener" aria-label={t.wppAria} onClick={zap}><Zap /></a>
      <Cookies t={t} cfg={cfg} />
    </div>
  );
}

/* bandeiras para trocar o idioma (SVG: o emoji de bandeira não aparece no Windows) */
export const BandeiraBR = () => (
  <svg viewBox="0 0 28 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="28" height="20" fill="#009b3a" /><path d="M14 2.2 25.6 10 14 17.8 2.4 10z" fill="#fedf00" />
    <circle cx="14" cy="10" r="4.6" fill="#002776" /><path d="M9.6 9.1c2.9-.5 6.1.1 8.7 1.6l-.3.9c-2.5-1.4-5.5-2-8.3-1.5z" fill="#fff" /></svg>
);
export const BandeiraUS = () => (
  <svg viewBox="0 0 28 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="28" height="20" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map(k => <rect key={k} y={k * 20 / 13} width="28" height={20 / 13} fill="#b22234" />)}
    <rect width="12.4" height={20 * 7 / 13} fill="#3c3b6e" />
    {[[2, 2], [5, 2], [8, 2], [11, 2], [3.5, 4.2], [6.5, 4.2], [9.5, 4.2], [2, 6.4], [5, 6.4], [8, 6.4], [11, 6.4], [3.5, 8.6], [6.5, 8.6], [9.5, 8.6]].map(([x, y], k) => <circle key={k} cx={x - .5} cy={y + .2} r=".55" fill="#fff" />)}</svg>
);
/* seletor: as duas bandeiras, a do idioma atual acesa; a outra leva à outra versão */
export function Idiomas({ t, outra, className = '' }) {
  const en = t.lang === 'en';
  const alvo = outra || t.outra;
  return (
    <span className={'idiomas ' + className} role="group" aria-label={en ? 'Language' : 'Idioma'}>
      <a href={en ? alvo : '#'} hrefLang="pt-BR" lang="pt-BR" className={en ? '' : 'on'} aria-current={en ? undefined : 'true'} title="Português" aria-label="Português"
        onClick={e => { if (!en) e.preventDefault(); }}><BandeiraBR /></a>
      <a href={en ? '#' : alvo} hrefLang="en" lang="en" className={en ? 'on' : ''} aria-current={en ? 'true' : undefined} title="English" aria-label="English"
        onClick={e => { if (en) e.preventDefault(); }}><BandeiraUS /></a>
    </span>
  );
}
