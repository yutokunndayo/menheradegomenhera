import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

function SignupCallback() {
    const [message, setMessage] = useState("登録を完了しています...");
    const [done, setDone] = useState(false);

    useEffect(() => {
        const run = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user?.email) {
                setMessage("ユーザー情報を取得できませんでした。もう一度お試しください。");
                return;
            }

            const normalizedEmail = user.email.trim().toLowerCase();

            const { error: upsertError } = await supabase
                .from("user_emails")
                .upsert({
                    email: normalizedEmail,
                    user_id: user.id,
                });

            if (upsertError) {
                setMessage("登録の完了処理に失敗しました。");
                return;
            }

            setDone(true);
            setMessage("登録が完了しました。このタブは閉じて大丈夫です。");
        };

        run();
    }, []);
    return (
        <div style={{ padding: "24px", textAlign: "center" }}>
            <p>{message}</p>
            {done && (
                <button onClick={() => window.close()}>
                    閉じる
                </button>
            )}
        </div>
    );
}
export default SignupCallback;