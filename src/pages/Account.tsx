import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

import HomePageHeader from "../components/HomePageHeader"
import TabBar from "../components/TabBar"

import "../styles/Account.css"

export default function Account() {

  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [icon, setIcon] = useState<string | null>(null)
  const [isGoogle, setIsGoogle] = useState(false)


  useEffect(() => {

    const fetchUser = async () => {

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setEmail(user.email ?? "")
      setDisplayName(user.user_metadata?.display_name ?? "")
      setIcon(user.user_metadata?.avatar_url ?? null)
      setIsGoogle(user.app_metadata?.provider === "google")

    }

    fetchUser()

  }, [])


  return (

    <div className="account-page">

      <HomePageHeader
        username={displayName}
        icon={icon}
      />

      {/* 画像変更ボタン */}
      <div className="account-avatar-action">
        <button
          className="avatar-change-btn"
          onClick={() => navigate("/account-edit")}
        >
          画像を変更する
        </button>
      </div>

      {/* ユーザー情報リスト */}
      <div className="account-info-list">

        {/* 名前 */}
        <div className="account-info-item non-clickable">
          <span className="info-label">名前</span>
          <span className="info-value">{displayName}</span>
        </div>

        <div className="info-divider" />

        {/* メールアドレス */}
        <div
          className="account-info-item clickable"
          onClick={() => navigate("/mail-modify")}
        >
          <span className="info-label">メールアドレス</span>
          <div className="info-right">
            <span className="info-value">{email}</span>
            <span className="info-arrow">›</span>
          </div>
        </div>

        <div className="info-divider" />

        {/* パスワード（Googleログイン時は非表示） */}
        {!isGoogle && (
          <>
            <div
              className="account-info-item clickable"
              onClick={() => navigate("/password-modify")}
            >
              <span className="info-label">パスワード</span>
              <div className="info-right">
                <span className="info-value info-password">・・・・・・・・</span>
                <span className="info-arrow">›</span>
              </div>
            </div>
            <div className="info-divider" />
          </>
        )}

      </div>

      <TabBar />

    </div>

  )

}