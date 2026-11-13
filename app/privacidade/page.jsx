import Privacidade from '@/components/Privacidade';
export const metadata = {
  title: 'Política de privacidade · Branding7',
  description: 'Como a Branding7 trata os seus dados pessoais e cookies (LGPD).',
  alternates: { canonical: '/privacidade/', languages: { 'pt-BR': '/privacidade/', en: '/en/privacy/' } }
};
export default function Pagina() { return <Privacidade lang="pt" />; }
