import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home, Example ,AuthCallback,Account,Login } from './types/index'


function App() {
  return (
    <>
      <Router>
        <main>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/example' element={<Example />} />
             <Route path='/authCallback' element={<AuthCallback />} />
             <Route path='/account' element={<Account />} />
               <Route path='/login' element={<Login />} />
            
          </Routes>
        </main>

      </Router>
    </>
  )
}
export default App