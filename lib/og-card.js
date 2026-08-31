import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = 'FounderSignal — Indian startup opportunity radar';

export function renderOgCard() {
  const bg = '#070b14';
  const primary = '#7dd3fc';
  const dim = '#9aa6b8';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          backgroundColor: bg,
          backgroundImage:
            'radial-gradient(circle at 85% 10%, rgba(125,211,252,0.22), transparent 45%), radial-gradient(circle at 10% 90%, rgba(125,211,252,0.10), transparent 40%)',
          color: '#f4f7fb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: primary,
              color: '#04202e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            FS
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>
            Founder
            <span style={{ color: primary }}>Signal</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 20,
              fontWeight: 700,
              color: primary,
              border: '2px solid rgba(125,211,252,0.4)',
              borderRadius: 999,
              padding: '10px 22px',
              alignSelf: 'flex-start',
            }}
          >
            Built for the Indian market
          </div>
          <div style={{ display: 'flex', fontSize: 66, fontWeight: 900, lineHeight: 1.1, letterSpacing: -2 }}>
            India’s startup opportunity radar
          </div>
          <div style={{ display: 'flex', fontSize: 27, color: dim, lineHeight: 1.4 }}>
            Scored briefs from live hiring, regulatory, community and open-source signals.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 21, color: dim }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: primary,
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex' }}>Evidence-backed | Not financial advice</div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
