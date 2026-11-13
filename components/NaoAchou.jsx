'use client';
/* 404: "essa cena não entrou no corte final" — volta ao site ou WhatsApp */
import { useEffect, useState } from 'react';
import { CFG_PADRAO, linkWpp, evento } from '@/lib/dados';
import { T } from '@/lib/textos';
import { Casca, Seta, Zap } from './Casca';

export default function NaoAchou() {
  const [lang, setLang] = useState('pt');
  useEffect(() => { if (/^\/en(\/|$)/.test(location.pathname)) setLang('en'); }, []);
  const t = T[lang];
  return (
    <Casca t={t} cfg={CFG_PADRAO}>
      <section className="n404">
        <div className="n404-luz" aria-hidden="true" />
        <div className="n404-visor" aria-hidden="true"><i /><i /><i /><i /><span><b />REC</span><em>00:00:04:04</em></div>
        <div className="lim n404-in">
          <p className="rotulo">{t.n404Rot}</p>
          <b className="n404-num" aria-hidden="true">4<span>0</span>4</b>
          <h1>{t.n404Tit}</h1>
          <p>{t.n404P}</p>
          <div className="n404-bts">
            <a className="pilula clara" href={t.raiz}><span>{t.n404Voltar}</span><i><Seta /></i></a>
            <a className="pilula-simples n404-zap" href={linkWpp(CFG_PADRAO)} target="_blank" rel="noopener" onClick={() => evento('Contact', { canal: 'whatsapp', origem: '404' })}><Zap />{t.n404Wpp}</a>
          </div>
        </div>
      </section>
    </Casca>
  );
}
