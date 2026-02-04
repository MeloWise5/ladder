import React, {useState, useEffect, useRef} from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Button, Row, Col } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { login } from '../actions/userActions'

// Module-level flag to prevent navigation loop
let hasNavigated = false

// Expose reset function for logout
window.resetLoginScreenFlags = () => {
  hasNavigated = false
}

function LoginScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const userLogin = useSelector(state => state.userLogin)
    const {loading, error, userInfo} = userLogin

    useEffect(() => {
        // Only navigate once when userInfo becomes available and we're on login page
        if(userInfo && location.pathname === '/login' && !hasNavigated){
            hasNavigated = true
            navigate('/', { replace: true })
        }
    }, [userInfo, navigate, location])
    
    // Reset the flag when component unmounts or userInfo is cleared
    useEffect(() => {
        if (!userInfo) {
            hasNavigated = false
        }
    }, [userInfo])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(login(email, password))
    }

  return (
    <FormContainer>
        <h1>Sign In</h1>
        {error && <Message variant='danger'>{error}</Message>}
        {loading && <Loader />}
        <Form onSubmit={submitHandler}>
            <Form.Group controlId='email'>
                <Form.Label>Email Address</Form.Label>
                <Form.Control type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='password'>
                <Form.Label>Password</Form.Label>
                <Form.Control type='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Button className='my-3' type='submit' variant='primary'>Sign In</Button>
        </Form>
        <Row className='py-3'>
            <Col>
                New Customer? <Link to={'/register'}>Register</Link>
            </Col>
        </Row>
    </FormContainer>
  )
}

export default LoginScreen
