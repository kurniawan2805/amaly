import type { RealtimeChannel, Session, User } from "@supabase/supabase-js"

import type { AppLanguage, HijriOffset, PartnerRole } from "@/lib/app-settings"
import type { Database, Json } from "@/lib/database.types"
import { getQuranPageDetails, updateProgress, type QuranProgressLog, type QuranProgressState } from "@/lib/quran-progress"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"

type QuranProgressRow = Database["public"]["Tables"]["quran_progress"]["Row"]
type PartnerEventRow = Database["public"]["Tables"]["partner_events"]["Row"]

export type AuthStateSnapshot = {
  session: Session | null
  user: User | null
}

export type PartnerProfile = {
  id: string
  displayName: string
  avatarUrl: string | null
}

export type PartnerSnapshot = {
  partnershipId: string
  partnerRole: PartnerRole
  currentUserRole: PartnerRole
  profile: PartnerProfile
  quranProgress: QuranProgressState | null
}

export type PartnerInvite = {
  id: string
  code: string
  creatorRole: PartnerRole
  expiresAt: string
}

export type PartnerNotice = {
  id: string
  type: "quran_goal" | "nudge"
  message: string
}

export { isSupabaseConfigured }

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.")
  }

  return supabase
}

function asQuranLogs(value: Json): QuranProgressLog[] {
  return Array.isArray(value) ? (value.filter((item) => typeof item === "object" && item !== null) as unknown as QuranProgressLog[]) : []
}

function asCompletedJuzs(value: Json) {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : []
}

function quranRowToProgress(row: QuranProgressRow, language: AppLanguage, hijriOffset: HijriOffset): QuranProgressState {
  const logs = asQuranLogs(row.logs)
  const progress = updateProgress(row.last_page_read || row.page || 0, 0, logs, language, row.daily_goal, hijriOffset)

  return {
    ...progress,
    completed_juzs: Array.from(new Set([...progress.completed_juzs, ...asCompletedJuzs(row.completed_juzs)])).sort((a, b) => a - b),
    goal_completed_today: row.goal_completed_today,
    pages_read_today: row.pages_read_today,
  }
}

function quranProgressToRow(progress: QuranProgressState, userId: string): Database["public"]["Tables"]["quran_progress"]["Insert"] {
  const details = getQuranPageDetails(progress.last_page_read || progress.page)

  return {
    user_id: userId,
    surah: details.surah,
    ayah: details.ayah,
    page: progress.page,
    pages_read_today: progress.pages_read_today,
    daily_goal: progress.daily_goal,
    last_page_read: progress.last_page_read,
    goal_completed_today: progress.goal_completed_today,
    completed_juzs: progress.completed_juzs as Json,
    logs: progress.logs as unknown as Json,
    updated_at: new Date().toISOString(),
  }
}

function generateInviteCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function noticeFromEvent(event: PartnerEventRow): PartnerNotice {
  const payload = typeof event.payload === "object" && event.payload !== null && !Array.isArray(event.payload) ? event.payload : {}
  const senderName = typeof payload.senderName === "string" ? payload.senderName : "Your partner"
  const pages = typeof payload.pagesReadToday === "number" && typeof payload.dailyGoal === "number" ? `${payload.pagesReadToday}/${payload.dailyGoal}` : null

  return {
    id: event.id,
    type: event.event_type,
    message:
      event.event_type === "quran_goal"
        ? `${senderName} completed today's Quran goal${pages ? ` (${pages})` : ""}.`
        : `${senderName} sent a gentle nudge.`,
  }
}

function friendlySupabaseError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback
  }

  const candidate = error as { code?: string; message?: string }

  if (candidate.code === "42P01" || candidate.message?.includes("relation") || candidate.message?.includes("does not exist")) {
    return "Supabase sync tables are missing. Apply the family sync migration first."
  }

  if (candidate.code === "42883" || candidate.message?.includes("function")) {
    return "Supabase sync functions are missing. Apply the family sync migration first."
  }

  return candidate.message ?? fallback
}

export async function getAuthSnapshot(): Promise<AuthStateSnapshot> {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return { session: data.session, user: data.session?.user ?? null }
}

