import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import { HiOutlineClipboard, HiOutlineCheckCircle } from "react-icons/hi2";
import QRCode from "qrcode";
import "../styles/login.css";
import "../styles/invite.css";

function InvitePage() {
    const navigate = useNavigate();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [inviteUrl, setInviteUrl] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    // パートナーが接続したかどうか
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate("/Auth", { replace: true }); return; }

            // すでにパートナーが設定済みならチャットへ
            const { data: profile } = await supabase
                .from("profiles")
                .select("partner")
                .eq("id", user.id)
                .single();

            if (profile?.partner) {
                navigate("/chat", { replace: true });
                return;
            }

            // 招待URLを生成
            // window.location.origin はデプロイ環境で自動的に本番URLになる
            const url = `${window.location.origin}/join?from=${user.id}`;
            setInviteUrl(url);

            // QRコード生成
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

            // ===== パートナー接続をポーリングで監視 =====
            // 3秒ごとにprofilesのpartnerカラムを確認する
            // パートナーが /join にアクセスして接続されると partner が埋まる
            pollingRef.current = setInterval(async () => {
                const { data } = await supabase
                    .from("profiles")
                    .select("partner")
                    .eq("id", user.id)
                    .single();

                if (data?.partner) {
                    // パートナーが接続された！
                    clearInterval(pollingRef.current!);
                    setConnected(true);
                    // 少し待ってからチャットへ
                    setTimeout(() => navigate("/chat", { replace: true }), 1500);
                }
            }, 3000);
        };

        init();

        // クリーンアップ（画面を離れたらポーリング停止）
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
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

                        {connected ? (
                            // パートナー接続完了
                            <>
                                <div className="join-icon join-icon--success">♡</div>
                                <p className="invite-title">ペアになりました！</p>
                                <p className="invite-desc">チャット画面へ移動します</p>
                            </>
                        ) : (
                            // 待機中
                            <>
                                <p className="invite-title">パートナーを招待しよう</p>
                                <p className="invite-desc">
                                    下のリンクまたはQRコードをパートナーに送ってね<br />
                                    <span className="invite-waiting">パートナーが参加するまで待機中...</span>
                                </p>

                                {/* QRコード */}
                                <div className="invite-qr-wrap">
                                    {loading ? (
                                        <div className="invite-qr-placeholder">
                                            <div className="join-spinner" />
                                        </div>
                                    ) : qrDataUrl ? (
                                        <img src={qrDataUrl} alt="招待QRコード" className="invite-qr" />
                                    ) : (
                                        <div className="invite-qr-placeholder">QR生成に失敗しました</div>
                                    )}
                                </div>

                                {/* URLコピーボタン */}
                                <button
                                    className={`invite-copy-btn ${copied ? "copied" : ""}`}
                                    onClick={handleCopy}
                                    disabled={loading}
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

                                {/* パートナーが来るまで次に進めない旨を表示 */}
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