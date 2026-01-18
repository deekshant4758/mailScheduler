"use client";

import { signOut, useSession } from "next-auth/react";
import { Search, RefreshCw, Filter, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
// import { useEmailStats } from "@/contexts/EmailStatsContext";
import { useEmailStats } from "@/context/EmailStatsContext";
import toast from "react-hot-toast";

export const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { refreshStats } = useEmailStats();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh stats
      await refreshStats();
      
      // Refresh current page data
      router.refresh();
      
      toast.success("Data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error(error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleFilter = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast(`Search functionality coming soon: "${searchQuery}"`);
      // TODO: Implement search functionality
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-6">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={handleFilter}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors relative ${
                showFilterMenu ? "bg-gray-100" : ""
              }`}
              title="Filter emails"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>

            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">Filter by Status</p>
                </div>
                <button
                  onClick={() => {
                    toast("Showing all emails");
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  All Emails
                </button>
                <button
                  onClick={() => {
                    toast("Filtering: Scheduled only");
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Scheduled
                </button>
                <button
                  onClick={() => {
                    toast("Filtering: Queued only");
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Queued
                </button>
                <button
                  onClick={() => {
                    toast("Filtering: Sent only");
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sent
                </button>
                <button
                  onClick={() => {
                    toast("Filtering: Failed only");
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Failed
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email || "user@example.com"}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown content */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push("/scheduled");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};