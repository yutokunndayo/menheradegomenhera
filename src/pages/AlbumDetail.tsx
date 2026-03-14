import { useLocation, useNavigate } from "react-router-dom"

import AppHeader from "../components/AppHeader"

import "../styles/AlbumDetail.css"

type Photo = {
  url: string
}

type Album = {
  id: number
  name: string
  image: string
  images: Photo[]
  author: string
  icon: string
  date: string
}

export default function AlbumDetail() {

  const location = useLocation()
  const navigate = useNavigate()

  const album: Album = location.state?.album

  if (!album) {

    navigate("/album")

    return null

  }


  return (

    <div className="album-detail-page">

      <AppHeader
        variant="simple"
        title={album.name}
      />


      {/* アルバム情報 */}
      <div className="detail-header">

        <div className="detail-user">

          <img
            src={album.icon}
            className="detail-user-icon"
          />

          <div className="detail-user-info">

            <span className="detail-user-name">
              {album.author}
            </span>

            <span className="detail-date">
              {album.date}
            </span>

          </div>

        </div>

        <h2 className="detail-title">
          {album.name}
        </h2>

      </div>


      {/* 写真グリッド */}
      <div className="detail-grid">

        {album.images.map((photo, index) => (

          <img
            key={index}
            src={photo.url}
            className="detail-photo"
          />

        ))}

      </div>


      {/* 戻るボタン */}
      <button
        className="back-button"
        onClick={() => navigate("/album")}
      >
        ← アルバム一覧に戻る
      </button>

    </div>

  )

}