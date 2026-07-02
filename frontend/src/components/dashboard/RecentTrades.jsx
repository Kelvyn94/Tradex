import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";

const RecentTrades = ({ trades }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No trades yet. Start logging your trades!</p>
        <Link
          to="/trades"
          className="text-accent text-sm hover:text-accent/80 transition-colors inline-block mt-2"
        >
          Log Your First Trade →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-dark-700">
            <th className="pb-2 font-cond tracking-wider">Date</th>
            <th className="pb-2 font-cond tracking-wider">Instrument</th>
            <th className="pb-2 font-cond tracking-wider">Direction</th>
            <th className="pb-2 font-cond tracking-wider text-right">Entry</th>
            <th className="pb-2 font-cond tracking-wider text-right">Exit</th>
            <th className="pb-2 font-cond tracking-wider text-right">P&L</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 5).map((trade) => {
            const pnl = trade.pnl || 0;
            const isWin = pnl >= 0;
            return (
              <tr
                key={trade.id}
                className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
              >
                <td className="py-3 text-sm font-mono text-gray-300">
                  {trade.date}
                </td>
                <td className="py-3 text-sm font-bold text-white">
                  {trade.instrument}
                </td>
                <td className="py-3 text-sm">
                  <span
                    className={
                      trade.direction === "Long"
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    {trade.direction}
                  </span>
                </td>
                <td className="py-3 text-sm text-right font-mono text-gray-300">
                  {trade.entry}
                </td>
                <td className="py-3 text-sm text-right font-mono text-gray-300">
                  {trade.exit}
                </td>
                <td
                  className={`py-3 text-sm text-right font-mono font-bold ${isWin ? "text-success" : "text-danger"}`}
                >
                  {isWin ? "+" : ""}
                  {pnl.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {trades.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            to="/trades"
            className="text-accent text-sm hover:text-accent/80 transition-colors"
          >
            View All {trades.length} Trades →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentTrades;
