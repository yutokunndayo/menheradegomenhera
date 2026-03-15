import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import iconImage from "../assets/icon.png";

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
        <img className="title-content-img" src={iconImage} alt="アイコン" />
        <p className="title-appname">KoiNavi</p>
      </div>
    </div>
  );
}

export default TitlePage;