import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export const Sparkline = ({ 
  data, 
  width = 80, 
  height = 24, 
  color = "hsl(var(--primary))",
  strokeWidth = 2 
}: SparklineProps) => {
  // Generate unique ID for gradient to avoid collisions
  const gradientId = useId();
  
  if (!data || data.length < 2) {
    return <div style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  // Determine trend direction
  const isUptrend = data[data.length - 1] > data[0];
  const trendColor = isUptrend ? "hsl(var(--success))" : "hsl(var(--destructive))";

  return (
    <svg 
      width={width} 
      height={height} 
      className="sparkline"
      style={{ overflow: 'visible' }}
    >
      {/* Area fill */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Filled area */}
      <path
        d={`${pathData} L ${width},${height} L 0,${height} Z`}
        fill={`url(#${gradientId})`}
      />
      
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
