import { 
    SNAPSHOT_LADDER_PROFIT_REQUEST, SNAPSHOT_LADDER_PROFIT_SUCCESS, SNAPSHOT_LADDER_PROFIT_FAIL, SNAPSHOT_LADDER_PROFIT_RESET,
    HISTORICAL_DATA_REQUEST, HISTORICAL_DATA_SUCCESS, HISTORICAL_DATA_FAIL, HISTORICAL_DATA_RESET
} from '../constants/chartConstants'    

export const snapshotLadderProfitReducer = (state = { snapshot_profit_chart: [] }, action) => {
    switch (action.type) {
        case SNAPSHOT_LADDER_PROFIT_REQUEST:
            return { loading: true, snapshot_profit_chart: [] }
        case SNAPSHOT_LADDER_PROFIT_SUCCESS:
            return { loading: false, snapshot_profit_chart: action.payload }
        case SNAPSHOT_LADDER_PROFIT_FAIL:
            return { loading: false, error: action.payload }
        case SNAPSHOT_LADDER_PROFIT_RESET:
            return { loading: false, snapshot_profit_chart: [] }
        default:
            return state
    }
}
export const historicalDataReducer = (state = { historical: [] }, action) => {
    switch (action.type) {
        case HISTORICAL_DATA_REQUEST:
            return { loading: true, historical: [] }
        case HISTORICAL_DATA_SUCCESS:
            return { loading: false, historical: action.payload }
        case HISTORICAL_DATA_FAIL:
            return { loading: false, error: action.payload }
        case HISTORICAL_DATA_RESET:
            return { loading: false, historical: [] }
        default:
            return state
    }
}