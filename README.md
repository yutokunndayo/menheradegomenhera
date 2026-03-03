react vite ts
# for develop
## How To
1. pagesにファイルを追加

参考例:  
> pages/Example.tsx  
> 
> pages/HomePage.tsx  
  
ファイル内return文内にできるのは1つの要素のみなので、無名タグ`<></>`で囲ってその中にjsx記入
`function Example()`と`export default Example;`がないと困る  

2. types/index.tsxに記入  
作った関数名をここに登録->App.tsxでRoute登録しておくことでどこでもこのページ呼び出しが可能->ページ遷移が楽に
```ts
export { default as Example } from '../pages/example'
```
ここの`default as Example`は必ず頭文字大文字で登録しよう->じゃないとコンパイルエラー  

3. App.tsxにimport&Route登録  
```ts
<Route path='/example' element={<Example />} />
```
このpathはRoutePathと、実際のurlになるので、小文字+アンダーバーで記入推奨  

> 補足  
> Routeを使用したい場合はnavigateで関数を作るのが多分楽でしょう
```tsx
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
const clickEvent = () => {
  navigate('/path');
};
<button toClick = {clickEvent} />
```


4. コンポーネントを使用数場合  
参考例:  
> components/Header.tsx  
> 
> pages/Example.tsx  

- 1. componentsにフォルダ作成
- 2. indexにて宣言
- 3. importから呼び出し->そのままタグを書くのみ
- 4. propsをつければ引数を設定可能、詳しくはコメント  

5. tailwindcssについて  
参考例:  
> components/Header.tsx  

タグの中にcssを記入可能  
アニメーション以外はこれで実装可能だが、cssの文言が違うため使用する場合はtailwindcssチートシートを検索して参照  
略語が多いのが特徴  

6. 相対パスの指定の仕方  
参考例:  
> pages/Example.tsx  

コメント通りでreactは相対パスを許さないのでimportしてから書いてください  

## 今後に向けて  
0. 起動構成の作り方  
```bash
// まだクローンしたことないなら
git clone https://github.com/yutokunndayo/menheradegomenhera.git
cd クローンしたファイル名
// すでにしてる(remoteがここになっている)なら
git pull
npm install
npm run dev
```  

1. supabase  
現在未連携なので関連フォルダなし  
連携後supabase.jsのライブラリを追加、supabaseの環境変数を.envに書いてgitignoreに追加
2. コーディング規約  
適当に決めてください  
僕はファイル名大文字,Route小文字とアンダーバー, 関数名キャメルケースで見たら何がしたいかわかる英文  
でやってます  