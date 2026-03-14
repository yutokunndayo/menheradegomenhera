import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthHeader from "../components/AuthHeader";
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
      {/* スカラップヘッダー（backTo="/auth" で戻るボタンを表示） */}
      <AuthHeader backTo="/auth" />

      <div className="auth-container">
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