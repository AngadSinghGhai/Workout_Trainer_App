import { useListWorkouts } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { splitHexColors } from "@/lib/splits";
import { Plus, Dumbbell } from "lucide-react";

export default function HistoryPage() {
  const { data: workouts, isLoading } = useListWorkouts();

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-2xl font-bold text-white">My Workouts</h1>
        <Link href="/workouts/new">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
          >
            <Plus size={16} />
            New
          </button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!workouts || workouts.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Dumbbell size={28} className="text-white/30" />
          </div>
          <p className="text-white font-semibold text-lg mb-1">No workouts yet</p>
          <p className="text-white/40 text-sm mb-6">Tap the + button to log your first session</p>
          <Link href="/workouts/new">
            <button className="px-6 py-3 rounded-full font-semibold text-sm bg-white text-black">
              Start a Workout
            </button>
          </Link>
        </div>
      )}

      {!isLoading && workouts && workouts.length > 0 && (
        <div className="space-y-2.5">
          {workouts.map((workout) => {
            const color = splitHexColors[workout.split];
            return (
              <Link key={workout.id} href={`/workouts/${workout.id}`}>
                <div
                  className="flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Split color pill */}
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: color, minHeight: 40 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
                        {workout.split}
                      </span>
                      <span className="text-xs text-white/30">·</span>
                      <span className="text-xs text-white/40">
                        {format(new Date(workout.date + "T12:00:00"), "MMM d")}
                      </span>
                    </div>
                    <p className="font-semibold text-white text-base leading-tight truncate">{workout.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-white">{workout.totalSets}</p>
                    <p className="text-xs text-white/40">sets</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
