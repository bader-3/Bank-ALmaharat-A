import { IconSparkle } from "@/components/ui/icons";

interface AiRecommendationReasonProps {
  reason: string;
  compact?: boolean;
}

export function AiRecommendationReason({ reason, compact }: AiRecommendationReasonProps) {
  return (
    <div className={`rounded-xl border border-gold-200/50 bg-gold-50/50 ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
      <div className="flex items-start gap-2">
        <IconSparkle size={14} className="mt-0.5 shrink-0 text-gold-600" />
        <p className={`${compact ? "text-xs leading-relaxed" : "type-body"} text-foreground-secondary`}>
          <span className="font-medium text-navy-900">لماذا؟ </span>
          {reason}
        </p>
      </div>
    </div>
  );
}

