import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import {LinkContainer} from 'react-router-bootstrap'
import {Container, Nav, Navbar, NavDropdown} from 'react-bootstrap';
import { logout } from '../actions/userActions';
import { createLadder, listUsersLadders } from '../actions/ladderActions';
import { LADDER_CREATE_RESET } from '../constants/ladderConstants';
import { useEffect } from 'react';
import AdminIcon from './icons/AdminIcon';
import DashboardIcon from './icons/DashboardIcon';
import UserIcon from './icons/UserIcon';
function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userLogin = useSelector(state => state.userLogin);
  const {userInfo} = userLogin;

  const ladderCreate = useSelector(state => state.ladderCreate)
  const { success: createSuccess, ladder: createdLadder } = ladderCreate;
  useEffect(() => {
    if(createSuccess && createdLadder?._id){
      dispatch(listUsersLadders())
      dispatch({type: LADDER_CREATE_RESET})
      navigate(`/ladder/${createdLadder._id}/edit`);
    }
  }, [dispatch, navigate, createSuccess, createdLadder?._id])

  const logoutHandler = () => { dispatch(logout()); }
  const createLadderHandler = () => { dispatch(createLadder()) }
  return (
    <header>
      <Navbar className="dash-navbar">
        <Container fluid className="px-3">
          <LinkContainer to="/">
            <Navbar.Brand className="dash-brand">LADDER</Navbar.Brand>
          </LinkContainer>
          <Nav className="ms-auto">
              {userInfo ? (
                <>
                  <LinkContainer to="/">
                    <Nav.Link title="Dashboard"><DashboardIcon size={29} color="currentColor" /></Nav.Link>
                  </LinkContainer>
                  <NavDropdown title={<UserIcon size={29} color="currentColor" />} id="navbarScrollingDropdown" align="end">
                    <NavDropdown.Item disabled style={{opacity:1, fontWeight:600, color:'var(--color-yellow)'}}>Hello, {userInfo.name}</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <LinkContainer to="/"><NavDropdown.Item>Dashboard</NavDropdown.Item></LinkContainer>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={createLadderHandler}>Create Ladder +</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <LinkContainer to="/profile"><NavDropdown.Item>Account</NavDropdown.Item></LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                  </NavDropdown>
                  {userInfo.isAdmin && (
                    <NavDropdown title={<AdminIcon size={29} color="currentColor" />} id="adminDropdown" align="end">
                      <LinkContainer to="/admin/userList"><NavDropdown.Item>View Users</NavDropdown.Item></LinkContainer>
                      <LinkContainer to="/admin/ladderList"><NavDropdown.Item>View Ladders</NavDropdown.Item></LinkContainer>
                    </NavDropdown>
                  )}
                </>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link><i className="fa-solid fa-user"></i> Login</Nav.Link>
                </LinkContainer>
              )}
            </Nav>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header
