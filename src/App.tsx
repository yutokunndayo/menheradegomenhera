import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import  GeminiProvider  from './components/api';
// ↓ GeminiDemo を直接読み込む場合はこちらを残します
import GeminiDemo from './pages/test'; 

import {
  Home,
  Example,
  AuthCallback,
  Account,
  Login,
  Register,
  AuthSelect,
  TitlePage,
  ForgotPassword,
  Chat,
  Setup,
  LogoutModalPage,
  SignupCallback,
  Test, // types/index から読み込む test
  DeleteAccountModal,
} from './types/index'

function App() {
  return (
    // GeminiProvider でアプリ全体を囲みます
    <GeminiProvider>
      <Router>
        <main>
          <Routes>
            {/* タイトル画面（起動時、2秒後に /auth へ自動遷移） */}
            <Route path='/' element={<TitlePage />} />

            {/* ログイン・新規登録 選択画面 */}
            <Route path='/auth' element={<AuthSelect />} />

            {/* ログイン画面 */}
            <Route path='/login' element={<Login />} />

            {/* 新規登録画面 → 完了後 /setup へ */}
            <Route path='/register' element={<Register />} />

            {/* パートナー性別選択画面（新規登録後のみ） */}
            <Route path='/setup' element={<Setup />} />

            {/* パスワード再設定（メール送信） */}
            <Route path='/forgot-password' element={<ForgotPassword />} />

            {/* OAuth コールバック → チャット画面へ */}
            <Route path='/authCallback' element={<AuthCallback />} />
            
            {/* OAuth コールバック → チャット画面へ */}
            <Route path='/signup-callback' element={<SignupCallback />} />

            {/* チャット画面（ログイン後のメイン画面） */}
            <Route path='/chat' element={<Chat />} />

            {/* その他のログイン後の画面 */}
            <Route path='/home' element={<Home />} />
            <Route path='/account' element={<Account />} />
            <Route path='/example' element={<Example />} />

            {/* ログアウトモーダル画面 */}
            <Route path='/logout' element={<LogoutModalPage />} />

            {/* テスト画面群（お好みでどちらかにアクセスしてください） */}
            <Route path='/test' element={<Test />} />
            <Route path='/demo' element={<GeminiDemo />} />

            {/* アカウント削除モーダル画面 */}
            <Route path='/delete-account' element={<DeleteAccountModal />} />
          </Routes>
        </main>
      </Router>
    </GeminiProvider>
  );
}

export default App;