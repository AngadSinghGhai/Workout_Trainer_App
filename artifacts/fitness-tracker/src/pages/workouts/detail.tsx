import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetWorkout, 
  useDeleteWorkout, 
  useAddExercise, 
  useUpdateExercise, 
  useDeleteExercise,
  useListExerciseTemplates,
  getGetWorkoutQueryKey,
  getListExerciseTemplatesQueryKey,
  ExerciseInput,
  ExerciseUpdate,
  Exercise
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, Dumbbell, MoreVertical, Edit2, Trash2, Plus, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

export default function WorkoutDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  // Exercise form state
  const [exName, setExName] = useState("");
  const [exMuscle, setExMuscle] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [exDuration, setExDuration] = useState("");
  const [exNotes, setExNotes] = useState("");

  const { data: workout, isLoading } = useGetWorkout(id, { 
    query: { enabled: !!id, queryKey: getGetWorkoutQueryKey(id) } 
  });
  
  const { data: templates } = useListExerciseTemplates({
    query: { queryKey: getListExerciseTemplatesQueryKey() }
  });

  const deleteWorkout = useDeleteWorkout();
  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  if (isLoading || !workout) {
    return <div className="text-muted-foreground font-mono animate-pulse">Loading data...</div>;
  }

  const handleDeleteWorkout = () => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      deleteWorkout.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Workout has been removed." });
            setLocation("/workouts");
          }
        }
      );
    }
  };

  const handleOpenExerciseDialog = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setExName(exercise.name);
      setExMuscle(exercise.muscleGroup);
      setExSets(exercise.sets?.toString() || "");
      setExReps(exercise.reps?.toString() || "");
      setExWeight(exercise.weightKg?.toString() || "");
      setExDuration(exercise.durationMinutes?.toString() || "");
      setExNotes(exercise.notes || "");
    } else {
      setEditingExercise(null);
      setExName("");
      setExMuscle("");
      setExSets("");
      setExReps("");
      setExWeight("");
      setExDuration("");
      setExNotes("");
    }
    setExerciseDialogOpen(true);
  };

  const handleSaveExercise = () => {
    if (!exName || !exMuscle) {
      toast({ title: "Validation Error", description: "Name and Muscle Group are required.", variant: "destructive" });
      return;
    }

    const payload: ExerciseInput = {
      name: exName,
      muscleGroup: exMuscle,
      sets: exSets ? parseInt(exSets) : null,
      reps: exReps ? parseInt(exReps) : null,
      weightKg: exWeight ? parseFloat(exWeight) : null,
      durationMinutes: exDuration ? parseFloat(exDuration) : null,
      notes: exNotes || null,
    };

    if (editingExercise) {
      updateExercise.mutate(
        { id, exerciseId: editingExercise.id, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: "Exercise saved." });
            setExerciseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(id) });
          }
        }
      );
    } else {
      addExercise.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Added", description: "Exercise added to session." });
            setExerciseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(id) });
          }
        }
      );
    }
  };

  const handleDeleteExercise = (exerciseId: number) => {
    if (confirm("Delete this exercise?")) {
      deleteExercise.mutate(
        { id, exerciseId },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Exercise removed." });
            queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(id) });
          }
        }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] uppercase tracking-wider font-mono rounded">
              {workout.type}
            </span>
            <span className="text-muted-foreground font-mono text-sm">{format(new Date(workout.date), 'MMMM d, yyyy')}</span>
          </div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight text-foreground">{workout.name}</h1>
          
          <div className="flex items-center gap-4 mt-4 text-sm font-mono text-muted-foreground">
            {workout.durationMinutes && (
              <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {workout.durationMinutes} min</div>
            )}
            <div className="flex items-center"><Dumbbell className="w-4 h-4 mr-1" /> {workout.exercises.length} exercises</div>
          </div>
          
          {workout.notes && (
            <p className="mt-4 text-sm text-muted-foreground bg-card/50 p-3 rounded-md border border-border">
              {workout.notes}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="font-mono text-xs uppercase" onClick={() => setLocation(`/workouts/${id}/edit`)}>
            Edit Meta
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation(`/workouts/${id}/edit`)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteWorkout}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl uppercase tracking-wider">Log</h2>
          <Button onClick={() => handleOpenExerciseDialog()} className="font-display text-xs uppercase tracking-widest h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Entry
          </Button>
        </div>

        <div className="space-y-3">
          {workout.exercises.map((ex, index) => (
            <div key={ex.id} className="group relative bg-card border border-border rounded-sm p-0 flex hover:border-primary/50 transition-colors">
              <div className="w-8 flex flex-col items-center justify-center border-r border-border bg-muted/20 text-muted-foreground">
                <span className="font-mono text-xs opacity-50">{index + 1}</span>
              </div>
              
              <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{ex.name}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 border border-border rounded">{ex.muscleGroup}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm font-mono mt-2">
                    {ex.sets && ex.reps && (
                      <div className="text-foreground bg-secondary/50 px-2 py-0.5 rounded flex items-center">
                        <span className="text-muted-foreground mr-1 text-xs uppercase">Vol:</span> 
                        {ex.sets} <span className="text-muted-foreground mx-1">×</span> {ex.reps}
                      </div>
                    )}
                    {ex.weightKg && (
                      <div className="text-foreground bg-secondary/50 px-2 py-0.5 rounded flex items-center">
                        <span className="text-muted-foreground mr-1 text-xs uppercase">Wgt:</span> 
                        {ex.weightKg}kg
                      </div>
                    )}
                    {ex.durationMinutes && (
                      <div className="text-foreground bg-secondary/50 px-2 py-0.5 rounded flex items-center">
                        <span className="text-muted-foreground mr-1 text-xs uppercase">Dur:</span> 
                        {ex.durationMinutes}m
                      </div>
                    )}
                  </div>
                  {ex.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{ex.notes}"</p>}
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenExerciseDialog(ex)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExercise(ex.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {workout.exercises.length === 0 && (
            <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card/50">
              <p className="text-muted-foreground font-mono text-sm mb-4">Logbook is empty for this session.</p>
              <Button variant="outline" onClick={() => handleOpenExerciseDialog()} className="font-mono text-xs uppercase">
                Add First Exercise
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Dialog */}
      <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">
              {editingExercise ? "Edit Entry" : "New Entry"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-mono uppercase text-muted-foreground">Name *</label>
              <Input className="col-span-3 font-sans bg-background border-border" value={exName} onChange={e => setExName(e.target.value)} placeholder="e.g. Barbell Squat" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-mono uppercase text-muted-foreground">Target *</label>
              <Input className="col-span-3 font-mono text-sm bg-background border-border" value={exMuscle} onChange={e => setExMuscle(e.target.value)} placeholder="e.g. Legs" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t border-border">
              <label className="text-right text-xs font-mono uppercase text-muted-foreground">Sets</label>
              <Input type="number" className="col-span-1 font-mono bg-background border-border" value={exSets} onChange={e => setExSets(e.target.value)} />
              
              <label className="text-right text-xs font-mono uppercase text-muted-foreground">Reps</label>
              <Input type="number" className="col-span-1 font-mono bg-background border-border" value={exReps} onChange={e => setExReps(e.target.value)} />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-mono uppercase text-muted-foreground">Weight(kg)</label>
              <Input type="number" step="0.5" className="col-span-1 font-mono bg-background border-border" value={exWeight} onChange={e => setExWeight(e.target.value)} />
              
              <label className="text-right text-xs font-mono uppercase text-muted-foreground">Time(m)</label>
              <Input type="number" step="0.5" className="col-span-1 font-mono bg-background border-border" value={exDuration} onChange={e => setExDuration(e.target.value)} />
            </div>

            <div className="grid grid-cols-4 items-start gap-4 pt-2 border-t border-border">
              <label className="text-right text-xs font-mono uppercase text-muted-foreground mt-2">Notes</label>
              <Textarea className="col-span-3 font-sans bg-background border-border resize-none" value={exNotes} onChange={e => setExNotes(e.target.value)} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseDialogOpen(false)} className="font-mono text-xs">CANCEL</Button>
            <Button onClick={handleSaveExercise} className="font-display text-xs tracking-widest uppercase">
              {addExercise.isPending || updateExercise.isPending ? "SAVING..." : "COMMIT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