export async function signInWithGoogle() {
  const client = requireSupabase()
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signInWithEmailPassword(email: string, password: string) {
  const client = requireSupabase()
  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const client = requireSupabase()
  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signOutOfSupabase() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function loadOwnProfile(userId: string): Promise<PartnerProfile | null> {
  const client = requireSupabase()
  const { data, error } = await client.from("profiles").select("id, display_name, avatar_url").eq("id", userId).maybeSingle()
  if (error) throw error
  return data
    ? {
        id: data.id,
        displayName: data.display_name || "",
        avatarUrl: data.avatar_url,
      }
    : null
}

export async function updateOwnDisplayName(userId: string, displayName: string): Promise<PartnerProfile> {
  const client = requireSupabase()
  const { data, error } = await client
    .from("profiles")
    .upsert({ id: userId, display_name: displayName.trim() || null, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("id, display_name, avatar_url")
    .single()

  if (error) throw error

  return {
    id: data.id,
    displayName: data.display_name || "",
    avatarUrl: data.avatar_url,
  }
}

export async function loadOwnQuranProgress(userId: string, language: AppLanguage, hijriOffset: HijriOffset) {
  const client = requireSupabase()
  const { data, error } = await client.from("quran_progress").select("*").eq("user_id", userId).maybeSingle()
  if (error) throw error
  return data ? quranRowToProgress(data, language, hijriOffset) : null
}

export async function upsertQuranProgress(progress: QuranProgressState, userId: string) {
  const client = requireSupabase()
  const { error } = await client.from("quran_progress").upsert(quranProgressToRow(progress, userId), { onConflict: "user_id" })
  if (error) throw error
}

export async function createPartnerInvite(userId: string, role: PartnerRole): Promise<PartnerInvite> {
  const client = requireSupabase()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await client
      .from("partner_invites")
      .insert({
        code: generateInviteCode(),
        created_by: userId,
        creator_role: role,
      })
      .select("id, code, creator_role, expires_at")
      .single()

    if (!error && data) {
      return {
        id: data.id,
        code: data.code,
        creatorRole: data.creator_role,
        expiresAt: data.expires_at,
      }
    }

    if (error?.code !== "23505") {
      throw new Error(friendlySupabaseError(error, "Could not create partner code."))
    }
  }

  throw new Error("Could not create a unique invite code.")
}

export async function acceptPartnerInvite(code: string, role: PartnerRole) {
  const client = requireSupabase()
  const { error } = await client.rpc("accept_partner_invite", {
    invite_code: code,
    accepter_role: role,
  })
  if (error) throw new Error(friendlySupabaseError(error, "Could not accept partner code."))
}

export async function loadPartnerSnapshot(userId: string, language: AppLanguage, hijriOffset: HijriOffset): Promise<PartnerSnapshot | null> {
  const client = requireSupabase()
  const { data: partnership, error: partnershipError } = await client
    .from("partnerships")
    .select("*")
    .or(`husband_id.eq.${userId},wife_id.eq.${userId}`)
    .maybeSingle()

  if (partnershipError) throw partnershipError
  if (!partnership) return null

  const currentUserRole: PartnerRole = partnership.husband_id === userId ? "husband" : "wife"
  const partnerRole: PartnerRole = currentUserRole === "husband" ? "wife" : "husband"
  const partnerId = currentUserRole === "husband" ? partnership.wife_id : partnership.husband_id
  const [{ data: profile, error: profileError }, { data: quranRow, error: quranError }] = await Promise.all([
    client.from("profiles").select("id, display_name, avatar_url").eq("id", partnerId).maybeSingle(),
    client.from("quran_progress").select("*").eq("user_id", partnerId).maybeSingle(),
  ])

  if (profileError) throw profileError
  if (quranError) throw quranError

  return {
    partnershipId: partnership.id,
    partnerRole,
    currentUserRole,
    profile: {
      id: partnerId,
      displayName: profile?.display_name || (partnerRole === "wife" ? "Mama" : "Partner"),
      avatarUrl: profile?.avatar_url ?? null,
    },
    quranProgress: quranRow ? quranRowToProgress(quranRow, language, hijriOffset) : null,
  }
}

export async function sendPartnerEvent(
  userId: string,
  partnerId: string,
  eventType: "quran_goal" | "nudge",
  payload: Record<string, Json> = {},
) {
  const client = requireSupabase()
  const { error } = await client.from("partner_events").insert({
    sender_id: userId,
    receiver_id: partnerId,
    event_type: eventType,
    payload,
  })
  if (error) throw error
}

export function subscribeToPartnerEvents(userId: string, onNotice: (notice: PartnerNotice) => void): RealtimeChannel | null {
  if (!supabase) {
    return null
  }

  return supabase
    .channel(`partner-events:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "partner_events",
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => onNotice(noticeFromEvent(payload.new as PartnerEventRow)),
    )
    .subscribe()
}
