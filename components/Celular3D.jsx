'use client';
/* Celular 3D rodando os vídeos dos clientes (pedido do Kevin: no lugar
   da câmera). Modelado só com formas do three.js, sem arquivo externo.
   A tela é um canvas: quadro do vídeo (arquivo enviado em Site → Vídeos)
   ou, sem vídeo, um "story" com o logo do cliente; por cima, a interface
   de Reels (barrinhas, @, curtidas). Gira com a rolagem da seção, segue o
   mouse, dá para arrastar e tocar para passar. Só desenha quando aparece. */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TW = 540, TH = 1170;          /* tela 9:19,5 (coordenadas de desenho) */
const ESC = 2;                      /* o canvas tem o dobro: 1080×2340, nítido de perto */
const W = 7.4, H = 16, P = .82, R = 1.15;

function retanguloRedondo(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 24), uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  return g;
}

function carregarImg(src) {
  return new Promise(ok => { if (!src) return ok(null); const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
}

function montarCelular(texTela) {
  const cel = new THREE.Group();
  const aro = new THREE.MeshStandardMaterial({ color: 0x2b2440, roughness: .3, metalness: .9 });
  const traseira = new THREE.MeshStandardMaterial({ color: 0x2a1d47, roughness: .25, metalness: .4 });
  const vidroPreto = new THREE.MeshStandardMaterial({ color: 0x050308, roughness: .08, metalness: .2 });
  const lenteMat = new THREE.MeshStandardMaterial({ color: 0x0a0618, roughness: .05, metalness: .6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xbfb8d6, roughness: .25, metalness: 1 });

  /* corpo: aro metálico e a traseira de vidro */
  cel.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, P, 5, R * .62), aro));
  const tras = new THREE.Mesh(retanguloRedondo(W - .12, H - .12, R - .05), traseira);
  tras.rotation.y = Math.PI; tras.position.z = -P / 2 - .002; cel.add(tras);
  /* frente: moldura preta + tela */
  const frente = new THREE.Mesh(retanguloRedondo(W - .1, H - .1, R - .05), vidroPreto);
  frente.position.z = P / 2 + .002; cel.add(frente);
  const tela = new THREE.Mesh(retanguloRedondo(W - .48, H - .48, R - .25),
    new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }));
  tela.position.z = P / 2 + .006; cel.add(tela);
  /* reflexo sutil no vidro */


  /* botões laterais */
  const botao = (y, h, lado) => { const b = new THREE.Mesh(new RoundedBoxGeometry(.16, h, .34, 4, .07), aro); b.position.set(lado * (W / 2 + .05), y, 0); cel.add(b); };
  botao(3.6, 1.1, -1); botao(2.0, 1.6, -1); botao(.2, 1.6, -1); botao(2.6, 2.4, 1);

  /* módulo de câmeras na traseira */
  const modulo = new THREE.Mesh(new RoundedBoxGeometry(3.3, 3.3, .3, 4, .75), new THREE.MeshStandardMaterial({ color: 0x1a1230, roughness: .2, metalness: .5 }));
  modulo.position.set(W / 2 - 2.15, H / 2 - 2.15, -P / 2 - .12); cel.add(modulo);
  const lente = (x, y, r) => {
    const g = new THREE.Group(); g.position.set(modulo.position.x + x, modulo.position.y + y, -P / 2 - .3);
    const anel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .22, 48), metal); anel.rotation.x = Math.PI / 2; g.add(anel);
    const vid = new THREE.Mesh(new THREE.CylinderGeometry(r * .78, r * .78, .24, 48), lenteMat); vid.rotation.x = Math.PI / 2; vid.position.z = -.01; g.add(vid);
    cel.add(g);
  };
  lente(-.72, .72, .62); lente(-.72, -.72, .62); lente(.78, 0, .55);
  const flash = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .05, 24), new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffe9b8, emissiveIntensity: .4 }));
  flash.rotation.x = Math.PI / 2; flash.position.set(modulo.position.x + .78, modulo.position.y + 1.02, -P / 2 - .28); cel.add(flash);
  return { cel };
}

