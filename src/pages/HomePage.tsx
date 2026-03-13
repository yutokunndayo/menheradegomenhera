// Reactのstate（状態管理）を使うため
import { useState } from "react"

// ページ遷移をするためのフック
import { useNavigate } from "react-router-dom"

// 画像ファイルの読み込み
import accountIcon from "../assets/registration-information.png"
import logoutIcon from "../assets/logout.png"
import deleteIcon from "../assets/account-delete.png"

// ヘッダーコンポーネント
import HomePageHeader from "../components/HomePageHeader"

// CSSファイルの読み込み
import "../styles/HomePage.css"


// ホーム画面コンポーネント
export default function HomePage() {

  // ページ遷移に使う関数
  const navigate = useNavigate()

  // プロフィールアイコンの画像URLを保存するstate
  const [icon, setIcon] = useState<string | null>(null)


  // アイコン画像を選択したときの処理
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    // 選択されたファイルを取得
    const file = e.target.files?.[0]

    // ファイルが存在する場合
    if (file) {

      // 選択された画像を表示するためのURLを作成して保存
      setIcon(URL.createObjectURL(file))

    }
  }


  return (

    <div className="page">

      {/* ===== ヘッダー（コンポーネント化）===== */}
      <HomePageHeader username="彼女ちゃん" />
      
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
            onClick={() => navigate("/login")}
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

    </div>
  )
}