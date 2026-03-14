import { useNavigate } from "react-router-dom";
import "../styles/login.css";

interface AuthHeaderProps {
    // 戻るボタンのリンク先。省略した場合は戻るボタンを表示しない
    backTo?: string;
    // アプリ名（省略時は "Menhera"）
    appName?: string;
}

function AuthHeader({ backTo, appName = "Menhera" }: AuthHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="scallop-header">
            {/* 戻るボタン（backTo が渡された場合のみ表示） */}
            {backTo && (
                <button className="back-btn" onClick={() => navigate(backTo)}>
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M11 4L6 9L11 14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    戻る
                </button>
            )}

            <div className="auth-logo">
                {/*
          アイコン差し込み方法:
          .logo-icon-placeholder を削除して以下に差し替え
          <img src="/icon.png" alt="アイコン" width="72" height="72" style={{ borderRadius: "50%" }} />
        */}
                <div className="logo-icon-placeholder" aria-label="アプリアイコン">
                    <span className="logo-icon-text">♡</span>
                </div>
                <p className="logo-appname">{appName}</p>
            </div>
        </div>
    );
}

export default AuthHeader;