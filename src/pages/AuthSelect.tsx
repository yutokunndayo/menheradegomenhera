import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/login.css";

function AuthSelect() {
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/authCallback`,
            },
        });
        if (error) alert(error.message);
    };

    return (
        <div className="auth-wrapper">
            {/* スカラップヘッダー + ロゴ */}
            <div className="scallop-header">
                <div className="auth-logo">
                    {/* アイコンプレースホルダー: 後でimgタグに差し替え */}
                    <div className="logo-icon-placeholder" aria-label="アプリアイコン">
                        <span className="logo-icon-text">♡</span>
                    </div>
                    <p className="logo-appname">Menhera</p>
                </div>
            </div>

            {/* ボタン群 */}
            <div className="auth-container">
                <div className="auth-section">
                    <div className="select-buttons">
                        <button className="btn-outline" onClick={() => navigate("/login")}>
                            ログイン
                        </button>
                        <button className="btn-primary" onClick={() => navigate("/register")}>
                            新規登録
                        </button>
                    </div>

                    <div className="divider">
                        <span>または</span>
                    </div>

                    <button className="btn-google" onClick={signInWithGoogle}>
                        {/* Googleアイコンプレースホルダー: 後でimgタグに差し替え */}
                        <span className="google-icon-placeholder">G</span>
                        Googleでログイン
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthSelect;