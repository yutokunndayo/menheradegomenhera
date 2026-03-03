import { Header } from '../types'
import reactImg from '../assets/react.svg'

function Example() {
    // backToは遷移先のRoute, ない場合は一つ前に戻る
    // この場合は意味ないけど"/"RouteのHomePageに戻る


    
    ////////////////////////////////////////////////////////
    // reactはimgタグsrc要素みたいな相対パスリンクの         //
    // コーディングを嫌うので、ここみたいにimportしてください //
    ////////////////////////////////////////////////////////
  return (
    <>
        <Header backTo="/" />
        <div>
            ☝コンポーネント呼び出し
            <br />
            戻るを押すと前のページに戻るだけ
        </div>
        <img src={reactImg} alt="example" />
    </>
  );
}

export default Example;