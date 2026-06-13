import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useCreateWorkout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListWorkoutsQueryKey } from "@workspace/api-client-react";
import { splitHexColors } from "@/lib/splits";
import { ArrowLeft } from "lucide-react";

type Split = "Push" | "Pull" | "Legs" | "Upper" | "Arms" | "Lower";

const SPLITS: { name: Split; description: string }[] = [
  { name: "Push",  description: "Chest · Shoulders · Triceps" },
  { name: "Pull",  description: "Back · Biceps · Forearms" },
  { name: "Legs",  description: "Quads · Hamstrings · Calves" },
  { name: "Upper", description: "Chest · Back · Shoulders" },
  { name: "Arms",  description: "Biceps · Triceps · Forearms" },
  { name: "Lower", description: "Quads · Hamstrings · Glutes" },
];

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
    defaultValues: { split: "" as Split | "", name: "", date: todayStr() },
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
    <div className="min-h-screen" style={{ background: "hsl(220 13% 7%)" }}>
      <div className="p-4 flex items-center gap-3 border-b border-white/8">
        <button onClick={() => navigate("/workouts")} className="text-white/50 active:text-white p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">New Session</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="p-4 space-y-6">
        {/* Split picker */}
        <div>
          <p className="text-sm font-semibold text-white/50 mb-3">Choose your split</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {SPLITS.map(({ name: split, description }) => {
              const color = splitHexColors[split];
              const isSelected = selectedSplit === split;
              return (
                <button
                  key={split}
                  type="button"
                  onClick={() => pickSplit(split)}
                  className="h-24 rounded-2xl text-left px-4 py-3 transition-all active:scale-95 flex flex-col justify-between"
                  style={{
                    backgroundColor: isSelected ? `${color}20` : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${isSelected ? color : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <span
                    className="text-lg font-bold leading-none"
                    style={{ color: isSelected ? color : "white" }}
                  >
                    {split}
                  </span>
                  <span className="text-[11px] leading-tight" style={{ color: isSelected ? `${color}99` : "rgba(255,255,255,0.35)" }}>
                    {description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedSplit && (
          <>
            <div>
              <p className="text-sm font-semibold text-white/50 mb-2">Session name</p>
              <input
                {...register("name", { required: true })}
                className="w-full rounded-xl px-4 py-3.5 text-white text-base font-medium focus:outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }}
                placeholder="e.g. Push Day"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-white/50 mb-2">Date</p>
              <input
                {...register("date", { required: true })}
                type="date"
                className="w-full rounded-xl px-4 py-3.5 text-white text-base font-medium focus:outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-2xl font-bold text-base text-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: splitHexColors[selectedSplit] }}
            >
              {isPending ? "Starting…" : `Start ${selectedSplit} Session`}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
