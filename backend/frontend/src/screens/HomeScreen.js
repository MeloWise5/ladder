import { useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate } from 'react-router-dom'
import { listUsersLadders, createLadder } from '../actions/ladderActions'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Ladder from './Ladder'

// Module-level flag to prevent duplicate fetches
let fetchInitiated = false
let hasCheckedAuth = false

// Expose reset function for logout
window.resetHomeScreenFlags = () => {
  fetchInitiated = false
  hasCheckedAuth = false
}

function HomeScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const laddersList = useSelector(state => state.ladderList) || []
  const { loading, error, ladders } = laddersList
  const userLogin = useSelector(state => state.userLogin)
  const {userInfo} = userLogin
  const ladderCreate = useSelector(state => state.ladderCreate)
  const { success: createSuccess } = ladderCreate
  const [ladderId, setLadderId] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const changeLadderHandler = (newLadderId) => {
    setLadderId(newLadderId)
    setSidebarOpen(false)
  }
  
  useEffect(() => {
      if(userInfo && userInfo?.name){
        hasCheckedAuth = true
        if (!fetchInitiated && (!ladders || ladders.length === 0) && !loading){
          fetchInitiated = true
          dispatch(listUsersLadders())
        }
      } else {
        fetchInitiated = false
      }
  },[dispatch,userInfo,loading,ladders])
  
  // Separate effect to reload ladders when a new one is created
  useEffect(() => {
    if (createSuccess) {
      dispatch(listUsersLadders())
    }
  }, [createSuccess, dispatch])
  
  // Set initial ladder when ladders first load
  useEffect(() => {
    if (ladders && ladders.length > 0 && !isInitialized) {
      setLadderId(ladders[0]._id)
      setIsInitialized(true)
    }
  }, [ladders, isInitialized])
  
  // Show message if not logged in (after all hooks)
  if (!userInfo || !userInfo?.name) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2>Sign In Required</h2>
          <Message variant='info'>Please log in to view your ladders.</Message>
        </div>
      </div>
    )
  }
  const ladder_list = ladders ? (
    ladders.map(ladder => {
      console.log(ladder)
      const isSelected = ladderId === ladder._id
      const isSampleName = ladder.name === 'Sample Name'
      const isDisabled = !ladder.enable
      
      let variant = ''
      let textColor = ''
      
      if (isSelected) {
        variant = 'primary'
        textColor = 'dark'
      } else if (isSampleName) {
        variant = 'danger'
        textColor = 'white'
      } else if (isDisabled) {
        variant = 'secondary'
        textColor = 'dark'
      }
      
      const debtPct = ladder.budget && ladder.debt ? Math.min(ladder.debt / ladder.budget, 1) : 0
      const debtColor = debtPct >= 0.9 ? '#ff4d4d' : debtPct >= 0.7 ? '#f5a623' : '#00c48c'
      const isPos = ladder.percent_change_24h >= 0
      const budgetUsed = ladder.budget ? `$${Number(ladder.debt || 0).toFixed(0)} / $${Number(ladder.budget).toFixed(0)}` : 'No budget'

      const changeClass = isPos ? ' change-pos' : ' change-neg'

      return (
        <div
          key={ladder._id}
          className={`ladder-card${isSelected ? ' selected' : ''}${isSampleName ? ' sample-card' : ''}${isDisabled ? ' disabled-card' : ''}${changeClass}`}
          onClick={() => changeLadderHandler(ladder._id)}
        >
          {/* Left: symbol + name */}
          <div className="lc-left">
            <div className="lc-symbol">{ladder.symbol}</div>
            <div className="lc-name">{ladder.name}</div>
          </div>

          {/* Middle: budget usage bar */}
          <div className="lc-budget">
            <div className="lc-budget-track">
              <div className="lc-budget-fill" style={{ width: `${debtPct * 100}%`, backgroundColor: debtColor }} />
            </div>
            <div className="lc-budget-meta">
              <span>{budgetUsed}</span>
            </div>
          </div>

          {/* Right: price + 24h change */}
          <div className="lc-right">
            <div className="lc-last">${Number(ladder.last).toFixed(2)}</div>
            <div className={`lc-change ${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{Number(ladder.percent_change_24h).toFixed(2)}%
            </div>
          </div>
        </div>
      )
  })
  ) : null

  return (
    <div className="app-body">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile ladder toggle button */}
      <button
        className="mobile-sidebar-tab"
        onClick={() => setSidebarOpen(o => !o)}
        title="My Ladders"
        aria-label="Toggle ladder list"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 100 100" fill="currentColor">
          {/* Left rail */}
          <rect x="28" y="8" width="8" height="84" rx="4" />
          {/* Right rail */}
          <rect x="64" y="8" width="8" height="84" rx="4" />
          {/* Rungs */}
          <rect x="28" y="16" width="44" height="7" rx="3" />
          <rect x="28" y="38" width="44" height="7" rx="3" />
          <rect x="28" y="60" width="44" height="7" rx="3" />
          <rect x="28" y="82" width="44" height="7" rx="3" />
        </svg>
      </button>

      <div className={`dash-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <div className="dash-sidebar-label">
          <span>MY LADDERS</span>
          <button className="sidebar-add-btn" onClick={() => dispatch(createLadder())} title="New Ladder">+</button>
        </div>
        <div className="dash-sidebar-list">
          {loading ? (
            <Loader />
          ) : error ? (
            <Message variant='danger'>{error}</Message>
          ) : (
            ladder_list
          )}
        </div>
      </div>
      <div className="dash-main">
        {ladderId
          ? <Ladder ladder_id={ladderId} />
          : <div className="dash-main-empty">Select a ladder to view details</div>
        }
      </div>
    </div>
  )
}

export default HomeScreen
