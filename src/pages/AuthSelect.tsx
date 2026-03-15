import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
import "../styles/Login.css";

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
            {/* 戻るボタンなし（トップ選択画面なので） */}
            <AuthHeader />

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