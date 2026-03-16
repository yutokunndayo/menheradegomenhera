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
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) throw userError;

                // auth.user がない → 未ログイン
                if (!user) {
                    setViewState("needAuth");
                    return;
                }

                // getUserしたidがprofiles.idにあるか確認
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, gender, partner, name")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                // profiles.id にない → 未登録扱いで /auth
                if (!profile) {
                    setViewState("needAuth");
                    return;
                }

                // すでにパートナーあり → 5秒見せて /chat
                if (profile.partner) {
                    setViewState("alreadyPartnered");
                    timeoutRef.current = setTimeout(() => {
                        navigate("/chat", { replace: true });
                    }, 5000);
                    return;
                }

                // gender 未設定 → setupへ
                if (profile.gender == null) {
                    setViewState("needSetup");
                    return;
                }

                // 招待URL生成
                const url = `${window.location.origin}/join?from=${user.id}`;
                setInviteUrl(url);

                try {
                    const dataUrl = await QRCode.toDataURL(url, {
                        width: 240,
                        margin: 2,
                        color: {
                            dark: "#f5317f",
                            light: "#ffffff",
                        },
                    });
                    setQrDataUrl(dataUrl);
                } catch (qrError) {
                    console.error("QR生成エラー:", qrError);
                }

                setViewState("invite");

                // パートナー接続監視
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
            } catch (e: any) {
                console.error("invite init error:", e);
                setErrorMsg(e?.message ?? "処理に失敗しました");
                setViewState("error");
            }
        };

        init();

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
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
                                <p className="invite-desc">
                                    5秒後にチャット画面へ移動します
                                </p>
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
                                        <img
                                            src={qrDataUrl}
                                            alt="招待QRコード"
                                            className="invite-qr"
                                        />
                                    ) : (
                                        <div className="invite-qr-placeholder">
                                            QR生成に失敗しました
                                        </div>
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