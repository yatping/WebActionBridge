import { Action } from "@/lib/types";

interface ActionCardProps {
  action: Action;
  index: number;
}

export default function ActionCard({ action, index }: ActionCardProps) {
  const getStatusBadge = () => {
    switch (action.status) {
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded-full bg-success-50 text-success-600 text-xs">
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-xs">
            In Progress
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded-full bg-danger-50 text-danger-600 text-xs">
            Failed
          </span>
        );
      case "queued":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 text-xs">
            Queued
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-primary-100 rounded-md p-2 mb-2 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-neutral-700">Action #{index}</span>
        {getStatusBadge()}
      </div>
      <p className="text-xs code-font bg-neutral-50 p-1.5 rounded">{action.code}</p>
      {action.error && (
        <p className="text-xs text-danger-600 mt-1">{action.error}</p>
      )}
    </div>
  );
}
