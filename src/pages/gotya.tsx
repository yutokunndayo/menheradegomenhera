import { useState } from "react"
import HomePageHeader from "../components/HomePageHeader"
import TabBar from "../components/TabBar"
import "./Account.css"

export default function Account() {

  const [username, setUsername] = useState("彼女ちゃん")
  const [icon, setIcon] = useState<string | null>(null)

  const email = "ecc.menhera@gmail.com"
  const password = "menheradegomenhera"

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setIcon(URL.createObjectURL(file))
    }
  }

  const handleNameChange = () => {
    const newName = prompt("新しい名前を入力してください")

    if (newName) {
      setUsername(newName)
    }
  }

  return (
    <div className="account-page">

      {/* ヘッダー */}
      <HomePageHeader username={username} />

      <div className="account-content">

        {/* アイコン */}
        <div className="account-icon-area">

          <img
            src={icon ?? "https://placehold.jp/150x150.png"}
            className="account-icon"
          />

          <label className="change-image-btn">
            画像を変更する
            <input
              type="file"
              className="hidden-input"
              onChange={handleImageChange}
            />
          </label>

        </div>


        {/* 情報リスト */}
        <div className="account-list">

          <div className="account-item">
            <span className="label">名前</span>

            <span
              className="value clickable"
              onClick={handleNameChange}
            >
              {username}
            </span>
          </div>

          <div className="account-item">
            <span className="label">メールアドレス</span>
            <span className="value">{email}</span>
          </div>

          <div className="account-item">
            <span className="label">パスワード</span>
            <span className="value">{password}</span>
          </div>

        </div>

      </div>

      <TabBar />

    </div>
  )
}