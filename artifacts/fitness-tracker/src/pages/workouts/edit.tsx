import { useLocation, useParams } from "wouter";
import { useGetWorkout, useUpdateWorkout, getGetWorkoutQueryKey, WorkoutUpdateType, WorkoutUpdate } from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string(),
  type: z.nativeEnum(WorkoutUpdateType),
  durationMinutes: z.coerce.number().min(1).optional().or(z.literal(0)).transform(v => v === 0 ? undefined : v),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WorkoutEdit() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: workout, isLoading } = useGetWorkout(id, { 
    query: { enabled: !!id, queryKey: getGetWorkoutQueryKey(id) } 
  });
  
  const updateWorkout = useUpdateWorkout();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: "",
      type: WorkoutUpdateType.strength,
      durationMinutes: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (workout) {
      form.reset({
        name: workout.name,
        date: workout.date,
        type: workout.type as any,
        durationMinutes: workout.durationMinutes || undefined,
        notes: workout.notes || "",
      });
    }
  }, [workout, form]);

  if (isLoading || !workout) {
    return <div className="text-muted-foreground font-mono animate-pulse">Loading data...</div>;
  }

  function onSubmit(values: FormValues) {
    updateWorkout.mutate(
      { id, data: values },
      {
        onSuccess: (data) => {
          toast({
            title: "Updated",
            description: "Workout metadata saved.",
          });
          queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(id) });
          setLocation(`/workouts/${id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update workout.",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">Edit Details</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{workout.name}</p>
        </div>
        <Button variant="outline" onClick={() => setLocation(`/workouts/${id}`)} className="font-mono text-xs">
          CANCEL
        </Button>
      </div>

      <Card className="bg-card border-border rounded-sm">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wider">Session Name</FormLabel>
                      <FormControl>
                        <Input className="bg-background border-border font-sans" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wider">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background border-border font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wider">Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border font-mono uppercase text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(WorkoutUpdateType).map(type => (
                            <SelectItem key={type} value={type} className="font-mono uppercase text-xs">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-wider">Est. Duration (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" className="bg-background border-border font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wider">Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Goals, conditions, focus..." 
                        className="resize-none bg-background border-border font-sans min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t border-border">
                <Button 
                  type="submit" 
                  className="font-display uppercase tracking-wider"
                  disabled={updateWorkout.isPending}
                >
                  {updateWorkout.isPending ? "SAVING..." : "SAVE CHANGES"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
