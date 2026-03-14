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
  EventList,
  LogoutModalPage,
  SignupCallback,
  DeleteAccountModal,
} from './types/index'

function App() {
  return (
    <>
      <Router>
        <main>
          <Routes>
            <Route path='/' element={<TitlePage />} />
            <Route path='/auth' element={<AuthSelect />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/setup' element={<Setup />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/authCallback' element={<AuthCallback />} />
            
            {/* OAuth コールバック → チャット画面へ */}
            <Route path='/signup-callback' element={<SignupCallback />} />

            {/* チャット画面（ログイン後のメイン画面） */}
            <Route path='/chat' element={<Chat />} />
            <Route path='/calendar' element={<CalendarPage />} />
            <Route path='/event-list' element={<EventList />} />
            <Route path='/event' element={<EventDetail />} />
            <Route path='/home' element={<Home />} />
            <Route path='/account' element={<Account />} />
            <Route path='/example' element={<Example />} />

            {/* ログアウトモーダル画面 */}
            <Route path='/logout' element={<LogoutModalPage />} />

            {/* アカウント削除モーダル画面 */}
            <Route path='/delete-account' element={<DeleteAccountModal />} />
          </Routes>
        </main>
      </Router>
    </>
  )
}

export default App;