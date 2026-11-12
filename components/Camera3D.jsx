'use client';
/* Câmera 3D (inspirada numa mirrorless compacta de vlog: corpo baixo,
   empunhadura, zoom motorizado 16-50, tela que vira para a frente e
   protetor de vento no microfone). Modelada só com formas do three.js,
   sem arquivo externo; a marca é a da Branding7.
   Gira com a rolagem da seção (prop progresso) e acompanha o mouse.
   Só desenha quando está na tela. */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function texturaTexto(desenhar, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); desenhar(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { t, c, g };
}

function montarCamera() {
  const cam = new THREE.Group();
  const corpoMat = new THREE.MeshPhysicalMaterial({ color: 0x17161c, roughness: .55, metalness: .25, clearcoat: .35, clearcoatRoughness: .5 });
  const borrachaMat = new THREE.MeshStandardMaterial({ color: 0x0e0d12, roughness: .92, metalness: 0 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc9c6d4, roughness: .28, metalness: 1 });
  const metalEscuro = new THREE.MeshStandardMaterial({ color: 0x2a2833, roughness: .35, metalness: .9 });
  const vermelho = new THREE.MeshStandardMaterial({ color: 0xe0203a, roughness: .35, metalness: .2, emissive: 0x5a0010, emissiveIntensity: .6 });

  /* corpo (11,5 × 6,7 × 4,5) */
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(11.5, 6.4, 4.4, 6, .55), corpoMat);
  cam.add(corpo);
  /* faixa de borracha na frente esquerda */
  const faixa = new THREE.Mesh(new RoundedBoxGeometry(10.6, 4.8, .25, 4, .12), borrachaMat);
  faixa.position.set(-.2, -.35, 2.2); cam.add(faixa);
  /* empunhadura */
  const grip = new THREE.Mesh(new RoundedBoxGeometry(2.9, 6.1, 2.6, 6, 1.1), borrachaMat);
  grip.position.set(4.15, -.05, 2.35); cam.add(grip);
  /* encaixe da lente */
  const encaixe = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, .35, 64), metalMat);
  encaixe.rotation.x = Math.PI / 2; encaixe.position.set(-.9, -.35, 2.45); cam.add(encaixe);

  /* lente zoom 16-50: barril, anel de zoom serrilhado, anel frontal, vidro */
  const lente = new THREE.Group(); lente.position.set(-.9, -.35, 2.6); cam.add(lente);
  const barril = (r1, r2, h, z, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 64), mat); m.rotation.x = Math.PI / 2; m.position.z = z; lente.add(m); return m; };
  barril(2.45, 2.5, 1.0, .5, corpoMat);
  const sulco = new THREE.MeshStandardMaterial({ color: 0x3a3846, roughness: .7 });
  for (let i = 0; i < 26; i++) barril(2.64, 2.64, .045, 1.1 + i * .065, i % 2 ? sulco : borrachaMat);   /* anel serrilhado */
  barril(2.55, 2.55, 1.7, 1.95, borrachaMat);
  barril(2.35, 2.5, 1.2, 3.35, corpoMat);
  barril(2.4, 2.4, .12, 3.98, metalEscuro);
  const vidroMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0618, roughness: .03, metalness: .1, clearcoat: 1, clearcoatRoughness: 0,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 650], reflectivity: 1 });
  const vidro = new THREE.Mesh(new THREE.SphereGeometry(2.0, 64, 32, 0, Math.PI * 2, 0, Math.PI / 5.2), vidroMat);
  vidro.rotation.x = Math.PI / 2; vidro.position.z = 2.3; lente.add(vidro);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(2.05, .1, 16, 80), metalEscuro); aro.position.z = 4.02; lente.add(aro);
  /* escrita no anel frontal */
  const { t: texAnel } = texturaTexto((g, w, h) => {
    g.fillStyle = '#0e0d12'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d4e6'; g.font = '600 46px Arial'; g.textAlign = 'center';
    g.fillText('E 3.5-5.6/PZ 16-50  OSS   ·   Ø40.5', w / 2, h / 2 + 16);
  }, 1024, 96);
  texAnel.wrapS = THREE.RepeatWrapping; texAnel.repeat.x = -1;
  const anelTx = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, .45, 64, 1, true), new THREE.MeshStandardMaterial({ map: texAnel, roughness: .6 }));
  anelTx.rotation.x = Math.PI / 2; anelTx.rotation.y = Math.PI; anelTx.position.z = 3.62; lente.add(anelTx);

  /* topo: sapata, botões, microfone com protetor de vento */
  const sapata = new THREE.Mesh(new RoundedBoxGeometry(2.2, .35, 2.0, 2, .05), metalEscuro); sapata.position.set(-.9, 3.35, -.1); cam.add(sapata);
  const gatilho = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .25, 40), metalMat); gatilho.position.set(4.2, 3.2, 2.5); cam.add(gatilho);
  const zoomAlav = new THREE.Mesh(new THREE.TorusGeometry(.62, .14, 12, 40, Math.PI * 1.4), metalEscuro); zoomAlav.rotation.x = -Math.PI / 2; zoomAlav.position.set(4.2, 3.17, 2.5); cam.add(zoomAlav);
  const rec = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .2, 32), vermelho); rec.position.set(2.7, 3.25, .6); cam.add(rec);
  const liga = new THREE.Mesh(new RoundedBoxGeometry(.9, .2, .5, 2, .08), metalEscuro); liga.position.set(2.5, 3.25, -1.0); cam.add(liga);
  /* protetor de vento (pelúcia escura sobre o microfone) */
  const pelo = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1b1a22, roughness: 1, metalness: 0 }));
  pelo.scale.set(1.25, .55, 1); pelo.position.set(-.9, 3.5, -.1); cam.add(pelo);
  const fios = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 1400 }, () => {
    const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI / 2, r = 1.05 + Math.random() * .12;
    return new THREE.Vector3(Math.cos(u) * Math.sin(v) * r * 1.25, Math.cos(v) * r * .55, Math.sin(u) * Math.sin(v) * r);
  })), new THREE.PointsMaterial({ color: 0x2c2a36, size: .07, sizeAttenuation: true }));
  fios.position.copy(pelo.position); cam.add(fios);

  /* luz de gravação na frente (pisca) */
  const tally = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 16), new THREE.MeshStandardMaterial({ color: 0xff2a4a, emissive: 0xff1a3a, emissiveIntensity: 2 }));
  tally.position.set(-4.6, 2.4, 2.22); cam.add(tally);

  /* marca na frente */
  const { t: texMarca } = texturaTexto((g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#e9e6f2'; g.font = '700 92px Arial'; g.textAlign = 'left'; g.fillText('B7', 10, 120);
    g.font = '600 34px Arial'; g.fillStyle = '#9b96ad'; g.fillText('BRANDING7', 12, 180);
  });
  const marca = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: texMarca, transparent: true }));
  marca.position.set(-4.0, 2.05, 2.36); cam.add(marca);

  /* tela articulada aberta para a frente (do lado esquerdo) */
  /* aberta para o lado e virada para a frente, como no vlog */
  const tela = new THREE.Group(); tela.position.set(-9.15, -.15, .9); tela.rotation.y = Math.PI / 2; cam.add(tela);
  const moldura = new THREE.Mesh(new RoundedBoxGeometry(.45, 4.6, 6.4, 4, .2), corpoMat); tela.add(moldura);
  const { t: texTela, g: gTela, c: cTela } = texturaTexto(() => {}, 640, 460);
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 4.0), new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }));
  visor.rotation.y = -Math.PI / 2; visor.position.x = -.24; tela.add(visor);
  const dobradica = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 3.4, 20), metalEscuro); dobradica.position.set(.1, 0, -3.25); tela.add(dobradica);
  const braco = new THREE.Mesh(new RoundedBoxGeometry(.35, 3.0, .8, 2, .12), corpoMat); braco.position.set(.25, 0, -3.55); tela.add(braco);

  /* traseira: o vão da tela, roda de comando e botões */
  const vao = new THREE.Mesh(new RoundedBoxGeometry(6.6, 4.6, .12, 3, .18), borrachaMat); vao.position.set(-1.6, -.2, -2.22); cam.add(vao);
  const roda = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .22, 40), metalEscuro); roda.rotation.x = Math.PI / 2; roda.position.set(3.4, -.9, -2.25); cam.add(roda);
  const centroRoda = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .26, 30), corpoMat); centroRoda.rotation.x = Math.PI / 2; centroRoda.position.set(3.4, -.9, -2.27); cam.add(centroRoda);
  [[3.4, 1.4], [2.6, 1.4], [4.2, 1.4], [3.0, -2.6], [3.8, -2.6]].forEach(([x, y]) => {
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .16, 24), metalEscuro); bt.rotation.x = Math.PI / 2; bt.position.set(x, y, -2.25); cam.add(bt);
  });
  const apoio = new THREE.Mesh(new RoundedBoxGeometry(1.9, 2.2, .14, 3, .3), borrachaMat); apoio.position.set(4.3, 1.9, -2.24); cam.add(apoio);

  function desenharTela(seg) {
    const g = gTela, w = cTela.width, h = cTela.height;
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1b2a8f'); gr.addColorStop(.45, '#5B2BC6'); gr.addColorStop(1, '#E2409C');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; const m = 34, l = 46;
    [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, a, b]) => { g.beginPath(); g.moveTo(x, y + b * l); g.lineTo(x, y); g.lineTo(x + a * l, y); g.stroke(); });
    g.font = '700 30px Arial'; g.fillStyle = '#fff';
    if (Math.floor(seg * 2) % 2 === 0) { g.fillStyle = '#ff2a4a'; g.beginPath(); g.arc(70, 76, 11, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.fillText('REC', 90, 87);
    const s = Math.floor(seg), tc = '00:' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + ':' + String(Math.floor((seg % 1) * 30)).padStart(2, '0');
    g.textAlign = 'right'; g.fillText(tc, w - 60, 87); g.textAlign = 'left';
    g.font = '600 24px Arial'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('4K  30p  ·  S-Cinetone', 60, h - 56);
    g.textAlign = 'center'; g.font = '800 120px Arial'; g.fillStyle = 'rgba(255,255,255,.95)'; g.fillText('B7', w / 2, h / 2 + 40); g.textAlign = 'left';
    texTela.needsUpdate = true;
  }
  desenharTela(0);
  return { cam, tally, desenharTela };
}

