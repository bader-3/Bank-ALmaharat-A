"use client";

import { NoorDiscoveryPanel } from "@/components/ai/noor-discovery-panel";
import { PlanningPreferencePanel } from "@/components/ai/planning-preference-panel";
import {
  getMissingPlanningKey,
  isStructuredPlanningStep,
  type PlanPreferenceKey,
} from "@/lib/ai/planning";
import type { CourseLevel, DeliveryMode } from "@/types/course";
import type { PlanDiscoveryMode, PlanningSession } from "@/types/noor";

type NoorChatExtrasProps = {
  planningSession: PlanningSession | null;
  onConfirmSpecialty: (specialtyId: string) => void;
  onConfirmLevel: (level: CourseLevel) => void;
  onConfirmDays: (days: string[]) => void;
  onConfirmTime: (hour: number, period: "صباحًا" | "مساءً") => void;
  onConfirmDelivery: (modes: DeliveryMode[]) => void;
  onAcceptSuggestion: (key: PlanPreferenceKey) => void;
  onChooseDiscoveryMode: (mode: PlanDiscoveryMode) => void;
  onChooseDiscoverySpecialty: (specialtyId: string) => void;
  onChooseDiscoveryLevel: (level: CourseLevel) => void;
  onChooseDiscoveryDelivery: (modes: DeliveryMode[]) => void;
  onToggleDiscoveryCourse: (slug: string) => void;
  onBuildFromDiscovery: () => void;
  onCancelDiscovery: () => void;
};

export function NoorChatExtras({
  planningSession,
  onConfirmSpecialty,
  onConfirmLevel,
  onConfirmDays,
  onConfirmTime,
  onConfirmDelivery,
  onAcceptSuggestion,
  onChooseDiscoveryMode,
  onChooseDiscoverySpecialty,
  onChooseDiscoveryLevel,
  onChooseDiscoveryDelivery,
  onToggleDiscoveryCourse,
  onBuildFromDiscovery,
  onCancelDiscovery,
}: NoorChatExtrasProps) {
  if (!planningSession) return null;

  if (planningSession.discovery?.active) {
    return (
      <NoorDiscoveryPanel
        discovery={planningSession.discovery}
        onChooseMode={onChooseDiscoveryMode}
        onChooseSpecialty={onChooseDiscoverySpecialty}
        onChooseLevel={onChooseDiscoveryLevel}
        onChooseDelivery={onChooseDiscoveryDelivery}
        onToggleCourse={onToggleDiscoveryCourse}
        onBuild={onBuildFromDiscovery}
        onCancel={onCancelDiscovery}
      />
    );
  }

  if (planningSession.status === "collecting_preferences") {
    return (
      <PlanningPreferencePanel
        preferences={planningSession.preferences}
        suggestedPreferences={planningSession.suggestedPreferences}
        onConfirmSpecialty={onConfirmSpecialty}
        onConfirmLevel={onConfirmLevel}
        onConfirmDays={onConfirmDays}
        onConfirmTime={onConfirmTime}
        onConfirmDelivery={onConfirmDelivery}
        onAcceptSuggestion={onAcceptSuggestion}
      />
    );
  }

  return null;
}

export function getNoorChatInteractionLocked(planningSession: PlanningSession | null): boolean {
  if (!planningSession || planningSession.status !== "collecting_preferences") {
    return false;
  }
  const step = getMissingPlanningKey(planningSession.preferences);
  return isStructuredPlanningStep(step);
}
