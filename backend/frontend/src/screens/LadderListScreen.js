import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Table, Button, Row, Col, Form } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { listLadders, deleteLadder, createLadder,updateEnabledLadder } from '../actions/ladderActions'
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
    const { loading: createLoading, error: createError, success: createSuccess, ladder:createdLadder } = ladderCreate
    const ladderDelete = useSelector(state => state.ladderDelete)
    const { loading: deleteLoading, error: deleteError, success: deleteSuccess } = ladderDelete
    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin


    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            //console.log('Fetching ladders for admin'+userInfo.isAdmin)
            if (createSuccess) {
                dispatch({ type: LADDER_CREATE_RESET })
                navigate(`/ladder/${createdLadder._id}/edit`, {
                    state: { from: `/admin/ladderList` }  // or whatever the current path is
                })
            } else {
                dispatch(listLadders())
            }
            error === 'Given token not valid for any token type' && navigate('/login')
        } else {
            navigate('/login')
        }
        
    }, [dispatch, navigate,deleteSuccess,createSuccess,createdLadder,enabledSuccess, userInfo, error])

    const createLadderHandler = () => {
        dispatch(createLadder())
    }

    const deleteHandler = (id) => {
        if (window.confirm('Are you sure')) {
        dispatch(deleteLadder(id))
        setMessage('Ladder deleted successfully!')
        }   
    }

    const enabledHandler = (e) => {
            e.preventDefault()
            dispatch(updateEnabledLadder({
                _id:e.target.id,
                enable: e.target.checked,
            }))
        }
    

    return (
    <div>
        
        <Row className='align-items-center'>
                <Col>
                    <h2>Ladders</h2>
                </Col>
                <Col className='text-end'>
                        <Button className='my-3' onClick={createLadderHandler}>   
                            <i className='fas fa-plus'></i> Create Ladder
                        </Button>
                </Col>
            </Row>
            {createLoading && <Loader />}
            {createError && <Message variant='danger'>{createError}</Message>}
            {deleteLoading && <Loader />}
            {deleteError && <Message variant='danger'>{deleteError}</Message>}
            {message && <Message variant='success'>{message}</Message>}
            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : (
            <>
            
            <Row className='align-items-center'>
            <Table striped bordered hover responsive className='table-sm'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>NAME</th>
                        <th>CREATOR</th>
                        <th>ENABLED</th>
                        <th>SYMBOL</th>
                        <th>MARKET</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {ladders && ladders.map(ladder => (
                        <tr key={ladder._id}>
                            <td>{ladder._id}</td>
                            <td>{ladder.name}</td>
                            <td>{ladder.user_name || 'N/A'}</td>
                            <td>
                                <Form>
                                    <Form.Group controlId='enable'>
                                    <Form.Check type='switch' id={ladder._id} checked={ladder.enable} onChange={enabledHandler}></Form.Check>
                                    </Form.Group>
                                </Form>
                            </td>
                            <td>{ladder.symbol}</td>
                            <td>{ladder.symbol_name}</td>
                            <td>    
                                <LinkContainer to={`/admin/ladder/${ladder._id}/edit`}>
                                    <Button variant='light' className='btn-sm'>
                                        <i className='fas fa-edit'></i> 
                                    </Button>
                                </LinkContainer>
                                   <Button variant='danger' className='btn-sm' onClick={() => deleteHandler(ladder._id)}>
                                        <i className='fas fa-trash'></i> 
                                    </Button>
                                
                            </td>       
                        </tr>
                    ))}
                </tbody>
            </Table>
            </Row>
            </>
        )}
    </div>
  )
}

export default LadderListScreen
