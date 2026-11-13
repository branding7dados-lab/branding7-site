import Privacidade from '@/components/Privacidade';
export const metadata = {
  title: 'Privacy policy · Branding7',
  description: 'How Branding7 handles your personal data and cookies.',
  alternates: { canonical: '/en/privacy/', languages: { 'pt-BR': '/privacidade/', en: '/en/privacy/' } }
};
export default function Pagina() { return <Privacidade lang="en" />; }
