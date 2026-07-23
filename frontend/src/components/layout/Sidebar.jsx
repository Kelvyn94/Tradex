// components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Bot,
  Settings,
  Database,
  Brain,
  Network,
  X,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Trades", icon: TrendingUp, path: "/trades" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "AI Assistant", icon: Bot, path: "/ai-assistant" },
  { name: "Data Engine", icon: Database, path: "/data-engine" },
  { name: "ICT Analysis", icon: Brain, path: "/ict" },
  { name: "Correlation", icon: Network, path: "/correlation" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ sidebarOpen, onClose }) {
  return (
    <aside
      className={`
        fixed left-0 top-[73px] z-40 h-[calc(100vh-73px)] 
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:top-0 lg:h-screen lg:translate-x-0
        ${sidebarOpen ? "lg:w-[200px]" : "lg:w-[72px]"}
      `}
      style={{
        width: sidebarOpen ? "200px" : "72px",
      }}
    >
      <div className="sidebar-premium flex h-full flex-col px-2 py-4 lg:px-3">
        {/* Logo/Brand */}
        <div
          className={`
            mb-6 flex items-center rounded-2xl border border-white/10 
            bg-white/5 px-3 py-3 transition-all duration-300
            ${sidebarOpen ? "justify-between" : "justify-center"}
          `}
        >
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
                  T
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                    Workspace
                  </p>
                  <p className="text-sm font-semibold text-white">TradeX</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 p-1.5 text-gray-400 hover:text-white transition-colors lg:hidden"
                onClick={onClose}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-base transition-all duration-300 hover:scale-110">
              T
            </div>
          )}
        </div>

        {/* Navigation - FIXED: Proper isActive handling */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className={({ isActive }) => `
                nav-item transition-all duration-200 rounded-xl relative
                ${isActive ? "active bg-blue-500/10 text-blue-400" : "text-gray-400"} 
                ${!sidebarOpen ? "justify-center px-2" : "px-3"}
                hover:bg-white/5 hover:text-white
              `}
              title={!sidebarOpen ? item.name : ""}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="icon flex-shrink-0 transition-transform duration-200"
                    size={20}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`
                      text-sm transition-all duration-200 whitespace-nowrap
                      ${!sidebarOpen ? "hidden lg:hidden" : "block"}
                    `}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        {sidebarOpen && (
          <div className="mt-auto pt-4 border-t border-white/5 animate-slide-up">
            <div className="px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                Version
              </p>
              <p className="text-xs text-gray-400">v2.0.0</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
