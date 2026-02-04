import React, {useState, useEffect, useRef} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Button, Row, Col, Card } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import TransactionsStats from '../components/TransactionsStats'
import TransactionsTable from '../components/TransactionsTable'
import LadderReport from '../components/LadderReport';
import { updateUserProfileDetails, getUserDetails, getUserCredentials, 
    createUserCredentials, updateUserCredentials, deleteUserCredentials, updateEnabledUserCredentials } from '../actions/userActions'
import { USER_UPDATE_PROFILE_RESET, USER_UPDATE_CREDENTIALS_RESET, USER_DELETE_CREDENTIALS_RESET,USER_CREATE_CREDENTIALS_RESET, USER_ENABLE_CREDENTIALS_RESET } from '../constants/userConstants'


function ProfileScreen() {
    const hasLoadedCredentials = useRef(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [messageError, setMessageError] = useState('')
    const [messageSuccess, setMessageSuccess] = useState('')

    // Credential form state
    const [selectedPlatform, setSelectedPlatform] = useState('')
    const [cred_id, setCredId] = useState('')
    const [tradierToken, setTradierToken] = useState('')
    const [tradierAccountId, setTradierAccountId] = useState('')
    const [coinbaseProjectId, setCoinbaseProjectId] = useState('')
    const [coinbaseApiKey, setCoinbaseApiKey] = useState('')
    const [coinbasePrivateKey, setCoinbasePrivateKey] = useState('')

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const userDetails = useSelector(state => state.userDetails)
    const {loading, error, user} = userDetails
    const userLogin = useSelector(state => state.userLogin)
    const {userInfo} = userLogin
    const userUpdateProfile = useSelector(state => state.userUpdateProfile)
    const {success} = userUpdateProfile
    const userGetCredentials = useSelector(state => state.userCredentials)
    const {credentials, loading: loadingCredentials, error: errorCredentials} = userGetCredentials
    const userCreateCredentials = useSelector(state => state.userCreateCredentials)
    const {success: successCreateCredentials} = userCreateCredentials
    const userUpdateCredentials = useSelector(state => state.userUpdateCredentials)
    const {success: successUpdateCredentials,  loading: loadingUpdateCredentials, error: errorUpdateCredentials} = userUpdateCredentials
    const userDeleteCredentials = useSelector(state => state.userDeleteCredentials)
    const {success: successDeleteCredentials} = userDeleteCredentials
    const userEnableCredentials = useSelector(state => state.userEnableCredentials)
    const {success: successEnableCredentials} = userEnableCredentials

    useEffect(() => {
        if(!userInfo){
            navigate('/login')
        }else{
            if(!user || !user.name || success || userInfo._id !== user._id || successUpdateCredentials || successDeleteCredentials || successCreateCredentials || successEnableCredentials){
                dispatch({type: USER_UPDATE_PROFILE_RESET})
                dispatch({type: USER_UPDATE_CREDENTIALS_RESET})
                dispatch({type: USER_DELETE_CREDENTIALS_RESET})
                dispatch({type: USER_CREATE_CREDENTIALS_RESET})
                dispatch({type: USER_ENABLE_CREDENTIALS_RESET})
                dispatch(getUserDetails('profile'))
                dispatch(getUserCredentials())
                hasLoadedCredentials.current = true
            }else{
                setName(user.name)
                setEmail(user.email)
                // Load credentials on first mount if not already loaded
                if (!hasLoadedCredentials.current) {
                    dispatch(getUserCredentials())
                    hasLoadedCredentials.current = true
                }
            }
        }
    }, [userInfo, user, navigate, success, dispatch, successUpdateCredentials, successDeleteCredentials, successCreateCredentials, successEnableCredentials])
    
    // Separate effect for handling credentials data
    useEffect(() => {
        if(credentials && credentials.length > 0){
            const defaultCred = credentials.find(cred => cred.platform === 'ADEFAULT')
            if (defaultCred) {
                setCredId(defaultCred._id)
            }
        }
    }, [credentials])

    const submitHandler = (e) => {
        e.preventDefault()
        if(password !== confirmPassword){
            setMessageError('Passwords do not match')
        }else{
            //dispatch(register(name, email, password))
            dispatch(updateUserProfileDetails({'id':user._id, 'name':name, 'email':email, 'password':password}))
            setMessageSuccess('Profile updated successfully')
            setMessageError('')
        }
    }
    const submitCredentialsHandler = (e) => {
        e.preventDefault()
        if (selectedPlatform === '') {          
            alert('Please select a platform')
            return  
        }
        if ((cred_id === '') || 
            (selectedPlatform === 'TRADIER' && (tradierToken === '' || tradierAccountId === '')) ||
            (selectedPlatform === 'COINBASE' && (coinbaseProjectId === '' || coinbaseApiKey === '' || coinbasePrivateKey === ''))) {
            alert('Please fill in all required fields for the selected platform')
            return
        }      
        if (credentials && credentials.find(cred => cred.platform === selectedPlatform)) {
            alert(`Credentials for ${selectedPlatform} already exist.`)
            return
        }   
        const realCredentials = credentials.filter(cred => cred.platform !== 'ADEFAULT')
        if (realCredentials.length >= 2) {
            alert('You can only have credentials for two platforms.')
            return
        }
        
        let credentialsData = {}
        
        if (selectedPlatform === 'TRADIER') {
            credentialsData = {
                cred_id: cred_id,
                platform: 'TRADIER',
                credentials: {
                    tradier_token: tradierToken,
                    tradier_account_id: tradierAccountId
                }
            }
        } else if (selectedPlatform === 'COINBASE') {
            credentialsData = {
                cred_id: cred_id,
                platform: 'COINBASE',
                credentials: {
                    project_id: coinbaseProjectId,
                    api_key: coinbaseApiKey,
                    private_key: coinbasePrivateKey
                }
            }
        }
        dispatch(updateUserCredentials(credentialsData))
        setTradierToken('')
        setTradierAccountId('')
        setCoinbaseProjectId('')
        setCoinbaseApiKey('')
        setCoinbasePrivateKey('')
        setSelectedPlatform('')
        
    }
    const removeCredHandler = (id) => {
        if(window.confirm(`Remove credentials with id: ${id} - Are you sure?`)) {
            // Add logic to remove credentials here
            dispatch(deleteUserCredentials(id))
        }

    }
    const enabledHandler = (e) => {
        console.log('Toggle:', e.target.id, 'to', e.target.checked)
        dispatch(updateEnabledUserCredentials({
            _id:e.target.id,
            is_active: e.target.checked,
        }))
    }


  return (
    <>
    <Row>        
        <Col md={3}>
        <h2>User Profile</h2>
        
        {loading && <Loader />}
        {messageSuccess && <Message variant='success'>{messageSuccess}</Message>}
        {messageError && <Message variant='danger'>{messageError}</Message>}
        {error && <Message variant='danger'>{error}</Message>}
        {errorCredentials && <Message variant='danger'>{errorCredentials}</Message>}
        <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
                <Form.Label>Name</Form.Label>
                <Form.Control type='name' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='email'>
                <Form.Label>Email Address</Form.Label>
                <Form.Control type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='password'>
                <Form.Label>Password</Form.Label>
                <Form.Control type='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Form.Group controlId='passwordConfirm'>
                <Form.Label>Password Confirm</Form.Label>
                <Form.Control type='password' placeholder='Confirm password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></Form.Control>
            </Form.Group>
            <Button className='my-3' type='submit' variant='primary'>Update Profile</Button>
        </Form>
        <hr>
       </hr>
         <h2>API Credentials</h2>
         {credentials && credentials.length <= 1  && <Button className='my-3 lg' variant='primary' onClick={() => dispatch(createUserCredentials())}>Add Credentials</Button>}
         
         {loadingUpdateCredentials ? <Loader /> : credentials && credentials.find(cred => cred.platform === 'ADEFAULT') && (
            <Form onSubmit={submitCredentialsHandler}>
                <Form.Group controlId='platform' className='mb-3'>
                    <Form.Label>Platform</Form.Label>
                    <Form.Select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
                        <option value=''>Select Platform</option>
                        <option 
                            value='TRADIER' 
                            disabled={credentials?.some(cred => cred.platform === 'TRADIER')}
                        >
                            Tradier {credentials?.some(cred => cred.platform === 'TRADIER') && '(Already Added)'}
                        </option>
                        <option 
                            value='COINBASE'
                            disabled={credentials?.some(cred => cred.platform === 'COINBASE')}
                        >
                            Coinbase {credentials?.some(cred => cred.platform === 'COINBASE') && '(Already Added)'}
                        </option>
                    </Form.Select>
                </Form.Group>
                
                {selectedPlatform === 'TRADIER' && (
                    <>
                        <Form.Group controlId='tradierToken' className='mb-3'>
                            <Form.Control 
                                id={cred_id}
                                type='text' 
                                defaultValue={cred_id} 
                                hidden={true}
                            />
                            <Form.Label>Tradier API Token</Form.Label>
                            <Form.Control 
                                type='password' 
                                placeholder='Enter Tradier Token' 
                                value={tradierToken} 
                                onChange={(e) => setTradierToken(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId='tradierAccountId' className='mb-3'>
                            <Form.Label>Tradier Account ID</Form.Label>
                            <Form.Control 
                                type='text' 
                                placeholder='Enter Account ID' 
                                value={tradierAccountId} 
                                onChange={(e) => setTradierAccountId(e.target.value)}
                            />
                        </Form.Group>
                    </>
                )}
                
                {selectedPlatform === 'COINBASE' && (
                    <>
                        <Form.Group controlId='coinbaseProjectId' className='mb-3'>
                            <Form.Control 
                                id={cred_id}
                                type='text' 
                                defaultValue={cred_id} 
                                hidden={true}
                            />
                            <Form.Label>Coinbase Project ID</Form.Label>
                            <Form.Control 
                                type='text' 
                                placeholder='Enter Project ID' 
                                value={coinbaseProjectId} 
                                onChange={(e) => setCoinbaseProjectId(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId='coinbaseApiKey' className='mb-3'>
                            <Form.Label>Coinbase API Key</Form.Label>
                            <Form.Control 
                                type='password' 
                                placeholder='Enter API Key' 
                                value={coinbaseApiKey} 
                                onChange={(e) => setCoinbaseApiKey(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId='coinbasePrivateKey' className='mb-3'>
                            <Form.Label>Coinbase Private Key</Form.Label>
                            <Form.Control 
                                as='textarea' 
                                rows={3}
                                placeholder='Enter Private Key' 
                                value={coinbasePrivateKey} 
                                onChange={(e) => setCoinbasePrivateKey(e.target.value)}
                            />
                        </Form.Group>
                    </>
                )}
                
                {selectedPlatform && (
                    <Button className='my-3' type='submit' variant='primary'>Save Credentials</Button>
                )}
            </Form>
         )}
         {loadingCredentials ? <Loader></Loader> : credentials && credentials.length > 0 && (
            <>
                {credentials
                    .filter(cred => cred.platform !== 'ADEFAULT')
                    .map((cred, index) => (
                        <Card key={index} className='mb-3'>
                            <Card.Body>
                                <Row>
                                    <Col xs={1} style={{cursor: 'pointer'}} >{cred.is_active ? <i className="fa-solid fa-check"></i> :<i className="fa-solid fa-ban"></i>}
                                    
                                    
                                    
                                    </Col>
                                    <Col> <Card.Title>{cred.platform}</Card.Title></Col>
                                    <Col className='text-end'>
                                    <Form>
                                        <Form.Group controlId='enable'>
                                        <Form.Check type='switch' id={cred._id} checked={cred.is_active} onChange={enabledHandler}></Form.Check>
                                        </Form.Group>
                                    </Form>
                                    </Col>
                                    <Col className='text-end'>
                                        <Button variant='danger' size='sm' onClick={() => removeCredHandler(cred._id)}><i className="fa-solid fa-trash-can"></i></Button>
                                    </Col>
                                </Row>
                                
                            </Card.Body>
                        </Card>
                    ))
                }
            </>
         )}
    
        </Col>
        <Col md={9}>
        <h2>User Trades</h2>
        <LadderReport />
        <hr></hr>
        <TransactionsStats />
        <TransactionsTable status='OPEN' />
        </Col>
    </Row>
    
        
    </>
  )
}

export default ProfileScreen
