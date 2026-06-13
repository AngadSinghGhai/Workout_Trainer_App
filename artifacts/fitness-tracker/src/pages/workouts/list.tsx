import { useState } from "react";
import { Link } from "wouter";
import { useListWorkouts, getListWorkoutsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusSquare, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkoutList() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: workouts, isLoading } = useListWorkouts(
    {}, 
    { query: { queryKey: getListWorkoutsQueryKey({}) } }
  );

  const filteredWorkouts = workouts?.filter(w => typeFilter === "all" || w.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">Logbook</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">History of all training sessions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] font-mono text-xs uppercase bg-card border-border">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL TYPES</SelectItem>
                <SelectItem value="strength">STRENGTH</SelectItem>
                <SelectItem value="cardio">CARDIO</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="flexibility">FLEXIBILITY</SelectItem>
                <SelectItem value="sport">SPORT</SelectItem>
                <SelectItem value="other">OTHER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Link href="/workouts/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 font-display uppercase tracking-wider">
            <PlusSquare className="w-4 h-4 mr-2" />
            Log Session
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground font-mono animate-pulse">Loading logs...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredWorkouts?.map((workout) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer rounded-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg mb-1">{workout.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                      <span className="text-foreground">{format(new Date(workout.date), 'MMM d, yyyy')}</span>
                      {workout.durationMinutes && <span>{workout.durationMinutes} min</span>}
                      <span>{workout.exerciseCount || 0} exercises</span>
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground text-[10px] uppercase tracking-wider font-mono rounded">
                      {workout.type}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {filteredWorkouts?.length === 0 && (
            <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card/50">
              <p className="text-muted-foreground font-mono text-sm mb-4">No logs found matching criteria.</p>
              <Link href="/workouts/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 font-display uppercase tracking-wider">
                Start New Session
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
