import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SageWidget from "../pages/SageWidget";
import type { SageMessage } from "../pages/SageWidget";

const SAGE_HIDDEN_PATHS = [
    "/", "/auth", "/login", "/register", "/setup",
    "/forgot-password", "/authCallback", "/signup-callback",
    "/invite", "/join", "/logout",
];

function SageOverlay() {
    const location = useLocation();
    const [isBoyfriend, setIsBoyfriend] = useState(false);
    const [sageMessage, setSageMessage] = useState<SageMessage | null>(null);
    const lastIdRef = useRef<string | null>(null);

    // ===== 自分が彼氏（gender=false）かどうか確認 =====
    useEffect(() => {
        const checkGender = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("gender")
                .eq("id", user.id)
                .single();

            // gender: false=彼氏（男）/ true=彼女（女）
            // 仙人は彼氏側にのみ表示
            setIsBoyfriend(profile?.gender === false);
        };
        checkGender();
    }, [location.pathname]);

    // ===== chat_emotion_contexts をポーリング（5秒ごと） =====
    // AIが emotion_text を書き込んだら自動で吹き出しが開く
    useEffect(() => {
        const poll = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("chat_emotion_contexts")
                .select("id, emotion_text, emotion_type")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (!data) return;
            if (String(data.id) === lastIdRef.current) return;

            lastIdRef.current = String(data.id);
            setSageMessage({
                id: String(data.id),
                text: data.emotion_text,
                type: (data.emotion_type as SageMessage["type"]) ?? "suggestion",
            });
        };

        const timer = setInterval(poll, 5000);
        poll();
        return () => clearInterval(timer);
    }, []);

    if (SAGE_HIDDEN_PATHS.includes(location.pathname)) return null;
    if (!isBoyfriend) return null;

    return <SageWidget message={sageMessage} isBoyfriend={isBoyfriend} />;
}

export default SageOverlay;