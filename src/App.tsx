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
            <Route path='/chat' element={<Chat />} />
            <Route path='/calendar' element={<CalendarPage />} />
            <Route path='/event-list' element={<EventList />} />
            <Route path='/event' element={<EventDetail />} />
            <Route path='/home' element={<Home />} />
            <Route path='/account' element={<Account />} />
            <Route path='/example' element={<Example />} />
          </Routes>
        </main>
      </Router>
    </>
  )
}

export default App;