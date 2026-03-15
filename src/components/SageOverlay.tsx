import { useState } from "react";
import { useLocation } from "react-router-dom";
// import { supabase } from "../lib/supabase"; // 本番時に解除
import SageWidget from "../pages/SageWidget";
import type { SageMessage } from "../pages/SageWidget";

// 仙人を表示しないパス（認証・招待系）
const SAGE_HIDDEN_PATHS = [
    "/", "/auth", "/login", "/register", "/setup",
    "/forgot-password", "/authCallback", "/signup-callback",
    "/invite", "/join", "/logout",
];

function SageOverlay() {
    const location = useLocation();
    // ===== ダミー確認用: true固定で常に表示 =====
    // 本番に切り替えるときは↓をfalseに戻してuseEffectのコメントを解除
    const [isBoyfriend, setIsBoyfriend] = useState(true);
    const [sageMessage, setSageMessage] = useState<SageMessage | null>(null);

    const isHidden = SAGE_HIDDEN_PATHS.includes(location.pathname);

    // ===== 本番用: 自分が彼氏かどうかをDBで確認 =====
    // ダミー確認中はコメントアウト。本番時に解除する。
    // useEffect(() => {
    //     const check = async () => {
    //         const { data: { user } } = await supabase.auth.getUser();
    //         if (!user) return;
    //         const { data } = await supabase
    //             .from("profiles")
    //             .select("gender")
    //             .eq("id", user.id)
    //             .single();
    //         // gender: false=彼氏, true=彼女
    //         setIsBoyfriend(data?.gender === false);
    //     };
    //     check();
    // }, [location.pathname]);

    // ===== AIからのメッセージ受信口 =====
    // chat_emotion_contexts テーブルの emotion_text を5秒ごとにポーリング
    // AIチームはこのテーブルに書き込むだけでOK
    //
    // useEffect(() => {
    //     let lastId: string | null = null;
    //     const poll = async () => {
    //         const { data: { user } } = await supabase.auth.getUser();
    //         if (!user) return;
    //         const { data } = await supabase
    //             .from("chat_emotion_contexts")
    //             .select("id, emotion_text, emotion_type")
    //             .eq("user_id", user.id)
    //             .order("created_at", { ascending: false })
    //             .limit(1)
    //             .single();
    //         if (!data || data.id === lastId) return;
    //         lastId = data.id;
    //         setSageMessage({ id: String(data.id), text: data.emotion_text, type: data.emotion_type });
    //     };
    //     const timer = setInterval(poll, 5000);
    //     poll();
    //     return () => clearInterval(timer);
    // }, []);

    if (isHidden || !isBoyfriend) return null;

    return <SageWidget message={sageMessage} isBoyfriend={isBoyfriend} />;
}

export default SageOverlay;