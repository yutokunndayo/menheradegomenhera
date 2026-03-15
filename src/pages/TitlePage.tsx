import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

interface TitlePageProps {
    // hideTimer=true のとき自動遷移しない（PartnerGuardのローディング用）
    hideTimer?: boolean;
}

function TitlePage({ hideTimer = false }: TitlePageProps) {
    const navigate = useNavigate();

    useEffect(() => {
        if (hideTimer) return; // ローディング中は遷移しない
        const timer = setTimeout(() => {
            navigate("/auth");
        }, 2000);
        return () => clearTimeout(timer);
    }, [navigate, hideTimer]);

    return (
        <div className="title-wrapper">
            <div className="title-deco-circle-1" />
            <div className="title-deco-circle-2" />
            <div className="title-deco-circle-3" />

            <div className="title-content">
                <div className="title-icon-placeholder" aria-label="アプリアイコン">
                    <span className="title-icon-text">♡</span>
                </div>
                <p className="title-appname">FamLink</p>
            </div>
        </div>
    );
}

export default TitlePage;