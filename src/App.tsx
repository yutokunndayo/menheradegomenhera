import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ↓ GeminiDemo を直接読み込む場合はこちらを残します
import GeminiDemo from './pages/test';
import PartnerGuard from './components/PartnerGuard'
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
  AlbumPage,
  Test, // types/index から読み込む test
  InvitePage,
  JoinPage,
  DiaryPage,
  AlbumNewCreate,
  AlbumEdit,
  AlbumDetail,
  DiaryCalendar,
  DiaryDetail,
  DeleteAccountModal,
} from './types/index';

function App() {
  return (
    // GeminiProvider でアプリ全体を囲みます

    <Router>




      <main>
        <PartnerGuard>

          <Routes>
            <Route path='/' element={<TitlePage />} />
            <Route path='/auth' element={<AuthSelect />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/setup' element={<Setup />} />
            <Route path='/invite' element={<InvitePage />} />
            <Route path='/join' element={<JoinPage />} />
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

            <Route path='/diary' element={<DiaryPage />} />
            <Route path='/diary-calendar' element={<DiaryCalendar />} />
            <Route path='/diary-detail' element={<DiaryDetail />} />


            {/* テスト画面群（お好みでどちらかにアクセスしてください） */}
            <Route path='/test' element={<Test />} />
            <Route path='/demo' element={<GeminiDemo />} />
            {/* 共有アルバム画面 */}
            <Route path='/album' element={<AlbumPage />} />

            {/* ログアウトモーダル画面 */}
            <Route path='/logout' element={<LogoutModalPage />} />

            {/* アカウント削除モーダル */}
            <Route path='/delete-account' element={<DeleteAccountModal />} />

            {/* アルバムの新規作成画面 */}
            <Route path="/album-new-create" element={<AlbumNewCreate />} />.

            <Route path="/album-edit" element={<AlbumEdit />} />

            {/* アルバム詳細画面 */}
            <Route path='/album-detail' element={<AlbumDetail />} />

          </Routes>




        </PartnerGuard>
      </main>
    </Router>

  );
}

export default App;