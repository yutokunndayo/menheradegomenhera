import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import { HiOutlineClipboard, HiOutlineCheckCircle } from "react-icons/hi2";
import QRCode from "qrcode";
import "../styles/Login.css";
import "../styles/Invite.css";

type InviteViewState =
  | "loading"
  | "needAuth"
  | "needSetup"
  | "alreadyPartnered"
  | "invite"
  | "connected"
  | "error";

function InvitePage() {
  const navigate = useNavigate();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewState, setViewState] = useState<InviteViewState>("loading");
  const [inviteUrl, setInviteUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        // getUser()はセッションなしでAuthSessionMissingErrorを投げるため
        // getSession()でセッションの有無を先に確認する
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setViewState("needAuth");
          return;
        }

        const user = session.user;
        const pendingFromId = sessionStorage.getItem("pendingFromId");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, gender, partner, name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          setViewState("needAuth");
          return;
        }

        if (profile.partner) {
          sessionStorage.removeItem("pendingFromId");
          setViewState("alreadyPartnered");
          timeoutRef.current = setTimeout(() => {
            navigate("/chat", { replace: true });
          }, 5000);
          return;
        }

        if (profile.gender == null) {
          setViewState("needSetup");
          return;
        }

        // 保存済み招待があれば先に接続を試す
        if (pendingFromId) {
          if (pendingFromId === user.id) {
            sessionStorage.removeItem("pendingFromId");
            setErrorMsg("自分自身の招待リンクには参加できません");
            setViewState("error");
            return;
          }

          const { error: rpcError } = await supabase.rpc("connect_partners", {
            inviter_id: pendingFromId,
          });

          if (rpcError) throw rpcError;

          sessionStorage.removeItem("pendingFromId");
          setViewState("connected");

          timeoutRef.current = setTimeout(() => {
            navigate("/chat", { replace: true });
          }, 1500);
          return;
        }

        // 通常の招待表示
        const url = `${window.location.origin}/join?from=${user.id}`;
        setInviteUrl(url);

        try {
          const dataUrl = await QRCode.toDataURL(url, {
            width: 240,
            margin: 2,
            color: { dark: "#f5317f", light: "#ffffff" },
          });
          setQrDataUrl(dataUrl);
        } catch (qrError) {
          console.error("QR生成エラー:", qrError);
        }

        setViewState("invite");

        pollingRef.current = setInterval(async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("partner")
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("polling error:", error);
            return;
          }

          if (data?.partner) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setViewState("connected");
            timeoutRef.current = setTimeout(() => {
              navigate("/chat", { replace: true });
            }, 1500);
          }
        }, 3000);
      } catch (e: unknown) {
        console.error("invite init error:", e);
        setErrorMsg(e instanceof Error ? e.message : "処理に失敗しました");
        setViewState("error");
      }
    };

    init();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="auth-wrapper">
      <AuthHeader />

      <div className="auth-container">
        <div className="auth-section">
          <div className="invite-section">
            {viewState === "loading" ? (
              <>
                <div className="join-spinner" />
                <p className="invite-title">処理中...</p>
              </>
            ) : viewState === "needAuth" ? (
              <>
                <div className="join-icon join-icon--error">!</div>
                <p className="invite-title">ログインが必要です</p>
                <p className="invite-desc">
                  招待機能を使うにはログインまたは登録が必要です
                </p>
                <button
                  className="invite-copy-btn"
                  onClick={() => navigate("/auth", { replace: true })}
                >
                  ログイン / 登録へ
                </button>
              </>
            ) : viewState === "needSetup" ? (
              <>
                <div className="join-icon join-icon--error">!</div>
                <p className="invite-title">初期設定が未完了です</p>
                <p className="invite-desc">
                  先にプロフィール設定を完了してください
                </p>
                <button
                  className="invite-copy-btn"
                  onClick={() => navigate("/setup", { replace: true })}
                >
                  設定へ進む
                </button>
              </>
            ) : viewState === "alreadyPartnered" ? (
              <>
                <div className="join-icon join-icon--success">♡</div>
                <p className="invite-title">すでにパートナーがいます</p>
                <p className="invite-desc">5秒後にチャット画面へ移動します</p>
              </>
            ) : viewState === "connected" ? (
              <>
                <div className="join-icon join-icon--success">♡</div>
                <p className="invite-title">ペアになりました！</p>
                <p className="invite-desc">チャット画面へ移動します</p>
              </>
            ) : viewState === "error" ? (
              <>
                <div className="join-icon join-icon--error">!</div>
                <p className="invite-title">エラーが発生しました</p>
                <p className="invite-desc">{errorMsg}</p>
                <button
                  className="invite-copy-btn"
                  onClick={() => navigate("/auth", { replace: true })}
                >
                  ログインへ
                </button>
              </>
            ) : (
              <>
                <p className="invite-title">パートナーを招待しよう</p>
                <p className="invite-desc">
                  下のリンクまたはQRコードをパートナーに送ってね
                  <br />
                  <span className="invite-waiting">
                    パートナーが参加するまで待機中...
                  </span>
                </p>

                <div className="invite-qr-wrap">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="招待QRコード" className="invite-qr" />
                  ) : (
                    <div className="invite-qr-placeholder">QR生成に失敗しました</div>
                  )}
                </div>

                <button
                  className={`invite-copy-btn ${copied ? "copied" : ""}`}
                  onClick={handleCopy}
                  disabled={!inviteUrl}
                >
                  {copied ? (
                    <>
                      <HiOutlineCheckCircle size={18} />
                      コピーしました！
                    </>
                  ) : (
                    <>
                      <HiOutlineClipboard size={18} />
                      招待リンクをコピー
                    </>
                  )}
                </button>

                <p className="invite-url-text">{inviteUrl}</p>

                <p className="invite-notice">
                  ※ パートナーが参加するまでアプリの機能は使えません
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitePage;