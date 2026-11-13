/* O conteúdo do site vem do Sistema B7 (tela "Site"), lido no navegador
   com a chave pública do banco. Só o que está publicado. */
export const SB = 'https://rartcafydsaocdzshqcx.supabase.co';
export const CHAVE = 'sb_publishable_N9Ha9Gwmh-jJsXaI5oY7Lw_dY4XAb8e';
const H = { apikey: CHAVE, Authorization: 'Bearer ' + CHAVE };

export const CFG_PADRAO = {
  whatsapp: '5577981223827',
  whatsapp_nome: 'Gabriel Martins',
  whatsapp_cargo: 'Gestor comercial',
  whatsapp_msg: 'Olá, Gabriel! Vim pelo site da Branding7 e quero saber mais sobre os vídeos.',
  instagram: 'b7.agencia',
  titulo: 'O vídeo que faz você vender.',
  subtitulo: 'Criativos em vídeo que viralizam, performam e trazem cliente. Do roteiro à edição, a Branding7 cuida de tudo.',
  palavras: ['vender', 'viralizar', 'performar'],
  regioes: [],
  numeros: []
};

export const SERVICOS_PADRAO = [
  { icone: '01', titulo: 'Vídeos para Reels e TikTok', texto: 'Conteúdo vertical com gancho forte, ritmo e legenda, feito para prender e engajar.' },
  { icone: '02', titulo: 'Criativos para anúncios', texto: 'Versões pensadas para tráfego pago: testes de gancho, chamadas e formatos que convertem.' },
  { icone: '03', titulo: 'Gravação profissional', texto: 'Equipe, câmera, luz e direção. Você só aparece; a gente cuida do resto.' },
  { icone: '04', titulo: 'Edição e pós-produção', texto: 'Cortes no tempo das redes, trilha, legendas e a identidade da sua marca.' },
  { icone: '05', titulo: 'Roteiro e estratégia', texto: 'Linha editorial e roteiros que falam com o seu público e levam à venda.' },
  { icone: '06', titulo: 'Gestão de redes', texto: 'Planejamento, publicação e acompanhamento dos resultados mês a mês.' }
];

export async function carregar() {
  const pega = u => fetch(SB + u, { headers: H }).then(r => (r.ok ? r.json() : [])).catch(() => []);
  const [c, itens, cli, num] = await Promise.all([
    pega('/rest/v1/site_config?id=eq.1&select=dados'),
    pega('/rest/v1/site_itens?publicado=eq.true&select=*&order=ordem.asc,created_at.desc'),
    pega('/rest/v1/rpc/site_clientes'),
    pega('/rest/v1/rpc/site_numeros')
  ]);
  /* clientes do sistema marcados "no site" entram antes das marcas avulsas */
  /* vídeo de link (Instagram/YouTube) ainda sem capa: pede ao servidor para
     buscar; aparece na próxima visita (o painel também faz isso ao salvar) */
  try {
    if ((Array.isArray(itens) ? itens : []).some(i => i.video_url && !i.capa_url && /instagram\.com|youtu/i.test(i.video_url)))
      fetch(SB + '/functions/v1/site-capa', { method: 'POST', headers: { 'Content-Type': 'application/json', ...H }, body: '{}', keepalive: true }).catch(() => {});
  } catch (e) {}
  const doSistema = (Array.isArray(cli) ? cli : []).map((x, k) => ({ id: 'b7-' + k, tipo: 'cliente', cliente_nome: x.nome, capa_url: x.logo_url }));
  return { cfg: { ...CFG_PADRAO, ...((c && c[0] && c[0].dados) || {}) }, itens: doSistema.concat(Array.isArray(itens) ? itens : []),
    numeros: num && !Array.isArray(num) ? num : null };
}

export async function enviarLead(d, origem) {
  const r = await fetch(SB + '/rest/v1/rpc/site_lead_enviar', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...H },
    body: JSON.stringify({ p_nome: d.nome, p_whatsapp: d.whatsapp, p_empresa: d.empresa || null, p_cidade: d.cidade || null,
      p_interesse: d.interesse || null, p_mensagem: d.mensagem || null, p_origem: origem || {} })
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || 'Não foi possível enviar.'); }
  return true;
}

export const linkWpp = (cfg, extra) => 'https://wa.me/' + String(cfg.whatsapp || '').replace(/\D/g, '') +
  '?text=' + encodeURIComponent((cfg.whatsapp_msg || '') + (extra ? '\n\n' + extra : ''));

