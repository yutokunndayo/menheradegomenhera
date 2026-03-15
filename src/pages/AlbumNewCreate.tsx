import { useState } from "react"
import { useNavigate } from "react-router-dom"

import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"

import "../styles/AlbumNewCreate.css"

// File オブジェクトも一緒に保持する
type Photo = {
  url: string   // プレビュー用 blob URL
  file: File    // Supabase アップロード用
}

export default function AlbumNewCreate() {

  const navigate = useNavigate()

  const [photos, setPhotos] = useState<Photo[]>([])


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const files = Array.from(e.target.files || [])

    const newPhotos = files.map((file) => ({
      url: URL.createObjectURL(file),
      file: file,  // File オブジェクトを保持
    }))

    setPhotos((prev) => [...prev, ...newPhotos])

    // 同じファイルを再選択できるようリセット
    e.target.value = ""

  }


  const goNext = () => {

    if (photos.length === 0) return

    navigate("/album-edit", {
      state: { images: photos },
    })

  }


  return (

    <div className="album-new-page">

      <AppHeader
        variant="simple"
        title="写真を選択"
      />

      <div className="photo-count">
        {photos.length}枚選択中
      </div>

      <div className="select-area">
        <label className="select-button">
          写真を追加
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-wrapper">
            <img
              src={photo.url}
              className="photo-item"
            />
            <span className="photo-number">
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {photos.length > 0 && (
        <button
          className="next-button"
          onClick={goNext}
        >
          次へ →
        </button>
      )}

      <TabBar />

    </div>

  )

}