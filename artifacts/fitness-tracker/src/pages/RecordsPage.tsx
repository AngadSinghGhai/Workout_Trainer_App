import { useGetPersonalRecords, useListExerciseTemplates } from "@workspace/api-client-react";
import { splitHexColors } from "@/lib/splits";
import { Trophy } from "lucide-react";

export default function RecordsPage() {
  const { data: records, isLoading } = useGetPersonalRecords();
  const { data: templates } = useListExerciseTemplates();

  const splitForExercise = (name: string): string => {
    const template = templates?.find((t) => t.name === name);
    return template?.split ?? "Push";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Records</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!records?.length) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">Records</h1>
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <Trophy size={48} className="mb-4" />
          <p className="text-lg">No records yet. Log some sets!</p>
        </div>
      </div>
    );
  }

  // Group by muscle group
  const grouped: Record<string, typeof records> = {};
  for (const rec of records) {
    const mg = rec.muscleGroup;
    if (!grouped[mg]) grouped[mg] = [];
    grouped[mg].push(rec);
  }

  return (
    <div className="pb-6">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Records</h1>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(grouped).map(([muscleGroup, recs]) => (
          <div key={muscleGroup}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">{muscleGroup}</p>
            <div className="space-y-2">
              {recs.map((rec) => {
                const split = splitForExercise(rec.exerciseName);
                const color = splitHexColors[split];
                return (
                  <div
                    key={rec.exerciseName}
                    className="bg-white/5 rounded-xl p-4 border-l-4"
                    style={{ borderLeftColor: color }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-base text-white">{rec.exerciseName}</p>
                        <p className="text-xs text-white/40 mt-0.5">{rec.workoutName} · {rec.achievedDate}</p>
                      </div>
                      <div className="text-right">
                        {rec.maxWeightKg != null ? (
                          <p className="text-2xl font-black font-mono" style={{ color }}>
                            {rec.maxWeightKg}<span className="text-sm font-bold text-white/40 ml-1">lbs</span>
                          </p>
                        ) : (
                          <p className="text-2xl font-black font-mono" style={{ color }}>BW</p>
                        )}
                        <p className="text-xs text-white/40">{rec.maxReps} reps</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
