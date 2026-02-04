import { 
    USER_LOGIN_REQUEST, USER_LOGIN_SUCCESS, USER_LOGIN_FAIL, 
    USER_LOGOUT,
    USER_LIST_REQUEST, USER_LIST_SUCCESS, USER_LIST_FAIL, USER_LIST_RESET,
    USER_DETAILS_REQUEST, USER_DETAILS_SUCCESS, USER_DETAILS_FAIL, USER_DETAILS_RESET,
    USER_REGISTER_REQUEST, USER_REGISTER_SUCCESS, USER_REGISTER_FAIL, USER_REGISTER_RESET,
    USER_UPDATE_PROFILE_REQUEST, USER_UPDATE_PROFILE_SUCCESS, USER_UPDATE_PROFILE_FAIL, USER_UPDATE_PROFILE_RESET,
    USER_DELETE_REQUEST, USER_DELETE_SUCCESS, USER_DELETE_FAIL,
    USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL, USER_UPDATE_RESET,
    USER_CREDENTIALS_REQUEST, USER_CREDENTIALS_SUCCESS, USER_CREDENTIALS_FAIL, USER_CREDENTIALS_RESET,
    USER_CREATE_CREDENTIALS_REQUEST, USER_CREATE_CREDENTIALS_SUCCESS, USER_CREATE_CREDENTIALS_FAIL, USER_CREATE_CREDENTIALS_RESET,
    USER_UPDATE_CREDENTIALS_FAIL, USER_UPDATE_CREDENTIALS_REQUEST, USER_UPDATE_CREDENTIALS_SUCCESS, USER_UPDATE_CREDENTIALS_RESET,
    USER_DELETE_CREDENTIALS_REQUEST, USER_DELETE_CREDENTIALS_SUCCESS, USER_DELETE_CREDENTIALS_FAIL, USER_DELETE_CREDENTIALS_RESET,
    USER_ENABLE_CREDENTIALS_FAIL, USER_ENABLE_CREDENTIALS_REQUEST, USER_ENABLE_CREDENTIALS_SUCCESS, USER_ENABLE_CREDENTIALS_RESET,
    USER_PROFILE_PAID_UPDATE_REQUEST, USER_PROFILE_PAID_UPDATE_SUCCESS, USER_PROFILE_PAID_UPDATE_FAIL, USER_PROFILE_PAID_UPDATE_RESET
} from '../constants/userConstants' 

export const userLoginReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_LOGIN_REQUEST:
            return { loading: true, }
        case USER_LOGIN_SUCCESS:
            return { loading: false, userInfo: action.payload }
        case USER_LOGIN_FAIL:
            return { loading: false, error: action.payload }
        case USER_LOGOUT:
            return { }
        default:
            return state
    }
}
export const userRegisterReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_REGISTER_REQUEST:
            return { loading: true, }
        case USER_REGISTER_SUCCESS:
            return { loading: false, userInfo: action.payload }
        case USER_REGISTER_FAIL:
            return { loading: false, error: action.payload }
        default:
            return state
    }
}
export const userDetailsReducer = (state = {user: {} }, action) => {
    switch (action.type) {
        case USER_DETAILS_REQUEST:
            return { ...state, loading: true }
        case USER_DETAILS_SUCCESS:
            return { loading: false, user: action.payload}
        case USER_DETAILS_FAIL:
            return { loading: false, error: action.payload }
        case USER_DETAILS_RESET:
            return {user: {}}
        default:
            return state
    }
}

