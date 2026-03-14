import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FiEdit2, FiTrash2 } from "react-icons/fi"
import { FaHeart } from "react-icons/fa"

import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"

import "../styles/AlbumPage.css"

type Album = {
  id:number
  name:string
  image:string
  author:string
  icon:string
  date:string
}

export default function AlbumPage(){

  const navigate = useNavigate()
  const location = useLocation()

  const [albums,setAlbums] = useState<Album[]>([
    {
      id:1,
      name:"初詣",
      image:"https://placehold.jp/600x400.png",
      author:"彼女ちゃん",
      icon:"https://placehold.jp/40x40.png",
      date:"2026年1月1日"
    }
  ])


  // ===== AlbumEditから戻ってきたアルバムを追加 =====
  useEffect(()=>{

    if(location.state?.newAlbum){

      setAlbums((prev)=>[location.state.newAlbum,...prev])

    }

  },[location.state])


  const goCreate = ()=>{

    navigate("/album-new-create")

  }


  const deleteAlbum = (id:number)=>{

    const newList = albums.filter(a=>a.id!==id)

    setAlbums(newList)

  }


  return(

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

        <FaHeart className="heart-icon"/>
        <span className="plus-icon">+</span>

      </button>


      {/* アルバム一覧 */}
      <div className="album-list">

        {albums.map((album)=>(

          <div key={album.id} className="album-item">

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

                <FiEdit2 className="album-icon-btn"/>

                <FiTrash2
                  className="album-icon-btn"
                  onClick={()=>deleteAlbum(album.id)}
                />

              </div>

            </div>

          </div>

        ))}

      </div>

      <TabBar/>

    </div>

  )

}