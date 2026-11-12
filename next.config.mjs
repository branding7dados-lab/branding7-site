/** Site estático (GitHub Pages): `next build` gera a pasta out/. */
const config = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false
};
export default config;
