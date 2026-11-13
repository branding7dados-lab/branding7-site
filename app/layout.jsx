import './globais.css';
import localFont from 'next/font/local';

/* fontes pelo next/font: pré-carregadas no cabeçalho e com fonte reserva de
   métricas ajustadas — o título não "pula" quando a fonte chega (CLS) */
const sora = localFont({ src: '../public/fonts/sora-var.woff2', weight: '300 800', variable: '--f-sora', display: 'swap', adjustFontFallback: 'Arial' });
const inter = localFont({
  src: [
    { path: '../public/fonts/inter-400.woff2', weight: '400' },
    { path: '../public/fonts/inter-500.woff2', weight: '500' },
    { path: '../public/fonts/inter-600.woff2', weight: '600' },
    { path: '../public/fonts/inter-700.woff2', weight: '700' }
  ], variable: '--f-inter', display: 'swap', adjustFontFallback: 'Arial'
});

export const metadata = {
  metadataBase: new URL('https://branding7.com.br'),
  title: 'Branding7',
  description: 'Agência de marketing digital especializada em vídeo: criativos que vendem, viralizam e performam. Roteiro, gravação, edição e anúncios.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', url: 'https://branding7.com.br/', siteName: 'Branding7',
    title: 'Branding7 — O vídeo que faz você vender',
    description: 'Criativos em vídeo que viralizam, performam e trazem cliente. Do roteiro à edição.',
    images: [{ url: '/marca/compartilhar.png', width: 1200, height: 630 }], locale: 'pt_BR'
  },
  icons: { icon: '/marca/symbol-color.png' }
};
export const viewport = { themeColor: '#07041a', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const ld = { '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Branding7', url: 'https://branding7.com.br/',
  description: 'Agência de marketing digital especializada em vídeo.', telephone: '+55 77 98122-3827', sameAs: ['https://www.instagram.com/b7.agencia/'] };

export default function Raiz({ children }) {
  return (
    <html lang="pt-BR" className={sora.variable + ' ' + inter.variable}>
      <head>
        {/* os dados e os logos vêm do Supabase: conexão aberta cedo */}
        <link rel="preconnect" href="https://rartcafydsaocdzshqcx.supabase.co" crossOrigin="" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