export const userListReducer = (state = {users: [] }, action) => {
    switch (action.type) {
        case USER_LIST_REQUEST:
            return { loading: true }
        case USER_LIST_SUCCESS:
            return { loading: false, users: action.payload }
        case USER_LIST_FAIL:
            return { loading: false, error: action.payload }
        case USER_LIST_RESET:
            return {users: [] }
        default:
            return state
    }
}
export const userDeleteReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_DELETE_REQUEST:
            return { loading: true }
        case USER_DELETE_SUCCESS:
            return { loading: false, success: true }
        case USER_DELETE_FAIL:
            return { loading: false, error: action.payload }

        default:
            return state
    }
}
export const userUpdateReducer = (state = { user: {} }, action) => {
    switch (action.type) {
        case USER_UPDATE_REQUEST:
            return { loading: true }
        case USER_UPDATE_SUCCESS:
            return { loading: false, success: true }
        case USER_UPDATE_FAIL:
            return { loading: false, error: action.payload }
        case USER_UPDATE_RESET:
            return {user: {}}
        default:
            return state
    }
}

export const userUpdateProfileReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_UPDATE_PROFILE_REQUEST:
            return { loading: true }
        case USER_UPDATE_PROFILE_SUCCESS:
            return { loading: false, success: true, userInfo: action.payload, error: null }
        case USER_UPDATE_PROFILE_FAIL:
            return { loading: false, error: action.payload }
        case USER_UPDATE_PROFILE_RESET:
            return {}
        default:
            return state
    }
}
export const userUpdateProfilePaidReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_PROFILE_PAID_UPDATE_REQUEST:
            return { loading: true }
        case USER_PROFILE_PAID_UPDATE_SUCCESS:
            return { loading: false, success: true }
        case USER_PROFILE_PAID_UPDATE_FAIL:
            return { loading: false, error: action.payload }
        case USER_PROFILE_PAID_UPDATE_RESET:
            return {}
        default:
            return state
    }
}

export const userGetCredentialsReducer = (state = { credentials: [] }, action) => {
    switch (action.type) {
        case USER_CREDENTIALS_REQUEST:
            return { ...state, loading: true }
        case USER_CREDENTIALS_SUCCESS:
            return { loading: false, credentials: action.payload }
        case USER_CREDENTIALS_FAIL:
            return { loading: false, error: action.payload }
        case USER_CREDENTIALS_RESET:
            return { credentials: [] }
        default:
            return state
    }
}
export const userCreateCredentialsReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_CREATE_CREDENTIALS_REQUEST:
            return { ...state, loading: true }
        case USER_CREATE_CREDENTIALS_SUCCESS:
            return { loading: false, success: true}
        case USER_CREATE_CREDENTIALS_FAIL:
            return { loading: false, error: action.payload }
        case USER_CREATE_CREDENTIALS_RESET:
            return { }
        default:
            return state
    }
}
export const userUpdateCredentialsReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_UPDATE_CREDENTIALS_REQUEST:
            return { ...state, loading: true }
        case USER_UPDATE_CREDENTIALS_SUCCESS:
            return { loading: false, success: true}
        case USER_UPDATE_CREDENTIALS_FAIL:
            return { loading: false, error: action.payload }
        case USER_UPDATE_CREDENTIALS_RESET:
            return { }
        default:
            return state
    }
}
export const userDeleteCredentialsReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_DELETE_CREDENTIALS_REQUEST:
            return { ...state, loading: true }
        case USER_DELETE_CREDENTIALS_SUCCESS:
            return { loading: false, success: true}
        case USER_DELETE_CREDENTIALS_FAIL:
            return { loading: false, error: action.payload }
        case USER_DELETE_CREDENTIALS_RESET:
            return { }
        default:
            return state
    }   
}
export const userEnableCredentialsReducer = (state = { }, action) => {
    switch (action.type) {
        case USER_ENABLE_CREDENTIALS_REQUEST:
            return { ...state, loading: true }
        case USER_ENABLE_CREDENTIALS_SUCCESS:
            return { loading: false, success: true}
        case USER_ENABLE_CREDENTIALS_FAIL:
            return { loading: false, error: action.payload }
        case USER_ENABLE_CREDENTIALS_RESET:
            return { }
        default:
            return state
    }
}