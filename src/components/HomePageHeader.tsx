import decor from "../assets/decor.png"
import "./HomePageHeader.css"

type Props = {
  username: string
  icon?: string | null
}

export default function HomePageHeader({ username, icon }: Props) {

  return (
    <div>

      {/* ピンクヘッダー */}
      <div className="header"></div>

      {/* デコレーション */}
      <img src={decor} className="decor" />

      {/* プロフィール */}
      <div className="profile">

        {/* アイコン */}
        <div className="icon-wrapper">

          {icon ? (
            <img
              src={icon}
              className="icon"
            />
          ) : (
            <div className="default-icon">

              <svg viewBox="0 0 24 24" fill="none" width="60" height="60">
                <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8" />
                <path
                  d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

            </div>
          )}

        </div>

        <h2 className="username">
          {username}
        </h2>

      </div>

    </div>
  )
}