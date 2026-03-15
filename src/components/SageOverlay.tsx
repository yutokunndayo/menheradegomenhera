import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type {
    RealtimeChannel,
    Session,
    User,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import SageWidget from "../pages/SageWidget";
import type { SageMessage } from "../pages/SageWidget";

const SAGE_HIDDEN_PATHS = [
    "/",
    "/auth",
    "/login",
    "/register",
    "/setup",
    "/forgot-password",
    "/authCallback",
    "/signup-callback",
    "/invite",
    "/join",
    "/logout",
];

type ProfileRow = {
    gender: boolean | null;
    partner: string | null;
};

type ChatEmotionContextRow = {
    id: string;
    user_id: string;
    emotion_text: string | null;
    created_at: string;
};

function SageOverlay() {

    const location = useLocation();

    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [isBoyfriend, setIsBoyfriend] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [partnerId, setPartnerId] = useState<string | null>(null);

    const [sageMessage, setSageMessage] = useState<SageMessage | null>(null);

    const lastIdRef = useRef<string | null>(null);

    const isHiddenPath = useMemo(
        () => SAGE_HIDDEN_PATHS.includes(location.pathname),
        [location.pathname]
    );

    // 1) auth状態は初回1回 + 変化時だけ追う
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("getSession error:", error);
            }

            if (!mounted) return;

            const session: Session | null = data.session ?? null;
            setUser(session?.user ?? null);
            setAuthLoading(false);
        };

        initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 2) userが変わった時だけ profiles.gender / partner を読む
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setIsBoyfriend(false);
            setPartnerId(null);
            setProfileLoading(false);
            return;
        }

        let cancelled = false;

        const fetchProfile = async () => {
            setProfileLoading(true);

            const { data, error } = await supabase
                .from("profiles")
                .select("gender, partner")
                .eq("id", user.id)
                .single();

            if (cancelled) return;

            if (error) {
                console.error("profiles fetch error:", error);
                setIsBoyfriend(false);
                setPartnerId(null);
                setProfileLoading(false);
                return;
            }

            const profile = data as ProfileRow | null;
            setIsBoyfriend(profile?.gender === false);
            setPartnerId(profile?.partner ?? null);
            setProfileLoading(false);
            console.log("[SageOverlay] user.id =", user?.id);
            console.log("[SageOverlay] isBoyfriend =", isBoyfriend);
            console.log("[SageOverlay] partnerId =", partnerId);
            console.log("[SageOverlay] isHiddenPath =", isHiddenPath);
        };

        fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [user, authLoading]);

    // 3) 彼氏 && 対象ページの時だけ realtime 購読
    //    girlfriend の user_id で保存された advice を、
    //    boyfriend 側が partnerId 経由で受け取る
    useEffect(() => {
        if (authLoading) return;
        if (profileLoading) return;
        if (!user) return;
        if (!isBoyfriend) return;
        if (!partnerId) return;
        if (isHiddenPath) return;

        let channel: RealtimeChannel | null = null;

        channel = supabase
            .channel(`chat-emotion-contexts-${user.id}-${partnerId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_emotion_contexts",
                    filter: `user_id=eq.${partnerId}`,
                },
                (payload) => {
                    const row = payload.new as ChatEmotionContextRow;

                    if (!row) return;
                    if (!row.emotion_text) return;
                    if (String(row.id) === lastIdRef.current) return;

                    lastIdRef.current = String(row.id);

                    setSageMessage({
                        id: String(row.id),
                        text: row.emotion_text,
                    });
                }
            )
            .subscribe((status) => {
                console.log("[SageOverlay] realtime status:", status);
            });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [user, authLoading, profileLoading, isBoyfriend, partnerId, isHiddenPath]);

    if (isHiddenPath) return null;
    if (authLoading) return null;
    if (profileLoading) return null;
    if (!isBoyfriend) return null;

    return <SageWidget message={sageMessage} isBoyfriend={isBoyfriend} />;
}

export default SageOverlay;