import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SignupCallback() {
    const [message, setMessage] = useState("登録を完了しています...");
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);
            const token_hash = params.get("token_hash");
            const type = params.get("type");

            if (!token_hash) {
                setMessage("認証リンクが無効です。もう一度登録をお試しください。");
                return;
            }

            // 1. メールリンクを検証してセッション化
            const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash,
                type: (type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | null) ?? "signup",
            });

            if (verifyError) {
                setMessage(`認証に失敗しました: ${verifyError.message}`);
                return;
            }

            // 2. セッション化後に user を取得
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user?.email) {
                setMessage("ユーザー情報を取得できませんでした。");
                return;
            }

            const normalizedEmail = user.email.trim().toLowerCase();

            // 3. 独自テーブルへ登録
            const { error: upsertError } = await supabase
                .from("user_emails")
                .upsert(
                    {
                        email: normalizedEmail,
                        user_id: user.id,
                    },
                    {
                        onConflict: "email",
                    }
                );

            if (upsertError) {
                setMessage(`登録の完了処理に失敗しました: ${upsertError.message}`);
                return;
            }

            // 4. URLをきれいにする
            window.history.replaceState({}, document.title, "/signup-callback");

            setDone(true);
            setMessage("登録が完了しました。ログイン画面へ移動できます。");

            // 自動遷移したいならこれでもOK
            // setTimeout(() => navigate("/login"), 1500);
        };

        run();
    }, [navigate]);

    return (
        <div style={{ padding: "24px", textAlign: "center" }}>
            <p>{message}</p>
            {done && (
                <button onClick={() => navigate("/login")}>
                    ログインへ
                </button>
            )}
        </div>
    );
}

export default SignupCallback;