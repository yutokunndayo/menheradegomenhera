import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
} from './types/index'

function App() {
  return (
    <>
      <Router>
        <main>
          <Routes>
            {/* タイトル画面（起動時に表示、2秒後に /auth へ自動遷移） */}
            <Route path='/' element={<TitlePage />} />

            {/* ログイン・新規登録 選択画面 */}
            <Route path='/auth' element={<AuthSelect />} />

            {/* ログイン画面 */}
            <Route path='/login' element={<Login />} />

            {/* 新規登録画面 */}
            <Route path='/register' element={<Register />} />

            {/* パスワード再設定（メール送信） */}
            <Route path='/forgot-password' element={<ForgotPassword />} />

            {/* OAuth コールバック → チャット画面へ */}
            <Route path='/authCallback' element={<AuthCallback />} />

            {/* チャット画面（ログイン後のメイン画面） */}
            <Route path='/chat' element={<Chat />} />

            {/* その他のログイン後の画面 */}
            <Route path='/home' element={<Home />} />
            <Route path='/account' element={<Account />} />
            <Route path='/example' element={<Example />} />
          </Routes>
        </main>
      </Router>
    </>
  )
}

export default App