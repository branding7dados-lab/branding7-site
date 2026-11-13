'use client';
/* Página "Sobre a Branding7": história, marcos, equipe e bastidores.
   Tudo editável no Sistema B7 → Site → Sobre nós. */
import { useEffect, useState } from 'react';
import { CFG_PADRAO, carregarSobre } from '@/lib/dados';
import { T } from '@/lib/textos';
import { Casca, Seta } from './Casca';

const S = {
  pt: {
    rot: 'Sobre a Branding7',
    tit: <>A gente conta histórias <em>que vendem</em>.</>,
    hist: ['A Branding7 nasceu para resolver um problema simples: muita marca boa passa despercebida porque não sabe se mostrar. A gente junta estratégia, roteiro, gravação e edição para transformar o que você faz em vídeo que prende, convence e vende.',
      'Somos uma agência de marketing digital especializada em vídeo. Cada projeto começa entendendo o seu negócio e termina olhando os números: o que funcionou vira o ponto de partida do próximo vídeo.'],
    valores: [['Estratégia antes da câmera', 'Todo vídeo tem um objetivo claro: atrair, convencer ou vender.'], ['Ritmo de rede social', 'Gancho nos primeiros segundos, cortes no tempo certo, legenda que segura.'], ['Resultado de verdade', 'Medimos o que trouxe cliente, não só o que deu curtida.']],
    marcos: 'Nossa trajetória', equipe: 'Quem faz', equipeTit: <>As pessoas por trás <em>de cada vídeo</em>.</>,
    bast: 'Bastidores', bastTit: <>Do set à <em>edição</em>.</>,
    ctaTit: <>Bora contar a <em>sua história</em>?</>, ctaP: 'Conte o que você precisa ou marque uma conversa rápida com o nosso time.', ctaOrc: 'Pedir orçamento', ctaAg: 'Marcar uma conversa',
    num: { videos: 'vídeos entregues', posts: 'posts publicados', marcas: 'marcas atendidas agora' }
  },
  en: {
    rot: 'About Branding7',
    tit: <>We tell stories <em>that sell</em>.</>,
    hist: ['Branding7 was born to solve a simple problem: lots of great brands go unnoticed because they don’t know how to show themselves. We bring together strategy, script, shooting and editing to turn what you do into videos that hook, convince and sell.',
      'We are a digital marketing agency specialized in video. Every project starts by understanding your business and ends by looking at the numbers: what worked becomes the starting point for the next video.'],
    valores: [['Strategy before the camera', 'Every video has a clear goal: attract, convince or sell.'], ['Social media pacing', 'A hook in the first seconds, cuts on the beat, captions that hold attention.'], ['Real results', 'We measure what brought customers, not just likes.']],
    marcos: 'Our journey', equipe: 'Who we are', equipeTit: <>The people behind <em>every video</em>.</>,
    bast: 'Behind the scenes', bastTit: <>From set to <em>edit</em>.</>,
    ctaTit: <>Shall we tell <em>your story</em>?</>, ctaP: 'Tell us what you need or book a quick call with our team.', ctaOrc: 'Get a quote', ctaAg: 'Book a call',
    num: { videos: 'videos delivered', posts: 'posts published', marcas: 'brands served right now' }
  }
};

