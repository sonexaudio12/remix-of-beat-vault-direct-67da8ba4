export interface SectionConfig {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  settings: Record<string, string>;
}

export interface SectionsLayout {
  sections: SectionConfig[];
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    id: 'hero',
    label: 'Hero Banner',
    enabled: true,
    order: 0,
    settings: {
      title: 'Premium Beats for',
      titleHighlight: 'Your Next Hit',
      subtitle: 'Discover studio-quality instrumentals with instant digital delivery. Choose your license, pay once, and start creating immediately.',
      badgeText: 'New beats every week',
      ctaText: 'Browse Beats',
      ctaLink: '/beats',
      secondaryCtaText: 'View Licensing',
      secondaryCtaLink: '/licenses',
    },
  },
  {
    id: 'beats',
    label: 'Latest Beats',
    enabled: true,
    order: 1,
    settings: {
      title: 'Latest Beats',
      subtitle: '',
      count: '5',
    },
  },
  {
    id: 'soundkits',
    label: 'Sound Kits',
    enabled: true,
    order: 2,
    settings: {
      title: 'Sound Kits',
      subtitle: '',
      count: '5',
    },
  },
  {
    id: 'services',
    label: 'Studio Services',
    enabled: true,
    order: 3,
    settings: {
      title: 'Studio Services',
      subtitle: 'Professional mixing, mastering & custom production',
      count: '4',
    },
  },
  {
    id: 'cta',
    label: 'Call to Action',
    enabled: false,
    order: 4,
    settings: {
      title: 'Ready to Create?',
      subtitle: 'Browse our catalog and find the perfect beat for your next project.',
      ctaText: 'Get Started',
      ctaLink: '/beats',
    },
  },
];
