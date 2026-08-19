import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  colorScheme = 'emerald',
  onClick,
}) => {
  const getColorStyles = () => {
    switch (colorScheme) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          gradient: 'from-emerald-500/5 to-transparent',
          accent: 'text-emerald-600',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          gradient: 'from-amber-500/5 to-transparent',
          accent: 'text-amber-600',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          gradient: 'from-rose-500/5 to-transparent',
          accent: 'text-rose-600',
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
          gradient: 'from-blue-500/5 to-transparent',
          accent: 'text-blue-600',
        };
      case 'indigo':
      default:
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          gradient: 'from-indigo-500/5 to-transparent',
          accent: 'text-indigo-600',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-emerald-300' : ''
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} pointer-events-none`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h4 className="text-2xl font-extrabold text-slate-800 mt-2">
            {value}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-3 rounded-xl border shadow-sm ${styles.iconBg} shrink-0`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium">
          {trend >= 0 ? (
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}%
            </span>
          ) : (
            <span className="flex items-center text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
