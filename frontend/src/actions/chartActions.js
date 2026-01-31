import axios from 'axios'
import { 
    SNAPSHOT_LADDER_PROFIT_REQUEST, SNAPSHOT_LADDER_PROFIT_SUCCESS, SNAPSHOT_LADDER_PROFIT_FAIL, SNAPSHOT_LADDER_PROFIT_RESET,
    HISTORICAL_DATA_REQUEST, HISTORICAL_DATA_SUCCESS, HISTORICAL_DATA_FAIL, HISTORICAL_DATA_RESET

} from '../constants/chartConstants'

export const snapshotLadderProfitChartAction = (id = 'all', date_method = 'all') => async (dispatch, getState) => {
    try {
        dispatch({ type: SNAPSHOT_LADDER_PROFIT_REQUEST })
         const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        console.log("Fetching snapshot chart data for ladder:", id, "from date:", date_method)
        const { data } = await axios.get(`/api/snapshot/chart/profit/${id}?date_method=${date_method}`, config)
        dispatch({
            type: SNAPSHOT_LADDER_PROFIT_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: SNAPSHOT_LADDER_PROFIT_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}
export const historicalDataChartAction = (symbol, date_method = 'all') => async (dispatch, getState) => {
    try {
        dispatch({ type: HISTORICAL_DATA_REQUEST })
         const {
            userLogin: { userInfo },
        } = getState()  
        const config = {
            headers: {
                'Content-Type': 'application/json',     
                Authorization: `Bearer ${userInfo.token}`,
            },
        }
        const { data } = await axios.get(`/api/snapshot/chart/historical/${symbol}?date_method=${date_method}`, config)
        //console.log("Historical Data Fetched:", data)
        dispatch({
            type: HISTORICAL_DATA_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: HISTORICAL_DATA_FAIL, 
            payload: error.response && error.response.data.detail ?
                error.response.data.detail : error.message,    
        })
    }
}