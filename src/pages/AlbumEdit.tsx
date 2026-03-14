import { useState } from "react"
import { useLocation,useNavigate } from "react-router-dom"

import AppHeader from "../components/AppHeader"

import "../styles/AlbumEdit.css"

export default function AlbumEdit(){

  const navigate = useNavigate()
  const location = useLocation()

  const images = location.state?.images || []

  const [title,setTitle] = useState("")


  const createAlbum = ()=>{

    const newAlbum = {

      id:Date.now(),

      name:title,

      image:images[0]?.url,

      author:"彼女ちゃん",

      icon:"https://placehold.jp/40x40.png",

      date:new Date().toLocaleDateString("ja-JP")

    }

    navigate("/album",{
      state:{newAlbum}
    })

  }


  return(

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
          onChange={(e)=>setTitle(e.target.value)}
        />

      </div>


      {/* 写真プレビュー */}
      <div className="album-preview">

        {images.map((img:any,index:number)=>(

          <img
            key={index}
            src={img.url}
            className="preview-image"
          />

        ))}

      </div>


      <button
        className="create-album-button"
        onClick={createAlbum}
      >

        作成

      </button>

    </div>

  )

}