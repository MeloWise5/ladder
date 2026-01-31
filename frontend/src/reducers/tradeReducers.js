import { 
    CRYPTO_DELETE_FAIL, CRYPTO_DELETE_REQUEST, CRYPTO_DELETE_SUCCESS, CRYPTO_DELETE_RESET,
    STOCKS_DELETE_FAIL, STOCKS_DELETE_REQUEST, STOCKS_DELETE_SUCCESS, STOCKS_DELETE_RESET,
    TRANSACTIONS_DELETE_FAIL, TRANSACTIONS_DELETE_REQUEST, TRANSACTIONS_DELETE_SUCCESS, TRANSACTIONS_DELETE_RESET,
    TRADE_SUGGESTION_FAIL, TRADE_SUGGESTION_REQUEST, TRADE_SUGGESTION_SUCCESS, TRADE_SUGGESTION_RESET
} from '../constants/tradeConstants'

export const cryptoDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case CRYPTO_DELETE_REQUEST:
            return { loading: true }
        case CRYPTO_DELETE_SUCCESS:
            return { loading: false, success: true }
        case CRYPTO_DELETE_FAIL:
            return { loading: false, error: action.payload }
        case CRYPTO_DELETE_RESET:
            return {}
        default:
            return state
    }
}
export const stocksDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case STOCKS_DELETE_REQUEST:
            return { loading: true }
        case STOCKS_DELETE_SUCCESS:
            return { loading: false, success: true }
        case STOCKS_DELETE_FAIL:
            return { loading: false, error: action.payload }
        case STOCKS_DELETE_RESET:
            return {}
        default:
            return state
    }
}
export const transactionsDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case TRANSACTIONS_DELETE_REQUEST:
            return { loading: true }
        case TRANSACTIONS_DELETE_SUCCESS:
            return { loading: false, success: true }
        case TRANSACTIONS_DELETE_FAIL:
            return { loading: false, error: action.payload }
        case TRANSACTIONS_DELETE_RESET:
            return {}
        default:
            return state
    }
}

export const tradeSuggestionReducer = (state = { }, action) => {
    switch (action.type) {
        case TRADE_SUGGESTION_REQUEST:
            return { loading: true, ...state }
        case TRADE_SUGGESTION_SUCCESS:
            return { loading: false, suggestion: action.payload }
        case TRADE_SUGGESTION_FAIL:
            return { loading: false, error: action.payload }
        case TRADE_SUGGESTION_RESET:
            return {}
        default:
            return state
    }
}