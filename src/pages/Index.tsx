import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, FileText, CheckCircle, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  const checkUserAndRedirect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roles) {
        setUserRole(roles.role);
        if (roles.role === "lecturer") {
          navigate("/lecturer-dashboard");
        } else if (roles.role === "coordinator" || roles.role === "academic_manager") {
          navigate("/approver-dashboard");
        }
      }
    }
    setLoading(false);
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
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">AureliusClaims</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Sign In
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block p-4 bg-gradient-primary rounded-full mb-6">
              <GraduationCap className="h-16 w-16 text-primary-foreground" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Streamline Lecturer Claims
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive system for submitting, tracking, and approving academic claims with transparency and efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Easy Submission</h3>
                <p className="text-muted-foreground">
                  Submit claims quickly with an intuitive form. Upload supporting documents and track your submissions in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-success/10 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Transparent Approval</h3>
                <p className="text-muted-foreground">
                  Coordinators and managers can review and approve claims with clear status tracking throughout the process.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-secondary/10 rounded-full w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure & Reliable</h3>
                <p className="text-muted-foreground">
                  Built with security in mind. Role-based access ensures data privacy and consistent information delivery.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6">
              Create an account or sign in to manage your claims
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 AureliusClaims. Academic Claims Management System.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
