"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Send, PenSquare } from "lucide-react";
// import { cn } from "@/lib/utils";
import { cn } from "@/lib/util";
import { useSession } from "next-auth/react";
import Image from "next/image";
// import { useEmailStats } from "@/contexts/EmailStatsContext";
import { useEmailStats } from "@/context/EmailStatsContext";

interface SidebarProps {
  onCompose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCompose }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { stats } = useEmailStats();

  const menuItems = [
    {
      label: "Scheduled",
      icon: Clock,
      href: "/scheduled",
      count: stats.scheduled,
    },
    {
      label: "Sent",
      icon: Send,
      href: "/sent",
      count: stats.sent,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo & User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 text-white font-bold text-xl px-3 py-2 rounded-lg">
            ONB
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() || "C"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email || "user@example.com"}
            </p>
          </div>
        </div>

        {/* Compose Button */}
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <PenSquare className="w-4 h-4" />
          Compose
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
            Core
          </p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold min-w-[24px] text-right",
                      isActive ? "text-green-600" : "text-gray-500"
                    )}
                  >
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
};