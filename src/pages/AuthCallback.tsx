import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      try {
        const url = window.location.href;

        // 1) PKCE（?code=...）ならセッション交換
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

        // const { error: upsertError } = await supabase.from("profiles").upsert({
        //   id: user.id,
        //   mail: user.email,
        // }, {
        //   // nameやgenderがすでにある場合は上書きしない
        //   onConflict: "id",
        //   ignoreDuplicates: true,
        // });

        // if (upsertError) throw upsertError;

        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: user.id,
        }, {
          onConflict: "id",
          ignoreDuplicates: true,
        });
        if (upsertError) throw upsertError;

        // profilesのgenderが未設定（初回）ならSetupへ、設定済みならchatへ
        const { data: profile } = await supabase
          .from("profiles")
          .select("gender")
          .eq("id", user.id)
          .single();

        if (profile?.gender === null) {
          navigate("/setup", { replace: true });
        } else {
          navigate("/chat", { replace: true });
        }
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