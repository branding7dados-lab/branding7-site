'use client';
/* Camada "cinema" do site: rolagem macia com inércia (Lenis), cursor de
   câmera no computador e rótulos que "decodificam" ao aparecer.
   Tudo leve: o cursor e a rolagem só mexem em transform; nada roda com a
   aba escondida; quem pediu menos movimento fica com o site normal. */
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

const SINAIS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';

export default function Cinema() {
  const cur = useRef(null);

  useEffect(() => {
    const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fino = matchMedia('(pointer: fine)').matches;
    const raiz = document.documentElement;

    /* placa de vídeo boa? liga os extras 3D */
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      if (gl && !/swiftshader|llvmpipe|software|basic render/i.test(r) && !calmo) raiz.classList.add('gpu');
    } catch (e) {}

    /* ---------- rolagem macia (só roda e mouse; o toque segue nativo) ---------- */
    let lenis = null, raf = 0;
    if (!calmo && fino) {
      lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1 });
      const anda = t => { lenis.raf(t); raf = requestAnimationFrame(anda); };
      raf = requestAnimationFrame(anda);
      /* links internos (#contato...) rolam pela mesma inércia */
      window.__lenis = lenis;
      raiz.classList.add('lenis-on');
    }

    /* ---------- cursor de câmera ---------- */
    let mx = -100, my = -100, cx = -100, cy = -100, rafC = 0, vivo = false;
    const el = cur.current;
    const moverC = () => {
      rafC = 0;
      cx += (mx - cx) * .22; cy += (my - cy) * .22;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(mx - cx) + Math.abs(my - cy) > .3) rafC = requestAnimationFrame(moverC);
    };
    const mover = e => {
      mx = e.clientX; my = e.clientY;
      if (!vivo) { vivo = true; cx = mx; cy = my; el.classList.add('on'); }
      const a = e.target.closest && e.target.closest('a, button, summary, [role="button"], .obra-cx, .reel');
      const video = e.target.closest && e.target.closest('.obra-cx, .depo-video');
      el.classList.toggle('link', !!a && !video);
      el.classList.toggle('play', !!video);
      if (!rafC) rafC = requestAnimationFrame(moverC);
    };
    const sair = () => { vivo = false; el.classList.remove('on'); };
    const aperta = () => el.classList.add('aperta'), solta = () => el.classList.remove('aperta');
    if (fino && !calmo && el) {
      addEventListener('pointermove', mover, { passive: true });
      document.addEventListener('mouseleave', sair);
      addEventListener('pointerdown', aperta); addEventListener('pointerup', solta);
      raiz.classList.add('cursor-cine');
    }

    /* ---------- rótulos que decodificam ao aparecer ---------- */
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const t = e.target, fim = t.dataset.texto || t.textContent; t.dataset.texto = fim;
      if (calmo) return;
      let k = 0; const total = fim.length, passos = Math.min(28, 10 + total);
      const tique = () => {
        k++;
        const pronto = Math.floor(total * k / passos);
        t.textContent = fim.slice(0, pronto) + fim.slice(pronto).replace(/[^\s]/g, () => SINAIS[(Math.random() * SINAIS.length) | 0]);
        if (k < passos) setTimeout(tique, 34); else t.textContent = fim;
      };
      tique();
    }), { threshold: .8 });
    const marcar = () => document.querySelectorAll('.rotulo:not([data-dec])').forEach(r => { r.dataset.dec = '1'; io.observe(r); });
    marcar(); let n = 0; const t2 = setInterval(() => { marcar(); if (++n > 8) clearInterval(t2); }, 1200);

    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(rafC); clearInterval(t2); io.disconnect();
      if (lenis) { lenis.destroy(); window.__lenis = null; raiz.classList.remove('lenis-on'); }
      removeEventListener('pointermove', mover); document.removeEventListener('mouseleave', sair);
      removeEventListener('pointerdown', aperta); removeEventListener('pointerup', solta);
    };
  }, []);

  return (
    <>
      <div className="cursor-cine-el" ref={cur} aria-hidden="true"><i /><span>Assistir</span></div>
    </>
  );
}