export default function Sobre({ lang = 'pt' }) {
  const t = T[lang], s = S[lang], en = lang === 'en';
  const [d, setD] = useState({ cfg: CFG_PADRAO, equipe: [], bastidores: [], numeros: null });
  const [foto, setFoto] = useState(null);
  useEffect(() => { carregarSobre().then(setD); }, []);
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.aparece:not(.visivel)').forEach((el, k) => { el.style.setProperty('--atraso', (k % 4) * 80 + 'ms'); io.observe(el); });
    return () => io.disconnect();
  }, [d]);
  useEffect(() => {
    if (!foto) return;
    const k = e => { if (e.key === 'Escape') setFoto(null); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [foto]);
  const c = d.cfg;
  /* no inglês, os textos digitados (em português) dão lugar aos padrões */
  const titulo = !en && c.historia_titulo ? c.historia_titulo : s.tit;
  const hist = !en && c.historia ? String(c.historia).split(/\n\s*\n/).map(x => x.trim()).filter(Boolean) : s.hist;
  const marcos = (!en && Array.isArray(c.marcos) ? c.marcos : []).filter(m => m && m.ano);
  const n = d.numeros, red = v => v >= 100 ? '+' + Math.floor(v / 10) * 10 : v > 0 ? '+' + v : null;
  const nums = n ? [[red(n.videos), s.num.videos], [red(n.posts), s.num.posts], [n.marcas > 0 ? String(n.marcas) : null, s.num.marcas]].filter(x => x[0]) : [];
  return (
    <Casca t={t} cfg={c} outra={en ? '/sobre/' : '/en/about/'}>
      <section className="sb-heroi">
        <div className="sb-luz" aria-hidden="true" />
        <div className="lim">
          <p className="rotulo aparece">{s.rot}</p>
          <h1 className="aparece">{titulo}</h1>
          <div className="sb-hist">{hist.map((p, k) => <p key={k} className="aparece">{p}</p>)}</div>
          {nums.length > 0 && <div className="sb-nums">{nums.map(([v, r]) => <div key={r} className="aparece"><b>{v}</b><small>{r}</small></div>)}</div>}
        </div>
      </section>

      <section className="sb-valores">
        <div className="lim sb-valores-in">
          {s.valores.map(([v, p], k) => <article key={v} className="aparece"><span>{String(k + 1).padStart(2, '0')}</span><h3>{v}</h3><p>{p}</p></article>)}
        </div>
      </section>

      {marcos.length > 0 && (
        <section className="sb-marcos">
          <div className="lim">
            <p className="rotulo aparece">{s.marcos}</p>
            <ol>{marcos.map((m, k) => <li key={k} className="aparece"><b>{m.ano}</b><p>{m.tx}</p></li>)}</ol>
          </div>
        </section>
      )}

      {d.equipe.length > 0 && (
        <section className="sb-equipe">
          <div className="lim">
            <p className="rotulo aparece">{s.equipe}</p>
            <h2 className="aparece">{s.equipeTit}</h2>
            <div className="sb-pessoas">
              {d.equipe.map(p => (
                <figure key={p.id} className="sb-pessoa aparece">
                  <span className="sb-foto">{p.capa_url ? <img src={p.capa_url} alt={p.titulo || ''} loading="lazy" /> : <i>{(p.titulo || '?').charAt(0)}</i>}</span>
                  <figcaption><b>{p.titulo}</b>{p.texto && <small>{p.texto}</small>}
                    {p.cliente_arroba && <a href={'https://www.instagram.com/' + String(p.cliente_arroba).replace(/^@/, '') + '/'} target="_blank" rel="noopener">@{String(p.cliente_arroba).replace(/^@/, '')}</a>}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {d.bastidores.length > 0 && (
        <section className="sb-bast">
          <div className="lim">
            <p className="rotulo aparece">{s.bast}</p>
            <h2 className="aparece">{s.bastTit}</h2>
          </div>
          <div className="sb-galeria">
            {d.bastidores.map((b, k) => (
              <button key={b.id} className={'sb-ft aparece' + (k % 5 === 0 ? ' alta' : '')} onClick={() => setFoto(b)} aria-label={b.titulo || s.bast}>
                <img src={b.capa_url} alt={b.titulo || ''} loading="lazy" />
                {b.titulo && <span>{b.titulo}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="sb-cta">
        <div className="lim">
          <h2 className="aparece">{s.ctaTit}</h2>
          <p className="aparece">{s.ctaP}</p>
          <div className="sb-cta-bts aparece">
            <a className="pilula clara" href={t.raiz + '#contato'}><span>{s.ctaOrc}</span><i><Seta /></i></a>
            <a className="pilula-simples" href={t.raiz + '#agendar'}>{s.ctaAg}</a>
          </div>
        </div>
      </section>

      {foto && (
        <div className="sb-zoom" role="dialog" aria-modal="true" onClick={() => setFoto(null)}>
          <button aria-label={t.fechar}>×</button>
          <img src={foto.capa_url} alt={foto.titulo || ''} />
          {foto.titulo && <p>{foto.titulo}</p>}
        </div>
      )}
    </Casca>
  );
}
