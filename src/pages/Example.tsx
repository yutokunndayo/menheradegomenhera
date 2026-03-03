import { Header } from '../types'


function Example() {
    // backToは遷移先のRoute, ない場合は一つ前に戻る
    // この場合は意味ないけど"/"RouteのHomePageに戻る
  return (
    <>
        <Header backTo="/" />
        <div>
            ☝コンポーネント呼び出し
            <br />
            戻るを押すと前のページに戻るだけ
        </div>
    </>
  );
}

export default Example;