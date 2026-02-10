import { SectionConfig } from '@/types/sectionConfig';

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: SectionConfig[];
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean hero + beats only. No distractions.',
    icon: '✨',
    sections: [
      { id: 'hero', label: 'Hero Banner', enabled: true, order: 0, settings: { title: 'Premium Beats', titleHighlight: 'Made for You', subtitle: 'High-quality instrumentals. Instant delivery.', badgeText: '', ctaText: 'Browse Beats', ctaLink: '/beats', secondaryCtaText: '', secondaryCtaLink: '' } },
      { id: 'beats', label: 'Latest Beats', enabled: true, order: 1, settings: { title: 'Latest Releases', subtitle: '', count: '8' } },
      { id: 'soundkits', label: 'Sound Kits', enabled: false, order: 2, settings: { title: 'Sound Kits', subtitle: '', count: '5' } },
      { id: 'services', label: 'Studio Services', enabled: false, order: 3, settings: { title: 'Studio Services', subtitle: '', count: '4' } },
      { id: 'cta', label: 'Call to Action', enabled: false, order: 4, settings: { title: 'Ready to Create?', subtitle: '', ctaText: 'Get Started', ctaLink: '/beats' } },
    ],
  },
  {
    id: 'beat-focused',
    name: 'Beat-Focused',
    description: 'Showcase your catalog front and center with CTA.',
    icon: '🎵',
    sections: [
      { id: 'hero', label: 'Hero Banner', enabled: true, order: 0, settings: { title: 'Fire Beats', titleHighlight: 'Drop Daily', subtitle: 'Fresh instrumentals added every week. License and download instantly.', badgeText: '🔥 New drops weekly', ctaText: 'Explore Catalog', ctaLink: '/beats', secondaryCtaText: 'Licensing Info', secondaryCtaLink: '/licenses' } },
      { id: 'beats', label: 'Latest Beats', enabled: true, order: 1, settings: { title: 'Hot Right Now', subtitle: 'Our freshest productions', count: '10' } },
      { id: 'soundkits', label: 'Sound Kits', enabled: true, order: 2, settings: { title: 'Producer Kits', subtitle: 'Loops, one-shots & more', count: '4' } },
      { id: 'cta', label: 'Call to Action', enabled: true, order: 3, settings: { title: 'Don\'t Miss Out', subtitle: 'New beats are added weekly. Grab yours before they go exclusive.', ctaText: 'Browse All Beats', ctaLink: '/beats' } },
      { id: 'services', label: 'Studio Services', enabled: false, order: 4, settings: { title: 'Studio Services', subtitle: '', count: '4' } },
    ],
  },
  {
    id: 'service-focused',
    name: 'Service-Focused',
    description: 'Lead with studio services, beats secondary.',
    icon: '🎛️',
    sections: [
      { id: 'hero', label: 'Hero Banner', enabled: true, order: 0, settings: { title: 'Professional', titleHighlight: 'Studio Services', subtitle: 'Mixing, mastering, and custom production by experienced engineers.', badgeText: 'Now booking', ctaText: 'View Services', ctaLink: '/services', secondaryCtaText: 'Browse Beats', secondaryCtaLink: '/beats' } },
      { id: 'services', label: 'Studio Services', enabled: true, order: 1, settings: { title: 'What We Offer', subtitle: 'End-to-end production services', count: '6' } },
      { id: 'beats', label: 'Latest Beats', enabled: true, order: 2, settings: { title: 'Our Beats', subtitle: 'Ready-made instrumentals', count: '4' } },
      { id: 'cta', label: 'Call to Action', enabled: true, order: 3, settings: { title: 'Let\'s Work Together', subtitle: 'Book a session or grab a beat — your next hit starts here.', ctaText: 'Get Started', ctaLink: '/services' } },
      { id: 'soundkits', label: 'Sound Kits', enabled: false, order: 4, settings: { title: 'Sound Kits', subtitle: '', count: '5' } },
    ],
  },
  {
    id: 'studio-style',
    name: 'Studio Style',
    description: 'Full showcase: hero, beats, kits, services & CTA.',
    icon: '🏠',
    sections: [
      { id: 'hero', label: 'Hero Banner', enabled: true, order: 0, settings: { title: 'Welcome to the', titleHighlight: 'Studio', subtitle: 'Beats, sound kits, and professional services — everything you need under one roof.', badgeText: 'Full-service studio', ctaText: 'Explore', ctaLink: '/beats', secondaryCtaText: 'Our Services', secondaryCtaLink: '/services' } },
      { id: 'beats', label: 'Latest Beats', enabled: true, order: 1, settings: { title: 'Latest Beats', subtitle: 'Fresh from the studio', count: '6' } },
      { id: 'soundkits', label: 'Sound Kits', enabled: true, order: 2, settings: { title: 'Sound Kits', subtitle: 'Producer essentials', count: '4' } },
      { id: 'services', label: 'Studio Services', enabled: true, order: 3, settings: { title: 'Studio Services', subtitle: 'Professional mixing, mastering & custom production', count: '4' } },
      { id: 'cta', label: 'Call to Action', enabled: true, order: 4, settings: { title: 'Ready to Create?', subtitle: 'Browse our catalog and find the perfect beat for your next project.', ctaText: 'Get Started', ctaLink: '/beats' } },
    ],
  },
];