/* vídeo: arquivo próprio, Instagram, YouTube ou Drive */
export function tipoLink(u) {
  u = String(u || '');
  if (/instagram\.com\/(reel|p|tv)\//i.test(u)) return 'instagram';
  if (/youtu\.?be/i.test(u)) return 'youtube';
  if (/drive\.google\.com/i.test(u)) return 'drive';
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(u) || /supabase\.co\/storage/i.test(u)) return 'arquivo';
  return 'link';
}
export function embed(u) {
  const t = tipoLink(u);
  if (t === 'instagram') { const m = u.match(/instagram\.com\/(reel|p|tv)\/([^/?#]+)/i); return m ? `https://www.instagram.com/${m[1] === 'tv' ? 'p' : m[1]}/${m[2]}/embed/` : null; }
  if (t === 'youtube') { const m = u.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{6,})/); return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0&playsinline=1` : null; }
  if (t === 'drive') { const m = u.match(/\/d\/([\w-]+)/) || u.match(/id=([\w-]+)/); return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null; }
  return null;
}

export function origemDaVisita() {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(location.search), o = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(k => { if (p.get(k)) o[k] = p.get(k).slice(0, 120); });
  try {
    if (Object.keys(o).length) sessionStorage.setItem('b7_origem', JSON.stringify(o));
    else Object.assign(o, JSON.parse(sessionStorage.getItem('b7_origem') || '{}'));
  } catch (e) {}
  if (document.referrer && !/branding7\.com\.br/.test(document.referrer)) o.referrer = document.referrer.slice(0, 200);
  return o;
}

/* contagem própria (Sistema B7 → Site → Métricas): sessão aleatória do
   navegador, sem cookie e sem dado pessoal */
const TIPO_B7 = { PageView: 'visita', Engajou: 'engajou', ViewContent: 'video', Contact: 'whatsapp', Formulario: 'formulario', Lead: 'lead', Instagram: 'instagram' };
function sessao() {
  try {
    let s = sessionStorage.getItem('b7_sessao');
    if (!s) { s = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); sessionStorage.setItem('b7_sessao', s); }
    return s;
  } catch (e) { return 'semstorage' + Math.random().toString(36).slice(2, 10); }
}
export function registrar(nome) {
  const tipo = TIPO_B7[nome]; if (!tipo || typeof window === 'undefined') return;
  const w = innerWidth, disp = w < 700 ? 'celular' : w < 1100 && matchMedia('(pointer: coarse)').matches ? 'tablet' : 'computador';
  try {
    fetch(SB + '/rest/v1/rpc/site_evento', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', ...H },
      body: JSON.stringify({ p_sessao: sessao(), p_tipo: tipo, p_origem: origemDaVisita(), p_pagina: location.pathname, p_dispositivo: disp }) }).catch(() => {});
  } catch (e) {}
}

export function evento(nome, dados) {
  registrar(nome);
  if (nome === 'Engajou' || nome === 'Formulario' || nome === 'Instagram') return;
  try { if (window.fbq) window.fbq('track', nome, dados || {}); } catch (e) {}
  try { if (window.gtag) window.gtag('event', nome === 'Lead' ? 'generate_lead' : nome === 'Contact' ? 'contact' : nome, dados || {}); } catch (e) {}
}

/* agendamento de conversa (Sistema B7 → Site → Agenda) */
export async function horariosLivres() {
  try {
    const r = await fetch(SB + '/rest/v1/rpc/site_horarios', { method: 'POST', headers: { 'Content-Type': 'application/json', ...H }, body: '{"p_dias":45}' });
    const j = r.ok ? await r.json() : null;
    return j && typeof j === 'object' && !Array.isArray(j) ? j : { ativo: false, horarios: [] };
  } catch (e) { return { ativo: false, horarios: [] }; }
}
export async function agendar(d, origem) {
  const r = await fetch(SB + '/rest/v1/rpc/site_agendar', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...H },
    body: JSON.stringify({ p_nome: d.nome, p_whatsapp: d.whatsapp, p_inicio: d.inicio, p_empresa: d.empresa || null, p_cidade: d.cidade || null,
      p_interesse: d.interesse || null, p_mensagem: d.mensagem || null, p_origem: origem || {} })
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || 'Não foi possível marcar.'); }
  return r.json();
}

/* conteúdo da página Sobre: história (site_config) + equipe e bastidores */
export async function carregarSobre() {
  const pega = u => fetch(SB + u, { headers: H }).then(r => (r.ok ? r.json() : [])).catch(() => []);
  const [c, itens, num] = await Promise.all([
    pega('/rest/v1/site_config?id=eq.1&select=dados'),
    pega('/rest/v1/site_itens?publicado=eq.true&tipo=in.(equipe,bastidor,cliente)&select=*&order=ordem.asc,created_at.desc'),
    pega('/rest/v1/rpc/site_numeros')
  ]);
  const l = Array.isArray(itens) ? itens : [];
  return { cfg: { ...CFG_PADRAO, ...((c && c[0] && c[0].dados) || {}) }, equipe: l.filter(i => i.tipo === 'equipe'), bastidores: l.filter(i => i.tipo === 'bastidor'),
    numeros: num && !Array.isArray(num) ? num : null };
}