export default function Celular3D({ progresso, midias = [] }) {
  const caixa = useRef(null);
  const listaRef = useRef(midias);
  listaRef.current = midias;

  useEffect(() => {
    const el = caixa.current; if (!el) return;
    let render;
    try { render = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { el.classList.add('sem-3d'); return; }
    const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    render.outputColorSpace = THREE.SRGBColorSpace; render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 1.1;
    el.appendChild(render.domElement);
    const cena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(render);
    cena.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    const olho = new THREE.PerspectiveCamera(30, 1, .1, 200); olho.position.set(0, 0, 40); olho.lookAt(0, 0, 0);
    cena.add(new THREE.AmbientLight(0xffffff, .3));
    const luzRosa = new THREE.PointLight(0xff4fb0, 520, 70); luzRosa.position.set(14, 8, 10); cena.add(luzRosa);
    const luzRoxa = new THREE.PointLight(0x6a4dff, 560, 70); luzRoxa.position.set(-14, -2, 8); cena.add(luzRoxa);
    const chave = new THREE.DirectionalLight(0xffffff, 1.2); chave.position.set(4, 12, 16); cena.add(chave);
    const contra = new THREE.DirectionalLight(0xc9b8ff, .9); contra.position.set(-6, 4, -14); cena.add(contra);

    /* ---------- a tela (canvas) ---------- */
    const cv = document.createElement('canvas'); cv.width = TW * ESC; cv.height = TH * ESC;
    const g = cv.getContext('2d');
    const texTela = new THREE.CanvasTexture(cv); texTela.colorSpace = THREE.SRGBColorSpace;
    /* sem mipmap (era o que deixava a tela borrada) e com o filtro máximo da placa */
    texTela.generateMipmaps = false; texTela.minFilter = THREE.LinearFilter; texTela.magFilter = THREE.LinearFilter;
    texTela.anisotropy = render.capabilities.getMaxAnisotropy();
    const { cel } = montarCelular(texTela);
    const giro = new THREE.Group(); giro.add(cel); cena.add(giro);

    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.crossOrigin = 'anonymous'; video.preload = 'auto'; video.setAttribute('playsinline', '');
    const imgs = new Map();
    const pegaImg = src => { if (!src) return null; if (!imgs.has(src)) { imgs.set(src, null); carregarImg(src).then(i => imgs.set(src, i)); } return imgs.get(src); };
    let simbolo = null; carregarImg('/marca/symbol-white.png').then(i => { simbolo = i; });

    let atual = 0, inicio = performance.now(), videoPronto = false, curtidas = 0;
    const lista = () => (listaRef.current && listaRef.current.length ? listaRef.current : [{ nome: 'Branding7', arroba: 'b7.agencia' }]);
    const DUR = 5200;
    function trocar(n) {
      const L = lista(); atual = ((n % L.length) + L.length) % L.length; inicio = performance.now(); videoPronto = false;
      curtidas = 800 + Math.floor(Math.random() * 9000);
      const m = L[atual];
      if (m.video) { video.src = m.video; video.currentTime = 0; video.play().catch(() => {}); }
      else { video.removeAttribute('src'); try { video.load(); } catch (e) {} }
    }
    video.addEventListener('loadeddata', () => { videoPronto = true; });
    video.addEventListener('ended', () => trocar(atual + 1));
    trocar(0);

    const cobrir = (img, iw, ih) => { const s = Math.max(TW / iw, TH / ih), w = iw * s, h = ih * s; g.drawImage(img, (TW - w) / 2, (TH - h) / 2, w, h); };
    const redondo = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    /* texto que cabe: diminui a fonte até caber; se ainda não couber, corta com "…" */
    const caber = (txt, peso, max, min, larg) => {
      txt = String(txt || ''); let t = max;
      for (; t > min; t -= 2) { g.font = peso + ' ' + t + 'px Sora, Inter, Arial'; if (g.measureText(txt).width <= larg) return txt; }
      g.font = peso + ' ' + min + 'px Sora, Inter, Arial';
      return txt;   /* o corte com "…" fica com cortar() */
    };
    const cortar = (txt, larg) => { txt = String(txt || ''); if (g.measureText(txt).width <= larg) return txt;
      while (txt.length > 1 && g.measureText(txt + '…').width > larg) txt = txt.slice(0, -1); return txt + '…'; };
    const coracao = (x, y, s) => { g.beginPath(); g.moveTo(x, y + s * .3); g.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3); g.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s);
      g.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3); g.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); g.fill(); };

    function desenhar(agora) {
      g.setTransform(ESC, 0, 0, ESC, 0, 0); g.imageSmoothingQuality = 'high';
      const L = lista(), m = L[atual % L.length] || {};
      const t = (agora - inicio) / (m.video && videoPronto && video.duration ? video.duration * 1000 : DUR);
      if (!m.video && t >= 1) trocar(atual + 1);
      /* fundo */
      const capa = m.capa ? pegaImg(m.capa) : null;
      if (m.video && videoPronto && video.videoWidth) cobrir(video, video.videoWidth, video.videoHeight);
      else if (m.capa && !capa) { return; }   /* capa ainda carregando: mantém a tela anterior */
      else if (capa) {   /* vídeo de link (Instagram/YouTube): a capa */
        cobrir(capa, capa.width, capa.height);
      }
      else {
        const k = agora / 1000;
        const gr = g.createLinearGradient(0, 0, TW, TH);
        gr.addColorStop(0, '#1b2a8f'); gr.addColorStop(.38, '#5B2BC6'); gr.addColorStop(.7, '#9A2AA8'); gr.addColorStop(1, '#E2409C');
        g.fillStyle = gr; g.fillRect(0, 0, TW, TH);
        for (let i = 0; i < 3; i++) {   /* luzes que passeiam */
          const x = TW / 2 + Math.sin(k * .7 + i * 2.1) * 220, y = TH * (.3 + i * .22) + Math.cos(k * .5 + i) * 120;
          const rg = g.createRadialGradient(x, y, 0, x, y, 340); rg.addColorStop(0, 'rgba(255,255,255,.22)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = rg; g.fillRect(0, 0, TW, TH);
        }
        const logo = pegaImg(m.logo);
        const e = Math.min(1, (agora - inicio) / 600), ease = 1 - Math.pow(1 - e, 3);
        const lado = 300 * (.86 + .14 * ease), lx = (TW - lado) / 2, ly = TH * .38 - lado / 2 + (1 - ease) * 40;
        g.save(); g.globalAlpha = ease;
        g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 60; g.shadowOffsetY = 24;
        redondo(lx, ly, lado, lado, 64); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
        g.clip();
        if (logo) g.drawImage(logo, lx, ly, lado, lado);
        else if (simbolo) { const s = lado * .5; g.fillStyle = '#5B2BC6'; g.fillRect(lx, ly, lado, lado); g.drawImage(simbolo, lx + (lado - s * .84) / 2, ly + (lado - s) / 2, s * .84, s); }
        g.restore();
        g.globalAlpha = ease; g.fillStyle = '#fff'; g.textAlign = 'center';
        const nomeT = caber(m.nome || 'Branding7', '700', 46, 30, TW - 70);
        g.fillText(cortar(nomeT, TW - 70), TW / 2, TH * .38 + lado / 2 + 90);
        g.font = '500 28px Inter, Arial'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText('confia na Branding7', TW / 2, TH * .38 + lado / 2 + 136);
        g.globalAlpha = 1;
      }
      /* sombras da interface */
      let sg = g.createLinearGradient(0, 0, 0, 260); sg.addColorStop(0, 'rgba(0,0,0,.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(0, 0, TW, 260);
      sg = g.createLinearGradient(0, TH - 420, 0, TH); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = sg; g.fillRect(0, TH - 420, TW, 420);
      /* ilha da câmera frontal */
      g.fillStyle = '#000'; redondo(TW / 2 - 70, 26, 140, 40, 20); g.fill();
      /* barrinhas do story */
      const n = Math.min(L.length, 8), gap = 8, bw = (TW - 48 - gap * (n - 1)) / n;
      for (let i = 0; i < n; i++) {
        const x = 24 + i * (bw + gap), idx = atual % n;
        g.fillStyle = 'rgba(255,255,255,.35)'; redondo(x, 86, bw, 6, 3); g.fill();
        const f = i < idx ? 1 : i === idx ? Math.min(1, Math.max(0, t)) : 0;
        if (f > 0) { g.fillStyle = '#fff'; redondo(x, 86, Math.max(6, bw * f), 6, 3); g.fill(); }
      }
      /* autor */
      const av = pegaImg(m.avatar || m.logo);
      g.save(); g.beginPath(); g.arc(56, 140, 28, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.clip();
      if (av) g.drawImage(av, 28, 112, 56, 56); else { g.fillStyle = '#9A2AA8'; g.fillRect(28, 112, 56, 56); }
      g.restore();
      g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '700 27px Inter, Arial';
      g.fillText(cortar(m.arroba ? '@' + String(m.arroba).replace(/^@/, '') : (m.nome || 'branding7'), TW - 130), 98, 136);
      g.font = '500 22px Inter, Arial'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText('Vídeo por @b7.agencia', 98, 164);
      /* ações à direita */
      const pulso = 1 + Math.max(0, Math.sin((agora - inicio) / 180)) * .06 * (t < .3 ? 1 : 0);
      g.fillStyle = '#ff3d71'; g.save(); g.translate(TW - 58, TH - 390); g.scale(pulso, pulso); coracao(0, -26, 52); g.restore();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '700 22px Inter, Arial';
      const c = Math.floor(curtidas + Math.min(1, t) * 1400);
      g.fillText(c >= 1000 ? (c / 1000).toFixed(1).replace('.', ',') + ' mil' : String(c), TW - 58, TH - 332);
      g.strokeStyle = '#fff'; g.lineWidth = 5;
      g.beginPath(); g.arc(TW - 58, TH - 268, 24, 0, Math.PI * 2); g.stroke();
      g.fillText(String(40 + atual * 7), TW - 58, TH - 222);
      g.beginPath(); g.moveTo(TW - 80, TH - 176); g.lineTo(TW - 36, TH - 196); g.lineTo(TW - 52, TH - 152); g.closePath(); g.stroke();
      /* legenda */
      g.textAlign = 'left'; g.font = '600 30px Inter, Arial'; g.fillStyle = '#fff';
      g.fillText(cortar(m.titulo || m.nome || 'Branding7', TW - 110), 28, TH - 150);
      g.font = '500 24px Inter, Arial'; g.fillStyle = 'rgba(255,255,255,.8)';
      g.fillText('🎬 Roteiro, gravação e edição: Branding7', 28, TH - 110);
      /* barra de casa */
      g.fillStyle = 'rgba(255,255,255,.85)'; redondo(TW / 2 - 90, TH - 34, 180, 8, 4); g.fill();
      texTela.needsUpdate = true;
    }

    const medir = () => { const r = el.getBoundingClientRect(); render.setSize(r.width, r.height, false); olho.aspect = r.width / Math.max(1, r.height);
      olho.position.z = olho.aspect < .9 ? 40 : 35; olho.updateProjectionMatrix(); };
    medir(); const ro = new ResizeObserver(medir); ro.observe(el);

    /* mouse, arrastar e tocar */
    let mx = 0, my = 0, arrasto = 0, arrastoV = 0, segurando = false, xIni = 0, xAnt = 0, moveu = 0;
    const mover = e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; };
    addEventListener('pointermove', mover, { passive: true });
    const cvs = render.domElement; cvs.style.touchAction = 'pan-y'; cvs.style.cursor = 'grab';
    const baixo = e => { segurando = true; xIni = xAnt = e.clientX; moveu = 0; cvs.style.cursor = 'grabbing'; };
    const arrastar = e => { if (!segurando) return; const d = e.clientX - xAnt; xAnt = e.clientX; moveu += Math.abs(d); arrastoV = d * .012; arrasto += arrastoV; pedir(); };
    const cima = () => { if (!segurando) return; segurando = false; cvs.style.cursor = 'grab'; if (moveu < 6) { trocar(atual + 1); pedir(); } };
    cvs.addEventListener('pointerdown', baixo); addEventListener('pointermove', arrastar, { passive: true }); addEventListener('pointerup', cima);

    let visivel = false, raf = 0, t0 = performance.now(), ry = 0, rx = 0, ultimaTela = 0;
    const quadro = agora => {
      raf = 0; if (!visivel) { video.pause(); return; }
      const L = lista(); if (L.length !== quadro.n) { quadro.n = L.length; L.forEach(x => { pegaImg(x.capa); pegaImg(x.avatar); }); trocar(0); }
      if (lista()[atual] && lista()[atual].video && video.paused) video.play().catch(() => {});
      const t = (performance.now() - t0) / 1000, p = progresso ? progresso() : 0;
      if (!segurando) { arrasto *= .94; arrastoV *= .9; }
      /* entra girando (mostra a traseira) e termina de frente; depois balança de leve com a rolagem */
      const e = Math.min(1, Math.max(0, p / .24)), ent = 1 - Math.pow(1 - e, 3);
      const alvoY = -Math.PI * 1.15 * (1 - ent) - .22 + Math.sin(p * Math.PI * 3) * .32 * ent + mx * .32 + arrasto, alvoX = .05 + my * .1 - (1 - ent) * .2;
      ry += (alvoY - ry) * (calmo ? 1 : .085); rx += (alvoX - rx) * .08;
      giro.rotation.set(rx, ry, calmo ? 0 : Math.sin(t * .8) * .03);
      giro.position.y = calmo ? 0 : Math.sin(t * 1.1) * .4;
      /* ~30 quadros por segundo bastam (a tela é um vídeo de 30fps) */
      if (agora - ultimaTela >= 32) {
        ultimaTela = agora;
        /* a tela só é redesenhada no ritmo do conteúdo: vídeo 30x/s, capa 10x/s */
        const m = lista()[atual] || {}, ritmo = m.video && videoPronto ? 32 : 100;
        if (agora - (quadro.ultDes || 0) >= ritmo) { quadro.ultDes = agora; desenhar(performance.now()); }
        render.render(cena, olho);
      }
      raf = requestAnimationFrame(quadro);
    };
    const pedir = () => { if (visivel && !raf) raf = requestAnimationFrame(quadro); };
    const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; pedir(); }, { rootMargin: '120px' });
    io.observe(el);
    return () => {
      io.disconnect(); ro.disconnect(); removeEventListener('pointermove', mover); removeEventListener('pointermove', arrastar); removeEventListener('pointerup', cima);
      cancelAnimationFrame(raf); video.pause(); video.removeAttribute('src');
      cena.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      pmrem.dispose(); render.dispose(); if (render.domElement.parentNode) render.domElement.parentNode.removeChild(render.domElement);
    };
  }, [progresso]);
  return <div className="celular3d" ref={caixa} role="img" aria-label="Celular mostrando vídeos de clientes da Branding7" />;
}
