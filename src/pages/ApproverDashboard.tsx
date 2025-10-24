import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { LogOut, CheckCircle, XCircle, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClaimWithProfile {
  id: string;
  lecturer_id: string;
  hours_worked: number;
  hourly_rate: number;
  total_amount: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const ApproverDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [claims, setClaims] = useState<ClaimWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

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
    await fetchClaims();
    setLoading(false);
  };

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from("claims")
      .select(`
        *,
        profiles:lecturer_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch claims");
      return;
    }

    setClaims((data || []) as any);
  };

  const handleApproveClaim = async (claimId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("claims")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claimId);

      if (error) throw error;

      toast.success("Claim approved successfully!");
      await fetchClaims();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!selectedClaim || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("claims")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedClaim.id);

      if (error) throw error;

      toast.success("Claim rejected");
      setRejectionReason("");
      setSelectedClaim(null);
      await fetchClaims();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredClaims = (status: string) => {
    if (status === "all") return claims;
    return claims.filter((claim) => claim.status === status);
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
            <p className="text-sm text-muted-foreground">Approver Dashboard</p>
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
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Claims</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            {["all", "pending", "approved", "rejected"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {filteredClaims(status).length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No {status !== "all" ? status : ""} claims found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredClaims(status).map((claim) => (
                    <Card key={claim.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {claim.profiles.full_name}
                            </CardTitle>
                            <CardDescription>{claim.profiles.email}</CardDescription>
                          </div>
                          <StatusBadge status={claim.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Hours</p>
                            <p className="font-semibold">{claim.hours_worked}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rate</p>
                            <p className="font-semibold">R {claim.hourly_rate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-semibold text-primary">
                              R {claim.total_amount}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <p className="font-semibold text-sm">
                              {new Date(claim.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {claim.notes && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm">{claim.notes}</p>
                          </div>
                        )}

                        {claim.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveClaim(claim.id)}
                              disabled={processing}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => setSelectedClaim(claim)}
                                  disabled={processing}
                                  className="flex-1"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Claim</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this claim
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="reason">Rejection Reason</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="Explain why this claim is being rejected..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleRejectClaim}
                                    disabled={processing || !rejectionReason.trim()}
                                    className="w-full"
                                    variant="destructive"
                                  >
                                    Confirm Rejection
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ApproverDashboard;
