// ページ遷移をするためのフック
import { useNavigate } from "react-router-dom"

// 画像ファイルの読み込み
import accountIcon from "../assets/registration-information.png"
import logoutIcon from "../assets/logout.png"
import deleteIcon from "../assets/account-delete.png"

// ヘッダーコンポーネント
// import HomePageHeader from "../components/HomePageHeader"

// タブバーコンポーネント
import TabBar from "../components/TabBar"

// CSSファイルの読み込み
import "../styles/HomePage.css"


// ホーム画面コンポーネント
export default function HomePage() {

  // ページ遷移に使う関数
  const navigate = useNavigate()

  return (

    <div className="page">

      {/* ===== ヘッダー（コンポーネント化）===== */}
      {/* <HomePageHeader username="彼女ちゃん" /> */}

      {/* ===== メニュー ===== */}
      <div className="menu">

        {/* 登録情報 */}
        <div className="menu-item">
          <button
            onClick={() => navigate("/account")}
            className="menu-button"
          >
            <img src={accountIcon} className="menu-icon" />
          </button>
          <p className="menu-text">登録情報</p>
        </div>

        {/* ログアウト */}
        <div className="menu-item">
          <button
            onClick={() => navigate("/logout")}
            className="menu-button"
          >
            <img src={logoutIcon} className="menu-icon" />
          </button>
          <p className="menu-text">ログアウト</p>
        </div>

        {/* アカウント削除 */}
        <div className="menu-item">
          <button className="menu-button">
            <img src={deleteIcon} className="menu-icon" />
          </button>
          <p className="menu-text delete">アカウントの削除</p>
        </div>

      </div>

      {/* ===== タブバー ===== */}
      <TabBar />

    </div>
  )
}