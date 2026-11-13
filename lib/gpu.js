/* Uma única checagem da placa de vídeo para o site todo. O contexto de
   teste é liberado na hora: celular com pouca memória (iPhone) recusa
   contextos WebGL a mais, e o celular 3D ficava em branco. */
let cache = null;
export function gpuBoa() {
  if (cache !== null) return cache;
  cache = false;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      cache = !/swiftshader|llvmpipe|software|basic render/i.test(r) && (navigator.hardwareConcurrency || 8) > 2;
      const perde = gl.getExtension('WEBGL_lose_context'); if (perde) perde.loseContext();
    }
  } catch (e) { cache = false; }
  return cache;
}
