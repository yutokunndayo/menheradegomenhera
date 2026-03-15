// ===== userCache.ts =====
import { supabase } from "./supabase";

const CACHE_KEY = "user_profile_cache";

interface UserProfile {
    id: string;
    name: string;
    gender: boolean; // false=彼氏, true=彼女
    partner: string | null;
}

function readCache(): UserProfile | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCache(profile: UserProfile) {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(profile));
}

// ===== 同期でgenderを読む（初期値のチラつき防止） =====
// useState の初期値に渡すことで、非同期待ちなしに正しいテーマが表示される
export function getCachedGender(): "boyfriend" | "girlfriend" | null {
    const cached = readCache();
    if (!cached) return null;
    return cached.gender === false ? "boyfriend" : "girlfriend";
}

// ログアウト時に呼ぶ
export function clearUserCache() {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem("partner_guard_ok");
}

// プロフィール取得（キャッシュ優先・なければSupabaseから取得）
export async function getCachedProfile(): Promise<UserProfile | null> {
    const cached = readCache();
    if (cached) return cached;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, gender, partner")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    const result: UserProfile = {
        id:      profile.id,
        name:    profile.name ?? "",
        gender:  profile.gender,
        partner: profile.partner ?? null,
    };

    writeCache(result);
    return result;
}