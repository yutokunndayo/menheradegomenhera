import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

// 画像
import accountIcon from "../assets/registration-information.png"
import logoutIcon from "../assets/logout.png"
import deleteIcon from "../assets/account-delete.png"

// コンポーネント
import HomePageHeader from "../components/HomePageHeader"
import TabBar from "../components/TabBar"

// CSS
import "../styles/HomePage.css"

export default function HomePage() {

  const navigate = useNavigate()

  // ユーザー名
  const [username, setUsername] = useState("")

  useEffect(() => {

    const getUserName = async () => {

      // ログインユーザー取得
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) return

      // usersテーブルから display_name 取得
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userData.user.id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setUsername(data.name || "")

    }

    getUserName()

  }, [])

  return (

    <div className="page">

      {/* ===== ヘッダー ===== */}
      <HomePageHeader username={username} />

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
          <button
            onClick={() => navigate("/delete-account")}
            className="menu-button"
          >
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