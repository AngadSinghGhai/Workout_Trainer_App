import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useCreateWorkout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListWorkoutsQueryKey } from "@workspace/api-client-react";
import { splitHexColors } from "@/lib/splits";
import { ArrowLeft } from "lucide-react";

type Split = "Push" | "Pull" | "Legs" | "Upper" | "Arms" | "Lower";

const SPLITS: Split[] = ["Push", "Pull", "Legs", "Upper", "Arms", "Lower"];

const defaultNames: Record<Split, string> = {
  Push: "Push Day",
  Pull: "Pull Day",
  Legs: "Legs Day",
  Upper: "Upper Body",
  Arms: "Arms Day",
  Lower: "Lower Day",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function NewWorkoutPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { mutate: createWorkout, isPending } = useCreateWorkout();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      split: "" as Split | "",
      name: "",
      date: todayStr(),
    },
  });

  const selectedSplit = watch("split");

  function pickSplit(split: Split) {
    setValue("split", split);
    setValue("name", defaultNames[split]);
  }

  function onSubmit(values: { split: Split | ""; name: string; date: string }) {
    if (!values.split) return;
    createWorkout(
      { data: { name: values.name, date: values.date, split: values.split as Split } },
      {
        onSuccess: (workout) => {
          queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
          navigate(`/workouts/${workout.id}`);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <button onClick={() => navigate("/workouts")} className="text-white/60 active:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">New Session</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="p-4 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Choose Split</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {SPLITS.map((split) => {
              const color = splitHexColors[split];
              const isSelected = selectedSplit === split;
              return (
                <button
                  key={split}
                  type="button"
                  onClick={() => pickSplit(split)}
                  className="h-20 rounded-xl font-black text-xl uppercase tracking-tight transition-all active:scale-95"
                  style={{
                    backgroundColor: isSelected ? color : "rgba(255,255,255,0.05)",
                    color: isSelected ? "#000" : color,
                    border: `2px solid ${isSelected ? color : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {split}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSplit && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Session Name</p>
              <input
                {...register("name", { required: true })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg font-bold focus:outline-none focus:border-white/40"
                placeholder="Workout name"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Date</p>
              <input
                {...register("date", { required: true })}
                type="date"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg font-bold focus:outline-none focus:border-white/40"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-5 rounded-xl font-black text-xl uppercase tracking-tight text-black transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: splitHexColors[selectedSplit] }}
            >
              {isPending ? "Starting..." : "Start Session"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
