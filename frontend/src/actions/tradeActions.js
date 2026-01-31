import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'
import { 
    CRYPTO_DELETE_FAIL, CRYPTO_DELETE_REQUEST, CRYPTO_DELETE_SUCCESS, CRYPTO_DELETE_RESET,
    STOCKS_DELETE_FAIL, STOCKS_DELETE_REQUEST, STOCKS_DELETE_SUCCESS, STOCKS_DELETE_RESET,
    TRANSACTIONS_DELETE_FAIL, TRANSACTIONS_DELETE_REQUEST, TRANSACTIONS_DELETE_SUCCESS, TRANSACTIONS_DELETE_RESET,
    TRADE_SUGGESTION_FAIL, TRADE_SUGGESTION_REQUEST, TRADE_SUGGESTION_SUCCESS, TRADE_SUGGESTION_RESET
} from '../constants/tradeConstants'
export const cryptoDeleteTrade = (trade_data) => async (dispatch, getState) => {
    try {
        console.log('Deleting crypto trade:')
        dispatch({ type: CRYPTO_DELETE_REQUEST })
        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
            // DELETE request body data goes here
            data: {
                transaction_id: trade_data.transaction_id,
                side: trade_data.side,
                step_id: trade_data.step_id
            }
        }
        await axios.delete(`/api/trade/crypto/delete/${trade_data.orderId}/`, config)
        dispatch({
            type: CRYPTO_DELETE_SUCCESS,
        })
    } catch (error) {
        dispatch({
            type: CRYPTO_DELETE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}
export const stocksDeleteTrade = (trade_data) => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCKS_DELETE_REQUEST })
        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
            // DELETE request body data goes here
            data: {
                transaction_id: trade_data.transaction_id,
                side: trade_data.side,
                step_id: trade_data.step_id
            }
        }
        await axios.delete(`/api/trade/stocks/delete/${trade_data.orderId}/`, config)
        dispatch({
            type: STOCKS_DELETE_SUCCESS,
        })
    } catch (error) {
        dispatch({
            type: STOCKS_DELETE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}
export const transactionsDeleteByID = (transaction_id) => async (dispatch, getState) => {
    try {
        dispatch({ type: TRANSACTIONS_DELETE_REQUEST })
        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        await axios.delete(`/api/trade/transactions/delete/${transaction_id}/`, config)
        dispatch({
            type: TRANSACTIONS_DELETE_SUCCESS,
        })
    } catch (error) {
        dispatch({
            type: TRANSACTIONS_DELETE_FAIL,
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,
        })
    }       
}
export const tradeSuggestionGROK = (suggestion_data, abortSignal = null) => async (dispatch, getState) => {
    try {
        dispatch({ type: TRADE_SUGGESTION_REQUEST })
        const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        
        // Add abort signal if provided
        if (abortSignal) {
            config.signal = abortSignal
        }
        
        const { data } = await axios.post(`/api/trade/suggestions/`, suggestion_data, config)
        dispatch({
            type: TRADE_SUGGESTION_SUCCESS,
            payload: data
        })
    } catch (error) {
        // Don't dispatch error if request was aborted
        if (axios.isCancel(error) || error.name === 'CanceledError') {
            console.log('Request cancelled by user');
            return;
        }
        dispatch({
            type: TRADE_SUGGESTION_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}