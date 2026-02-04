import React, {useState, useEffect} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Button, Row, Col } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { getUserDetails, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'

function UserEditScreen() {
    const params = useParams()
    const {id} = params
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const [messageError, setMessageError] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const userDetails = useSelector(state => state.userDetails)
    const {loading, error, user} = userDetails
    const userUpdate = useSelector(state => state.userUpdate)
    const {loading:loadingUpdate, error:errorUpdate, success} = userUpdate

    useEffect(() => {
        if(success){
            dispatch({type:USER_UPDATE_RESET})
            navigate('/admin/userlist/')
        }else{
            if (!user.name || user._id !== Number(params.id)) {
                dispatch(getUserDetails(params.id))
            } else {
                setName(user.name)
                setEmail(user.email)
                setIsAdmin(user.isAdmin)
            }
        }
        
    }, [user, params.id, dispatch, success, navigate])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(updateUser({
            _id:user._id,
            name,
            email,
            isAdmin}))
    }

  return (
    <div>
        {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : ''}
    <Link to='/admin/userlist' className='btn btn-light my-3'>Go Back</Link>
    <FormContainer>
        <h1>Edit User</h1>
        <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
                <Form.Label>Name</Form.Label>
                <Form.Control type='name' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='email'>
                <Form.Label>Email Address</Form.Label>
                <Form.Control type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='isadmin'>
                <Form.Check type='checkbox' label='Is Admin' checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)}></Form.Check>
            </Form.Group>
            <Button className='my-3' type='submit' variant='primary'>Update User</Button>
        </Form>
    </FormContainer>
    </div>
  )
}

export default UserEditScreen
