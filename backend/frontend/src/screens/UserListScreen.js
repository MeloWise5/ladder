import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Table, Button, Form } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { listUsers, deleteUser, updateUserProfilePaid } from '../actions/userActions'

function UserListScreen() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [message, setMessage] = useState(null)
    const [is_paid, setIsPaid] = useState(null)
    const userList = useSelector(state => state.userList)
    const { loading, error, users } = userList
    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin
    const userDelete = useSelector(state => state.userDelete)
    const { success } = userDelete
    const userUpdateProfilePaid = useSelector(state => state.userUpdateProfilePaid)
    const { success: successUpdateProfilePaid } = userUpdateProfilePaid

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listUsers())
        } else {
            navigate('/login')
        }
    }, [dispatch,success, successUpdateProfilePaid, navigate, userInfo])

    useEffect(() => {
        if (users && users.length > 0) {
            // Create object mapping user IDs to their paid status
            const paidStatuses = {}
            users.forEach(user => {
                paidStatuses[user._id] = user.paid
            })
            setIsPaid(paidStatuses)
        }
    }, [users])

    const deleteHandler = (id) => {
        if (window.confirm('Are you sure')) {       
        dispatch(deleteUser(id))
        setMessage('User deleted successfully!')
        }   
    }
    const enabledHandler = (e) => {
        e.preventDefault()
        dispatch(updateUserProfilePaid({
            _id:e.target.id,
            paid: e.target.checked,
        }))
    }
  //console.log(users)
  return (
    <div>
        <h1>Users</h1>
        {message && <Message variant='success'>{message}</Message>}
        {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : (
            <Table striped bordered hover responsive className='table-sm'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>PAID</th>
                        <th>ADMIN</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users && users.map(user => (
                        <tr key={user._id}>
                            <td>{user._id}</td>
                            <td>{user.name}</td>
                            <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                            <td>
                                <Form>
                                    <Form.Group controlId='enable' style={{cursor: 'pointer'}}>
                                        <Form.Check 
                                            type='switch' 
                                            placeholder='Enter enable' 
                                            id={user._id} 
                                            checked={user.isPaid || false}  
                                            onChange={enabledHandler}
                                            style={{cursor: 'pointer'}}
                                            className="pointer-switch"
                                        />
                                    </Form.Group>
                                    <style>{`
                                        .pointer-switch, 
                                        .pointer-switch input, 
                                        .pointer-switch label,
                                        .pointer-switch .form-check-input {
                                        cursor: pointer !important;
                                        }
                                    `}</style>
                                </Form>
                            </td>
                            <td>{user.isAdmin ? (<i className='fas fa-check' style={{ color: 'green' }}></i>) : (<i className='fas fa-times' style={{ color: 'red' }}></i>)}</td>
                            <td>    
                                <LinkContainer to={`/admin/user/${user._id}/edit`}>
                                    <Button variant='light' className='btn-sm'>
                                        <i className='fas fa-edit'></i> 
                                    </Button>
                                </LinkContainer>
                                   <Button variant='danger' className='btn-sm' onClick={() => deleteHandler(user._id)}>
                                        <i className='fas fa-trash'></i> 
                                    </Button>
                                
                            </td>       
                        </tr>
                    ))}
                </tbody>
            </Table>
        )}
    </div>
  )
}

export default UserListScreen
