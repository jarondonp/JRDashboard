import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarChartProps {
  data: any[];
  dataKey: string;
  color?: string;
  height?: number;
}

export function RadarChart({ data, dataKey, color = '#3b82f6', height = 400 }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="area" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar name="Progreso" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.6} />
        <Tooltip />
        <Legend />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
