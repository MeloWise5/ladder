import axios from '../axios';  // or whatever path you chose
import { 
    USER_LOGIN_REQUEST, USER_LOGIN_SUCCESS, USER_LOGIN_FAIL, 
    USER_LOGOUT,
    USER_LIST_REQUEST, USER_LIST_SUCCESS, USER_LIST_FAIL, USER_LIST_RESET,
    USER_DETAILS_REQUEST, USER_DETAILS_SUCCESS, USER_DETAILS_FAIL, USER_DETAILS_RESET,
    USER_REGISTER_REQUEST, USER_REGISTER_SUCCESS, USER_REGISTER_FAIL, USER_REGISTER_RESET,
    USER_UPDATE_PROFILE_REQUEST, USER_UPDATE_PROFILE_SUCCESS, USER_UPDATE_PROFILE_FAIL, USER_UPDATE_PROFILE_RESET,
    USER_DELETE_REQUEST, USER_DELETE_SUCCESS, USER_DELETE_FAIL,
    USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL,
    USER_CREDENTIALS_FAIL, USER_CREDENTIALS_REQUEST, USER_CREDENTIALS_SUCCESS, USER_CREDENTIALS_RESET,
    USER_CREATE_CREDENTIALS_FAIL, USER_CREATE_CREDENTIALS_REQUEST, USER_CREATE_CREDENTIALS_SUCCESS, USER_CREATE_CREDENTIALS_RESET,
    USER_UPDATE_RESET, USER_UPDATE_CREDENTIALS_FAIL, USER_UPDATE_CREDENTIALS_REQUEST, USER_UPDATE_CREDENTIALS_SUCCESS,
    USER_DELETE_CREDENTIALS_REQUEST, USER_DELETE_CREDENTIALS_SUCCESS, USER_DELETE_CREDENTIALS_FAIL, USER_DELETE_CREDENTIALS_RESET,
    USER_ENABLE_CREDENTIALS_FAIL, USER_ENABLE_CREDENTIALS_REQUEST, USER_ENABLE_CREDENTIALS_SUCCESS, USER_ENABLE_CREDENTIALS_RESET,
    USER_PROFILE_PAID_UPDATE_REQUEST, USER_PROFILE_PAID_UPDATE_SUCCESS, USER_PROFILE_PAID_UPDATE_FAIL, USER_PROFILE_PAID_UPDATE_RESET
} from '../constants/userConstants' 

import { 
    LADDER_LIST_RESET,
    LADDER_DETAILS_RESET,
    LADDER_CREATE_RESET,
    LADDER_UPDATE_RESET,
    LADDER_DELETE_RESET
} from '../constants/ladderConstants' 

