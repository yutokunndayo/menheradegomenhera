import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/Login.css";
import "../styles/Invite.css";

type JoinState =
    | "loading"
    | "needAuth"
    | "needSetup"
    | "alreadyPartnered"
    | "selfInvite"
    | "joining"
    | "joined"
    | "error";

function JoinPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [joinState, setJoinState] = useState<JoinState>("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                const fromId = searchParams.get("from") || sessionStorage.getItem("pendingFromId");

                if (!fromId) {
                    setJoinState("error");
                    setErrorMsg("招待情報が見つかりません");
                    return;
                }

                // 最初に必ず保存
                sessionStorage.setItem("pendingFromId", fromId);

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) throw userError;

                // 未ログイン
                if (!user) {
                    setJoinState("needAuth");
                    return;
                }

                // 自分自身の招待リンクは禁止
                if (user.id === fromId) {
                    sessionStorage.removeItem("pendingFromId");
                    setJoinState("selfInvite");
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, partner, gender")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                // profiles未作成
                if (!profile) {
                    setJoinState("needAuth");
                    return;
                }

                // gender未設定
                if (profile.gender == null) {
                    setJoinState("needSetup");
                    return;
                }

                // すでにパートナーあり
                if (profile.partner) {
                    setJoinState("alreadyPartnered");
                    timeoutRef.current = setTimeout(() => {
                        navigate("/chat", { replace: true });
                    }, 5000);
                    return;
                }

                // 接続実行
                setJoinState("joining");

                const { error: rpcError } = await supabase.rpc("connect_partners", {
                    inviter_id: fromId,
                });

                if (rpcError) throw rpcError;

                sessionStorage.removeItem("pendingFromId");
                setJoinState("joined");

                timeoutRef.current = setTimeout(() => {
                    navigate("/chat", { replace: true });
                }, 1500);
            } catch (e: any) {
                console.error("join init error:", e);
                setJoinState("error");
                setErrorMsg(e?.message ?? "参加処理に失敗しました");
            }
        };

        init();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [navigate, searchParams]);

    return (
        <div className="auth-wrapper">
            <AuthHeader />

            <div className="auth-container">
                <div className="auth-section">
                    <div className="invite-section">
                        {joinState === "loading" || joinState === "joining" ? (
                            <>
                                <div className="join-spinner" />
                                <p className="invite-title">
                                    {joinState === "joining" ? "接続中..." : "確認中..."}
                                </p>
                            </>
                        ) : joinState === "needAuth" ? (
                            <>
                                <div className="join-icon join-icon--error">!</div>
                                <p className="invite-title">ログインが必要です</p>
                                <p className="invite-desc">
                                    ログインまたは登録後、自動で招待処理を再開します
                                </p>
                                <button
                                    className="invite-copy-btn"
                                    onClick={() => navigate("/auth", { replace: true })}
                                >
                                    ログイン / 登録へ
                                </button>
                            </>
                        ) : joinState === "needSetup" ? (
                            <>
                                <div className="join-icon join-icon--error">!</div>
                                <p className="invite-title">初期設定が未完了です</p>
                                <p className="invite-desc">
                                    設定完了後、自動で招待処理を再開します
                                </p>
                                <button
                                    className="invite-copy-btn"
                                    onClick={() => navigate("/setup", { replace: true })}
                                >
                                    設定へ進む
                                </button>
                            </>
                        ) : joinState === "alreadyPartnered" ? (
                            <>
                                <div className="join-icon join-icon--success">♡</div>
                                <p className="invite-title">すでにパートナーがいます</p>
                                <p className="invite-desc">
                                    5秒後にチャット画面へ移動します
                                </p>
                            </>
                        ) : joinState === "selfInvite" ? (
                            <>
                                <div className="join-icon join-icon--error">!</div>
                                <p className="invite-title">この招待には参加できません</p>
                                <p className="invite-desc">
                                    自分自身の招待リンクは使用できません
                                </p>
                                <button
                                    className="invite-copy-btn"
                                    onClick={() => navigate("/invite", { replace: true })}
                                >
                                    招待画面へ
                                </button>
                            </>
                        ) : joinState === "joined" ? (
                            <>
                                <div className="join-icon join-icon--success">♡</div>
                                <p className="invite-title">パートナー登録が完了しました！</p>
                                <p className="invite-desc">チャット画面へ移動します</p>
                            </>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JoinPage;