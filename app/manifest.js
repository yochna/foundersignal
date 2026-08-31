export default function manifest() {
  return {
    name: 'FounderSignal',
    short_name: 'FounderSignal',
    description:
      'Scored startup opportunity briefs built from live hiring, regulatory, community and open-source signals for the Indian market.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070b14',
    theme_color: '#070b14',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