export const login = (email, password) => async (dispatch) => {
    try {
        dispatch({ type: USER_LOGIN_REQUEST })

        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        }
        const { data } = await axios.post('/api/users/login/', { 'username':email, 'password':password }, config)
        dispatch({
            type: USER_LOGIN_SUCCESS,
            payload: data
        })
        // Local storage
        localStorage.setItem('userInfo', JSON.stringify(data))
    } catch (error) {
        dispatch({
            type: USER_LOGIN_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const register = (name, email, password) => async (dispatch) => {
    try {
        dispatch({ type: USER_REGISTER_REQUEST })

        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        }
        const { data } = await axios.post(
            '/api/users/register/', 
            { 'name':name, 'email':email, 'password':password },
            config)
        dispatch({
            type: USER_REGISTER_SUCCESS,
            payload: data
        })
        dispatch({
            type: USER_LOGIN_SUCCESS,
            payload: data
        })
        // Local storage
        localStorage.setItem('userInfo', JSON.stringify(data))
    } catch (error) {
        dispatch({
            type: USER_REGISTER_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const getUserDetails = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_DETAILS_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.get(
            `/api/users/${id}/`, 
            config
        )
        dispatch({
            type: USER_DETAILS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: USER_DETAILS_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const updateUserProfileDetails = (user) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_UPDATE_PROFILE_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.put(
            `/api/users/profile/update/`, 
            user,
            config
        )
        dispatch({
            type: USER_UPDATE_PROFILE_SUCCESS,
            payload: data
        })
        // update local storage / state with new data
        dispatch({
            type: USER_LOGIN_SUCCESS,
            payload: data
        })
        localStorage.setItem('userInfo', JSON.stringify(data))

    } catch (error) {
        dispatch({
            type: USER_UPDATE_PROFILE_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const listUsers = () => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_LIST_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.get(
            `/api/users/`, 
            config
        )
        dispatch({
            type: USER_LIST_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: USER_LIST_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const deleteUser = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_DELETE_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.delete(
            `/api/users/delete/${id}/`, 
            config
        )
        dispatch({
            type: USER_DELETE_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: USER_DELETE_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const updateUser = (user) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_UPDATE_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.put(
            `/api/users/update/${user._id}/`, 
            user,
            config
        )
        dispatch({
            type: USER_UPDATE_SUCCESS,
        })
        dispatch({
            type: USER_DETAILS_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: USER_UPDATE_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const logout = () => (dispatch) => {
        // Local storage
        localStorage.removeItem('userInfo')
        dispatch({ type: USER_LOGOUT })
        dispatch({ type: USER_DETAILS_RESET })
        dispatch({ type: USER_LIST_RESET })
        
        // Reset ladder state to prevent data leakage between users
        dispatch({ type: LADDER_LIST_RESET })
        dispatch({ type: LADDER_DETAILS_RESET })
        dispatch({ type: LADDER_CREATE_RESET })
        dispatch({ type: LADDER_UPDATE_RESET })
        dispatch({ type: LADDER_DELETE_RESET })
        
        // Reset module-level flags in HomeScreen and LoginScreen
        // These persist across component unmounts
        window.resetHomeScreenFlags && window.resetHomeScreenFlags()
        window.resetLoginScreenFlags && window.resetLoginScreenFlags()
}

export const getUserCredentials = () => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_CREDENTIALS_REQUEST })
        const { userLogin: { userInfo } } = getState()
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }   
        }
        const { data } = await axios.get(
            `/api/users/credentials/get/`,
            config
        )
        dispatch({  
            type: USER_CREDENTIALS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: USER_CREDENTIALS_FAIL,    
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }   
}
export const createUserCredentials = () => async (dispatch, getState) => {
    console.log('createUserCredentials action called')
    try {
        dispatch({ type: USER_CREATE_CREDENTIALS_REQUEST })    
        const { userLogin: { userInfo } } = getState()
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.post(
            `/api/users/credentials/`,
            {},
            config
        )
        dispatch({  
            type: USER_CREATE_CREDENTIALS_SUCCESS,
            payload: data
        })
    } catch (error) {   
        dispatch({
            type: USER_CREATE_CREDENTIALS_FAIL,    
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }   
}
export const updateUserCredentials = (cred) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_UPDATE_CREDENTIALS_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.put(
            `/api/users/credentials/update/`, 
            cred,
            config
        )
        dispatch({
            type: USER_UPDATE_CREDENTIALS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: USER_UPDATE_CREDENTIALS_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const deleteUserCredentials = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_DELETE_CREDENTIALS_REQUEST })
        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }
        const { data } = await axios.delete(
            `/api/users/credentials/delete/${id}/`, 
            config
        )
        dispatch({
            type: USER_DELETE_CREDENTIALS_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: USER_DELETE_CREDENTIALS_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const updateEnabledUserCredentials = (credentials) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_ENABLE_CREDENTIALS_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.put(`/api/users/credentials/enable/${credentials._id}/`,credentials ,config)    
        dispatch({
            type: USER_ENABLE_CREDENTIALS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: USER_ENABLE_CREDENTIALS_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}

export const updateUserProfilePaid = (profile_paid_data) => async (dispatch, getState) => {
    try {
        dispatch({ type: USER_PROFILE_PAID_UPDATE_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.put(`/api/users/profile/paid/${profile_paid_data._id}/`,profile_paid_data ,config)    
        dispatch({
            type: USER_PROFILE_PAID_UPDATE_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: USER_PROFILE_PAID_UPDATE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}