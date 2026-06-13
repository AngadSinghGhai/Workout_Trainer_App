import { useState } from "react";
import { useGetProgress, getGetProgressQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { splitHexColors } from "@/lib/splits";
import { TrendingUp } from "lucide-react";

export default function ProgressPage() {
  const { data: progress, isLoading } = useGetProgress();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exercises = progress ?? [];
  const current = exercises.find((e) => e.exerciseName === selectedExercise) ?? exercises[0] ?? null;

  const displayName = current?.exerciseName ?? selectedExercise;

  const splitColorFor = (muscleGroup: string): string => {
    const map: Record<string, string> = {
      Chest: splitHexColors.Push,
      Triceps: splitHexColors.Push,
      Shoulders: splitHexColors.Push,
      Back: splitHexColors.Pull,
      Biceps: splitHexColors.Pull,
      Forearms: splitHexColors.Pull,
      Legs: splitHexColors.Legs,
      Calves: splitHexColors.Legs,
    };
    return map[muscleGroup] ?? "#888";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Progress</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!exercises.length) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">Progress</h1>
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <TrendingUp size={48} className="mb-4" />
          <p className="text-lg">Log some sets to see your progress.</p>
        </div>
      </div>
    );
  }

  const accentColor = current ? splitColorFor(current.muscleGroup) : "#888";

  const chartData = (current?.dataPoints ?? []).map((dp) => ({
    date: dp.date.slice(5),
    "Max Weight (lbs)": dp.maxWeightKg ?? 0,
    Volume: Math.round(dp.totalVolume),
  }));

  return (
    <div className="pb-6">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-3">Progress</h1>
        <select
          value={current?.exerciseName ?? ""}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none"
        >
          {exercises.map((ex) => (
            <option key={ex.exerciseName} value={ex.exerciseName}>
              {ex.exerciseName}
            </option>
          ))}
        </select>
      </div>

      {current && (
        <div className="p-4 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
              {current.muscleGroup}
            </p>
            <h2 className="text-2xl font-black">{displayName}</h2>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Max Weight (lbs)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: "#ffffff60", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#ffffff60", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: `1px solid ${accentColor}40`, borderRadius: 8, color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="Max Weight (lbs)" fill={accentColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Total Volume (kg)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: "#ffffff60", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#ffffff60", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: `1px solid ${accentColor}40`, borderRadius: 8, color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="Volume" fill={accentColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
