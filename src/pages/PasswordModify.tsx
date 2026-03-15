import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

import AppHeader from "../components/AppHeader"

import "../styles/PasswordModify.css"

export default function PasswordModify() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")


  useEffect(() => {

    const fetchEmail = async () => {

      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) setEmail(user.email)

    }

    fetchEmail()

  }, [])


  const handleSendReset = async () => {

    setSuccessMsg("")
    setErrorMsg("")

    if (!email) {
      setErrorMsg("メールアドレスが取得できませんでした")
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password",
    })

    setIsLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setSuccessMsg("パスワードリセットメールを送信しました。メールを確認してください。")

  }


  return (

    <div className="password-modify-page">

      <AppHeader
        variant="simple"
        title="パスワード変更"
      />

      <div className="password-modify-content">

        {/* 説明テキスト */}
        <div className="pw-description-box">
          <p className="pw-description">
            登録中のメールアドレスにパスワードリセット用のリンクを送信します。
          </p>
        </div>

        {/* メールアドレス表示 */}
        <div className="pw-email-box">
          <span className="pw-email-label">送信先メールアドレス</span>
          <span className="pw-email-value">{email}</span>
        </div>

        {/* エラー / 成功メッセージ */}
        {errorMsg && (
          <p className="pw-msg pw-error">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="pw-msg pw-success">{successMsg}</p>
        )}

        {/* 送信ボタン */}
        <button
          className="pw-send-btn"
          onClick={handleSendReset}
          disabled={isLoading || !!successMsg}
        >
          {isLoading ? "送信中..." : "リセットメールを送信する"}
        </button>

        {/* キャンセル */}
        <button
          className="pw-back-link"
          onClick={() => navigate("/account")}
        >
          キャンセル
        </button>

      </div>

    </div>

  )

}