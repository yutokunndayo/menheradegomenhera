// ===== userCache.ts =====
import { supabase } from "./supabase";

// キャッシュキーにユーザーIDを含める → 別アカウントでのキャッシュ混在を防ぐ
const CACHE_PREFIX = "user_profile_cache_";

interface UserProfile {
    id: string;
    name: string;
    gender: boolean;
    partner: string | null;
    avatarUrl: string | null; // 公開URL（Storageから生成済み）
}

function getCacheKey(userId: string) {
    return `${CACHE_PREFIX}${userId}`;
}

function readCache(userId: string): UserProfile | null {
    try {
        const raw = sessionStorage.getItem(getCacheKey(userId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCache(profile: UserProfile) {
    sessionStorage.setItem(getCacheKey(profile.id), JSON.stringify(profile));
}

// ===== 同期でgenderを読む（初期値のチラつき防止） =====
export function getCachedGender(): "boyfriend" | "girlfriend" | null {
    // 全キャッシュエントリを走査して現在ログイン中のユーザーを探す
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key?.startsWith(CACHE_PREFIX)) continue;
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) continue;
            const profile: UserProfile = JSON.parse(raw);
            return profile.gender === false ? "boyfriend" : "girlfriend";
        } catch {
            continue;
        }
    }
    return null;
}

// 同期でアバターURLを読む
export function getCachedAvatarUrl(): string | null {
    return readCache()?.avatarUrl ?? null;
}

// ログアウト時に呼ぶ
export function clearUserCache() {
    // 全ユーザーのキャッシュを削除
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
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
    // まず現在のユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // ユーザーID付きキャッシュを確認
    const cached = readCache(user.id);
    if (cached) return cached;

    // キャッシュなし → Supabaseから取得
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