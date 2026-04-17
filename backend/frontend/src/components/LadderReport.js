import React, {useState, useEffect, memo, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import LineGraph from './Charts/LineGraph'
import LineGraphBreakdown from './Charts/LineGraphBreakdown'
import LineGraphStacked from './Charts/LineGraphStacked'
import { getUserDetails } from '../actions/userActions'

const LadderReport = memo(function LadderReport({LADDER_DATA=false}) {
  const [ladderId, setLadderId] = useState(false)
  const [ladderName, setLadderName] = useState(false)
  const [date_method, setDateMethod] = useState('week')
  const [chartView, setChartView] = useState('combined') // 'combined' | 'breakdown'
  const [breakdownMode, setBreakdownMode] = useState('profit') // 'profit' | 'debt'
  const [shouldLoadCharts, setShouldLoadCharts] = useState(false)
  const hasLoadedUser = useRef(false)
  const dispatch = useDispatch()
  const userDetails = useSelector(state => state.userDetails)
  const { user } = userDetails
  const snapshotBreakdown = useSelector(state => state.snapshotBreakdownChart)

  // Compute latest total profit + debt from the last data point
  const breakdownTotals = (() => {
    const bd = snapshotBreakdown?.breakdown
    if (!bd || !bd.dates || bd.dates.length === 0) return null
    const last = bd.dates.length - 1
    const profit = bd.ladders.reduce((s, l) => s + (l.profit[last] || 0), 0)
    const debt   = bd.ladders.reduce((s, l) => s + (l.debt[last]   || 0), 0)
    return { profit, debt }
  })()

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
          <button
            onClick={() => setChartView('combined')}
            className={`chart-view-btn${chartView === 'combined' ? ' active' : ''}`}
            style={chartView !== 'combined' ? {cursor:'pointer'} : {cursor:'default'}}
          >
            <i className="fas fa-coins" />
            Profit &amp; Debt — {ladderName || 'All Ladders'}
          </button>
          <button
            onClick={() => setChartView('breakdown')}
            className={`chart-view-btn${chartView === 'breakdown' ? ' active' : ''}`}
            style={chartView !== 'breakdown' ? {cursor:'pointer'} : {cursor:'default'}}
          >
            <i className="fas fa-layer-group" />
            Breakdown
          </button>
        </div>
        {chartView === 'combined' && !ladderId && breakdownTotals && (
          <div className="chart-totals-strip">
            <span className="chart-total-pill chart-total-pill--profit">
              <i className="fas fa-arrow-trend-up" />
              ${breakdownTotals.profit.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
            </span>
            <span className="chart-total-pill chart-total-pill--debt">
              <i className="fas fa-arrow-trend-down" />
              ${breakdownTotals.debt.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
            </span>
          </div>
        )}
        <div className="stock-range-btns">
          {chartView === 'breakdown' && <>
            <button onClick={() => setBreakdownMode('profit')} className={`stock-range-btn${breakdownMode === 'profit' ? ' active' : ''}`}>Profit</button>
            <button onClick={() => setBreakdownMode('debt')} className={`stock-range-btn${breakdownMode === 'debt' ? ' active' : ''}`}>Debt</button>
            <span style={{width:'1px', background:'var(--border)', margin:'0 4px', alignSelf:'stretch'}} />
          </>}
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
        {shouldLoadCharts ? (
          chartView === 'combined'
            ? ladderId
              ? <LineGraph LADDER_ID={ladderId} DATE_METHOD={date_method} />
              : <LineGraphStacked DATE_METHOD={date_method} />
            : <LineGraphBreakdown DATE_METHOD={date_method} MODE={breakdownMode} />
        ) : (
          <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-dim)'}}>Loading…</div>
        )}
      </div>
    </div>
  )
})

export default LadderReport
