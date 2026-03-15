import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/Login.css";

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        setError(null);
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="auth-wrapper">
            <AuthHeader backTo="/login" />

            <div className="auth-container">
                {sent ? (
                    <div className="auth-section">
                        <p className="auth-success">
                            パスワード再設定のメールを送信しました。メールをご確認ください。
                        </p>
                        <button className="btn-outline" onClick={() => navigate("/login")}>
                            ログインへ戻る
                        </button>
                    </div>
                ) : (
                    <div className="auth-section">
                        <div className="field-group">
                            <label className="field-label">メールアドレス</label>
                            <input
                                className="field-input"
                                type="email"
                                placeholder="sample@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                            />
                        </div>

                        {error && <p className="auth-error">{error}</p>}

                        <button
                            className="btn-primary"
                            onClick={handleReset}
                            disabled={loading || !email}
                        >
                            {loading ? "送信中..." : "再設定メールを送信"}
                        </button>

                        <button className="switch-link" onClick={() => navigate("/login")}>
                            ログインへ戻る
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;