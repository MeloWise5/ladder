import React, {useState, useEffect} from 'react'
import { Link, useNavigate,useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Button, Row, Col } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { resetPassword } from '../actions/userActions'


function ResetPasswordScreen() {
    //console.log('Register page loaded')
    const { uidb64, token } = useParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [messageError, setMessageError] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { loading, userResetPassword, error } = useSelector((state) => state.userResetPassword)

    useEffect(() => {
        if (error) {
            return
        }
        if (userResetPassword && userResetPassword.detail) {
            navigate('/')
        }
    }, [userResetPassword, error, navigate])

    const submitHandler = (e) => {
        e.preventDefault()
        setMessageError('')
        //console.log("submit handler userInfo: " + error)
        if(password !== confirmPassword){
            setMessageError('Passwords do not match')
        }else{
            dispatch(resetPassword(uidb64, token, password))
        }
    }
    
  return (
    <div>
    <FormContainer>
        <h1>Reset Password</h1>
        {messageError && <Message variant='danger'>{messageError}</Message>}
        {error && <Message variant='danger'>{error}</Message>}
        {loading && <Loader />}
        <Form onSubmit={submitHandler}>
            <Form.Group controlId='password'>
                <Form.Label>Password</Form.Label>
                <Form.Control required type='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='passwordConfirm'>
                <Form.Label>Password Confirm</Form.Label>
                <Form.Control required type='password' placeholder='Confirm password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Button className='my-3' type='submit' variant='primary'>Reset Password</Button>
        </Form>
    </FormContainer></div>
  )
}

export default ResetPasswordScreen
