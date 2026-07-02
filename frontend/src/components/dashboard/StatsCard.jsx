import React from "react";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = "accent",
  subtitle,
  trend,
}) => {
  const colorClasses = {
    green: "text-success",
    red: "text-danger",
    accent: "text-accent",
    yellow: "text-warning",
  };

  return (
    <div className={`stat-card ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-cond text-gray-500 tracking-wider">
            {title}
          </p>
          <p
            className={`text-2xl font-mono font-bold mt-1 ${colorClasses[color]}`}
          >
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <span
              className={`text-xs ${trend >= 0 ? "text-success" : "text-danger"} mt-1 inline-block`}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
        {Icon && <Icon className={`w-6 h-6 ${colorClasses[color]}`} />}
      </div>
    </div>
  );
};

export default StatsCard;
