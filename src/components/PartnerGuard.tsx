import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ===== パートナー接続チェックガード =====
// パートナーが設定されていない場合は /invite にリダイレクトする
// /auth, /login, /register, /setup, /invite, /join は対象外（認証・招待フロー）

const UNGUARDED_PATHS = [
    "/",
    "/auth",
    "/login",
    "/register",
    "/setup",
    "/forgot-password",
    "/authCallback",
    "/invite",
    "/join",
];

interface PartnerGuardProps {
    children: React.ReactNode;
}

function PartnerGuard({ children }: PartnerGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const check = async () => {
            // ガード対象外のパスはそのまま通す
            const isUnguarded = UNGUARDED_PATHS.some(p =>
                location.pathname === p || location.pathname.startsWith(p + "?")
            );
            if (isUnguarded) { setChecked(true); return; }

            const { data: { user } } = await supabase.auth.getUser();

            // 未ログインはガードしない（他のリダイレクト処理に任せる）
            if (!user) { setChecked(true); return; }

            // パートナーが設定されているか確認
            const { data: profile } = await supabase
                .from("profiles")
                .select("partner")
                .eq("id", user.id)
                .single();

            if (!profile?.partner) {
                // パートナー未接続 → 招待画面へ強制リダイレクト
                navigate("/invite", { replace: true });
                return;
            }

            setChecked(true);
        };

        check();
    }, [location.pathname, navigate]);

    // チェック完了前はローディング表示
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