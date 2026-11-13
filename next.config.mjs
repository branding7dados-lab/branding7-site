/** Site estático (GitHub Pages): `next build` gera a pasta out/. */
const config = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  /* CSS dentro do HTML: a abertura não espera o arquivo de estilos */
  experimental: { inlineCss: true }
};
export default config;
