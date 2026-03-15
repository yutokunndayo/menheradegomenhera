import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { clearUserCache, updateCachedAvatarUrl } from "../lib/userCache"
import { FiCamera } from "react-icons/fi"
import TabBar from "../components/TabBar"
import decor from "../assets/decor.png"
import "../styles/Account.css"

export default function Account() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState("")
  const [email,       setEmail]       = useState("")
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null)
  const [isGoogle,    setIsGoogle]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [userId,      setUserId]      = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? "")
      setIsGoogle(user.app_metadata?.provider === "google")

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar")
        .eq("id", user.id)
        .single()

      if (profile) {
        setDisplayName(profile.name ?? "")
        if (profile.avatar) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(profile.avatar)
          setAvatarUrl(urlData.publicUrl)
        }
      }
    }
    fetchUser()
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const ext      = file.name.split(".").pop() || "jpg"
      const filePath = `${userId}/avatar.${ext}`

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, cacheControl: "3600" })
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      await supabase.from("profiles").update({ avatar: filePath }).eq("id", userId)

      // キャッシュバスター付きURLで即時反映
      const freshUrl = urlData.publicUrl + "?t=" + Date.now()

      // キャッシュを更新（clearしない→他のキャッシュは維持）
      updateCachedAvatarUrl(freshUrl)
      setAvatarUrl(freshUrl)

    } catch (err) {
      console.error("アバター更新エラー:", err)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="account-page">
      <div className="header" />
      <img src={decor} className="decor" alt="" />

      <div className="profile">
        <div className="icon-wrapper">
          <button
            className="account-avatar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {avatarUrl ? (
              <img src={avatarUrl} className="icon" alt="アバター" />
            ) : (
              <div className="default-icon">
                <svg viewBox="0 0 24 24" fill="none" width="60" height="60">
                  <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8" />
                  <path
                    d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20"
                    stroke="white" strokeWidth="1.8" strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
            <span className="account-avatar-edit-badge">
              <FiCamera size={12} color="white" />
            </span>
          </button>
        </div>

        <p className="account-avatar-hint">
          {uploading ? "アップロード中..." : "タップして変更"}
        </p>
        <h2 className="username">{displayName}</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
      </div>

      <div className="account-info-list">
        <div className="account-info-item non-clickable">
          <span className="info-label">名前</span>
          <span className="info-value">{displayName || "未設定"}</span>
        </div>
        <div className="info-divider" />
        <div className="account-info-item clickable" onClick={() => navigate("/mail-modify")}>
          <span className="info-label">メールアドレス</span>
          <div className="info-right">
            <span className="info-value">{email}</span>
            <span className="info-arrow">›</span>
          </div>
        </div>
        <div className="info-divider" />
        {!isGoogle && (
          <>
            <div className="account-info-item clickable" onClick={() => navigate("/password-modify")}>
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