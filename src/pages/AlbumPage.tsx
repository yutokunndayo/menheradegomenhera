import { useState } from "react"
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import { FaHeart } from "react-icons/fa"

import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"

import "../styles/AlbumPage.css"

type Album = {
  id: number
  name: string
  image: string
  author: string
  icon: string
  date: string
}

export default function AlbumPage() {

  const [albums, setAlbums] = useState<Album[]>([
    {
      id: 1,
      name: "初詣",
      image: "https://placehold.jp/600x400.png",
      author: "彼女ちゃん",
      icon: "https://placehold.jp/40x40.png",
      date: "2026年1月1日"
    }
  ])

  const createAlbum = () => {

    const newAlbum: Album = {
      id: Date.now(),
      name: "新しいアルバム",
      image: "https://placehold.jp/600x400.png",
      author: "彼女ちゃん",
      icon: "https://placehold.jp/40x40.png",
      date: new Date().toLocaleDateString("ja-JP")
    }

    setAlbums([newAlbum, ...albums])
  }

  return (

    <div className="album-page">

      {/* ===== ヘッダー ===== */}
      <AppHeader
        variant="simple"
        title=""
      />

      {/* 新規作成ボタン */}
      <button className="album-create-btn" onClick={createAlbum}>
        <FaHeart className="heart-icon"/>
        <FiPlus className="plus-icon"/>
      </button>


      {/* ===== アルバム一覧 ===== */}
      <div className="album-list">

        {albums.map((album) => (

          <div key={album.id} className="album-item">

            {/* 投稿者 */}
            <div className="album-user">

              <div className="album-user-left">
                <img src={album.icon} className="album-user-icon" />
                <span className="album-user-name">{album.author}</span>
              </div>

              <span className="album-date">{album.date}</span>

            </div>


            {/* メイン画像 */}
            <img src={album.image} className="album-image" />


            {/* 下部 */}
            <div className="album-bottom">

              <span className="album-title">{album.name}</span>

              <div className="album-actions">
                <FiEdit2 className="album-icon-btn" />
                <FiTrash2 className="album-icon-btn" />
              </div>

            </div>

          </div>

        ))}

      </div>


      <TabBar />

    </div>
  )
}