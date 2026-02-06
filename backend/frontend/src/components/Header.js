import React , {useEffect}from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import {LinkContainer} from 'react-router-bootstrap'
import {Button, Container, Form, Nav, Navbar, NavDropdown} from 'react-bootstrap';
import { logout } from '../actions/userActions';
import { createLadder, listUsersLadders } from '../actions/ladderActions';
import { LADDER_CREATE_RESET } from '../constants/ladderConstants';
function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userLogin = useSelector(state => state.userLogin);
  const {userInfo} = userLogin;
  
  const ladderCreate = useSelector(state => state.ladderCreate)
  const { 
    loading: createLoading, 
    error: createError, 
    success: createSuccess, 
    ladder: createdLadder } = ladderCreate;
  useEffect(() => {
    if(createSuccess && createdLadder?._id){
        //console.log('Ladder created successfully!',createdLadder._id)
        dispatch({type:LADDER_CREATE_RESET})
        const from = `/ladder/${createdLadder._id}/edit`;
        navigate(from);
    } 
  },[dispatch, navigate, createSuccess, createdLadder?._id])


  const logoutHandler = () => {
    dispatch(logout());
  }
  const createLadderHandler = () => {
    dispatch(createLadder())
  }
  return (
    <header>
    <Navbar expand="lg" variant='dark' bg="dark" className="bg-body-tertiary" collapseOnSelect>
      <Container fluid>
        <LinkContainer to="/">
          <Navbar.Brand >LADDER</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: '100px' }}
            navbarScroll
          > 
          {userInfo ? (
            <NavDropdown title={`${userInfo.name}`} id="navbarScrollingDropdown">
              <LinkContainer to="/"><NavDropdown.Item>View All</NavDropdown.Item></LinkContainer>
              
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={createLadderHandler}>Create Ladder +</NavDropdown.Item>
              <NavDropdown.Divider />
              <LinkContainer to="/profile"><NavDropdown.Item>Account</NavDropdown.Item></LinkContainer>
              <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
            </NavDropdown>
            ) : (
            <>
            <LinkContainer to="/login"><Nav.Link><i className="fa-solid fa-user"></i> Login</Nav.Link></LinkContainer>
            </>
          )}
          {userInfo && userInfo.isAdmin  && (
            <NavDropdown title={`Admin`} id="navbarScrollingDropdown">
              <LinkContainer to="/admin/userList"><NavDropdown.Item>View Users</NavDropdown.Item></LinkContainer>
              <LinkContainer to="/admin/ladderList"><NavDropdown.Item>View Ladders</NavDropdown.Item></LinkContainer>
            </NavDropdown>)}
          </Nav>
          {/* <Form className="d-flex">
            <Form.Control
              type="search"
              placeholder="Search"
              className="me-2"
              aria-label="Search"
            />
            <Button variant="outline-success">Search</Button>
          </Form> */}
        </Navbar.Collapse>
      </Container>
    </Navbar>
    </header>
  );
}

export default Header
