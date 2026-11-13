import Sobre from '@/components/Sobre';
export const metadata = {
  title: 'About Branding7 · Team and behind the scenes',
  description: 'Meet Branding7: the story, the team and the behind the scenes of the video-focused digital marketing agency.',
  alternates: { canonical: '/en/about/', languages: { 'pt-BR': '/sobre/', en: '/en/about/' } }
};
export default function Pagina() { return <Sobre lang="en" />; }
