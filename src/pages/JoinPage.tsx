import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/Login.css";
import "../styles/Invite.css";

type JoinStatus =
  | "loading"
  | "needAuth"
  | "needSetup"
  | "success"
  | "error"
  | "already"
  | "self";

function JoinPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ran = useRef(false);

  const fromId = params.get("from") || sessionStorage.getItem("pendingFromId");
  const [status, setStatus] = useState<JoinStatus>("loading");
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

        // 先に保存しておく
        sessionStorage.setItem("pendingFromId", fromId);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        // 未ログイン → 画面表示だけ
        if (!user) {
          setStatus("needAuth");
          return;
        }

        if (fromId === user.id) {
          sessionStorage.removeItem("pendingFromId");
          setErrorMsg("自分自身の招待リンクには参加できません");
          setStatus("self");
          return;
        }

        const { data: myProfile, error: myProfileError } = await supabase
          .from("profiles")
          .select("id, partner, gender")
          .eq("id", user.id)
          .maybeSingle();

        if (myProfileError) throw myProfileError;

        // profiles がない → authへ案内
        if (!myProfile) {
          setStatus("needAuth");
          return;
        }

        // gender未設定 → setupへ案内
        if (myProfile.gender == null) {
          setStatus("needSetup");
          return;
        }

        if (myProfile.partner) {
          setStatus("already");
          setTimeout(() => navigate("/chat", { replace: true }), 5000);
          return;
        }

        const { error: rpcError } = await supabase.rpc("connect_partners", {
          inviter_id: fromId,
        });

        if (rpcError) throw rpcError;

        sessionStorage.removeItem("pendingFromId");
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
              <p className="join-status-text">確認中...</p>
            </>
          )}

          {status === "needAuth" && (
            <>
              <div className="join-icon join-icon--error">!</div>
              <p className="join-status-text">ログインが必要です</p>
              <p className="join-status-sub">
                ログインまたは登録後、自動でパートナー登録を再開します
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/auth", { replace: true })}
                style={{ marginTop: 16 }}
              >
                ログイン / 登録へ
              </button>
            </>
          )}

          {status === "needSetup" && (
            <>
              <div className="join-icon join-icon--error">!</div>
              <p className="join-status-text">初期設定が未完了です</p>
              <p className="join-status-sub">
                設定完了後、自動でパートナー登録を再開します
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/setup", { replace: true })}
                style={{ marginTop: 16 }}
              >
                設定へ進む
              </button>
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
              <p className="join-status-text">すでにパートナーがいます</p>
              <p className="join-status-sub">5秒後にチャット画面へ移動します</p>
            </>
          )}

          {status === "self" && (
            <>
              <div className="join-icon join-icon--error">!</div>
              <p className="join-status-text join-status-text--error">
                自分自身の招待リンクには参加できません
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/invite", { replace: true })}
                style={{ marginTop: 16 }}
              >
                招待画面へ
              </button>
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