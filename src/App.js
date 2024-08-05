import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import Chats from './components/Chats';
import Otp from './components/Otp';
import Dashboard from './components/Dashboard';
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth" element={<LoginSignup />} />
          <Route path='/auth/verify-otp' element={<Otp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path='/dashboard/agent-chats' element={<Chats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
