import { supabase } from "./supabase";

const CACHE_PREFIX = "user_profile_cache_";

interface UserProfile {
    id: string;
    name: string;
    gender: boolean;
    partner: string | null;
    avatarUrl: string | null;
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

export function getCachedGender(): "boyfriend" | "girlfriend" | null {
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

export async function getCachedAvatarUrl(): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return readCache(user.id)?.avatarUrl ?? null;
}

export function clearUserCache() {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    sessionStorage.removeItem("partner_guard_ok");
}

export async function updateCachedAvatarUrl(url: string) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const cached = readCache(user.id);
    if (!cached) return;

    writeCache({ ...cached, avatarUrl: url });
}

export async function getCachedProfile(): Promise<UserProfile | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const cached = readCache(user.id);
    if (cached) return cached;

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, gender, partner, avatar")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    let avatarUrl: string | null = null;
    if (profile.avatar) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar);
        avatarUrl = data.publicUrl;
    }

    const result: UserProfile = {
        id: profile.id,
        name: profile.name ?? "",
        gender: profile.gender,
        partner: profile.partner ?? null,
        avatarUrl,
    };

    writeCache(result);
    return result;
}