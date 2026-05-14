import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-72 p-8 lg:p-12 bg-background-light dark:bg-background-dark min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
