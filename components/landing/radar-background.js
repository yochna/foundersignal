const BLIPS = [
  { angle: 12, radius: 0.34, color: '#10b981', size: 6 },
  { angle: 38, radius: 0.72, color: '#0ea5e9', size: 6 },
  { angle: 64, radius: 0.46, color: '#f59e0b', size: 5 },
  { angle: 88, radius: 0.9, color: '#f43f5e', size: 6 },
  { angle: 116, radius: 0.5, color: '#10b981', size: 5 },
  { angle: 142, radius: 0.82, color: '#0ea5e9', size: 6 },
  { angle: 168, radius: 0.36, color: '#f59e0b', size: 5 },
  { angle: 196, radius: 0.66, color: '#10b981', size: 6 },
  { angle: 222, radius: 0.92, color: '#f43f5e', size: 5 },
  { angle: 250, radius: 0.44, color: '#0ea5e9', size: 6 },
  { angle: 278, radius: 0.74, color: '#f59e0b', size: 5 },
  { angle: 306, radius: 0.56, color: '#10b981', size: 6 },
  { angle: 332, radius: 0.86, color: '#f43f5e', size: 5 },
  { angle: 354, radius: 0.24, color: '#0ea5e9', size: 4 },
];

const SWEEP_PERIOD_SEC = 7;

function radarPosition(angle, radius) {
  const rad = (angle * Math.PI) / 180;
  return {
    left: `${50 + radius * 46 * Math.sin(rad)}%`,
    top: `${50 - radius * 46 * Math.cos(rad)}%`,
  };
}

export function RadarBackground() {
  return (
    <div
      className="radar-bg pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative aspect-square w-[min(80vw,720px)]">
        <svg className="h-full w-full" viewBox="0 0 200 200" fill="none">
          <circle className="radar-ring" cx="100" cy="100" r="26" strokeWidth="1" />
          <circle className="radar-ring" cx="100" cy="100" r="52" strokeWidth="1" />
          <circle className="radar-ring" cx="100" cy="100" r="78" strokeWidth="1" />
          <circle className="radar-ring-inner" cx="100" cy="100" r="96" strokeWidth="1" />
          <path className="radar-ring" d="M4 100 H196" strokeWidth="1" />
          <path className="radar-ring" d="M100 4 V196" strokeWidth="1" />
          <circle className="radar-ring-inner" cx="100" cy="100" r="1.6" fill="currentColor" stroke="none" />
        </svg>

        <div className="radar-sweep absolute inset-0 rounded-full" />
        <div
          className="radar-scan absolute"
          style={{ left: 'calc(50% - 1px)', top: 0, width: 2, height: '50%' }}
        />

        {BLIPS.map((blip, i) => {
          const { left, top } = radarPosition(blip.angle, blip.radius);
          const delay = -((blip.angle / 360) * SWEEP_PERIOD_SEC);
          return (
            <span
              key={i}
              className="radar-blip"
              style={{
                left,
                top,
                width: blip.size,
                height: blip.size,
                marginLeft: -blip.size / 2,
                marginTop: -blip.size / 2,
                background: blip.color,
                boxShadow: `0 0 10px 2px ${blip.color}55`,
                animationDuration: `${SWEEP_PERIOD_SEC}s`,
                animationDelay: `${delay.toFixed(2)}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
