import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/login.css";

function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        if (!agreed) return;
        setError(null);
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/setup", { replace: true }), 1500);
        }
    };

    return (
        <div className="auth-wrapper">
            <AuthHeader backTo="/auth" />

            <div className="auth-container">
                {success ? (
                    <div className="auth-section">
                        <p className="auth-success">
                            確認メールを送信しました。メールを確認してアカウントを有効化してください。
                        </p>
                        <button className="btn-primary" onClick={() => navigate("/login")}>
                            ログインへ
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
                            />
                        </div>

                        <div className="field-group">
                            <div className="field-label-row">
                                <label className="field-label">パスワード</label>
                                <span className="field-hint">半角英数と記号を含む６文字以上</span>
                            </div>
                            <input
                                className="field-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="terms-row" onClick={() => setAgreed(!agreed)}>
                            <span
                                className={`custom-checkbox ${agreed ? "checked" : ""}`}
                                role="checkbox"
                                aria-checked={agreed}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === " " && setAgreed(!agreed)}
                            >
                                {agreed && (
                                    <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1 5L4.5 8.5L11 1.5"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </span>
                            <span className="terms-text">利用規約とプライバシーポリシーに同意します</span>
                        </div>

                        {error && <p className="auth-error">{error}</p>}

                        <button
                            className="btn-primary"
                            onClick={handleRegister}
                            disabled={!agreed || loading || !email || !password}
                        >
                            {loading ? "登録中..." : "新規登録"}
                        </button>

                        <button className="switch-link" onClick={() => navigate("/login")}>
                            アカウントをお持ちの方はこちら
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Register;