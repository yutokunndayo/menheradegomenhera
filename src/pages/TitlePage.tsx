import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import iconLogo from "../assets/icon.png";
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
                <img src={iconLogo} alt="アイコン" width="120" height="120" style={{ borderRadius: "50%" }} />
                <p className="title-appname">KoiNavi</p>
            </div>
        </div>
    );
}

export default TitlePage;