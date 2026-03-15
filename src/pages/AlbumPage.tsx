import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { FaHeart } from "react-icons/fa"
import { FiEdit2, FiTrash2, FiUser } from "react-icons/fi"
import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"
import "../styles/AlbumPage.css"

type Album = {
  id: string
  title: string
  cover_url: string | null
  created_at: string
  user_id: string
  author_name?: string
  author_icon?: string | null
}

export default function AlbumPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)
  const [showModal,    setShowModal]    = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchAlbums = async () => {
    setLoading(true)

    // ログインユーザー取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setMyId(user.id)

    // 自分のプロフィールをSupabaseから直接取得（avatar含む）
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("name, avatar, partner")
      .eq("id", user.id)
      .maybeSingle()

    const myName:   string      = myProfile?.name   ?? "自分"
    const myAvatar: string|null = myProfile?.avatar ?? null

    // パートナーのプロフィールを取得
    let partnerName:   string      = "パートナー"
    let partnerAvatar: string|null = null

    if (myProfile?.partner) {
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("name, avatar")
        .eq("id", myProfile.partner)
        .maybeSingle()

      if (partnerProfile) {
        partnerName   = partnerProfile.name   ?? "パートナー"
        partnerAvatar = partnerProfile.avatar ?? null
      }
    }

    // アルバム一覧取得
    const { data, error } = await supabase
      .from("albums")
      .select("id, user_id, title, cover_url, created_at")
      .order("created_at", { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    const enriched = (data ?? []).map(a => ({
      ...a,
      author_name:  a.user_id === user.id ? myName   : partnerName,
      author_icon:  a.user_id === user.id ? myAvatar : partnerAvatar,
    }))

    setAlbums(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchAlbums() }, [location.key])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
  }

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteTarget(id)
    setShowModal(true)
  }

  const deleteAlbum = async () => {
    if (!deleteTarget) return
    await supabase.from("albums").delete().eq("id", deleteTarget)
    setAlbums(prev => prev.filter(a => a.id !== deleteTarget))
    setShowModal(false)
    setDeleteTarget(null)
  }

  const editAlbum = (e: React.MouseEvent, album: Album) => {
    e.stopPropagation()
    navigate("/album-detail", { state: { albumId: album.id } })
  }

  return (
    <div className="album-page">
      <AppHeader variant="simple" title="" />

      <button className="album-create-btn" onClick={() => navigate("/album-new-create")}>
        <FaHeart className="heart-icon" />
        <span className="plus-icon">+</span>
      </button>

      <div className="album-list">
        {loading ? (
          <p className="album-empty">読み込み中...</p>
        ) : albums.length === 0 ? (
          <div className="album-empty-state">
            <p className="album-empty-emoji">📷</p>
            <p className="album-empty-text">まだアルバムがありません</p>
            <p className="album-empty-sub">ハートボタンから思い出を追加しよう</p>
          </div>
        ) : (
          albums.map(album => (
            <div
              key={album.id}
              className="album-item"
              onClick={() => navigate("/album-detail", { state: { albumId: album.id } })}
            >
              {/* 投稿者行 */}
              <div className="album-user">
                <div className="album-user-left">
                  {album.author_icon ? (
                    <img
                      src={album.author_icon}
                      alt={album.author_name}
                      className="album-user-icon-img"
                    />
                  ) : (
                    <div className="album-user-icon-placeholder">
                      <FiUser size={14} color="white" />
                    </div>
                  )}
                  <span className="album-user-name">{album.author_name}</span>
                </div>
                <span className="album-date">{formatDate(album.created_at)}</span>
              </div>

              {/* メイン画像 */}
              {album.cover_url ? (
                <img src={album.cover_url} className="album-image" alt={album.title} />
              ) : (
                <div className="album-image-placeholder">📷</div>
              )}

              {/* タイトル＋アクション */}
              <div className="album-bottom">
                <span className="album-title">{album.title}</span>
                {album.user_id === myId && (
                  <div className="album-actions">
                    <FiEdit2 className="album-icon-btn" onClick={e => editAlbum(e, album)} />
                    <FiTrash2 className="album-icon-btn" onClick={e => confirmDelete(e, album.id)} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 削除確認モーダル */}
      {showModal && (
        <>
          <div className="album-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="album-modal">
            <h2 className="album-modal-title">アルバムを削除</h2>
            <p className="album-modal-text">このアルバムを削除しますか？<br />写真もすべて削除されます。</p>
            <div className="album-modal-buttons">
              <button className="album-modal-cancel" onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="album-modal-ok" onClick={deleteAlbum}>削除</button>
            </div>
          </div>
        </>
      )}

      <TabBar />
    </div>
  )
}