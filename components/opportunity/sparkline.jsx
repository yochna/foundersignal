/**
 * Dependency-free sparkline. Recharts is used for the larger analytical charts,
 * but a card renders many of these at once and an inline SVG path is far
 * cheaper than mounting a chart per card.
 */
export function Sparkline({
  data = [],
  width = 100,
  height = 28,
  color = 'currentColor',
  strokeWidth = 1.75,
  fill = true,
  className,
}) {
  const values = data
    .map((point) => (typeof point === 'number' ? point : Number(point?.value)))
    .filter((n) => Number.isFinite(n));

  if (values.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden="true">
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="3 3"
          opacity="0.35"
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = strokeWidth;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${width - pad},${height} L${pad},${height} Z`;
  const gradientId = `spark-${Math.random().toString(36).slice(2, 9)}`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={`Trend from ${min} to ${values[values.length - 1]}`}
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      ) : null}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={strokeWidth + 0.75} fill={color} />
    </svg>
  );
}

export default Sparkline;
