import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getAfterLoginDest } from "../lib/authRedirect";

function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      try {
        const url = window.location.href;

        // PKCE（?code=...）ならセッション交換
        if (url.includes("?code=")) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const user = data.user;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        // profiles に upsert（既存レコードは上書きしない）
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: user.id,
        }, {
          onConflict: "id",
          ignoreDuplicates: true,
        });
        if (upsertError) throw upsertError;

        // pendingJoin / setup / invite / chat を判定して遷移
        const dest = await getAfterLoginDest(user.id);
        navigate(dest, { replace: true });

      } catch (e) {
        console.error("AuthCallback error:", e);
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return <p style={{ textAlign: "center", marginTop: "40vh", color: "#f5317f" }}>読み込み中...</p>;
}

export default AuthCallback;