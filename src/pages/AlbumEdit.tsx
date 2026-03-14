import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import AppHeader from "../components/AppHeader"

// ★ supabase クライアントのパスはプロジェクトに合わせて変更してください
// 例: "../lib/supabase" や "../supabaseClient" など
import { supabase } from "../lib/supabase"

import "../styles/AlbumEdit.css"

type Photo = {
  url: string   // プレビュー用 blob URL
  file: File    // Supabase アップロード用
}

export default function AlbumEdit() {

  const navigate = useNavigate()
  const location = useLocation()

  const images: Photo[] = location.state?.images || []

  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")


  const createAlbum = async () => {

    if (title.trim() === "") return
    if (images.length === 0) return

    setIsLoading(true)
    setErrorMsg("")

    try {

      // ===== 1. 各画像を Supabase ストレージ "images" にアップロード =====
      const uploadedUrls: string[] = []

      for (const photo of images) {

        // ファイル名：拡張子だけ取り出し、日本語・スペースを除去して安全な名前にする
        const ext = photo.file.name.split(".").pop() || "png"
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, photo.file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`アップロード失敗: ${uploadError.message}`)
        }

        // ===== 2. 公開 URL を取得 =====
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(fileName)

        uploadedUrls.push(urlData.publicUrl)

      }

      // ===== 3. アルバムオブジェクトを作成して AlbumPage へ渡す =====
      const newAlbum = {
        id: Date.now() + Math.floor(Math.random() * 100000),
        name: title,
        image: uploadedUrls[0],                               // サムネイル（1枚目）
        images: uploadedUrls.map((url) => ({ url })),         // 全写真
        author: "彼女ちゃん",
        icon: "https://placehold.jp/40x40.png",
        date: new Date().toLocaleDateString("ja-JP"),
      }

      navigate("/album", {
        state: { newAlbum },
      })

    } catch (err: any) {

      console.error(err)
      setErrorMsg(err.message || "エラーが発生しました")

    } finally {

      setIsLoading(false)

    }

  }


  return (

    <div className="album-edit-page">

      <AppHeader
        variant="simple"
        title="アルバム作成"
      />

      {/* タイトル入力 */}
      <div className="album-title-input">
        <input
          type="text"
          placeholder="アルバムタイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* エラー表示 */}
      {errorMsg && (
        <p style={{ color: "red", padding: "0 20px", fontSize: "14px" }}>
          {errorMsg}
        </p>
      )}

      {/* 写真プレビュー */}
      <div className="album-preview">
        {images.map((img, index) => (
          <img
            key={index}
            src={img.url}
            className="preview-image"
          />
        ))}
      </div>

      {/* 作成ボタン */}
      <button
        className="create-album-button"
        onClick={createAlbum}
        disabled={title.trim() === "" || isLoading}
      >
        {isLoading ? "アップロード中..." : "作成"}
      </button>

    </div>

  )

}