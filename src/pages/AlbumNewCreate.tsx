import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { getCachedProfile } from "../lib/userCache"
import { FiX, FiCamera, FiCheck } from "react-icons/fi"
import AppHeader from "../components/AppHeader"
import "../styles/AlbumNewCreate.css"

type Photo = { url: string; file: File }

export default function AlbumNewCreate() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos = files.map(file => ({ url: URL.createObjectURL(file), file }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const createAlbum = async () => {
    if (!title.trim() || photos.length === 0) return
    setIsLoading(true)
    setErrorMsg("")

    try {
      const profile = await getCachedProfile()
      if (!profile) throw new Error("ログインが必要です")

      // 1. アルバム作成
      const { data: album, error: albumError } = await supabase
        .from("albums")
        .insert({ user_id: profile.id, title: title.trim() })
        .select("id")
        .single()
      if (albumError) throw albumError

      // 2. 写真をアップロード
      const uploadedUrls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const ext = photo.file.name.split(".").pop() || "jpg"
        const fileName = `${album.id}/${Date.now()}_${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from("images")
          .upload(fileName, photo.file, { cacheControl: "3600", upsert: false })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }

      // 3. album_photos に保存
      const photoRows = uploadedUrls.map((url, order_num) => ({
        album_id: album.id, url, order_num,
      }))
      const { error: photoError } = await supabase.from("album_photos").insert(photoRows)
      if (photoError) throw photoError

      // 4. カバー画像を更新
      await supabase.from("albums").update({ cover_url: uploadedUrls[0] }).eq("id", album.id)

      navigate("/album")
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const canCreate = title.trim().length > 0 && photos.length > 0

  return (
    <div className="anc-page">
      <AppHeader variant="simple" title="" />

      <div className="anc-inner">
        {/* タイトルエリア */}
        <div className="anc-title-section">
          <div className="anc-title-label">アルバム名</div>
          <input
            className="anc-title-input"
            type="text"
            placeholder="例：初デート、夏の思い出..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={30}
          />
          <div className="anc-title-count">{title.length}/30</div>
        </div>

        {/* 写真追加エリア */}
        <div className="anc-photos-section">
          <div className="anc-section-label">
            写真 <span className="anc-photo-count">{photos.length}枚</span>
          </div>

          <div className="anc-photo-grid">
            {/* 追加ボタン */}
            <button
              className="anc-add-cell"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiCamera size={24} color="#f5317f" />
              <span>追加</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* 写真プレビュー */}
            {photos.map((photo, i) => (
              <div key={i} className="anc-photo-cell">
                <img src={photo.url} className="anc-photo-img" alt="" />
                <button className="anc-photo-remove" onClick={() => removePhoto(i)}>
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && <p className="anc-error">{errorMsg}</p>}
      </div>

      {/* 作成ボタン */}
      <button
        className={`anc-create-btn ${canCreate && !isLoading ? "active" : ""}`}
        onClick={createAlbum}
        disabled={!canCreate || isLoading}
      >
        {isLoading ? (
          <span>アップロード中...</span>
        ) : (
          <>
            <FiCheck size={18} />
            <span>アルバムを作成</span>
          </>
        )}
      </button>
    </div>
  )
}