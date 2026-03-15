import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { getCachedProfile } from "../lib/userCache"
import { FiEdit2, FiTrash2, FiPlus, FiX } from "react-icons/fi"
import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"
import "../styles/AlbumDetail.css"

type Photo = { id: string; url: string; order_num: number }
type Album = { id: string; title: string; cover_url: string | null; user_id: string; created_at: string }

export default function AlbumDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const albumId: string = location.state?.albumId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [album,         setAlbum]         = useState<Album | null>(null)
  const [photos,        setPhotos]        = useState<Photo[]>([])
  const [myId,          setMyId]          = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [isUploading,   setIsUploading]   = useState(false)
  const [editingTitle,  setEditingTitle]  = useState(false)
  const [newTitle,      setNewTitle]      = useState("")
  const [showModal,       setShowModal]       = useState(false) // アルバム削除確認モーダル
  const [showPhotoModal,  setShowPhotoModal]  = useState(false) // 写真削除確認モーダル
  const [deletePhotoId,   setDeletePhotoId]   = useState<string | null>(null)

  useEffect(() => {
    if (!albumId) { navigate("/album"); return }
    const fetch = async () => {
      const profile = await getCachedProfile()
      setMyId(profile?.id ?? null)

      const { data: albumData } = await supabase
        .from("albums").select("*").eq("id", albumId).single()
      if (!albumData) { navigate("/album"); return }
      setAlbum(albumData)
      setNewTitle(albumData.title)

      const { data: photoData } = await supabase
        .from("album_photos").select("id, url, order_num")
        .eq("album_id", albumId).order("order_num")
      setPhotos(photoData ?? [])
      setLoading(false)
    }
    fetch()
  }, [albumId])

  const isOwner = myId === album?.user_id

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !albumId) return
    setIsUploading(true)
    try {
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split(".").pop() || "jpg"
        const fileName = `${albumId}/${Date.now()}_${i}.${ext}`
        const { error } = await supabase.storage.from("images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false })
        if (error) throw error
        const { data } = supabase.storage.from("images").getPublicUrl(fileName)
        newUrls.push(data.publicUrl)
      }
      const base = photos.length
      const rows = newUrls.map((url, i) => ({ album_id: albumId, url, order_num: base + i }))
      const { data: inserted } = await supabase.from("album_photos").insert(rows).select("id, url, order_num")
      if (inserted) setPhotos(prev => [...prev, ...inserted])
      if (!album?.cover_url && newUrls[0]) {
        await supabase.from("albums").update({ cover_url: newUrls[0] }).eq("id", albumId)
        setAlbum(prev => prev ? { ...prev, cover_url: newUrls[0] } : prev)
      }
    } catch (err) { console.error(err) }
    finally { setIsUploading(false); e.target.value = "" }
  }

  const confirmDeletePhoto = (photoId: string) => {
    setDeletePhotoId(photoId)
    setShowPhotoModal(true)
  }

  const deletePhoto = async () => {
    if (!deletePhotoId) return
    await supabase.from("album_photos").delete().eq("id", deletePhotoId)
    setPhotos(prev => prev.filter(p => p.id !== deletePhotoId))
    setShowPhotoModal(false)
    setDeletePhotoId(null)
  }

  const saveTitle = async () => {
    if (!newTitle.trim() || !albumId) return
    await supabase.from("albums").update({ title: newTitle.trim() }).eq("id", albumId)
    setAlbum(prev => prev ? { ...prev, title: newTitle.trim() } : prev)
    setEditingTitle(false)
  }

  const deleteAlbum = async () => {
    await supabase.from("albums").delete().eq("id", albumId)
    navigate("/album")
  }

  if (loading) return null

  return (
    <div className="album-detail-page">
      <AppHeader variant="simple" title={editingTitle ? "" : (album?.title ?? "")} />

      {/* タイトル編集・アクション行 */}
      <div className="detail-header">
        <div className="detail-user">
          {editingTitle ? (
            <div className="detail-title-edit-row">
              <input
                className="detail-title-input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
              />
              <button className="detail-title-save" onClick={saveTitle}>保存</button>
              <button className="detail-title-cancel" onClick={() => setEditingTitle(false)}>
                <FiX size={16} />
              </button>
            </div>
          ) : (
            <h2 className="detail-title">{album?.title}</h2>
          )}

          {isOwner && !editingTitle && (
            <div className="detail-actions">
              <FiEdit2  className="detail-action-icon" onClick={() => setEditingTitle(true)} />
              <FiPlus   className="detail-action-icon" onClick={() => !isUploading && fileInputRef.current?.click()} />
              <FiTrash2 className="detail-action-icon detail-action-icon--danger" onClick={() => setShowModal(true)} />
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleAddPhotos} />
      </div>

      {isUploading && <p className="detail-uploading">アップロード中...</p>}

      {photos.length === 0 ? (
        <div className="detail-empty">
          <p className="detail-empty-emoji">📷</p>
          <p>写真がありません</p>
          {isOwner && (
            <button className="detail-add-first" onClick={() => fileInputRef.current?.click()}>
              写真を追加する
            </button>
          )}
        </div>
      ) : (
        <div className="detail-grid">
          {photos.map(photo => (
            <div key={photo.id} className="detail-photo-wrap">
              <img src={photo.url} className="detail-photo" alt="" />
              {isOwner && (
                <FiTrash2 className="detail-photo-delete" onClick={() => confirmDeletePhoto(photo.id)} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== 写真削除確認モーダル ===== */}
      {showPhotoModal && (
        <>
          <div className="album-modal-overlay" onClick={() => setShowPhotoModal(false)} />
          <div className="album-modal">
            <h2 className="album-modal-title">写真を削除</h2>
            <p className="album-modal-text">この写真を削除しますか？</p>
            <div className="album-modal-buttons">
              <button className="album-modal-cancel" onClick={() => setShowPhotoModal(false)}>
                キャンセル
              </button>
              <button className="album-modal-ok" onClick={deletePhoto}>
                削除
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== アルバム削除確認モーダル ===== */}
      {showModal && (
        <>
          <div className="album-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="album-modal">
            <h2 className="album-modal-title">アルバムを削除</h2>
            <p className="album-modal-text">このアルバムを削除しますか？<br />写真もすべて削除されます。</p>
            <div className="album-modal-buttons">
              <button className="album-modal-cancel" onClick={() => setShowModal(false)}>
                キャンセル
              </button>
              <button className="album-modal-ok" onClick={deleteAlbum}>
                削除
              </button>
            </div>
          </div>
        </>
      )}

      <TabBar />
    </div>
  )
}