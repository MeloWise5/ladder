import { useEffect, useRef, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate } from 'react-router-dom'
import { listUsersLadders, pollUsersLadders, createLadder } from '../actions/ladderActions'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Ladder from './Ladder'

const ALERT_FADE_MS = 2000

const ALERT_ICONS = [
  { key: 'INSUFFICIENT_FUNDS_STOCKS', level: 'danger',  iconType: 'fa',   icon: 'fa-building-columns', label: 'Insufficient funds (stocks)' },
  { key: 'INSUFFICIENT_FUNDS_CRYPTO', level: 'danger',  iconType: 'fa',   icon: 'fa-building-columns', label: 'Insufficient funds (crypto)' },
  { key: 'NO_FUNDS_STOCKS',           level: 'danger',  iconType: 'fa',   icon: 'fa-building-columns', label: 'No funds (stocks)' },
  { key: 'NO_FUNDS_CRYPTO',           level: 'danger',  iconType: 'fa',   icon: 'fa-building-columns', label: 'No funds (crypto)' },
  { key: 'BUDGET_MAXED',              level: 'warning', iconType: 'fa',   icon: 'fa-dollar-sign',      label: 'Budget maxed' },
  { key: 'BUFFER_52_WEEK',            level: 'warning', iconType: 'text', icon: '52',                  label: '52-week high buffer' },
  { key: 'HOUR_24',                   level: 'warning', iconType: 'fa',   icon: 'fa-arrow-trend-down', label: 'Trending down (24h)' },
]

function AlertBadge({ alertStr }) {
  const [displayed, setDisplayed] = useState(alertStr || '')
  const [phase, setPhase] = useState(alertStr ? 'in' : 'hidden')
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (alertStr) {
      setDisplayed(alertStr)
      setPhase('in')
    } else if (displayed) {
      setPhase('out')
      timerRef.current = setTimeout(() => {
        setDisplayed('')
        setPhase('hidden')
      }, ALERT_FADE_MS)
    }
    return () => clearTimeout(timerRef.current)
  }, [alertStr]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'hidden' || !displayed) return null
  const active = ALERT_ICONS.filter(a => displayed.includes(a.key))
  if (!active.length) return null

  return (
    <span className={`lc-alert-dots lc-alert-dots--${phase}`}>
      {active.map(a => (
        <span
          key={a.key}
          className={`lc-alert-icon lc-alert-icon--${a.level}`}
          title={a.label}
        >
          {a.iconType === 'fa' ? <i className={`fas ${a.icon}`} /> : a.icon}
        </span>
      ))}
    </span>
  )
}

function HomeScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const laddersList = useSelector(state => state.ladderList) || []
  const { loading, error, ladders } = laddersList
  const userLogin = useSelector(state => state.userLogin)
  const {userInfo} = userLogin
  const [ladderId, setLadderId] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeStocksOpen, setActiveStocksOpen] = useState(true)
  const [activeCryptoOpen, setActiveCryptoOpen] = useState(true)
  const [disabledStocksOpen, setDisabledStocksOpen] = useState(false)
  const [disabledCryptoOpen, setDisabledCryptoOpen] = useState(false)
  const hasFetchedRef = useRef(false)

  const changeLadderHandler = (newLadderId) => {
    setLadderId(newLadderId)
    setSidebarOpen(false)
  }
  
  // Fetch on mount, then poll every 60 seconds to keep sidebar data fresh
  useEffect(() => {
    if (!userInfo?.name) return
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      dispatch(listUsersLadders())
    }
    const interval = setInterval(() => {
      dispatch(pollUsersLadders())
    }, 60000)
    return () => clearInterval(interval)
  }, [dispatch, userInfo])
  
  // Set initial ladder when ladders first load; also select newest when list grows
  useEffect(() => {
    if (ladders && ladders.length > 0) {
      const sidebarFirst = () => {
        const bySymbol = (a, b) => (a.symbol || '').localeCompare(b.symbol || '')
        const hasActivity = l => Number(l.daily_profit || 0) !== 0 || Number(l.daily_debt || 0) !== 0
        const activeStocks   = [...ladders].filter(l => l.enable && l.market?.toLowerCase() === 'stocks')
        const activeCrypto   = [...ladders].filter(l => l.enable && l.market?.toLowerCase() === 'crypto')
        const withAct  = g => g.filter(l =>  hasActivity(l)).sort(bySymbol)
        const withOut  = g => g.filter(l => !hasActivity(l)).sort(bySymbol)
        const ordered  = [
          ...withAct(activeStocks), ...withOut(activeStocks),
          ...withAct(activeCrypto), ...withOut(activeCrypto),
          ...[...ladders].filter(l => !l.enable).sort(bySymbol),
        ]
        return (ordered[0] || ladders[0])._id
      }
      if (!isInitialized) {
        setLadderId(sidebarFirst())
        setIsInitialized(true)
      } else if (!ladders.find(l => l._id === ladderId)) {
        // Previously selected ladder is gone (deleted), fall back to sidebar first
        setLadderId(sidebarFirst())
      }
    }
  }, [ladders, isInitialized, ladderId])
  
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
  const sortBySymbol = (arr) => [...arr].sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''))

  const sortActiveGroup = (arr) => {
    const hasActivity = l => Number(l.daily_profit || 0) !== 0 || Number(l.daily_debt || 0) !== 0
    const active   = sortBySymbol(arr.filter(l =>  hasActivity(l)))
    const inactive = sortBySymbol(arr.filter(l => !hasActivity(l)))
    return [...active, ...inactive]
  }

  const activeStocks   = ladders ? sortActiveGroup(ladders.filter(l => l.enable  && l.market?.toLowerCase() === 'stocks')) : []
  const activeCrypto   = ladders ? sortActiveGroup(ladders.filter(l => l.enable  && l.market?.toLowerCase() === 'crypto')) : []
  const disabledStocks = ladders ? sortBySymbol(ladders.filter(l => !l.enable && l.market?.toLowerCase() === 'stocks')) : []
  const disabledCrypto = ladders ? sortBySymbol(ladders.filter(l => !l.enable && l.market?.toLowerCase() === 'crypto')) : []
  const otherLadders   = ladders ? sortBySymbol(ladders.filter(l => !['stocks','crypto'].includes(l.market?.toLowerCase()))) : []

  const renderCard = (ladder) => {
      //console.log(ladder)
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

      const dailyProfit = Number(ladder.daily_profit || 0)
      const dailyDebt   = Number(ladder.daily_debt   || 0)
      const fmtDaily = (v) => `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

      return (
        <div
          key={ladder._id}

          className={`ladder-card${isSelected ? ' selected' : ''}${isSampleName ? ' sample-card' : ''}${isDisabled ? ' disabled-card' : ''}${changeClass}`}
          onClick={() => changeLadderHandler(ladder._id)}
        >
          {/* Top row: symbol+name | budget bar | price+change */}
          <div className="lc-top-row">
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

          {/* Bottom strip: daily profit + daily debt + alert icons */}
          <div className="lc-daily-strip">
            <span className={`lc-daily lc-daily--profit${dailyProfit === 0 ? ' lc-daily--zero' : ''}`}>
              <span className={`lc-daily-dot lc-daily-dot--profit${dailyProfit === 0 ? ' lc-daily-dot--zero' : ''}`} />
              {fmtDaily(dailyProfit)}
            </span>
            <span className={`lc-daily lc-daily--debt${dailyDebt === 0 ? ' lc-daily--zero' : ''}`}>
              <span className={`lc-daily-dot lc-daily-dot--debt${dailyDebt === 0 ? ' lc-daily-dot--zero' : ''}`} />
              {fmtDaily(dailyDebt)}
            </span>
            <AlertBadge alertStr={ladder.alert || ''} />
          </div>
        </div>
      )
  }

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
            <>
              {activeStocks.length > 0 && (
                <div className="sidebar-section">
                  <div className="sidebar-section-header sidebar-section-header--active" onClick={() => setActiveStocksOpen(o => !o)}>
                    <span className="sidebar-section-title">ACTIVE STOCKS</span>
                    <span className="sidebar-section-count">{activeStocks.length}</span>
                    <span className={`sidebar-section-chevron${activeStocksOpen ? ' open' : ''}`}>▾</span>
                  </div>
                  {activeStocksOpen && activeStocks.map(renderCard)}
                </div>
              )}
              {activeCrypto.length > 0 && (
                <div className="sidebar-section">
                  <div className="sidebar-section-header sidebar-section-header--active" onClick={() => setActiveCryptoOpen(o => !o)}>
                    <span className="sidebar-section-title">ACTIVE CRYPTO</span>
                    <span className="sidebar-section-count">{activeCrypto.length}</span>
                    <span className={`sidebar-section-chevron${activeCryptoOpen ? ' open' : ''}`}>▾</span>
                  </div>
                  {activeCryptoOpen && activeCrypto.map(renderCard)}
                </div>
              )}
              {disabledStocks.length > 0 && (
                <div className="sidebar-section">
                  <div className="sidebar-section-header sidebar-section-header--disabled" onClick={() => setDisabledStocksOpen(o => !o)}>
                    <span className="sidebar-section-title">DISABLED STOCKS</span>
                    <span className="sidebar-section-count">{disabledStocks.length}</span>
                    <span className={`sidebar-section-chevron${disabledStocksOpen ? ' open' : ''}`}>▾</span>
                  </div>
                  {disabledStocksOpen && disabledStocks.map(renderCard)}
                </div>
              )}
              {disabledCrypto.length > 0 && (
                <div className="sidebar-section">
                  <div className="sidebar-section-header sidebar-section-header--disabled" onClick={() => setDisabledCryptoOpen(o => !o)}>
                    <span className="sidebar-section-title">DISABLED CRYPTO</span>
                    <span className="sidebar-section-count">{disabledCrypto.length}</span>
                    <span className={`sidebar-section-chevron${disabledCryptoOpen ? ' open' : ''}`}>▾</span>
                  </div>
                  {disabledCryptoOpen && disabledCrypto.map(renderCard)}
                </div>
              )}
              {otherLadders.length > 0 && otherLadders.map(renderCard)}
            </>
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
