import Sobre from '@/components/Sobre';
export const metadata = {
  title: 'Sobre a Branding7 · Equipe e bastidores',
  description: 'Conheça a Branding7: a história, a equipe e os bastidores da agência de marketing digital especializada em vídeo.',
  alternates: { canonical: '/sobre/', languages: { 'pt-BR': '/sobre/', en: '/en/about/' } },
  openGraph: { title: 'Sobre a Branding7', url: 'https://branding7.com.br/sobre/', images: [{ url: '/marca/compartilhar.png', width: 1200, height: 630 }] }
};
export default function Pagina() { return <Sobre lang="pt" />; }
