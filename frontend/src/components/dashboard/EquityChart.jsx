import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const EquityChart = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-sm">Need 2+ trades to plot equity curve</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((point, index) => ({
    ...point,
    index: index + 1,
    label: point.date ? point.date.substring(5) : `Trade ${index + 1}`,
  }));

  const isPositive = chartData[chartData.length - 1]?.equity >= 0;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis
            dataKey="label"
            stroke="#6c757d"
            tick={{ fontSize: 10, fill: "#6c757d" }}
          />
          <YAxis
            stroke="#6c757d"
            tick={{ fontSize: 10, fill: "#6c757d" }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a2e",
              border: "1px solid #2d2d44",
              borderRadius: "8px",
              color: "#e0e0e0",
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Equity"]}
          />
          <Line
            type="monotone"
            dataKey="equity"
            stroke={isPositive ? "#00e676" : "#ff3d57"}
            strokeWidth={2.5}
            dot={{ fill: isPositive ? "#00e676" : "#ff3d57", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquityChart;
