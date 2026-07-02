import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Activity,
  User,
  Lock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Shield,
  Globe,
} from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate("/");
    }
  };

  const features = [
    { icon: TrendingUp, text: "Track Performance" },
    { icon: BarChart3, text: "Advanced Analytics" },
    { icon: Shield, text: "Bank-level Security" },
    { icon: Globe, text: "Trade Anywhere" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
        {/* Left Side - Brand */}
        <div className="hidden lg:flex flex-col justify-center p-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-12 h-12 text-accent" />
            <h1 className="text-4xl font-cond font-bold text-accent tracking-wider">
              TRADEX
            </h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Track. Analyze. <br />
            Improve. Repeat.
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            The all-in-one trading journal that helps you build discipline and
            grow consistently.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-gray-300 bg-dark-800/50 p-3 rounded-lg border border-dark-700"
              >
                <feature.icon className="w-5 h-5 text-accent" />
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-dark-800/50 p-3 rounded-lg border border-dark-700">
              <div className="text-2xl font-bold text-accent">10K+</div>
              <div className="text-xs text-gray-500">Traders</div>
            </div>
            <div className="bg-dark-800/50 p-3 rounded-lg border border-dark-700">
              <div className="text-2xl font-bold text-success">2M+</div>
              <div className="text-xs text-gray-500">Trades Logged</div>
            </div>
            <div className="bg-dark-800/50 p-3 rounded-lg border border-dark-700">
              <div className="text-2xl font-bold text-warning">95%</div>
              <div className="text-xs text-gray-500">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-2xl p-8 shadow-2xl">
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <Activity className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-cond font-bold text-accent tracking-wider">
              TRADEX
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Log in to continue your trading journey
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-dark-900 font-bold py-3 rounded-lg hover:bg-accent/80 transition-all duration-200 hover:shadow-lg hover:shadow-accent/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-900"></div>
              ) : (
                <>
                  Login <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
