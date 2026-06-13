import { useLocation } from "wouter";
import { useCreateWorkout, WorkoutInputType, WorkoutInput } from "@workspace/api-client-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string(),
  type: z.nativeEnum(WorkoutInputType),
  durationMinutes: z.coerce.number().min(1).optional().or(z.literal(0)).transform(v => v === 0 ? undefined : v),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WorkoutNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createWorkout = useCreateWorkout();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Workout " + format(new Date(), "MMM d"),
      date: format(new Date(), "yyyy-MM-dd"),
      type: WorkoutInputType.strength,
      durationMinutes: 60,
      notes: "",
    },
  });

  function onSubmit(values: FormValues) {
    createWorkout.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          toast({
            title: "Session initiated",
            description: "Workout log created successfully.",
          });
          setLocation(`/workouts/${data.id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create workout.",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">New Session</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Initialize a new training log.</p>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border font-mono uppercase text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(WorkoutInputType).map(type => (
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
                  disabled={createWorkout.isPending}
                >
                  {createWorkout.isPending ? "INITIALIZING..." : "START SESSION"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
