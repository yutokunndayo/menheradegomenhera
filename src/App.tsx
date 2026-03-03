import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home, Example } from './types/index'

function App() {
  return (
    <>
      <Router>
        <main>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/example' element={<Example />} />
          </Routes>
        </main>

      </Router>
    </>
  )
}
export default App