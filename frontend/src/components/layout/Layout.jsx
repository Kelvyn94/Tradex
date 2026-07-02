import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 ml-20 lg:ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
