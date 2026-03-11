import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function TitlePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="title-wrapper">
      {/* 装飾サークル */}
      <div className="title-deco-circle-1" />
      <div className="title-deco-circle-2" />
      <div className="title-deco-circle-3" />

      <div className="title-content">
        {/* アイコンプレースホルダー: 後でimgタグに差し替え */}
        <div className="title-icon-placeholder" aria-label="アプリアイコン">
          <span className="title-icon-text">♡</span>
        </div>
        <p className="title-appname">Menhera</p>
      </div>
    </div>
  );
}

export default TitlePage;