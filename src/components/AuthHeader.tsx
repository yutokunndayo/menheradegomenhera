import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import iconImage from "../assets/icon.png";

interface AuthHeaderProps {
    // 戻るボタンのリンク先。省略した場合は戻るボタンを表示しない
    backTo?: string;
    // アプリ名（省略時は "KoiNavi"）
    appName?: string;
}

function AuthHeader({ backTo, appName = "KoiNavi" }: AuthHeaderProps) {
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
                <img src={iconImage} alt="アイコン" width="72" height="72" style={{ borderRadius: "50%" }} />
                <p className="logo-appname">{appName}</p>
            </div>
        </div>
    );
}

export default AuthHeader;