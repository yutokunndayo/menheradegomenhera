import { useState } from "react"
import { useNavigate } from "react-router-dom"

import AppHeader from "../components/AppHeader"
import TabBar from "../components/TabBar"

import "../styles/AlbumNewCreate.css"

export default function AlbumNewCreate(){

  const navigate = useNavigate()

  const [images,setImages] = useState<File[]>([])

  const handleSelectImages = (e:React.ChangeEvent<HTMLInputElement>) => {

    const files = e.target.files

    if(!files) return

    const newFiles = Array.from(files)

    setImages(newFiles)

  }

  const goNext = () => {

    navigate("/album-edit",{
      state:{images}
    })

  }

  return(

    <div className="album-new-page">

      <AppHeader
        variant="simple"
        title="写真を選択"
      />

      {/* 写真選択 */}
      <div className="select-area">

        <label className="select-button">

          写真を選択

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelectImages}
          />

        </label>

      </div>


      {/* 選択された写真 */}
      <div className="photo-grid">

        {images.map((file,index)=>{

          const url = URL.createObjectURL(file)

          return(
            <img
              key={index}
              src={url}
              className="photo-item"
            />
          )

        })}

      </div>


      {/* 次へボタン */}
      {images.length > 0 && (

        <button
          className="next-button"
          onClick={goNext}
        >
          次へ
        </button>

      )}

      <TabBar/>

    </div>

  )

}