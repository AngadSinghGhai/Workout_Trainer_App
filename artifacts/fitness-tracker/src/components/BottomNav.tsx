import { Link, useLocation } from "wouter";
import { List, Plus, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const isDetail = location.match(/^\/workouts\/\d+$/);
  if (isDetail) return null; // Don't show bottom nav on workout detail page

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50">
      <Link href="/workouts" className={cn("flex flex-col items-center p-2", location === "/workouts" ? "text-primary" : "text-muted-foreground")}>
        <List size={24} />
      </Link>
      <Link href="/workouts/new" className={cn("flex items-center justify-center p-3 rounded-full -mt-6 shadow-lg shadow-black/50 text-white", location === "/workouts/new" ? "bg-primary text-black" : "bg-primary text-black")}>
        <Plus size={32} />
      </Link>
      <Link href="/progress" className={cn("flex flex-col items-center p-2", location === "/progress" ? "text-primary" : "text-muted-foreground")}>
        <TrendingUp size={24} />
      </Link>
      <Link href="/records" className={cn("flex flex-col items-center p-2", location === "/records" ? "text-primary" : "text-muted-foreground")}>
        <Trophy size={24} />
      </Link>
    </div>
  );
}
