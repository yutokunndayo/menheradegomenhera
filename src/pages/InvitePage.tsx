import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import { HiOutlineClipboard, HiOutlineCheckCircle } from "react-icons/hi2";
import QRCode from "qrcode";
import "../styles/Login.css";
import "../styles/Invite.css";

function InvitePage() {
    const navigate = useNavigate();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [inviteUrl, setInviteUrl] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) throw userError;

                if (!user) {
                    navigate("/login", { replace: true });
                    return;
                }

                const pendingFromId = sessionStorage.getItem("pendingFromId");

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("partner")
                    .eq("id", user.id)
                    .single();

                if (profileError) throw profileError;

                // すでにペア済みなら chat へ
                if (profile?.partner) {
                    sessionStorage.removeItem("pendingFromId");
                    navigate("/chat", { replace: true });
                    return;
                }

                // 未処理の招待リンク情報があれば、そのままペア接続を実行
                if (pendingFromId) {
                    if (pendingFromId === user.id) {
                        sessionStorage.removeItem("pendingFromId");
                        setErrorMsg("自分自身の招待リンクには参加できません");
                        setLoading(false);
                        return;
                    }

                    const { error: rpcError } = await supabase.rpc("connect_partners", {
                        inviter_id: pendingFromId,
                    });

                    if (rpcError) throw rpcError;

                    sessionStorage.removeItem("pendingFromId");
                    setConnected(true);
                    setLoading(false);

                    setTimeout(() => navigate("/chat", { replace: true }), 1500);
                    return;
                }

                // 通常の招待画面
                const url = `${window.location.origin}/join?from=${user.id}`;
                setInviteUrl(url);

                try {
                    const dataUrl = await QRCode.toDataURL(url, {
                        width: 240,
                        margin: 2,
                        color: { dark: "#f5317f", light: "#ffffff" },
                    });
                    setQrDataUrl(dataUrl);
                } catch (e) {
                    console.error("QR生成エラー:", e);
                }

                setLoading(false);

                // パートナー接続監視
                pollingRef.current = setInterval(async () => {
                    const { data } = await supabase
                        .from("profiles")
                        .select("partner")
                        .eq("id", user.id)
                        .single();

                    if (data?.partner) {
                        if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                        }
                        setConnected(true);
                        setTimeout(() => navigate("/chat", { replace: true }), 1500);
                    }
                }, 3000);
            } catch (e: any) {
                console.error("invite init error:", e);
                setErrorMsg(e?.message ?? "処理に失敗しました");
                setLoading(false);
            }
        };

        init();

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
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
                        {loading ? (
                            <>
                                <div className="join-spinner" />
                                <p className="invite-title">処理中...</p>
                            </>
                        ) : errorMsg ? (
                            <>
                                <div className="join-icon join-icon--error">!</div>
                                <p className="invite-title">エラーが発生しました</p>
                                <p className="invite-desc">{errorMsg}</p>
                                <button
                                    className="invite-copy-btn"
                                    onClick={() => navigate("/login", { replace: true })}
                                >
                                    ログインへ
                                </button>
                            </>
                        ) : connected ? (
                            <>
                                <div className="join-icon join-icon--success">♡</div>
                                <p className="invite-title">ペアになりました！</p>
                                <p className="invite-desc">チャット画面へ移動します</p>
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