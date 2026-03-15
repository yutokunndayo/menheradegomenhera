import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

import HomePageHeader from "../components/HomePageHeader"
import TabBar from "../components/TabBar"

import "../styles/LogoutModalPage.css"

export default function LogoutModalPage() {

  const navigate = useNavigate()

  // ログアウト処理
  const handleLogout = async () => {

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("ログアウトエラー:", error.message)
      return
    }

    // ログイン選択画面へ
    navigate("/AuthSelect")
  }

  return (

    <div className="page">

      {/* ヘッダー + プロフィール */}
      <HomePageHeader username="彼女ちゃん" />

      {/* 背景暗くする */}
      <div className="overlay"></div>

      {/* モーダル */}
      <div className="modal">

        <h2 className="modal-title">
          ログアウト
        </h2>

        <p className="modal-text">
          ログアウトしてよろしいですか？
        </p>

        <div className="modal-buttons">

          <button
            className="cancel-button"
            onClick={() => navigate("/home")}
          >
            キャンセル
          </button>

          <button
            className="ok-button"
            onClick={handleLogout}
          >
            OK
          </button>

        </div>

      </div>

      {/* タブバー */}
      <TabBar />

    </div>

  )
}