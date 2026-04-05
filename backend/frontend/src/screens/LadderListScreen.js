import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Form } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import PlusIcon from '../components/icons/PlusIcon'
import { listLadders, deleteLadder, createLadder, updateEnabledLadder } from '../actions/ladderActions'
import { LADDER_CREATE_RESET } from '../constants/ladderConstants'

function LadderListScreen() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [message, setMessage] = useState(null)
    const ladderAdminList = useSelector(state => state.ladderAdminList)
    const { loading, error, ladders } = ladderAdminList
    const ladderEnabled = useSelector(state => state.ladderUpdateEnabled)
    const { loading: enabledLoading, error: enabledError, success: enabledSuccess } = ladderEnabled
    const ladderCreate = useSelector(state => state.ladderCreate)
    const { loading: createLoading, error: createError, success: createSuccess, ladder: createdLadder } = ladderCreate
    const ladderDelete = useSelector(state => state.ladderDelete)
    const { loading: deleteLoading, error: deleteError, success: deleteSuccess } = ladderDelete
    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            if (createSuccess) {
                dispatch({ type: LADDER_CREATE_RESET })
                navigate(`/ladder/${createdLadder._id}/edit`, {
                    state: { from: `/admin/ladderList` }
                })
            } else {
                dispatch(listLadders())
            }
            error === 'Given token not valid for any token type' && navigate('/login')
        } else {
            navigate('/login')
        }
    }, [dispatch, navigate, deleteSuccess, createSuccess, createdLadder, enabledSuccess, userInfo, error])

    const createLadderHandler = () => { dispatch(createLadder()) }

    const deleteHandler = (id) => {
        if (window.confirm('Are you sure')) {
            dispatch(deleteLadder(id))
            setMessage('Ladder deleted successfully!')
        }
    }

    const enabledHandler = (e) => {
        e.preventDefault()
        dispatch(updateEnabledLadder({
            _id: e.target.id,
            enable: e.target.checked,
        }))
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <span className="admin-page-title">Ladders</span>
                <span className="admin-page-count">{ladders ? ladders.length : 0}</span>
                <button className="admin-create-btn" onClick={createLadderHandler}>
                    <PlusIcon size={16} color="currentColor" />
                    Create Ladder
                </button>
            </div>

            {createLoading && <Loader />}
            {createError && <Message variant='danger'>{createError}</Message>}
            {deleteLoading && <Loader />}
            {deleteError && <Message variant='danger'>{deleteError}</Message>}
            {message && <Message variant='success'>{message}</Message>}

            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : (
                <div className="admin-table-wrap">
                    <table className="dark-table admin-table admin-table--ladders" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>NAME</th>
                                <th>CREATOR</th>
                                <th>SYMBOL</th>
                                <th>MARKET</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {ladders && ladders.map(ladder => (
                                <tr key={ladder._id}>
                                    <td className="admin-table-id">{ladder._id}</td>
                                    <td>{ladder.name}</td>
                                    <td>{ladder.user_name || 'N/A'}</td>
                                    <td>{ladder.symbol}</td>
                                    <td>{ladder.symbol_name}</td>
                                    <td>
                                        <Form.Check
                                            type='switch'
                                            id={ladder._id}
                                            checked={ladder.enable}
                                            onChange={enabledHandler}
                                            className="admin-toggle"
                                        />
                                    </td>
                                    <td>
                                        <div className="admin-table-actions">
                                            <LinkContainer to={`/admin/ladder/${ladder._id}/edit`}>
                                                <button className="admin-action-btn admin-action-btn--edit">
                                                    <i className='fas fa-edit' />
                                                </button>
                                            </LinkContainer>
                                            <button
                                                className="admin-action-btn admin-action-btn--delete"
                                                onClick={() => deleteHandler(ladder._id)}
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

export default LadderListScreen
