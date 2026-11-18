"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Car,
  FileText,
  FileDown,
  Settings,
  LogOut,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Vehicles", href: "/vehicles", icon: Car },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Export Data", href: "/export", icon: FileDown },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 fixed inset-y-0 z-40">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              VehicleVault
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Document Manager
            </p>
          </div>
        </div>

        {/* Quick Add Button */}
        <div className="mt-4 px-2">
          <Link
            href="/vehicles/new"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="mt-6 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-blue-600 dark:text-blue-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 px-2 space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col truncate pr-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {session?.user?.name || "Driver"}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {session?.user?.email}
              </span>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ================= MOBILE HEADER ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            VehicleVault
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <ThemeToggle />
          <Link
            href="/vehicles/new"
            className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm ml-1"
            title="Add Vehicle"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 mb-16 md:mb-0 max-w-7xl">
        {/* Desktop top header for notifications */}
        <div className="hidden md:flex justify-end items-center gap-2 mb-6">
          <NotificationBell />
        </div>
        {children}
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-40 px-2 py-1.5 flex justify-around items-center">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                active
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <item.icon className={`w-5 h-5 mb-0.5 ${active ? "stroke-[2.5]" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
