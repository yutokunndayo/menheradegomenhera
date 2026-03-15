// ===== userCache.ts =====
import { supabase } from "./supabase";

const CACHE_KEY = "user_profile_cache";

interface UserProfile {
    id: string;
    name: string;
    gender: boolean;       // false=彼氏, true=彼女
    partner: string | null;
    avatarUrl: string | null; // 公開URL（Storageから生成済み）
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

// 同期でgenderを読む（初期値のチラつき防止）
export function getCachedGender(): "boyfriend" | "girlfriend" | null {
    const cached = readCache();
    if (!cached) return null;
    return cached.gender === false ? "boyfriend" : "girlfriend";
}

// 同期でアバターURLを読む
export function getCachedAvatarUrl(): string | null {
    return readCache()?.avatarUrl ?? null;
}

// ログアウト時に呼ぶ
export function clearUserCache() {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem("partner_guard_ok");
}

// アバターURLだけ更新する（アップロード後に呼ぶ）
export function updateCachedAvatarUrl(url: string) {
    const cached = readCache();
    if (!cached) return;
    writeCache({ ...cached, avatarUrl: url });
}

// プロフィール取得（キャッシュ優先・なければSupabaseから取得）
export async function getCachedProfile(): Promise<UserProfile | null> {
    const cached = readCache();
    if (cached) return cached;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, gender, partner, avatar")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    // avatarパスから公開URLを生成
    let avatarUrl: string | null = null;
    if (profile.avatar) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar);
        avatarUrl = data.publicUrl;
    }

    const result: UserProfile = {
        id:        profile.id,
        name:      profile.name ?? "",
        gender:    profile.gender,
        partner:   profile.partner ?? null,
        avatarUrl,
    };

    writeCache(result);
    return result;
}