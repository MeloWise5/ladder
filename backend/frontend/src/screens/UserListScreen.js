import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Form } from 'react-bootstrap'
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
    }, [dispatch, success, successUpdateProfilePaid, navigate, userInfo])

    useEffect(() => {
        if (users && users.length > 0) {
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
            _id: e.target.id,
            paid: e.target.checked,
        }))
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <span className="admin-page-title">Users</span>
                <span className="admin-page-count">{users ? users.length : 0}</span>
            </div>

            {message && <Message variant='success'>{message}</Message>}

            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : (
                <div className="admin-table-wrap">
                    <table className="dark-table admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
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
                                    <td className="admin-table-id">{user._id}</td>
                                    <td>{user.name}</td>
                                    <td>
                                        <a href={`mailto:${user.email}`} className="admin-table-link">
                                            {user.email}
                                        </a>
                                    </td>
                                    <td>
                                        <Form.Check
                                            type='switch'
                                            id={user._id}
                                            checked={user.isPaid || false}
                                            onChange={enabledHandler}
                                            className="admin-toggle"
                                        />
                                    </td>
                                    <td>
                                        {user.isAdmin
                                            ? <i className='fas fa-check' style={{ color: 'var(--color-green)' }} />
                                            : <i className='fas fa-times' style={{ color: 'var(--color-red)' }} />
                                        }
                                    </td>
                                    <td>
                                        <div className="admin-table-actions">
                                            <LinkContainer to={`/admin/user/${user._id}/edit`}>
                                                <button className="admin-action-btn admin-action-btn--edit">
                                                    <i className='fas fa-edit' />
                                                </button>
                                            </LinkContainer>
                                            <button
                                                className="admin-action-btn admin-action-btn--delete"
                                                onClick={() => deleteHandler(user._id)}
                                            >
                                                <i className='fas fa-trash' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default UserListScreen
