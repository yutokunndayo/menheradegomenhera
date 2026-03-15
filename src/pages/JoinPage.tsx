import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/Login.css";
import "../styles/Invite.css";

function JoinPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ran = useRef(false);

  const fromId = params.get("from");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const connect = async () => {
      try {
        if (!fromId) {
          setErrorMsg("無効な招待リンクです");
          setStatus("error");
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        // auth user がないなら login へ
        if (!user) {
          sessionStorage.setItem("pendingFromId", fromId);
          navigate("/auth", { replace: true });
          return;
        }

        // 自分自身の招待リンクは不可
        if (fromId === user.id) {
          setErrorMsg("自分自身の招待リンクには参加できません");
          setStatus("error");
          return;
        }

        // profiles がなければ「未ログイン相当」とみなして login へ
        const { data: myProfile, error: myProfileError } = await supabase
          .from("profiles")
          .select("partner")
          .eq("id", user.id)
          .maybeSingle();

        if (myProfileError) throw myProfileError;

        if (!myProfile) {
          sessionStorage.setItem("pendingFromId", fromId);
          navigate("/auth", { replace: true });
          return;
        }

        // すでにペア済みなら chat へ
        if (myProfile.partner) {
          setStatus("already");
          setTimeout(() => navigate("/chat", { replace: true }), 1500);
          return;
        }

        // ペア接続
        const { error: rpcError } = await supabase.rpc("connect_partners", {
          inviter_id: fromId,
        });

        if (rpcError) throw rpcError;

        setStatus("success");
        setTimeout(() => navigate("/chat", { replace: true }), 1500);
      } catch (e: any) {
        console.error("join error:", e);
        setErrorMsg(e?.message ?? "接続に失敗しました");
        setStatus("error");
      }
    };

    connect();
  }, [navigate, fromId]);

  return (
    <div className="auth-wrapper">
      <AuthHeader />
      <div className="auth-container">
        <div className="join-status-area">
          {status === "loading" && (
            <>
              <div className="join-spinner" />
              <p className="join-status-text">接続中...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="join-icon join-icon--success">♡</div>
              <p className="join-status-text">ペアになりました！</p>
              <p className="join-status-sub">チャット画面へ移動します</p>
            </>
          )}

          {status === "already" && (
            <>
              <div className="join-icon join-icon--success">♡</div>
              <p className="join-status-text">すでにペアが設定されています</p>
              <p className="join-status-sub">チャット画面へ移動します</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="join-icon join-icon--error">!</div>
              <p className="join-status-text join-status-text--error">{errorMsg}</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/invite", { replace: true })}
                style={{ marginTop: 16 }}
              >
                招待画面に戻る
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinPage;