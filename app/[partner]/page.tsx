import { notFound } from 'next/navigation';
import { getPartnerConfig, isValidPartner } from '@/lib/partners';
import PartnerPageClient from './PartnerPageClient';

interface PartnerPageProps {
  params: Promise<{
    partner: string;
  }>;
}

/**
 * Partner-specific page that validates the partner and renders the client component
 * This is a Server Component that handles partner validation
 */
export default async function PartnerPage({ params }: PartnerPageProps) {
  const { partner } = await params;

  // Validate partner exists and is active
  if (!isValidPartner(partner)) {
    notFound(); // Shows 404 page for invalid partners
  }

  // Get partner configuration
  const partnerConfig = getPartnerConfig(partner);

  if (!partnerConfig) {
    notFound();
  }

  // Pass partner config to client component
  return <PartnerPageClient partnerConfig={partnerConfig} />;
}

/**
 * Generate static paths for all active partners (optional, for static generation)
 * Uncomment if you want to pre-render partner pages at build time
 */
// export async function generateStaticParams() {
//   const { getActivePartners } = await import('@/lib/partners');
//   const partners = getActivePartners();
//   
//   return partners.map((partner) => ({
//     partner: partner.id,
//   }));
// }
