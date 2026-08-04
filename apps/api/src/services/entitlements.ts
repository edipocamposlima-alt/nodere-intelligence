import { getSupabase } from "../db/supabase.js";

export type SessionEntitlementIdentity = {
  userId?: string | null;
  authUserId?: string | null;
  workspaceId?: string | null;
};

export type AccountEntitlement = {
  accountType: "STANDARD" | "OWNER_INTERNAL";
  billingExempt: boolean;
  planEnforcementExempt: boolean;
  internalCreditBlocking: boolean;
  usageMeteringEnabled: boolean;
  providerLimitsStillApply: boolean;
  authUserId: string | null;
};

const STANDARD_ENTITLEMENT: AccountEntitlement = {
  accountType: "STANDARD",
  billingExempt: false,
  planEnforcementExempt: false,
  internalCreditBlocking: true,
  usageMeteringEnabled: true,
  providerLimitsStillApply: true,
  authUserId: null
};

export async function getAccountEntitlement(identity?: SessionEntitlementIdentity | null): Promise<AccountEntitlement> {
  const sb = getSupabase();
  if (!sb || !identity) return STANDARD_ENTITLEMENT;

  let authUserId = identity.authUserId || null;
  if (!authUserId && identity.userId) {
    const membership = await sb
      .from("nodere_platform_users")
      .select("auth_user_id")
      .eq("id", identity.userId)
      .maybeSingle();
    if (!membership.error && membership.data?.auth_user_id) authUserId = String(membership.data.auth_user_id);
  }
  if (!authUserId) return STANDARD_ENTITLEMENT;

  let query = sb
    .from("nodere_owner_entitlements")
    .select("user_id,workspace_id,account_type,billing_exempt,plan_enforcement_exempt,internal_credit_blocking,usage_metering_enabled,provider_limits_still_apply,active")
    .eq("user_id", authUserId)
    .eq("active", true);
  if (identity.workspaceId) query = query.eq("workspace_id", identity.workspaceId);
  const { data, error } = await query.maybeSingle();
  if (error || !data || data.account_type !== "OWNER_INTERNAL") return { ...STANDARD_ENTITLEMENT, authUserId };

  return {
    accountType: "OWNER_INTERNAL",
    billingExempt: Boolean(data.billing_exempt),
    planEnforcementExempt: Boolean(data.plan_enforcement_exempt),
    internalCreditBlocking: Boolean(data.internal_credit_blocking),
    usageMeteringEnabled: Boolean(data.usage_metering_enabled),
    providerLimitsStillApply: Boolean(data.provider_limits_still_apply),
    authUserId
  };
}

export function isInternalOwnerEntitlement(entitlement?: AccountEntitlement | null) {
  return entitlement?.accountType === "OWNER_INTERNAL"
    && entitlement.billingExempt
    && entitlement.planEnforcementExempt
    && !entitlement.internalCreditBlocking;
}
