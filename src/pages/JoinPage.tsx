import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/login.css";
import "../styles/invite.css";

function JoinPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const ran = useRef(false);

    // URLパラメータから招待者のUUIDを取得
    // 例: /join?from=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const fromId = params.get("from");

    const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    console.log("招待元ID:", fromId);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const connect = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                // 未ログインの場合はAuthへ（招待URLをリダイレクト先として保持）
                if (!user) {
                    // ログイン後に自動でこのページに戻れるようにURLを保存
                    sessionStorage.setItem("pendingJoin", `/join?from=${fromId}`);
                    navigate("/Auth", { replace: true });
                    return;
                }

                // 無効な招待リンク
                if (!fromId || fromId === user.id) {
                    setErrorMsg("無効な招待リンクです");
                    setStatus("error");
                    return;
                }

                // 自分のプロフィールを確認
                const { data: myProfile } = await supabase
                    .from("profiles")
                    .select("partner")
                    .eq("id", user.id)
                    .single();

                // すでにパートナー設定済み
                if (myProfile?.partner) {
                    setStatus("already");
                    setTimeout(() => navigate("/chat", { replace: true }), 2000);
                    return;
                }

                // 招待者が存在するか確認
                const { data: fromProfile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", fromId)
                    .single();

                console.log("招待者プロフィール:", fromProfile);

                if (!fromProfile) {
                    setErrorMsg("招待者が見つかりません");
                    setStatus("error");
                    return;
                }

                // ===== お互いのpartnerカラムを更新 =====
                // テーブル定義: profiles.partner UUID（相手のid）
                const { error: e1 } = await supabase
                    .from("profiles")
                    .update({ partner: fromId })
                    .eq("id", user.id);
                if (e1) throw e1;

                const { error: e2 } = await supabase
                    .from("profiles")
                    .update({ partner: user.id })
                    .eq("id", fromId);
                if (e2) throw e2;

                setStatus("success");
                setTimeout(() => navigate("/chat", { replace: true }), 2000);

            } catch (e) {
                console.error("招待エラー:", e);
                setErrorMsg("接続に失敗しました");
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