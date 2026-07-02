import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListTodo, BarChart3 } from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/trades", icon: ListTodo, label: "Trade Log" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-20 lg:w-64 bg-dark-800/90 backdrop-blur-sm border-r border-dark-700 p-4 transition-all duration-300">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-dark-700"
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline font-cond text-sm tracking-wider">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="border-t border-dark-700 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="hidden lg:inline">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
