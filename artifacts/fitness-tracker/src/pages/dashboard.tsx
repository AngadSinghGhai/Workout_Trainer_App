import { useGetStatsSummary, useGetWeeklyStats, useGetMuscleGroupStats, useListWorkouts, getGetStatsSummaryQueryKey, getGetWeeklyStatsQueryKey, getGetMuscleGroupStatsQueryKey, getListWorkoutsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Activity, Clock, Target, Flame, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary({ query: { queryKey: getGetStatsSummaryQueryKey() } });
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyStats({ weeks: 8 }, { query: { queryKey: getGetWeeklyStatsQueryKey({ weeks: 8 }) } });
  const { data: muscles, isLoading: musclesLoading } = useGetMuscleGroupStats({ query: { queryKey: getGetMuscleGroupStatsQueryKey() } });
  const { data: recentWorkouts, isLoading: recentLoading } = useListWorkouts({ limit: 5 }, { query: { queryKey: getListWorkoutsQueryKey({ limit: 5 }) } });

  if (statsLoading || weeklyLoading || musclesLoading || recentLoading) {
    return <div className="text-muted-foreground font-mono animate-pulse">Initializing sensors...</div>;
  }

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">Command Center</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Overview of recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium uppercase tracking-wider">Total Workouts</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-display font-bold">{stats?.totalWorkouts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+{stats?.thisMonthWorkouts ?? 0} this month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium uppercase tracking-wider">Avg Duration</span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-display font-bold">{Math.round(stats?.avgDurationMinutes ?? 0)}<span className="text-lg text-muted-foreground ml-1">m</span></div>
            <p className="text-xs text-muted-foreground mt-1">Per session</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium uppercase tracking-wider">Current Streak</span>
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-display font-bold">{stats?.currentStreak ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Consecutive weeks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium uppercase tracking-wider">This Week</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-display font-bold">{stats?.thisWeekWorkouts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wider text-sm text-muted-foreground">Volume over time (min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--secondary))'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="totalDurationMinutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border flex flex-col">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wider text-sm text-muted-foreground">Target Focus</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 min-h-[200px] flex items-center justify-center">
              {muscles && muscles.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={muscles}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="muscleGroup"
                    >
                      {muscles.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground font-mono text-sm">No data available.</div>
              )}
            </div>
            {muscles && muscles.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {muscles.map((m, idx) => (
                  <div key={m.muscleGroup} className="flex items-center text-xs font-mono">
                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-muted-foreground">{m.muscleGroup}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display uppercase tracking-wider text-sm text-muted-foreground">Recent Sessions</h2>
          <Link href="/workouts" className="text-xs font-mono text-primary hover:text-primary/80 flex items-center">
            VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentWorkouts?.map((workout) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-bold text-lg truncate pr-2">{workout.name}</h3>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground text-[10px] uppercase tracking-wider font-mono rounded">
                      {workout.type}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground space-y-1">
                    <div>{format(new Date(workout.date), 'MMM d, yyyy')}</div>
                    {workout.durationMinutes && <div>{workout.durationMinutes} min</div>}
                    <div>{workout.exerciseCount || 0} exercises</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {recentWorkouts?.length === 0 && (
            <div className="col-span-full py-8 text-center border border-dashed border-border rounded-lg bg-card/50">
              <p className="text-muted-foreground font-mono text-sm mb-2">No logs found.</p>
              <Link href="/workouts/new" className="text-primary font-mono text-sm hover:underline">
                START FIRST SESSION
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
