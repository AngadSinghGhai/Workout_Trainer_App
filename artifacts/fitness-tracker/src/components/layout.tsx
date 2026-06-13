import React from "react";
import { Link, useLocation } from "wouter";
import { Dumbbell, Activity, CalendarDays, PlusSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/workouts", label: "Logbook", icon: CalendarDays },
    { href: "/workouts/new", label: "New Session", icon: PlusSquare },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Dumbbell className="w-6 h-6 text-primary mr-2" />
          <span className="font-display font-bold text-xl tracking-tight uppercase">FITLOG</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
