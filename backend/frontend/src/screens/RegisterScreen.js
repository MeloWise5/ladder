import React, {useState, useEffect} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Button, Row, Col } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { register } from '../actions/userActions'


function RegisterScreen() {
    //console.log('Register page loaded')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [messageError, setMessageError] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const userRegister = useSelector(state => state.userRegister)
    const {loading, error, userInfo} = userRegister

    useEffect(() => {
        if(userInfo && userInfo?._id){
            //console.log("redirect from register page")
            navigate('/')
        }
    }, [userInfo, navigate])

    const submitHandler = (e) => {
        e.preventDefault()
        //console.log("submit handler userInfo: " + error)
        if(password !== confirmPassword){
            setMessageError('Passwords do not match')
        }else{
            dispatch(register(name, email, password))
        }
    }
    
  return (
    <div>
    <FormContainer>
        <h1>Register</h1>
        {messageError && <Message variant='danger'>{messageError}</Message>}
        {error && <Message variant='danger'>{error}</Message>}
        {loading && <Loader />}
        <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
                <Form.Label>Name</Form.Label>
                <Form.Control required type='name' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='email'>
                <Form.Label>Email Address</Form.Label>
                <Form.Control required type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='password'>
                <Form.Label>Password</Form.Label>
                <Form.Control required type='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='passwordConfirm'>
                <Form.Label>Password Confirm</Form.Label>
                <Form.Control required type='password' placeholder='Confirm password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Button className='my-3' type='submit' variant='primary'>Register</Button>
        </Form>
        <Row className='py-3'>
            <Col>
                Have a <Link to={'/login'}>Login</Link>?
            </Col>
        </Row>
    </FormContainer></div>
  )
}

export default RegisterScreen
