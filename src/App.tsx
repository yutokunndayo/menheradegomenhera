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
  Setup,
  CalendarPage,
  EventDetail,
} from './types/index'

function App() {
  return (
    <>
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

            {/* チャット画面（ログイン後のメイン画面） */}
            <Route path='/chat' element={<Chat />} />

            {/* カレンダー画面（タブバーでカレンダーを押した時のカレンダー画面） */}
            <Route path='/calendar' element={<CalendarPage />} />

            {/* 予定詳細、編集画面（タブバーでカレンダーを押した時のカレンダー画面） */}
            <Route path='/event' element={<EventDetail />} />

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