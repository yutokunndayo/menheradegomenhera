import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
    } else {
      navigate("/account", { replace: true });
    }
  };

  return (
    <div className="auth-wrapper">
      {/* スカラップヘッダー + ロゴ */}
      <div className="scallop-header">
        {/* 戻るボタン */}
        <button className="back-btn" onClick={() => navigate("/auth")}>
          <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          戻る
        </button>

        <div className="auth-logo">
          {/* アイコンプレースホルダー: 後でimgタグに差し替え */}
          <div className="logo-icon-placeholder" aria-label="アプリアイコン">
            <span className="logo-icon-text">♡</span>
          </div>
          <p className="logo-appname">Menhera</p>
        </div>
      </div>

      <div className="auth-container">
        <div className="auth-section">
          {/* メールアドレス */}
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

          {/* パスワード */}
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              className="forgot-link"
              onClick={() => navigate("/forgot-password")}
            >
              パスワードをお忘れの方はこちら
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn-primary"
            onClick={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <button className="switch-link" onClick={() => navigate("/register")}>
            アカウントをお持ちでない方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;