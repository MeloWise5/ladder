import { 
    LADDER_LIST_REQUEST, LADDER_LIST_SUCCESS, LADDER_LIST_FAIL, LADDER_LIST_RESET,
    LADDER_DETAILS_REQUEST, LADDER_DETAILS_SUCCESS, LADDER_DETAILS_FAIL, LADDER_DETAILS_RESET,
    LADDER_DELETE_REQUEST, LADDER_DELETE_SUCCESS, LADDER_DELETE_FAIL, LADDER_DELETE_RESET,
    LADDER_CREATE_REQUEST, LADDER_CREATE_SUCCESS, LADDER_CREATE_FAIL, LADDER_CREATE_RESET,
    LADDER_UPDATE_FAIL, LADDER_UPDATE_SUCCESS, LADDER_UPDATE_REQUEST, LADDER_UPDATE_RESET,
    LADDER_UPDATE_ENABLED_FAIL, LADDER_UPDATE_ENABLED_REQUEST, LADDER_UPDATE_ENABLED_SUCCESS, LADDER_UPDATE_ENABLED_RESET
} from '../constants/ladderConstants'

export const ladderListReducer = (state = { ladders: [] }, action) => {
    switch (action.type) {
        case LADDER_LIST_REQUEST:
            return { ...state, loading: true }
        case LADDER_LIST_SUCCESS:
            return { loading: false, ladders: action.payload }
        case LADDER_LIST_FAIL:
            return { loading: false, error: action.payload }
        case LADDER_LIST_RESET:
            return { loading: false, ladders: [] }
        default:
            return state
    }
}
export const ladderDetailsReducer = (state = { ladder: {steps:[]} }, action) => {
    switch (action.type) {
        case LADDER_DETAILS_REQUEST:
            return { loading: true, ...state }
        case LADDER_DETAILS_SUCCESS:
            return { loading: false, ladder: action.payload }
        case LADDER_DETAILS_FAIL:
            return { loading: false, error: action.payload }
        case LADDER_DETAILS_RESET:
            return { loading: false, ladder: {steps:[]} }
        default:
            return state
    }
}
export const ladderDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case LADDER_DELETE_REQUEST:
            return { loading: true }
        case LADDER_DELETE_SUCCESS:
            return { loading: false, success: true }
        case LADDER_DELETE_FAIL:
            return { loading: false, error: action.payload }
        case LADDER_DELETE_RESET:
            return {loading: false, success: false, error: null}
        default:
            return state
    }
}
export const ladderCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case LADDER_CREATE_REQUEST:
            return { loading: true }
        case LADDER_CREATE_SUCCESS:
            return { loading: false, success: true, ladder: action.payload }
        case LADDER_CREATE_FAIL:
            return { loading: false, error: action.payload }
        case LADDER_CREATE_RESET:
            return {}
        default:
            return state
    }
}
export const ladderUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case LADDER_UPDATE_REQUEST:
            return { loading: true }
        case LADDER_UPDATE_SUCCESS:
            return { loading: false, success: true, ladder: action.payload }
        case LADDER_UPDATE_ENABLED_FAIL:
            return { loading: false, error: action.payload }
        case LADDER_UPDATE_RESET:
            return {}
        default:
            return state
    }
}
export const ladderUpdateEnabledReducer = (state = {}, action) => {
    switch (action.type) {
        case LADDER_UPDATE_ENABLED_REQUEST:
            return { loading: true }
        case LADDER_UPDATE_ENABLED_SUCCESS:
            return { loading: false, success: true, ladder: action.payload }
        case LADDER_UPDATE_ENABLED_FAIL:
            return { loading: false, error: action.payload }
        case LADDER_UPDATE_ENABLED_RESET:
            return {}
        default:
            return state
    }
}