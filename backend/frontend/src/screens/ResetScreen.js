import React, {useState, useEffect, useRef} from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Button, Row, Col } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { reset } from '../actions/userActions'

// Module-level flag to prevent navigation loop
let hasNavigated = false

// Expose reset function for logout
window.resetLoginScreenFlags = () => {
  hasNavigated = false
}

function ResetScreen() {
    const [resetSent, setResetSent] = useState(false)
    const [email, setEmail] = useState('')
    const dispatch = useDispatch()

    const { loading, resetData, success, error, message } = useSelector((state) => state.userReset)

    useEffect(() => {
        if (resetData || error) {
            setResetSent(false) // optional: stop local fallback message
        }
    }, [resetData, error])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(reset(email))
        setResetSent(true)
    }

  return (
    <>
     {
     loading ? (
      <Loader />
    ) : error ? (
      <Message variant='danger'>{error}</Message>
    ) : resetSent ? (
        <Message variant='success'>If an account with that email exists, a password reset link has been sent.</Message>
    ) : (
        <FormContainer>
            <h1>Reset Password</h1>
            <Form onSubmit={submitHandler}>
                <Form.Group controlId='email'>
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}></Form.Control>
                </Form.Group>
                <Button className='my-3' type='submit' variant='primary'>Reset Password</Button>
            </Form>
            <Row className='py-3'>
                <Col>
                    <Link to={'/login'}>Login</Link>
                </Col>
            </Row>
        </FormContainer>
    )}
  </>
    )
}

export default ResetScreen