export default function Camera3D({ progresso }) {
  const caixa = useRef(null);
  useEffect(() => {
    const el = caixa.current; if (!el) return;
    let render;
    try { render = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { el.classList.add('sem-3d'); return; }
    const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    render.outputColorSpace = THREE.SRGBColorSpace; render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 1.15;
    el.appendChild(render.domElement);
    const cena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(render);
    cena.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    const olho = new THREE.PerspectiveCamera(30, 1, .1, 200); olho.position.set(0, 3, 30); olho.lookAt(0, -.5, 0);
    cena.add(new THREE.AmbientLight(0xffffff, .25));
    const luzRosa = new THREE.PointLight(0xff4fb0, 380, 60); luzRosa.position.set(14, 6, 8); cena.add(luzRosa);
    const luzRoxa = new THREE.PointLight(0x6a4dff, 420, 60); luzRoxa.position.set(-14, 4, 6); cena.add(luzRoxa);
    const chave = new THREE.DirectionalLight(0xffffff, 1.4); chave.position.set(4, 10, 14); cena.add(chave);
    const { cam, tally, desenharTela } = montarCamera();
    cam.position.x = 1.7; cam.scale.setScalar(1.08);
    const giro = new THREE.Group(); giro.add(cam); cena.add(giro);
    /* sombra suave no chão */
    const { t: texSombra } = texturaTexto((g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }, 256, 256);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2; sombra.position.y = -5.2; cena.add(sombra);

    const medir = () => { const r = el.getBoundingClientRect(); render.setSize(r.width, r.height, false); olho.aspect = r.width / Math.max(1, r.height); olho.updateProjectionMatrix(); };
    medir(); const ro = new ResizeObserver(medir); ro.observe(el);
    let mx = 0, my = 0;
    const mover = e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; };
    addEventListener('pointermove', mover, { passive: true });
    let visivel = false, raf = 0, t0 = performance.now(), ultimaTela = -1, ry = 0, rx = 0;
    const quadro = () => {
      raf = 0; if (!visivel) return;
      const t = (performance.now() - t0) / 1000, p = progresso ? progresso() : 0;
      const alvoY = -0.35 + p * Math.PI * 2.1 + mx * .25, alvoX = .12 + my * .12;
      ry += (alvoY - ry) * (calmo ? 1 : .08); rx += (alvoX - rx) * .08;
      giro.rotation.set(rx, ry, 0);
      giro.position.y = calmo ? 0 : Math.sin(t * 1.2) * .35;
      tally.material.emissiveIntensity = Math.sin(t * 6) > 0 ? 2.4 : .3;
      const s = Math.floor(t * 15); if (s !== ultimaTela) { ultimaTela = s; desenharTela(t); }
      render.render(cena, olho);
      if (!calmo || p !== quadro.ultimoP) raf = requestAnimationFrame(quadro);
      quadro.ultimoP = p;
    };
    const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel && !raf) raf = requestAnimationFrame(quadro); }, { rootMargin: '100px' });
    io.observe(el);
    const aoRolar = () => { if (visivel && !raf) raf = requestAnimationFrame(quadro); };
    addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      io.disconnect(); ro.disconnect(); removeEventListener('pointermove', mover); removeEventListener('scroll', aoRolar); cancelAnimationFrame(raf);
      cena.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      pmrem.dispose(); render.dispose(); if (render.domElement.parentNode) render.domElement.parentNode.removeChild(render.domElement);
    };
  }, [progresso]);
  return <div className="camera3d" ref={caixa} aria-label="Câmera de vídeo em 3D" role="img" />;
}
