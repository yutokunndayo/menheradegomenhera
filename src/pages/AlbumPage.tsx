import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FiEdit2, FiTrash2 } from "react-icons/fi"
import { FaHeart } from "react-icons/fa"

import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"

import "../styles/AlbumPage.css"

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

export default function AlbumPage() {

  const navigate = useNavigate()
  const location = useLocation()

  const [albums, setAlbums] = useState<Album[]>([
    {
      id: 1,
      name: "初詣",
      image: "https://placehold.jp/600x400.png",
      images: [{ url: "https://placehold.jp/600x400.png" }],
      author: "彼女ちゃん",
      icon: "https://placehold.jp/40x40.png",
      date: "2026年1月1日",
    },
  ])

  // 処理済みのアルバム id を記録して二重追加を防ぐ
  const addedIdRef = useRef<number | null>(null)

  useEffect(() => {

    const newAlbum = location.state?.newAlbum

    if (newAlbum && newAlbum.id !== addedIdRef.current) {

      addedIdRef.current = newAlbum.id

      setAlbums((prev) => [newAlbum, ...prev])

      // location.state をクリアして再レンダリング時の再追加を防ぐ
      window.history.replaceState({}, "")

    }

  }, [location.state])


  const goCreate = () => {
    navigate("/album-new-create")
  }


  const goDetail = (album: Album) => {
    navigate("/album-detail", {
      state: { album },
    })
  }


  const deleteAlbum = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    const newList = albums.filter((a) => a.id !== id)
    setAlbums(newList)
  }


  return (

    <div className="album-page">

      <AppHeader
        variant="simple"
        title=""
      />

      {/* 新規作成ボタン */}
      <button
        className="album-create-btn"
        onClick={goCreate}
      >
        <FaHeart className="heart-icon" />
        <span className="plus-icon">+</span>
      </button>

      {/* アルバム一覧 */}
      <div className="album-list">

        {albums.map((album) => (

          <div
            key={album.id}
            className="album-item"
            onClick={() => goDetail(album)}
          >

            <div className="album-user">

              <div className="album-user-left">

                <img
                  src={album.icon}
                  className="album-user-icon"
                />

                <span className="album-user-name">
                  {album.author}
                </span>

              </div>

              <span className="album-date">
                {album.date}
              </span>

            </div>

            <img
              src={album.image}
              className="album-image"
            />

            <div className="album-bottom">

              <span className="album-title">
                {album.name}
              </span>

              <div className="album-actions">

                <FiEdit2
                  className="album-icon-btn"
                  onClick={(e) => e.stopPropagation()}
                />

                <FiTrash2
                  className="album-icon-btn"
                  onClick={(e) => deleteAlbum(e, album.id)}
                />

              </div>

            </div>

          </div>

        ))}

      </div>

      <TabBar />

    </div>

  )

}