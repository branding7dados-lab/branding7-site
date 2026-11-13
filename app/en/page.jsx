import Site from '@/components/Site';
export const metadata = {
  title: 'Branding7 · Video that makes you sell',
  description: 'Digital marketing agency specialized in video: creatives that sell, go viral and perform. Script, shooting, editing and ads.',
  alternates: { canonical: '/en/', languages: { 'pt-BR': '/', en: '/en/' } },
  openGraph: { type: 'website', url: 'https://branding7.com.br/en/', siteName: 'Branding7', title: 'Branding7 — Video that makes you sell',
    description: 'Video creatives that go viral, perform and bring in customers. From script to edit.', images: [{ url: '/marca/compartilhar.png', width: 1200, height: 630 }], locale: 'en_US' }
};
export default function Inicio() { return <Site lang="en" />; }
