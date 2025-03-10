import { cn } from "@/lib/utils";

type ProposalStatus = "applied" | "under_review" | "approved" | "rejected" | "waitlist";

interface ProposalProgressProps {
  status: ProposalStatus;
  className?: string;
}

export function ProposalProgress({ status, className }: ProposalProgressProps) {
  const stages = [
    { key: "applied", label: "Applied" },
    { key: "under_review", label: "Under Review" },
    { key: "approved", label: "Approved" },
  ];

  const currentStageIndex = stages.findIndex(stage => stage.key === status);
  const isRejected = status === "rejected";
  const isWaitlisted = status === "waitlist";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        {stages.map((stage, index) => {
          const isActive = !isRejected && !isWaitlisted && index <= currentStageIndex;
          const isCurrentStage = stage.key === status;

          return (
            <div key={stage.key} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  isCurrentStage && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-full mt-4",
                    isActive ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {isRejected && (
        <div className="text-center mt-4">
          <span className="text-destructive font-medium">Proposal Rejected</span>
        </div>
      )}
      {isWaitlisted && (
        <div className="text-center mt-4">
          <span className="text-yellow-600 font-medium">Waitlisted</span>
        </div>
      )}
    </div>
  );
}