"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ClipboardList,
  Leaf,
  FileBarChart2,
  ShieldAlert,
  LogOut,
  User,
} from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  currentRole?: string;
  userName?: string;
}

export default function Sidebar({
  currentRole = "Venue Director",
  userName = "Carlos Mendes",
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Crowd Intelligence", href: "/crowd", icon: Users },
    { name: "Incident Manager", href: "/incidents", icon: AlertTriangle },
    { name: "Volunteer Coordinator", href: "/volunteers", icon: ClipboardList },
    { name: "Sustainability", href: "/sustainability", icon: Leaf },
    { name: "Reports", href: "/reports", icon: FileBarChart2 },
  ];

  return (
    <aside
      className="w-[280px] h-screen fixed left-0 top-0 bg-bg-surface border-r border-border-subtle flex flex-col justify-between z-30"
      id="sidebar-container"
      role="navigation"
      aria-label="Primary Workspace Navigation"
    >
      {/* Brand Header */}
      <div>
        <div className="h-[72px] flex items-center px-6 border-b border-border-subtle gap-3">
          <div className="w-8 h-8 rounded-sm bg-brand-green-deep border border-brand-gold flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-md font-outfit font-bold tracking-wide text-text-primary">
              StadiumIQ
            </h1>
            <span className="text-[10px] text-brand-gold tracking-widest uppercase font-semibold">
              Command Center
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5" aria-label="Main navigation links">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3.5 px-4.5 py-3 rounded-md text-sm transition-all duration-200",
                  isActive
                    ? "bg-brand-green-deep/30 border border-brand-green-light/40 text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40 border border-transparent",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5",
                    isActive ? "text-brand-gold" : "text-text-secondary",
                  )}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Operator profile card at bottom */}
      <div className="p-4 border-t border-border-subtle space-y-3 bg-bg-base/40">
        <div className="flex items-center gap-3.5 px-2">
          <div className="w-10 h-10 rounded-full bg-brand-green-deep/50 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
            <User className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-text-primary truncate">
              {userName}
            </p>
            <p className="text-[10px] text-text-secondary truncate">
              {currentRole}
            </p>
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border-subtle hover:border-alert-danger/40 hover:bg-alert-danger/5 hover:text-alert-danger text-text-secondary text-xs rounded-sm transition-all duration-200"
          onClick={() => console.log("Logging out...")}
          aria-label="Logout from session"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
