import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkout,
  getGetWorkoutQueryKey,
  getListWorkoutsQueryKey,
  useAddExercise,
  useDeleteExercise,
  useUpdateExercise,
  useLogSet,
  useDeleteSet,
  useListExerciseTemplates,
} from "@workspace/api-client-react";
import { useRestTimer } from "@/hooks/useRestTimer";
import { splitHexColors } from "@/lib/splits";
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp, Info, Shuffle } from "lucide-react";

type ExerciseTemplate = {
  id: number;
  name: string;
  muscleGroup: string;
  split: string;
  musclesWorked: string;
  formTip: string;
  alternatives: string[];
};

type WorkoutSet = {
  id: number;
  exerciseId: number;
  setNumber: number;
  reps: number;
  weightKg: number | null;
  completedAt: string;
};

type Exercise = {
  id: number;
  workoutId: number;
  name: string;
  muscleGroup: string;
  order: number;
  notes: string | null;
  sets: WorkoutSet[];
};

// Info drawer for exercise details
function ExerciseInfoDrawer({
  template,
  onClose,
  accentColor,
}: {
  template: ExerciseTemplate;
  onClose: () => void;
  accentColor: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-[#111] rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white">{template.name}</h2>
            <p className="text-xs font-bold mt-0.5" style={{ color: accentColor }}>
              {template.muscleGroup}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 active:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Muscles Worked</p>
            <p className="text-sm text-white/80">{template.musclesWorked}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Form Tip</p>
            <p className="text-sm text-white/80 leading-relaxed">{template.formTip}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Alternatives</p>
            <div className="space-y-1">
              {template.alternatives.map((alt) => (
                <div
                  key={alt}
                  className="px-3 py-2 rounded-lg bg-white/5 text-sm text-white/70 border border-white/10"
                >
                  {alt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rest timer banner
function RestTimerBanner({
  timeLeft,
  onDismiss,
  onAddTime,
  accentColor,
}: {
  timeLeft: number;
  onDismiss: () => void;
  onAddTime: (s: number) => void;
  accentColor: string;
}) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = timeLeft / 90;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3"
      style={{ background: `${accentColor}15`, borderTop: `2px solid ${accentColor}` }}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: accentColor }}>
          Rest
        </p>
        <p className="text-3xl font-black font-mono text-white" style={{ color: accentColor }}>
          {mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onAddTime(30)}
          className="px-3 py-2 rounded-lg text-sm font-bold border"
          style={{ color: accentColor, borderColor: `${accentColor}50` }}
        >
          +30s
        </button>
        <button
          onClick={onDismiss}
          className="text-white/40 active:text-white"
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );
}

// Individual exercise card
function ExerciseCard({
  exercise,
  workoutId,
  accentColor,
  templates,
  onSetLogged,
}: {
  exercise: Exercise;
  workoutId: number;
  accentColor: string;
  templates: ExerciseTemplate[];
  onSetLogged: () => void;
}) {
  const queryClient = useQueryClient();
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [infoOpen, setInfoOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const { mutate: logSet, isPending: logging } = useLogSet();
  const { mutate: deleteSet } = useDeleteSet();
  const { mutate: deleteExercise } = useDeleteExercise();
  const { mutate: updateExercise, isPending: swapping } = useUpdateExercise();

  const template = templates.find((t) => t.name === exercise.name);

  function handleSwap(altName: string) {
    const altTemplate = templates.find((t) => t.name === altName);
    updateExercise(
      {
        id: workoutId,
        exerciseId: exercise.id,
        data: {
          name: altName,
          muscleGroup: altTemplate?.muscleGroup ?? exercise.muscleGroup,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setSwapOpen(false);
        },
      }
    );
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(workoutId) });
    queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
  }

  function handleLogSet() {
    const parsedWeight = parseFloat(weight);
    logSet(
      {
        id: workoutId,
        exerciseId: exercise.id,
        data: {
          reps: parseInt(reps) || 1,
          weightKg: isNaN(parsedWeight) || parsedWeight === 0 ? null : parsedWeight,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          onSetLogged();
        },
      }
    );
  }

  function handleDeleteSet(setId: number) {
    deleteSet(
      { id: workoutId, exerciseId: exercise.id, setId },
      { onSuccess: invalidate }
    );
  }

  function handleDeleteExercise() {
    deleteExercise(
      { id: workoutId, exerciseId: exercise.id },
      { onSuccess: invalidate }
    );
  }

  return (
    <>
      {infoOpen && template && (
        <ExerciseInfoDrawer
          template={template}
          onClose={() => setInfoOpen(false)}
          accentColor={accentColor}
        />
      )}

      {/* Swap sheet */}
      {swapOpen && template && template.alternatives.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSwapOpen(false)}>
          <div
            className="w-full rounded-t-2xl p-5 pb-8"
            style={{ background: "hsl(220 12% 13%)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">Machine full? Try instead:</p>
              <button onClick={() => setSwapOpen(false)} className="text-white/30 active:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <p className="text-base font-bold text-white mb-4">{exercise.name} →</p>
            <div className="space-y-2.5">
              {template.alternatives.map((alt) => {
                const altT = templates.find((t) => t.name === alt);
                return (
                  <button
                    key={alt}
                    onClick={() => handleSwap(alt)}
                    disabled={swapping}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left active:scale-[0.98] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{alt}</p>
                      {altT && <p className="text-xs text-white/40 mt-0.5">{altT.muscleGroup}</p>}
                    </div>
                    <span className="text-xs font-bold" style={{ color: accentColor }}>Swap</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/[0.04] rounded-2xl overflow-hidden border border-white/10">
        {/* Exercise header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => template && setInfoOpen(true)}
              className="flex items-center gap-1.5 text-left"
            >
              <h3 className="text-base font-black text-white leading-tight">{exercise.name}</h3>
              {template && <Info size={14} className="text-white/30 flex-shrink-0" />}
            </button>
            <p className="text-xs mt-0.5 font-medium" style={{ color: accentColor }}>
              {exercise.muscleGroup}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {template && template.alternatives.length > 0 && (
              <button
                onClick={() => setSwapOpen(true)}
                className="text-white/30 active:text-white/70 p-1.5 flex items-center gap-1"
                title="Machine full? Swap exercise"
              >
                <Shuffle size={14} />
              </button>
            )}
            <button
              onClick={handleDeleteExercise}
              className="text-white/20 active:text-white/60 p-1 -mr-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sets table */}
        {exercise.sets.length > 0 && (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-[32px_1fr_1fr_28px] gap-x-2 text-xs font-bold uppercase tracking-widest text-white/30 pb-1.5 border-b border-white/10 mb-1.5">
              <span>#</span>
              <span>Reps</span>
              <span>Weight</span>
              <span />
            </div>
            {exercise.sets.map((set) => (
              <div
                key={set.id}
                className="grid grid-cols-[32px_1fr_1fr_28px] gap-x-2 items-center py-1.5"
              >
                <span className="text-sm font-mono text-white/40">{set.setNumber}</span>
                <span className="text-sm font-mono font-bold text-white">{set.reps}</span>
                <span className="text-sm font-mono font-bold text-white">
                  {set.weightKg != null ? `${set.weightKg} lbs` : "BW"}
                </span>
                <button
                  onClick={() => handleDeleteSet(set.id)}
                  className="text-white/20 active:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Log set input row */}
        <div className="p-4 pt-2 flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase text-white/30 mb-1">Reps</p>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white font-mono font-bold text-center text-lg focus:outline-none focus:border-white/30"
              min={1}
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase text-white/30 mb-1">Weight (lbs)</p>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white font-mono font-bold text-center text-lg focus:outline-none focus:border-white/30"
              min={0}
              step={5}
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleLogSet}
              disabled={logging}
              className="h-12 w-16 rounded-lg font-black text-sm text-black disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              {logging ? "..." : "Log"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Template row in the "add exercise" section
function TemplateRow({
  template,
  onAdd,
  accentColor,
}: {
  template: ExerciseTemplate;
  onAdd: (t: ExerciseTemplate) => void;
  accentColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 py-3">
        <button
          onClick={() => onAdd(template)}
          className="flex-1 flex items-center gap-3 text-left active:opacity-60"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-sm font-bold text-white">{template.name}</span>
          <span className="text-xs text-white/30 ml-auto">{template.muscleGroup}</span>
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-white/30 p-1"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {expanded && (
        <div className="pb-3 pl-5 pr-3 space-y-1.5">
          <p className="text-xs text-white/50 leading-relaxed">{template.formTip}</p>
          <p className="text-xs text-white/30">
            <span className="text-white/40 font-bold">Swaps: </span>
            {template.alternatives.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const workoutId = parseInt(params.id);
  const [, navigate] = useLocation();

  const { data: workout, isLoading } = useGetWorkout(workoutId, {
    query: { queryKey: getGetWorkoutQueryKey(workoutId), enabled: !!workoutId },
  });
  const { data: templates = [] } = useListExerciseTemplates();
  const { mutate: addExercise } = useAddExercise();
  const queryClient = useQueryClient();
  const { timeLeft, start: startTimer, dismiss: dismissTimer, addTime } = useRestTimer(90);

  const accentColor = workout ? splitHexColors[workout.split] ?? "#fff" : "#fff";

  // Templates for this split
  const splitTemplates = templates.filter((t) => workout && t.split === workout.split);

  // Group split templates by muscle group
  const templatesByGroup: Record<string, ExerciseTemplate[]> = {};
  for (const t of splitTemplates) {
    if (!templatesByGroup[t.muscleGroup]) templatesByGroup[t.muscleGroup] = [];
    templatesByGroup[t.muscleGroup].push(t);
  }

  function handleAddExercise(template: ExerciseTemplate) {
    addExercise(
      {
        id: workoutId,
        data: { name: template.name, muscleGroup: template.muscleGroup },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(workoutId) });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="h-8 w-40 bg-white/10 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40">Workout not found.</p>
      </div>
    );
  }

  const exercises = workout.exercises as Exercise[];

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-5 border-b border-white/10"
        style={{ borderBottomColor: `${accentColor}30` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/workouts")} className="text-white/50 active:text-white">
            <ArrowLeft size={22} />
          </button>
          <span
            className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {workout.split}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white leading-tight">{workout.name}</h1>
        <p className="text-sm text-white/40 mt-0.5">{workout.date}</p>
      </div>

      {/* Exercise cards */}
      <div className="p-4 space-y-4">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            workoutId={workoutId}
            accentColor={accentColor}
            templates={templates as ExerciseTemplate[]}
            onSetLogged={startTimer}
          />
        ))}

        {exercises.length === 0 && (
          <div className="text-center py-8 text-white/30">
            <p className="text-sm">Add your first exercise below</p>
          </div>
        )}
      </div>

      {/* Add exercises section */}
      <div className="px-4">
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">
              Add Exercise — {workout.split}
            </p>
          </div>

          {Object.entries(templatesByGroup).map(([group, groupTemplates]) => (
            <div key={group} className="px-4">
              <p className="text-[10px] font-black uppercase tracking-widest py-2 border-b border-white/5" style={{ color: `${accentColor}80` }}>
                {group}
              </p>
              {groupTemplates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t as ExerciseTemplate}
                  onAdd={handleAddExercise}
                  accentColor={accentColor}
                />
              ))}
            </div>
          ))}

          {splitTemplates.length === 0 && (
            <p className="px-4 py-4 text-sm text-white/30">No templates for this split.</p>
          )}
        </div>
      </div>

      {/* Rest timer banner */}
      {timeLeft !== null && timeLeft > 0 && (
        <RestTimerBanner
          timeLeft={timeLeft}
          onDismiss={dismissTimer}
          onAddTime={addTime}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
