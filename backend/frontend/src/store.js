import { createStore, combineReducers, applyMiddleware} from 'redux'
import { thunk }  from 'redux-thunk'

import { 
    ladderListReducer, ladderAdminListReducer, ladderDetailsReducer, ladderDeleteReducer, ladderCreateReducer,
    ladderUpdateReducer, ladderUpdateEnabledReducer, ladderUpdateAlertReducer } from './reducers/ladderReducers'
import { 
    userLoginReducer, userRegisterReducer, userDetailsReducer, 
    userListReducer, userDeleteReducer, userUpdateReducer,
    userUpdateProfilePaidReducer, userUpdateProfileReducer,
    userGetCredentialsReducer,userCreateCredentialsReducer,userUpdateCredentialsReducer,
    userDeleteCredentialsReducer, userEnableCredentialsReducer
} from './reducers/userReducers'

import { 
    cryptoDeleteReducer, stocksDeleteReducer, transactionsDeleteReducer, tradeSuggestionReducer
} from './reducers/tradeReducers'

import { 
    snapshotLadderProfitReducer, historicalDataReducer
} from './reducers/chartReducers'

const reducer = combineReducers({
    ladderList: ladderListReducer,
    ladderAdminList: ladderAdminListReducer,
    ladderDetails: ladderDetailsReducer,
    ladderCreate: ladderCreateReducer,
    ladderDelete:ladderDeleteReducer,
    ladderUpdate: ladderUpdateReducer,
    ladderUpdateEnabled: ladderUpdateEnabledReducer,
    ladderUpdateAlert: ladderUpdateAlertReducer,
    cryptoDelete: cryptoDeleteReducer,
    stocksDelete: stocksDeleteReducer,
    transactionsDelete: transactionsDeleteReducer,  
    tradeSuggestion: tradeSuggestionReducer,

    snapshotLadderProfitChart: snapshotLadderProfitReducer,
    historicalDataChart: historicalDataReducer,
    
    userLogin: userLoginReducer,
    userRegister: userRegisterReducer,
    userDetails: userDetailsReducer,
    userUpdate: userUpdateReducer,
    userList: userListReducer,
    userDelete: userDeleteReducer,

    userUpdateProfile: userUpdateProfileReducer,
    userUpdateProfilePaid: userUpdateProfilePaidReducer,

    userCreateCredentials: userCreateCredentialsReducer,
    userCredentials: userGetCredentialsReducer,
    userUpdateCredentials: userUpdateCredentialsReducer,
    userDeleteCredentials: userDeleteCredentialsReducer,
    userEnableCredentials: userEnableCredentialsReducer,
})

// local storage logic
// this is to persist cart items in local storage
// it pulls from the users browser local storage
// if nothing there it sets to empty array
const userInfoFromStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null
const initialState = {
    userLogin: { userInfo: userInfoFromStorage },
}

const middleware = [thunk]

const store = createStore(reducer, initialState, applyMiddleware(...middleware))

export default store