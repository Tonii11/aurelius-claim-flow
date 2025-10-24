import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected";
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    pending: {
      label: "Pending",
      className: "bg-warning text-warning-foreground",
      icon: Clock,
    },
    approved: {
      label: "Approved",
      className: "bg-success text-success-foreground",
      icon: CheckCircle,
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive text-destructive-foreground",
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
