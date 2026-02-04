import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'
import { 
    LADDER_LIST_REQUEST, LADDER_LIST_SUCCESS, LADDER_LIST_FAIL, LADDER_LIST_RESET,
LADDER_ADMIN_LIST_REQUEST, LADDER_ADMIN_LIST_SUCCESS, LADDER_ADMIN_LIST_FAIL, LADDER_ADMIN_LIST_RESET,
LADDER_DETAILS_REQUEST, LADDER_DETAILS_SUCCESS, LADDER_DETAILS_FAIL, LADDER_DETAILS_RESET,
LADDER_DELETE_FAIL, LADDER_DELETE_REQUEST, LADDER_DELETE_SUCCESS,
LADDER_CREATE_FAIL, LADDER_CREATE_REQUEST, LADDER_CREATE_SUCCESS, LADDER_CREATE_RESET,
LADDER_UPDATE_FAIL, LADDER_UPDATE_REQUEST, LADDER_UPDATE_SUCCESS,
LADDER_UPDATE_ENABLED_FAIL, LADDER_UPDATE_ENABLED_REQUEST, LADDER_UPDATE_ENABLED_SUCCESS,
LADDER_BULK_CREATE_REQUEST, LADDER_BULK_CREATE_SUCCESS, LADDER_BULK_CREATE_FAIL,

} from '../constants/ladderConstants'

export const listLadders = () => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_ADMIN_LIST_REQUEST })
         const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.get('/api/ladders/admin', config)
        dispatch({
            type: LADDER_ADMIN_LIST_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: LADDER_ADMIN_LIST_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const usersLadders = () => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_LIST_REQUEST })
        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.get('/api/ladders/user/', config)
        dispatch({
            type: LADDER_LIST_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: LADDER_LIST_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const listUsersLadders = () => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_LIST_REQUEST })
        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.get('/api/ladders/user/list/', config)
        dispatch({
            type: LADDER_LIST_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: LADDER_LIST_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const detailsLadder = (id) => async (dispatch) => {
    try {
        dispatch({ type: LADDER_DETAILS_REQUEST })
        const { data } = await axios.get(`/api/ladders/${id}`)
        dispatch({
            type: LADDER_DETAILS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: LADDER_DETAILS_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const deleteLadder = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_DELETE_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        await axios.delete(`/api/ladders/delete/${id}/`, config)    
        dispatch({
            type: LADDER_DELETE_SUCCESS,
        })
    } catch (error) {
        dispatch({
            type: LADDER_DELETE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}
export const createLadder = (ladderData = {}) => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_CREATE_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.post(`/api/ladders/create`, ladderData, config)    
        dispatch({
            type: LADDER_CREATE_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: LADDER_CREATE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}

export const bulkCreateLadders = (laddersData) => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_BULK_CREATE_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.post(`/api/ladders/bulk-create`, { ladders: laddersData }, config)    
        dispatch({
            type: LADDER_BULK_CREATE_SUCCESS,
            payload: data
        })
        return data
    } catch (error) {
        dispatch({
            type: LADDER_BULK_CREATE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}

export const updateLadder = (ladder) => async (dispatch, getState) => {
    
    try {
        dispatch({ type: LADDER_UPDATE_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.put(`/api/ladders/update/${ladder._id}/`, ladder,config)    
        dispatch({
            type: LADDER_UPDATE_SUCCESS,
            payload: data
        })
        dispatch({
            type: LADDER_DETAILS_SUCCESS,
            payload: data
        })
       
    } catch (error) {
        dispatch({
            type: LADDER_UPDATE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}
export const updateEnabledLadder = (ladder) => async (dispatch, getState) => {
    try {
        dispatch({ type: LADDER_UPDATE_ENABLED_REQUEST })

        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.put(`/api/ladders/updateenabled/${ladder._id}/`,ladder ,config)    
        dispatch({
            type: LADDER_UPDATE_ENABLED_SUCCESS,
            payload: data
        })
        dispatch({
            type: LADDER_DETAILS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: LADDER_UPDATE_ENABLED_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}