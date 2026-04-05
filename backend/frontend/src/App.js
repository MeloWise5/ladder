import {useEffect} from 'react'
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Header from './components/Header'
import Footer from './components/Footer'
import './theme.css'

import HomeScreen from './screens/HomeScreen'
import LadderScreen from './screens/Ladder'
import LoginScreen from './screens/LoginScreen'
import ResetScreen from './screens/ResetScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import RegisterScreen from './screens/RegisterScreen'
import ProfileScreen from './screens/ProfileScreen'
import UserListScreen from './screens/UserListScreen'
import UserEditScreen from './screens/UserEditScreen'
import LadderListScreen from './screens/LadderListScreen'
import LadderEditScreen from './screens/LadderEditScreen'

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} exact />

            <Route path="/login" element={<LoginScreen/>} />
            <Route path="/reset" element={<ResetScreen/>} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordScreen />} />
            <Route path="/register" element={<RegisterScreen/>} />
            <Route path="/profile" element={<ProfileScreen/>} />

            <Route path="/ladder/:id" element={<LadderScreen/>} />
            <Route path="/ladder/:id/edit" element={<LadderEditScreen/>} />

            <Route path="/admin/ladderList" element={<LadderListScreen/>} />
            <Route path="/admin/ladder/:id/edit" element={<LadderEditScreen/>} />
            <Route path="/admin/userList" element={<UserListScreen/>} />
            <Route path="/admin/user/:id/edit" element={<UserEditScreen/>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
