import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { Activity, LogOut, User, Clock, Menu } from "lucide-react";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-800/90 backdrop-blur-sm border-b border-dark-700 h-[73px] px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Activity className="w-8 h-8 text-accent" />
        <h1 className="text-xl font-cond font-bold text-accent tracking-wider">
          TRADEX
        </h1>
        <span className="text-xs text-gray-500 font-cond tracking-wider hidden sm:inline">
          // JOURNAL
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-xs">
            {time.toUTCString().replace(" GMT", " UTC")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300 hidden sm:inline">
            {user?.username}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-danger transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
