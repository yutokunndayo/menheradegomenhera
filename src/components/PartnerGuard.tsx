import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const UNGUARDED_PATHS = [
    "/",
    "/auth",
    "/login",
    "/register",
    "/setup",
    "/forgot-password",
    "/authcallback",
    "/signup-callback",
    "/invite",
    "/join",
    "/logout",
    "/test",
    "/demo",
    "/album",
    "/example",
];

// セッション内キャッシュキー
const CACHE_KEY = "partner_guard_ok";

interface PartnerGuardProps {
    children: React.ReactNode;
}

function PartnerGuard({ children }: PartnerGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [checked, setChecked] = useState(
        // すでにキャッシュ済みなら即通す（Supabase不要）
        () => sessionStorage.getItem(CACHE_KEY) === "1"
    );

    useEffect(() => {
        // キャッシュ済みなら何もしない
        if (sessionStorage.getItem(CACHE_KEY) === "1") {
            setChecked(true);
            return;
        }

        const isUnguarded = UNGUARDED_PATHS.some(p =>
            location.pathname === p || location.pathname.startsWith(p + "?")
        );
        if (isUnguarded) { setChecked(true); return; }

        // ここに来るのは初回ログイン後の1回だけ
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setChecked(true); return; }

            const { data: profile } = await supabase
                .from("profiles")
                .select("partner")
                .eq("id", user.id)
                .single();

            if (!profile?.partner) {
                navigate("/invite", { replace: true });
                return;
            }

            // パートナー接続済み → キャッシュに保存（以降はSupabaseを叩かない）
            sessionStorage.setItem(CACHE_KEY, "1");
            setChecked(true);
        };

        check();
        // location.pathnameを依存配列から外す → ページ遷移のたびに叩かない
    }, [navigate]);

    if (!checked) {
        return (
            <div style={{
                minHeight: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff5f8",
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "4px solid #fce4ec",
                    borderTopColor: "#f5317f",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
            </div>
        );
    }

    return <>{children}</>;
}

export default PartnerGuard;