import React, {useState, useEffect, useRef} from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form } from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import TransactionsStats from '../components/TransactionsStats'
import TransactionsTable from '../components/TransactionsTable'
import LadderReport from '../components/LadderReport';
import axios from 'axios'
import { updateUserProfileDetails, getUserDetails, getUserCredentials, 
    createUserCredentials, updateUserCredentials, deleteUserCredentials, updateEnabledUserCredentials,
    updateNotificationPreferences } from '../actions/userActions'
import { USER_UPDATE_PROFILE_RESET, USER_UPDATE_CREDENTIALS_RESET, USER_DELETE_CREDENTIALS_RESET,USER_CREATE_CREDENTIALS_RESET, USER_ENABLE_CREDENTIALS_RESET, USER_UPDATE_NOTIFICATIONS_RESET } from '../constants/userConstants'


const formatPhoneDisplay = (digits) => {
    if (!digits) return ''
    const d = digits.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return `(${d}`
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`
    return `1+ (${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
}

function ProfileScreen() {
    const hasLoadedCredentials = useRef(false)
    const [activeForm, setActiveForm] = useState(null)  // 'profile' | 'password' | null
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [messageError, setMessageError] = useState('')
    const [messageSuccess, setMessageSuccess] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')

    // Notification / phone state
    const [phoneNumber, setPhoneNumber] = useState('')
    const [phoneFocused, setPhoneFocused] = useState(false)
    const [weeklyReport, setWeeklyReport] = useState(false)
    const [monthlyReport, setMonthlyReport] = useState(false)
    const [notifyEmail, setNotifyEmail] = useState(false)
    const [notifySms, setNotifySms] = useState(false)
    const [notifMessage, setNotifMessage] = useState('')
    const [notifError, setNotifError] = useState('')

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
    const {success, loading: loadingUpdateProfile} = userUpdateProfile
    const userGetCredentials = useSelector(state => state.userCredentials)
    const {credentials, loading: loadingCredentials, error: errorCredentials} = userGetCredentials
    const userCreateCredentials = useSelector(state => state.userCreateCredentials)
    const {success: successCreateCredentials, loading: loadingCreateCredentials, error: errorCreateCredentials} = userCreateCredentials
    const userUpdateCredentials = useSelector(state => state.userUpdateCredentials)
    const {success: successUpdateCredentials, loading: loadingUpdateCredentials, error: errorUpdateCredentials} = userUpdateCredentials
    const userDeleteCredentials = useSelector(state => state.userDeleteCredentials)
    const {success: successDeleteCredentials, loading: loadingDeleteCredentials, error: errorDeleteCredentials} = userDeleteCredentials
    const userEnableCredentials = useSelector(state => state.userEnableCredentials)
    const {success: successEnableCredentials, loading: loadingEnableCredentials, error: errorEnableCredentials} = userEnableCredentials
    const userUpdateNotifications = useSelector(state => state.userUpdateNotifications)
    const {success: successNotifications, loading: loadingNotifications, error: errorNotifications} = userUpdateNotifications

    useEffect(() => {
        if(!userInfo){
            navigate('/login')
            return
        }
        // Profile update: handle locally — no full page refetch
        if(success){
            if(activeForm === 'password'){
                setPasswordSuccess('Password updated successfully')
                setPasswordError('')
            } else {
                setMessageSuccess('Profile updated successfully')
                setMessageError('')
            }
            setActiveForm(null)
            dispatch({type: USER_UPDATE_PROFILE_RESET})
            return
        }
        // Notifications update: handle locally — no full page refetch
        if(successNotifications){
            setNotifMessage('Notification preferences saved')
            setNotifError('')
            dispatch({type: USER_UPDATE_NOTIFICATIONS_RESET})
            return
        }
        // Credentials operations: only refresh credentials list, no full page refetch
        if(successCreateCredentials || successUpdateCredentials || successDeleteCredentials || successEnableCredentials){
            dispatch({type: USER_CREATE_CREDENTIALS_RESET})
            dispatch({type: USER_UPDATE_CREDENTIALS_RESET})
            dispatch({type: USER_DELETE_CREDENTIALS_RESET})
            dispatch({type: USER_ENABLE_CREDENTIALS_RESET})
            dispatch(getUserCredentials())
            return
        }
        if(!user || !user.name || userInfo._id !== user._id){
            dispatch(getUserDetails('profile'))
            dispatch(getUserCredentials())
            hasLoadedCredentials.current = true
        }else{
            // Load credentials on first mount if not already loaded
            if (!hasLoadedCredentials.current) {
                dispatch(getUserCredentials())
                hasLoadedCredentials.current = true
            }
        }
    }, [userInfo, user, navigate, success, dispatch, successUpdateCredentials, successDeleteCredentials, successCreateCredentials, successEnableCredentials, successNotifications])
    
    // Separate effect for handling credentials data
    useEffect(() => {
        if(credentials && credentials.length > 0){
            const defaultCred = credentials.find(cred => cred.platform === 'ADEFAULT')
            if (defaultCred) {
                setCredId(defaultCred._id)
            }
        }
    }, [credentials])

    // Sync all profile fields whenever user data arrives from server
    useEffect(() => {
        if (!user || !user.name) return
        setName(user.name)
        setEmail(user.email)
        if (user.profile) {
            setPhoneNumber(user.profile.phone_number || '')
            setWeeklyReport(user.profile.weekly_report || false)
            setMonthlyReport(user.profile.monthly_report || false)
            setNotifyEmail(user.profile.notify_email || false)
            setNotifySms(user.profile.notify_sms || false)
        }
    }, [user])

    const submitHandler = (e) => {
        e.preventDefault()
        setMessageSuccess('')
        setMessageError('')
        setActiveForm('profile')
        dispatch(updateUserProfileDetails({'id':user._id, 'name':name, 'email':email, 'password':'', 'phone_number':phoneNumber}))
    }
    const submitPasswordHandler = (e) => {
        e.preventDefault()
        if(password !== confirmPassword){
            setPasswordError('Passwords do not match')
            setPasswordSuccess('')
        }else if(password === ''){
            setPasswordError('Password cannot be empty')
            setPasswordSuccess('')
        }else{
            setPasswordError('')
            setPasswordSuccess('')
            setActiveForm('password')
            dispatch(updateUserProfileDetails({'id':user._id, 'name':name, 'email':email, 'password':password}))
            setPassword('')
            setConfirmPassword('')
        }
    }
    const submitNotificationsHandler = (e) => {
        e.preventDefault()
        const hasFrequency = weeklyReport || monthlyReport
        const hasMethod    = notifyEmail || notifySms
        if (hasFrequency && !hasMethod) {
            setNotifError('Please select a delivery method (Email or Text).')
            return
        }
        if (hasMethod && !hasFrequency) {
            setNotifError('Please select a report frequency (Weekly or Monthly).')
            return
        }
        setNotifMessage('')
        setNotifError('')
        dispatch(updateNotificationPreferences({
            weekly_report: weeklyReport,
            monthly_report:monthlyReport,
            notify_email:  notifyEmail,
            notify_sms:    notifySms,
        }))
    }
    const handlePhoneBlur = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
        setPhoneNumber(digits)
        setPhoneFocused(false)
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
        //console.log('Toggle:', e.target.id, 'to', e.target.checked)
        dispatch(updateEnabledUserCredentials({
            _id:e.target.id,
            is_active: e.target.checked,
        }))
    }


  return (
    <div className="prof-layout">

      {/* ── Left panel ── */}
      <div className="prof-sidebar">

        {/* User Profile */}
        <div className="prof-panel">
          <div className="prof-panel-header">
            <i className="fa-solid fa-user-circle" style={{marginRight:8}} />USER PROFILE
          </div>
          <div className="prof-panel-body">
            {loadingUpdateProfile && activeForm === 'profile' && <Loader />}
            {messageSuccess && <Message variant='success'>{messageSuccess}</Message>}
            {messageError  && <Message variant='danger'>{messageError}</Message>}
            {error         && <Message variant='danger'>{error}</Message>}
            <Form onSubmit={submitHandler}>
              <Form.Group controlId='name' className='mb-3'>
                <Form.Label className="prof-label">Name</Form.Label>
                <Form.Control className="dark-input" type='name' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)} />
              </Form.Group>
              <Form.Group controlId='email' className='mb-3'>
                <Form.Label className="prof-label">Email</Form.Label>
                <Form.Control className="dark-input" type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Group>
              <Form.Group controlId='phone' className='mb-3'>
                <Form.Label className="prof-label">Phone Number</Form.Label>
                <Form.Control
                  className="dark-input"
                  type='tel'
                  placeholder='10-digit number'
                  value={phoneFocused ? phoneNumber : formatPhoneDisplay(phoneNumber)}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={handlePhoneBlur}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </Form.Group>

              <button className="prof-btn" type='submit'>Update Profile</button>
            </Form>
          </div>
        </div>

        {/* Update Password */}
        <div className="prof-panel">
          <div className="prof-panel-header">
            <i className="fa-solid fa-lock" style={{marginRight:8}} />UPDATE PASSWORD
          </div>
          <div className="prof-panel-body">
            {loadingUpdateProfile && activeForm === 'password' && <Loader />}
            {passwordSuccess && <Message variant='success'>{passwordSuccess}</Message>}
            {passwordError   && <Message variant='danger'>{passwordError}</Message>}
            <Form onSubmit={submitPasswordHandler}>
              <Form.Group controlId='password' className='mb-3'>
                <Form.Label className="prof-label">New Password</Form.Label>
                <Form.Control className="dark-input" type='password' placeholder='Enter new password' value={password} onChange={(e) => setPassword(e.target.value)} />
              </Form.Group>
              <Form.Group controlId='passwordConfirm' className='mb-3'>
                <Form.Label className="prof-label">Confirm Password</Form.Label>
                <Form.Control className="dark-input" type='password' placeholder='Confirm password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </Form.Group>
              <button className="prof-btn" type='submit'>Update Password</button>
            </Form>
          </div>
        </div>

        {/* API Credentials */}
        <div className="prof-panel">
          <div className="prof-panel-header">
            <i className="fa-solid fa-key" style={{marginRight:8}} />API CREDENTIALS
          </div>
          <div className="prof-panel-body">
            {(loadingCreateCredentials || loadingUpdateCredentials || loadingDeleteCredentials || loadingEnableCredentials || loadingCredentials) && <Loader />}
            {errorCredentials    && <Message variant='danger'>{errorCredentials}</Message>}
            {errorCreateCredentials  && <Message variant='danger'>{errorCreateCredentials}</Message>}
            {errorUpdateCredentials  && <Message variant='danger'>{errorUpdateCredentials}</Message>}
            {errorDeleteCredentials  && <Message variant='danger'>{errorDeleteCredentials}</Message>}
            {errorEnableCredentials  && <Message variant='danger'>{errorEnableCredentials}</Message>}
            {credentials && credentials.length <= 1 && (
              <button className="prof-btn mb-3" onClick={() => dispatch(createUserCredentials())}>Add Credentials +</button>
            )}

            {!(loadingCreateCredentials || loadingUpdateCredentials || loadingDeleteCredentials || loadingEnableCredentials || loadingCredentials) && credentials && credentials.find(cred => cred.platform === 'ADEFAULT') && (
              <Form onSubmit={submitCredentialsHandler}>
                <Form.Group controlId='platform' className='mb-3'>
                  <Form.Label className="prof-label">Platform</Form.Label>
                  <Form.Select className="dark-input" value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
                    <option value=''>Select Platform</option>
                    <option value='TRADIER' disabled={credentials?.some(c => c.platform === 'TRADIER')}>
                      Tradier {credentials?.some(c => c.platform === 'TRADIER') && '(Added)'}
                    </option>
                    <option value='COINBASE' disabled={credentials?.some(c => c.platform === 'COINBASE')}>
                      Coinbase {credentials?.some(c => c.platform === 'COINBASE') && '(Added)'}
                    </option>
                  </Form.Select>
                </Form.Group>

                {selectedPlatform === 'TRADIER' && (<>
                  <Form.Control id={cred_id} type='text' defaultValue={cred_id} hidden />
                  <Form.Group controlId='tradierToken' className='mb-3'>
                    <Form.Label className="prof-label">Tradier API Token</Form.Label>
                    <Form.Control className="dark-input" type='password' placeholder='Enter Tradier Token' value={tradierToken} onChange={(e) => setTradierToken(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId='tradierAccountId' className='mb-3'>
                    <Form.Label className="prof-label">Tradier Account ID</Form.Label>
                    <Form.Control className="dark-input" type='text' placeholder='Enter Account ID' value={tradierAccountId} onChange={(e) => setTradierAccountId(e.target.value)} />
                  </Form.Group>
                </>)}

                {selectedPlatform === 'COINBASE' && (<>
                  <Form.Control id={cred_id} type='text' defaultValue={cred_id} hidden />
                  <Form.Group controlId='coinbaseProjectId' className='mb-3'>
                    <Form.Label className="prof-label">Project ID</Form.Label>
                    <Form.Control className="dark-input" type='text' placeholder='Enter Project ID' value={coinbaseProjectId} onChange={(e) => setCoinbaseProjectId(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId='coinbaseApiKey' className='mb-3'>
                    <Form.Label className="prof-label">API Key</Form.Label>
                    <Form.Control className="dark-input" type='password' placeholder='Enter API Key' value={coinbaseApiKey} onChange={(e) => setCoinbaseApiKey(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId='coinbasePrivateKey' className='mb-3'>
                    <Form.Label className="prof-label">Private Key</Form.Label>
                    <Form.Control className="dark-input" as='textarea' rows={3} placeholder='Enter Private Key' value={coinbasePrivateKey} onChange={(e) => setCoinbasePrivateKey(e.target.value)} />
                  </Form.Group>
                </>)}

                {selectedPlatform && <button className="prof-btn" type='submit'>Save Credentials</button>}
              </Form>
            )}

            {!(loadingCreateCredentials || loadingUpdateCredentials || loadingDeleteCredentials || loadingEnableCredentials || loadingCredentials) && credentials && credentials.filter(c => c.platform !== 'ADEFAULT').map((cred, i) => (
              <div key={i} className="prof-cred-card">
                <div className="prof-cred-info">
                  <span className={`prof-cred-status ${cred.is_active ? 'active' : ''}`}>
                    <i className={`fa-solid ${cred.is_active ? 'fa-check' : 'fa-ban'}`} />
                  </span>
                  <span className="prof-cred-name">{cred.platform}</span>
                </div>
                <div className="prof-cred-actions">
                  <Form.Check type='switch' id={cred._id} checked={cred.is_active} onChange={enabledHandler} />
                  <button className="prof-cred-delete" onClick={() => removeCredHandler(cred._id)}>
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="prof-panel">
          <div className="prof-panel-header">
            <i className="fa-solid fa-bell" style={{marginRight:8}} />NOTIFICATION PREFERENCES
          </div>
          <div className="prof-panel-body">
            {notifMessage && <Message variant='success'>{notifMessage}</Message>}
            {errorNotifications && <Message variant='danger'>{errorNotifications}</Message>}
            <Form onSubmit={submitNotificationsHandler}>
              <div className="notif-icon-row">
                {/* Frequency group */}
                <button type="button" className={`notif-icon-btn${weeklyReport ? ' active' : ''}`} onClick={() => setWeeklyReport(v => !v)} title="Weekly Report (Fridays)">
                  <i className="fa-regular fa-calendar" />
                  <span className="notif-icon-badge">7</span>
                  <span className="notif-icon-label">Weekly</span>
                </button>
                <button type="button" className={`notif-icon-btn${monthlyReport ? ' active' : ''}`} onClick={() => setMonthlyReport(v => !v)} title="Monthly Report (1st of month)">
                  <i className="fa-regular fa-calendar" />
                  <span className="notif-icon-badge">30</span>
                  <span className="notif-icon-label">Monthly</span>
                </button>

                <div className="notif-divider" />

                {/* Delivery group */}
                <button type="button" className={`notif-icon-btn${notifyEmail ? ' active' : ''}`} onClick={() => setNotifyEmail(v => !v)} title="Email notifications">
                  <i className="fa-regular fa-envelope" />
                  <span className="notif-icon-label">Email</span>
                </button>
                <button
                  type="button"
                  className={`notif-icon-btn${notifySms ? ' active' : ''}${!phoneNumber ? ' disabled' : ''}`}
                  onClick={() => { if (phoneNumber) setNotifySms(v => !v) }}
                  title={!phoneNumber ? 'Add a phone number above to enable' : 'Text notifications'}
                >
                  <i className="fa-solid fa-comment-sms" />
                  <span className="notif-icon-label">Text</span>
                </button>
              </div>

              {/* Inline summary / validation feedback */}
              {(() => {
                const hasFrequency = weeklyReport || monthlyReport
                const hasMethod    = notifyEmail || notifySms
                const methodLabel  = notifyEmail && notifySms ? 'Email and Text'
                                   : notifyEmail ? 'Email'
                                   : notifySms   ? 'Text'
                                   : null
                const lines = []
                if (weeklyReport  && methodLabel) lines.push(`A weekly report will be sent to you via ${methodLabel}.`)
                if (monthlyReport && methodLabel) lines.push(`A monthly report will be sent to you via ${methodLabel}.`)
                const validationError = (hasFrequency && !hasMethod)
                  ? 'Select a delivery method (Email or Text) to continue.'
                  : (hasMethod && !hasFrequency)
                  ? 'Select a report frequency (Weekly or Monthly) to continue.'
                  : null
                if (!hasFrequency && !hasMethod) return null
                return (
                  <div className="notif-summary">
                    {validationError
                      ? <span className="notif-summary-error"><i className="fa-solid fa-triangle-exclamation" style={{marginRight:6}}/>{validationError}</span>
                      : lines.map((l, i) => <span key={i} className="notif-summary-line">{l}</span>)
                    }
                  </div>
                )
              })()}

              {loadingNotifications ? <Loader /> : <button className="prof-btn" style={{marginTop: '14px'}} type='submit'>Save Preferences</button>}
            </Form>
          </div>
        </div>

      </div>{/* end prof-sidebar */}

      {/* ── Right panel ── */}
      <div className="prof-main">
        <LadderReport />
        <TransactionsStats />
        <div style={{ marginTop: '16px' }}>
          <TransactionsTable status='OPEN' />
        </div>
      </div>

    </div>
  )
}

export default ProfileScreen
