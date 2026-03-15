import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

import AppHeader from "../components/AppHeader"

import "../styles/MailModify.css"

export default function MailModify() {

  const navigate = useNavigate()

  const [currentEmail, setCurrentEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")


  useEffect(() => {

    const fetchEmail = async () => {

      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) setCurrentEmail(user.email)

    }

    fetchEmail()

  }, [])


  const handleSubmit = async () => {

    setErrorMsg("")

    if (!newEmail.trim()) {
      setErrorMsg("新しいメールアドレスを入力してください")
      return
    }

    if (newEmail === currentEmail) {
      setErrorMsg("現在と同じメールアドレスです")
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    setIsLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    // 成功 → モーダルを表示して2秒後にアカウント画面へ
    setShowModal(true)

    setTimeout(() => {
      navigate("/account")
    }, 2000)

  }


  return (

    <div className="mail-modify-page">

      <AppHeader
        variant="simple"
        title="メールアドレス変更"
      />

      <div className="mail-modify-content">

        {/* 現在のメールアドレス */}
        <div className="current-email-box">
          <span className="current-email-label">現在のメールアドレス</span>
          <span className="current-email-value">{currentEmail}</span>
        </div>

        {/* 新しいメールアドレス入力 */}
        <div className="form-group">
          <label className="form-label">新しいメールアドレス</label>
          <input
            type="email"
            className="form-input"
            placeholder="example@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>

        {/* エラーメッセージ */}
        {errorMsg && (
          <p className="msg error-msg">{errorMsg}</p>
        )}

        {/* 保存ボタン */}
        <button
          className="save-btn"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "送信中..." : "保存する"}
        </button>

        {/* キャンセル */}
        <button
          className="back-link"
          onClick={() => navigate("/account")}
        >
          キャンセル
        </button>

      </div>


      {/* 完了モーダル */}
      {showModal && (

        <div className="complete-overlay">
          <div className="complete-modal">
            <div className="complete-icon">✓</div>
            <p className="complete-text">変更が完了しました</p>
          </div>
        </div>

      )}

    </div>

  )

}