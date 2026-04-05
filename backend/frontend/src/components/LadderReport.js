import React, {useState, useEffect, memo, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import LineGraph from './Charts/LineGraph'
import { getUserDetails } from '../actions/userActions'

const LadderReport = memo(function LadderReport({LADDER_DATA=false}) {
  const [ladderId, setLadderId] = useState(false)
  const [ladderName, setLadderName] = useState(false)
  const [date_method, setDateMethod] = useState('week')
  const [shouldLoadCharts, setShouldLoadCharts] = useState(false)
  const hasLoadedUser = useRef(false)
  const dispatch = useDispatch()
  const userDetails = useSelector(state => state.userDetails)
  const { user } = userDetails

  useEffect(() => {
    if ((!user || !user.name) && !hasLoadedUser.current) {
      dispatch(getUserDetails('profile'))
      hasLoadedUser.current = true
    }
  }, [dispatch, user?.name])

  useEffect(() => {
    if (!LADDER_DATA || !LADDER_DATA._id) {
      setLadderId(false)
      setLadderName('All Ladders')
    } else {
      setLadderId(LADDER_DATA._id)
      setLadderName(LADDER_DATA.name)
    }
  }, [LADDER_DATA])

  useEffect(() => {
    const timer = setTimeout(() => setShouldLoadCharts(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="stock-chart-section" style={{marginBottom: 'var(--gap-md)'}}>
      <div className="stock-chart-header">
        <div className="chart-view-btns">
          <button className="chart-view-btn active" style={{cursor:'default'}}>
            <i className="fas fa-coins" />
            Profit &amp; Debt — {ladderName || 'All Ladders'}
          </button>
        </div>
        <div className="stock-range-btns">
          {[['week','1W'],['month','1M'],['year','1Y'],['all','ALL']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDateMethod(val)}
              className={`stock-range-btn${date_method === val ? ' active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-panel chart-panel--visible">
        {shouldLoadCharts
          ? <LineGraph LADDER_ID={ladderId} DATE_METHOD={date_method} />
          : <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-dim)'}}>Loading…</div>
        }
      </div>
    </div>
  )
})

export default LadderReport
