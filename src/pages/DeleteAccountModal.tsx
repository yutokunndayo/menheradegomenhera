import { useNavigate } from "react-router-dom"

import HomePageHeader from "../components/HomePageHeader"
import TabBar from "../components/TabBar"

import "../styles/DeleteAccountModal.css"

export default function DeleteAccountModal() {

  const navigate = useNavigate()

  return (

    <div className="page">

      {/* ヘッダー + プロフィール */}
      <HomePageHeader username="彼女ちゃん" />

      {/* 背景暗くする */}
      <div className="overlay"></div>


      {/* モーダル */}
      <div className="modal">

        <h2 className="modal-title">
          アカウントの削除
        </h2>

        <p className="modal-text">
          アカウントを完全に削除してよろしいですか？<br />
          削除した場合、相手の端末内のデータも削除されます。
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
            onClick={() => navigate("/login")}
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