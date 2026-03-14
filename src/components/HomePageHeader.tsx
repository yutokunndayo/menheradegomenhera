import { useState } from "react"
import decor from "../assets/decor.png"
import "../styles/HomePageHeader.css"

type Props = {
  username: string
}

export default function HomePageHeader({ username }: Props) {

  const [icon, setIcon] = useState<string | null>(null)

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setIcon(URL.createObjectURL(file))
    }
  }

  return (
    <div>

      {/* ピンクヘッダー */}
      <div className="header"></div>

      {/* デコレーション */}
      <img src={decor} className="decor" />

      {/* プロフィール */}
      <div className="profile">

        <label className="icon-label">

          <input
            type="file"
            className="icon-input"
            onChange={handleIconChange}
          />

          <img
            src={icon ?? "https://placehold.jp/150x150.png"}
            className="icon"
          />

        </label>

        <h2 className="username">
          {username}
        </h2>

      </div>

    </div>
  )
}