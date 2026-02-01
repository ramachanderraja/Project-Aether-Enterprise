import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FinancialMetric } from '../../types';

interface RevenueChartProps {
  data: FinancialMetric[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend />
          
          {/* Confidence Interval (Area) */}
          <Area
            type="monotone"
            dataKey="confidenceUpper"
            stroke="none"
            fill="url(#colorConfidence)"
            fillOpacity={0.2}
            name="Confidence Interval"
          />
          <Area
            type="monotone"
            dataKey="confidenceLower"
            stroke="none"
            fill="#0f172a" // Mask the bottom part to create a range effect visually
            fillOpacity={1}
            name="Confidence Interval Low"
            legendType="none"
            tooltipType="none"
          />

          <Line
            type="monotone"
            dataKey="actual"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Actuals"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            name="AI Forecast"
          />
          <Line
            type="monotone"
            dataKey="budget"
            stroke="#94a3b8"
            strokeWidth={1}
            dot={false}
            name="Budget"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
