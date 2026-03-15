import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import AppHeader from "../components/AppHeader"
import "../styles/AlbumEdit.css"

type Photo = { url: string; file?: File }
type Album = {
  id: number; name: string; image: string
  images: Photo[]; author: string; icon: string; date: string
}

export default function AlbumEdit() {
  const navigate = useNavigate()
  const location = useLocation()

  // 編集モード: editAlbumがあれば編集、なければ新規
  const editAlbum: Album | undefined = location.state?.editAlbum
  const isEditMode = !!editAlbum

  const [title, setTitle] = useState(editAlbum?.name ?? "")
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(editAlbum?.images ?? [])
  const [newPhotos, setNewPhotos] = useState<{ url: string; file: File }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const added = files.map(file => ({ url: URL.createObjectURL(file), file }))
    setNewPhotos(prev => [...prev, ...added])
    e.target.value = ""
  }

  const removeExisting = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const removeNew = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const save = async () => {
    if (!title.trim()) return
    setIsLoading(true)
    setErrorMsg("")

    try {
      // 新規追加分をアップロード
      const uploadedUrls: string[] = []
      for (const photo of newPhotos) {
        const ext = photo.file.name.split(".").pop() || "png"
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage
          .from("images").upload(fileName, photo.file, { cacheControl: "3600", upsert: false })
        if (error) throw new Error(`アップロード失敗: ${error.message}`)
        const { data } = supabase.storage.from("images").getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      }

      const allImages = [
        ...existingPhotos,
        ...uploadedUrls.map(url => ({ url })),
      ]

      if (isEditMode && editAlbum) {
        const updatedAlbum: Album = {
          ...editAlbum,
          name: title,
          image: allImages[0]?.url ?? editAlbum.image,
          images: allImages,
        }
        navigate("/album", { state: { updatedAlbum } })
      } else {
        const newAlbum: Album = {
          id: Date.now() + Math.floor(Math.random() * 100000),
          name: title,
          image: allImages[0]?.url ?? "",
          images: allImages,
          author: "自分",
          icon: "https://placehold.jp/40x40.png",
          date: new Date().toLocaleDateString("ja-JP"),
        }
        navigate("/album", { state: { newAlbum } })
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const allPhotos = [...existingPhotos, ...newPhotos]

  return (
    <div className="album-edit-page">
      <AppHeader variant="simple" title={isEditMode ? "アルバムを編集" : "アルバム作成"} />

      <div className="album-title-input">
        <input
          type="text"
          placeholder="アルバムタイトル"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {errorMsg && <p style={{ color:"red", padding:"0 20px", fontSize:"14px" }}>{errorMsg}</p>}

      <div className="select-area">
        <label className="select-button">
          写真を追加
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        </label>
      </div>

      <div className="album-preview">
        {/* 既存写真 */}
        {existingPhotos.map((photo, i) => (
          <div key={`ex-${i}`} className="preview-wrapper">
            <img src={photo.url} className="preview-image" alt="" />
            <button className="preview-remove" onClick={() => removeExisting(i)}>✕</button>
          </div>
        ))}
        {/* 新規写真 */}
        {newPhotos.map((photo, i) => (
          <div key={`new-${i}`} className="preview-wrapper">
            <img src={photo.url} className="preview-image" alt="" />
            <button className="preview-remove" onClick={() => removeNew(i)}>✕</button>
            <span className="preview-new-badge">NEW</span>
          </div>
        ))}
      </div>

      <button
        className="create-album-button"
        onClick={save}
        disabled={!title.trim() || allPhotos.length === 0 || isLoading}
      >
        {isLoading ? "保存中..." : isEditMode ? "保存" : "作成"}
      </button>
    </div>
  )
}