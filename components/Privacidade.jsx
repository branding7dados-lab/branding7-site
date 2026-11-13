'use client';
/* Política de privacidade (LGPD) em português e inglês, com o botão para
   mudar a escolha de cookies a qualquer momento. */
import { useEffect, useState } from 'react';
import { CFG_PADRAO, carregar } from '@/lib/dados';
import { T } from '@/lib/textos';
import { Casca, escolha, escolher, rastreadores } from './Casca';

const P = {
  pt: {
    rot: 'Privacidade', tit: <>Política de <em>privacidade</em>.</>, atualizado: 'Atualizada em 13 de novembro de 2026.',
    secoes: [
      ['Quem somos', 'Este site é da Branding7, agência de marketing digital especializada em vídeo (grupo Núcleo7). A Branding7 é a controladora dos dados pessoais tratados por meio deste site, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).'],
      ['Que dados coletamos', 'Quando você preenche o formulário de orçamento ou marca uma conversa, coletamos: nome, WhatsApp, empresa, cidade, o serviço de interesse, a mensagem que você escreveu e, no agendamento, o dia e o horário escolhidos. Também guardamos de onde a visita veio (por exemplo, o nome da campanha do anúncio), sem o seu endereço IP.'],
      ['Medição do site', 'Para saber quantas pessoas visitam o site e quais partes funcionam, registramos eventos anônimos (visita, clique no WhatsApp, envio do formulário) ligados a um código aleatório da sua sessão. Esse registro não usa cookies e não identifica você.'],
      ['Cookies de terceiros', 'Com a sua permissão, usamos o Pixel da Meta (Facebook e Instagram) e o Google Analytics para medir o resultado dos nossos anúncios. Esses serviços usam cookies e podem tratar dados de navegação conforme as políticas da Meta e do Google. Se você não aceitar, eles não são carregados. Você pode mudar a sua escolha abaixo a qualquer momento.'],
      ['Para que usamos', 'Usamos os seus dados para responder ao seu pedido, preparar o orçamento, confirmar e realizar a conversa marcada e, se você virar cliente, para prestar o serviço. A base legal é o seu pedido (procedimentos preliminares a um contrato) e o nosso legítimo interesse em melhorar o site e os anúncios.'],
      ['Com quem compartilhamos', 'Não vendemos os seus dados. Eles ficam guardados em servidores de provedores de tecnologia contratados pela Branding7 (banco de dados e hospedagem) e podem ser acessados pela equipe comercial do grupo Núcleo7 para fazer o atendimento. A conversa continua no WhatsApp, serviço da Meta.'],
      ['Por quanto tempo', 'Guardamos os dados de contato enquanto houver conversa ou relação comercial, e depois pelo tempo necessário para cumprir obrigações legais. Você pode pedir a exclusão antes disso.'],
      ['Seus direitos', 'Você pode pedir a qualquer momento para confirmar se temos dados seus, acessar, corrigir, apagar, ou retirar o consentimento. É só chamar no WhatsApp ou no Instagram da Branding7 com o seu pedido; respondemos em até 15 dias.']
    ],
    ck: 'Sua escolha de cookies', ckAtual: { sim: 'Você aceitou os cookies de medição.', nao: 'Você recusou os cookies de medição.', nada: 'Você ainda não escolheu.' },
    ckSim: 'Aceitar cookies', ckNao: 'Recusar cookies', contato: 'Falar com a gente'
  },
  en: {
    rot: 'Privacy', tit: <>Privacy <em>policy</em>.</>, atualizado: 'Last updated on November 13, 2026.',
    secoes: [
      ['Who we are', 'This website belongs to Branding7, a digital marketing agency specialized in video (Núcleo7 group). Branding7 is the controller of the personal data processed through this website, under Brazil’s General Data Protection Law (LGPD, Law 13,709/2018).'],
      ['What we collect', 'When you fill in the quote form or book a call, we collect: name, WhatsApp number, company, city, the service you are interested in, your message and, for bookings, the chosen day and time. We also keep where the visit came from (for example, the ad campaign name), without your IP address.'],
      ['Website measurement', 'To know how many people visit the site and which parts work, we record anonymous events (visit, WhatsApp click, form submission) linked to a random session code. This does not use cookies and does not identify you.'],
      ['Third-party cookies', 'With your permission, we use the Meta Pixel (Facebook and Instagram) and Google Analytics to measure our ads. These services use cookies and may process browsing data under Meta’s and Google’s policies. If you decline, they are not loaded. You can change your choice below at any time.'],
      ['How we use it', 'We use your data to answer your request, prepare the quote, confirm and hold the booked call and, if you become a client, to provide the service. The legal basis is your request (steps prior to a contract) and our legitimate interest in improving the site and our ads.'],
      ['Who we share it with', 'We do not sell your data. It is stored on servers of technology providers hired by Branding7 (database and hosting) and may be accessed by the Núcleo7 group sales team to assist you. The conversation continues on WhatsApp, a Meta service.'],
      ['How long we keep it', 'We keep contact data while there is a conversation or business relationship, and afterwards for as long as legal obligations require. You can ask us to delete it sooner.'],
      ['Your rights', 'You can ask at any time to confirm whether we hold your data, access, correct or delete it, or withdraw your consent. Just message Branding7 on WhatsApp or Instagram; we reply within 15 days.']
    ],
    ck: 'Your cookie choice', ckAtual: { sim: 'You accepted measurement cookies.', nao: 'You declined measurement cookies.', nada: 'You haven’t chosen yet.' },
    ckSim: 'Accept cookies', ckNao: 'Decline cookies', contato: 'Talk to us'
  }
};

export default function Privacidade({ lang = 'pt' }) {
  const t = T[lang], p = P[lang];
  const [cfg, setCfg] = useState(CFG_PADRAO);
  const [ck, setCk] = useState(null);
  useEffect(() => { carregar().then(r => setCfg(r.cfg)); }, []);
  useEffect(() => { const f = () => setCk(escolha() || 'nada'); f(); addEventListener('b7-cookies', f); return () => removeEventListener('b7-cookies', f); }, []);
  const mudar = v => {
    escolher(v);
    if (v === 'sim') rastreadores(cfg);
    /* recusar depois de aceitar: recarrega para descarregar o Pixel/Analytics */
    if (v === 'nao' && typeof window !== 'undefined' && window.__b7Rastro) location.reload();
  };
  return (
    <Casca t={t} cfg={cfg} outra={lang === 'en' ? '/privacidade/' : '/en/privacy/'}>
      <article className="lim priv">
        <p className="rotulo">{p.rot}</p>
        <h1>{p.tit}</h1>
        <p className="priv-data">{p.atualizado}</p>
        {p.secoes.map(([h, tx]) => <section key={h}><h2>{h}</h2><p>{tx}</p></section>)}
        <section className="priv-ck">
          <h2>{p.ck}</h2>
          <p>{ck ? p.ckAtual[ck] || p.ckAtual.nada : ''}</p>
          <div>
            <button className={'pilula-simples' + (ck === 'sim' ? ' on' : '')} onClick={() => mudar('sim')}>{p.ckSim}</button>
            <button className={'pilula-simples' + (ck === 'nao' ? ' on' : '')} onClick={() => mudar('nao')}>{p.ckNao}</button>
          </div>
        </section>
      </article>
    </Casca>
  );
}
