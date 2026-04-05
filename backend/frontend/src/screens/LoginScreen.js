import React, {useState, useEffect} from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../components/Loader'
import Message from '../components/Message'
import LoginBackground from '../components/LoginBackground'
import { login } from '../actions/userActions'

// Module-level flag to prevent navigation loop
let hasNavigated = false

// Expose reset function for logout
window.resetLoginScreenFlags = () => {
  hasNavigated = false
}

function LoginScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const userLogin = useSelector(state => state.userLogin)
    const {loading, error, userInfo} = userLogin

    useEffect(() => {
        if(userInfo && location.pathname === '/login' && !hasNavigated){
            hasNavigated = true
            navigate('/', { replace: true })
        }
    }, [userInfo, navigate, location])

    useEffect(() => {
        if (!userInfo) {
            hasNavigated = false
        }
    }, [userInfo])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(login(email, password))
    }

    return (
        <div className="auth-wrapper">
            <LoginBackground />
            <div className="auth-card">
                <h2>Sign In</h2>

                {error && <Message variant='danger'>{error}</Message>}
                {loading && <Loader />}

                <form onSubmit={submitHandler}>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="form-control dark-input"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-control dark-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="prof-btn auth-submit-btn">
                        Sign In
                    </button>
                </form>

                <div className="auth-footer-row">
                    New Customer? <Link to="/register">Register</Link>
                    <span className="auth-divider">/</span>
                    <Link to="/reset">Reset Password</Link>
                </div>
            </div>
        </div>
    )
}

export default LoginScreen
