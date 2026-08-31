import { renderOgCard, OG_SIZE, OG_ALT } from '@/lib/og-card';

export const runtime = 'edge';
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return renderOgCard();
}
