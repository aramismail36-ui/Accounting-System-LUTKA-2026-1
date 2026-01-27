import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  PieChart,
  Banknote,
  UtensilsCrossed,
  CircleDollarSign,
  UserCog,
  CalendarClock,
  Archive
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "داشبۆرد", href: "/", icon: LayoutDashboard },
    { name: "قوتابیان", href: "/students", icon: GraduationCap },
    { name: "داهاتەکان", href: "/income", icon: Wallet },
    { name: "خەرجییەکان", href: "/expenses", icon: Receipt },
    { name: "قیستەکان", href: "/payments", icon: Users },
    { name: "مامۆستا و فەرمانبەران", href: "/staff", icon: Users },
    { name: "خەرجی مووچە", href: "/salary-payments", icon: Banknote },
    { name: "پارەی خواردن", href: "/food-payments", icon: UtensilsCrossed },
    { name: "خاوەن پشکەکان", href: "/shareholders", icon: CircleDollarSign },
    { name: "ڕاپۆرتەکان", href: "/reports", icon: PieChart },
    { name: "بەکارهێنەران", href: "/users", icon: UserCog },
    { name: "ساڵی دارایی", href: "/fiscal-years", icon: CalendarClock },
    { name: "ئەرشیف", href: "/archive", icon: Archive },
    { name: "ڕێکخستنەکان", href: "/school-settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white shadow-2xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">سیستەمی لوتکە</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 mb-3">
          <Avatar className="h-9 w-9 border border-slate-600">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-slate-700 text-slate-300">
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-2"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          <span>چوونە دەرەوە</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 fixed inset-y-0 right-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="p-0 w-72 border-l border-slate-800 bg-slate-900">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:mr-72 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">سیستەمی لوتکە</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
