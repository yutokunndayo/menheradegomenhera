import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import TitlePage from "../pages/TitlePage";

const UNGUARDED_PATHS = [
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
    "/test",
    "/demo",
    "/album",
    "/example",
];

const CACHE_KEY = "partner_guard_ok";

interface PartnerGuardProps {
    children: React.ReactNode;
}

function PartnerGuard({ children }: PartnerGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [checked, setChecked] = useState(
        () => sessionStorage.getItem(CACHE_KEY) === "1"
    );

    useEffect(() => {
        if (sessionStorage.getItem(CACHE_KEY) === "1") {
            setChecked(true);
            return;
        }

        const isUnguarded = UNGUARDED_PATHS.some(p =>
            location.pathname === p || location.pathname.startsWith(p + "?")
        );
        if (isUnguarded) { setChecked(true); return; }

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

            sessionStorage.setItem(CACHE_KEY, "1");
            setChecked(true);
        };

        check();
    }, [navigate]);

    // チェック完了前はタイトル画面を表示
    if (!checked) return <TitlePage hideTimer />;

    return <>{children}</>;
}

export default PartnerGuard;