import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { LogOut, FileText, Plus } from "lucide-react";

interface Claim {
  id: string;
  hours_worked: number;
  hourly_rate: number;
  total_amount: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  rejection_reason: string | null;
}

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [hoursWorked, setHoursWorked] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);
    await fetchClaims(session.user.id);
    setLoading(false);
  };

  const fetchClaims = async (userId: string) => {
    const { data, error } = await supabase
      .from("claims")
      .select("*")
      .eq("lecturer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch claims");
      return;
    }

    setClaims((data || []) as Claim[]);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("claims")
        .insert({
          lecturer_id: user.id,
          hours_worked: parseFloat(hoursWorked),
          hourly_rate: parseFloat(hourlyRate),
          notes: notes || null,
        });

      if (error) throw error;

      toast.success("Claim submitted successfully!");
      setHoursWorked("");
      setHourlyRate("");
      setNotes("");
      setShowForm(false);
      await fetchClaims(user.id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">AureliusClaims</h1>
            <p className="text-sm text-muted-foreground">Lecturer Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Submit New Claim
            </Button>
          )}

          {showForm && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Submit New Claim</CardTitle>
                <CardDescription>
                  Fill in the details of your work claim
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitClaim} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours Worked</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate">Hourly Rate (R)</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {hoursWorked && hourlyRate && (
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        R {(parseFloat(hoursWorked) * parseFloat(hourlyRate)).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional information about this claim..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <FileUpload />

                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? "Submitting..." : "Submit Claim"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">My Claims</h2>
            {claims.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No claims submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              claims.map((claim) => (
                <Card key={claim.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(claim.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Hours Worked</p>
                        <p className="font-semibold">{claim.hours_worked}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hourly Rate</p>
                        <p className="font-semibold">R {claim.hourly_rate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-primary">R {claim.total_amount}</p>
                      </div>
                    </div>

                    {claim.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{claim.notes}</p>
                      </div>
                    )}

                    {claim.rejection_reason && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive font-medium mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-destructive">{claim.rejection_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LecturerDashboard;
