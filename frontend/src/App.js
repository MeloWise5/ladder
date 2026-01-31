import {useEffect} from 'react'
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from 'react-bootstrap'
import Header from './components/Header'
import Footer from './components/Footer'

import HomeScreen from './screens/HomeScreen'
import LadderScreen from './screens/Ladder'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ProfileScreen from './screens/ProfileScreen'
import UserListScreen from './screens/UserListScreen'
import UserEditScreen from './screens/UserEditScreen'
import LadderListScreen from './screens/LadderListScreen'
import LadderEditScreen from './screens/LadderEditScreen'

function App() {

  return (
    <Router >
      <Header />
      <main className='py-3'>
        <Container>
          <Routes>
          <Route path="/" element={<HomeScreen />} exact />
          
          <Route path="/login" element={<LoginScreen/>} />
          <Route path="/register" element={<RegisterScreen/>} />
          <Route path="/profile" element={<ProfileScreen/>} />

          <Route path="/ladder/:id" element={<LadderScreen/>} />
          <Route path="/ladder/:id/edit" element={<LadderEditScreen/>} />

          <Route path="/admin/ladderList" element={<LadderListScreen/>} />
          <Route path="/admin/ladder/:id/edit" element={<LadderEditScreen/>} />
          <Route path="/admin/userList" element={<UserListScreen/>} />
          <Route path="/admin/user/:id/edit" element={<UserEditScreen/>} />
          
           {/*<Route path="/cart/:id?" element={<CartScreen/>} />

          <Route path="/shipping" element={<ShippingScreen/>} />
          <Route path="/payment" element={<PaymentScreen/>} />
          <Route path="/placeorder" element={<PlaceOrderScreen/>} />
          <Route path="/order/:id" element={<OrderScreen/>} />
          
          <Route path="/admin/productList" element={<ProductListScreen/>} />
          <Route path="/admin/product/:id/edit" element={<ProductEditScreen/>} />
          <Route path="/admin/orderList" element={<OrderListScreen/>} />
           */}
          
          </Routes>
        </Container>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
