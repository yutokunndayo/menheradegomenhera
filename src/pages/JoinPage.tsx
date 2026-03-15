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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          sessionStorage.setItem("pendingJoin", `/join?from=${fromId}`);
          navigate("/Auth", { replace: true });
          return;
        }

        if (!fromId || fromId === user.id) {
          setErrorMsg("無効な招待リンクです");
          setStatus("error");
          return;
        }

        // 自分がすでにペア済みかだけ確認
        const { data: myProfile, error: myProfileError } = await supabase
          .from("profiles")
          .select("partner")
          .eq("id", user.id)
          .maybeSingle();

        if (myProfileError) throw myProfileError;

        if (!myProfile) {
          setErrorMsg("プロフィールが見つかりません");
          setStatus("error");
          return;
        }

        if (myProfile.partner) {
          setStatus("already");
          setTimeout(() => navigate("/chat", { replace: true }), 1500);
          return;
        }

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
                onClick={() => navigate("/invite")}
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