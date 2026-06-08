import { getSupabase, hasSupabase } from "../db/supabase.js";

export type OnboardingStepName = "search" | "crm" | "proposal";

export type OnboardingStatus = {
  workspace_id: string;
  step_search_completed: boolean;
  step_crm_completed: boolean;
  step_proposal_completed: boolean;
  completed_at: string | null;
};

const memory = new Map<string, OnboardingStatus>();

function defaultStatus(workspaceId: string): OnboardingStatus {
  return {
    workspace_id: workspaceId,
    step_search_completed: false,
    step_crm_completed: false,
    step_proposal_completed: false,
    completed_at: null
  };
}

function isCompleted(status: OnboardingStatus) {
  return status.step_search_completed && status.step_crm_completed && status.step_proposal_completed;
}

export async function getOnboardingStatus(workspaceId = "default"): Promise<OnboardingStatus> {
  if (!hasSupabase()) return memory.get(workspaceId) ?? defaultStatus(workspaceId);
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("onboarding_steps")
    .select("workspace_id, step_search_completed, step_crm_completed, step_proposal_completed, completed_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) {
    const fallback = memory.get(workspaceId) ?? defaultStatus(workspaceId);
    return { ...fallback, schemaUnavailable: true } as OnboardingStatus;
  }
  if (data) return data as OnboardingStatus;
  return createOnboardingStatus(workspaceId);
}

export async function createOnboardingStatus(workspaceId = "default"): Promise<OnboardingStatus> {
  const status = defaultStatus(workspaceId);
  memory.set(workspaceId, status);
  if (!hasSupabase()) return status;
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("onboarding_steps")
    .upsert({ workspace_id: workspaceId }, { onConflict: "workspace_id" })
    .select("workspace_id, step_search_completed, step_crm_completed, step_proposal_completed, completed_at")
    .single();
  if (error) return status;
  return data as OnboardingStatus;
}

export async function markOnboardingStep(workspaceId: string, step: OnboardingStepName): Promise<OnboardingStatus> {
  const current = await getOnboardingStatus(workspaceId);
  const updates: Partial<OnboardingStatus> & { updated_at?: string } = { updated_at: new Date().toISOString() };
  if (step === "search") updates.step_search_completed = true;
  if (step === "crm") updates.step_crm_completed = true;
  if (step === "proposal") updates.step_proposal_completed = true;

  const next = { ...current, ...updates } as OnboardingStatus;
  if (isCompleted(next) && !next.completed_at) {
    next.completed_at = new Date().toISOString();
    updates.completed_at = next.completed_at;
  }
  memory.set(workspaceId, next);

  if (hasSupabase()) {
    const sb = getSupabase()!;
    await sb.from("onboarding_steps").upsert(
      {
        workspace_id: workspaceId,
        ...updates
      },
      { onConflict: "workspace_id" }
    );
    if (next.completed_at) {
      await sb.from("nodere_workspaces").update({
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }).eq("id", workspaceId);
      try {
        await sb.from("workspaces").update({
          onboarding_completed: true
        }).eq("id", workspaceId);
      } catch {
        // Compatibilidade: alguns ambientes usam apenas nodere_workspaces.
      }
    }
  }
  return next;
}
