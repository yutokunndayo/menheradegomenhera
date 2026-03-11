// import { useNavigate } from 'react-router-dom';


// export default function HomePage() {
//     const navigate = useNavigate();
//     const ClickHandler = () => {
//         navigate('/example');
//     }
//     // tailwindcssは適当につけてるから参考にしないで
//     return (

//         <div className="bg-red-500 text-white p-6 rounded-lg" onClick={ClickHandler}>
//             ここをクリックしてExampleページに移動
//         </div>
//     )
// }

import { useState } from "react"
import { useNavigate } from "react-router-dom"

import header from "../assets/header.png"
import decor from "../assets/decor.png"

export default function HomePage() {

  const navigate = useNavigate()

  const [icon, setIcon] = useState<string | null>(null)

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIcon(URL.createObjectURL(file))
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-center">

      {/* ヘッダー */}
      <div className="relative">
        <img src={header} className="w-full"/>
        <h1 className="absolute top-4 left-4 text-white text-xl font-bold">
          ホーム
        </h1>
      </div>

      {/* 装飾 */}
      <img src={decor} className="w-full -mt-2"/>

      {/* プロフィール */}
      <div className="-mt-16 flex flex-col items-center">

        <label className="cursor-pointer">
          <input type="file" hidden onChange={handleIconChange}/>

          <img
            src={icon ?? "https://placehold.jp/150x150.png"}
            className="w-28 h-28 rounded-full border-4 border-pink-500 object-cover"
          />
        </label>

        <h2 className="mt-3 text-xl border-b-2 border-gray-300 px-3 pb-1">
          彼女ちゃん
        </h2>

      </div>

      {/* メニュー */}
      <div className="flex justify-center gap-6 mt-10">

        <button
          onClick={() => navigate("/account")}
          className="w-24 h-24 bg-pink-100 rounded-2xl flex items-center justify-center"
        >
          登録情報
        </button>

        <button
          onClick={() => navigate("/login")}
          className="w-24 h-24 bg-pink-100 rounded-2xl flex items-center justify-center"
        >
          ログアウト
        </button>

        <button
          className="w-24 h-24 bg-pink-100 rounded-2xl flex items-center justify-center text-red-500"
        >
          アカウント削除
        </button>

      </div>

    </div>
  )
}