'use client';

import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color = '#2bb8c4',
  width = 80,
  height = 24,
  className = '',
}) => {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniSparkline;
