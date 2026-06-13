import { useListWorkouts, getListWorkoutsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { splitHexColors } from "@/lib/splits";
import { Plus } from "lucide-react";

export default function HistoryPage() {
  const { data: workouts, isLoading } = useListWorkouts();

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">History</h1>
      
      {isLoading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && workouts?.length === 0 && (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
          <p className="mb-4 text-lg">No workouts yet.</p>
          <Link href="/workouts/new" className="bg-primary text-black px-6 py-3 rounded-full font-bold flex items-center gap-2">
            <Plus size={20} />
            Start Workout
          </Link>
        </div>
      )}

      {!isLoading && workouts?.map((workout) => (
        <Link key={workout.id} href={`/workouts/${workout.id}`}>
          <div className="block bg-card border border-border p-4 rounded-xl mb-3 active:scale-95 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: splitHexColors[workout.split] }}
              />
              <span className="font-bold text-sm" style={{ color: splitHexColors[workout.split] }}>
                {workout.split}
              </span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                {format(new Date(workout.date), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold tracking-tight">{workout.name}</h2>
              <div className="text-sm text-muted-foreground">
                {workout.totalSets} sets
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
