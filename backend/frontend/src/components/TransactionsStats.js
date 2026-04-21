import React, {useState, useEffect, useMemo, useRef, memo} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Table, ListGroup, Card, Button} from 'react-bootstrap'
import Loader from './Loader'
import { getUserDetails } from '../actions/userActions'


function TransactionsStats({ladder=false, selectedStepId=null, onStepIdClick=null}) {
  const hasLoadedUser = useRef(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userDetails = useSelector(state => state.userDetails)
  const {loading: userLoading, error, user} = userDetails
  // Only fetch user profile when not in ladder mode (global stats view)
  useEffect(() => {
    if(!ladder && (!user || !user.name) && !hasLoadedUser.current){
      dispatch(getUserDetails('profile'))
      hasLoadedUser.current = true
    }
  }, [dispatch, user?.name, ladder])
  // When ladder prop is provided, data is already available — don't block on user API
  const loading = ladder ? false : userLoading
  
  const transaction_report = useMemo(() => {
    //console.log('ladder prop:', ladder);
    //console.log('user data:', user);
    
    let transactions_stats = {}
    
    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const todayDate = new Date();
    const currentMonthName = MONTH_NAMES[todayDate.getMonth()];
    const dailyDateStr = todayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (!ladder){
      transactions_stats.open_transaction_count = user?.open_transaction_count ?? 0;
      transactions_stats.closed_transaction_count = user?.closed_transaction_count ?? 0;
      transactions_stats.avg_buy_days = user?.avg_buy_days ?? 0;
      transactions_stats.avg_sell_days = user?.avg_sell_days ?? 0;
      transactions_stats.avg_trades_per_day = user?.avg_trades_per_day ?? 0;
      transactions_stats.avg_profit_per_day = user?.avg_profit_per_day ?? 0;
      transactions_stats.top_5_days_by_profit = user?.top_5_days_by_profit || [];
      transactions_stats.top_5_steps_by_profit = user?.top_5_steps_by_profit || [];
      transactions_stats.daily_profit = user?.daily_profit ?? 0;
      transactions_stats.daily_debt = user?.daily_debt ?? 0;
      transactions_stats.daily_buy_count = user?.daily_buy_count ?? 0;
      transactions_stats.daily_sell_count = user?.daily_sell_count ?? 0;
      transactions_stats.monthly_profit = user?.monthly_profit ?? 0;
      transactions_stats.monthly_debt = user?.monthly_debt ?? 0;
      transactions_stats.monthly_buy_count = user?.monthly_buy_count ?? 0;
      transactions_stats.monthly_sell_count = user?.monthly_sell_count ?? 0;
      transactions_stats.monthly_breakdown = user?.monthly_breakdown || [];
      transactions_stats.currentMonthName = currentMonthName;
      transactions_stats.dailyDateStr = dailyDateStr;
    }else if(ladder){
      transactions_stats.open_transaction_count = ladder?.open_transaction_count ?? 0;
      transactions_stats.closed_transaction_count = ladder?.closed_transaction_count ?? 0;
      transactions_stats.avg_buy_days = ladder?.avg_buy_days ?? 0;
      transactions_stats.avg_sell_days = ladder?.avg_sell_days ?? 0;
      transactions_stats.avg_trades_per_day = ladder?.avg_trades_per_day ?? 0;
      transactions_stats.avg_profit_per_day = ladder?.avg_profit_per_day ?? 0;
      transactions_stats.top_5_days_by_profit = ladder?.top_5_days_by_profit || [];
      transactions_stats.top_5_steps_by_profit = ladder?.top_5_steps_by_profit || [];
      transactions_stats.daily_profit = ladder?.daily_profit ?? 0;
      transactions_stats.daily_debt = ladder?.daily_debt ?? 0;
      transactions_stats.daily_buy_count = ladder?.daily_buy_count ?? 0;
      transactions_stats.daily_sell_count = ladder?.daily_sell_count ?? 0;
      transactions_stats.monthly_profit = ladder?.monthly_profit ?? 0;
      transactions_stats.monthly_debt = ladder?.monthly_debt ?? 0;
      transactions_stats.monthly_buy_count = ladder?.monthly_buy_count ?? 0;
      transactions_stats.monthly_sell_count = ladder?.monthly_sell_count ?? 0;
      transactions_stats.monthly_breakdown = ladder?.monthly_breakdown || [];
      transactions_stats.currentMonthName = currentMonthName;
      transactions_stats.dailyDateStr = dailyDateStr;
    }

    //console.log('Final transactions_stats:', transactions_stats);
    //console.log('useMemo recalculating - avg_buy_days:', transactions_stats.avg_buy_days);
    
    return (
      <div className="txn-stats-grid">
        {/* Card 1 — Trade Averages */}
        <div className="txn-stats-card">
          <div className="txn-stats-card-header">
            <span className="txn-stats-title">TRANSACTIONS</span>
            <span className="txn-stats-badge">
              {transactions_stats.open_transaction_count} Open &nbsp;·&nbsp; {transactions_stats.closed_transaction_count} Closed
            </span>
          </div>
          {loading ? <Loader /> : (
            <div className="txn-stats-body">
              <div className="txn-stats-row">
                <span className="txn-stats-label">Avg Buy Days</span>
                <span className="txn-stats-val">{transactions_stats.avg_buy_days}</span>
              </div>
              <div className="txn-stats-row">
                <span className="txn-stats-label">Avg Sell Days</span>
                <span className="txn-stats-val">{transactions_stats.avg_sell_days}</span>
              </div>
              <div className="txn-stats-row">
                <span className="txn-stats-label">Trades Per Day</span>
                <span className="txn-stats-val">{transactions_stats.avg_trades_per_day}</span>
              </div>
              <div className="txn-stats-row">
                <span className="txn-stats-label">Profit Per Day</span>
                <span className="txn-stats-val pos">${transactions_stats.avg_profit_per_day}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 2 — Top 5 */}
        <div className="txn-stats-card txn-stats-card--top5">
          <div className="txn-stats-card-header">
            <span className="txn-stats-title">TOP 5</span>
          </div>
          {loading ? <Loader /> : (
            <div className="txn-stats-top5">
              <div className="txn-stats-top5-col">
                <div className="txn-stats-col-label">Days by Profit</div>
                {transactions_stats.top_5_days_by_profit?.length > 0 ? (
                  transactions_stats.top_5_days_by_profit.map((day, i) => (
                    <div key={i} className="txn-stats-row">
                      <span className="txn-stats-label">{day.date}</span>
                      <span className="txn-stats-val pos">${day.profit}</span>
                    </div>
                  ))
                ) : <div className="txn-stats-empty">No data</div>}
              </div>
              <div className="txn-stats-top5-divider" />
              <div className="txn-stats-top5-col">
                <div className="txn-stats-col-label">Steps by Profit</div>
                {transactions_stats.top_5_steps_by_profit?.length > 0 ? (
                  transactions_stats.top_5_steps_by_profit.map((step, i) => (
                    <div key={i}
                      className={`txn-stats-row${ladder ? ' txn-stats-row--clickable' : ''}${ladder && selectedStepId === step.step_id ? ' txn-stats-row--active' : ''}`}
                      onClick={ladder ? () => onStepIdClick && onStepIdClick(selectedStepId === step.step_id ? null : step.step_id) : undefined}
                      title={step.ladder_name}
                    >
                      <span className="txn-stats-label">
                        {typeof step.price === 'number' ? `$${step.price.toFixed(2)}` : step.price}
                      </span>
                      <span className="txn-stats-val pos">
                        ${typeof step.profit === 'number' ? step.profit.toFixed(2) : step.profit}
                      </span>
                    </div>
                  ))
                ) : <div className="txn-stats-empty">No data</div>}
              </div>
            </div>
          )}
        </div>

        {/* Card 3 — Daily */}
        <div className="txn-stats-card txn-stats-card--daily">
          <div className="txn-stats-card-header">
            <span className="txn-stats-title">DAILY</span>
            <span className="txn-stats-badge">{transactions_stats.dailyDateStr}</span>
          </div>
          {loading ? <Loader /> : (
            <div className="txn-stats-body">
              <div className="txn-stats-row">
                <span className="txn-stats-label">Total Profit</span>
                <span className={`txn-stats-val ${transactions_stats.daily_profit >= 0 ? 'pos' : 'neg'}`}>${transactions_stats.daily_profit}</span>
              </div>
              <div className="txn-stats-row">
                <span className="txn-stats-label">Total Debt</span>
                <span className="txn-stats-val">${transactions_stats.daily_debt}</span>
              </div>
              <div className="txn-stats-row">
                <span className="txn-stats-label">Buy Trades</span>
                <span className="txn-stats-val">{transactions_stats.daily_buy_count}</span>
              </div>
              <div className="txn-stats-row">
                <span className="txn-stats-label">Sell Trades</span>
                <span className="txn-stats-val">{transactions_stats.daily_sell_count}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 4 — Monthly */}
        <div className="txn-stats-card">
          <div className="txn-stats-card-header">
            <span className="txn-stats-title">MONTHLY</span>
          </div>
          {loading ? <Loader /> : (
            <div className="txn-stats-monthly-scroll">
              {transactions_stats.monthly_breakdown?.length > 0 ? (
                <table className="txn-stats-monthly-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Profit</th>
                      <th>Debt</th>
                      <th>Buys</th>
                      <th>Sells</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions_stats.monthly_breakdown.map((row, i) => (
                      <tr key={i}>
                        <td className="month-label">{row.month}</td>
                        <td className={row.profit >= 0 ? 'profit-pos' : 'profit-neg'}>${row.profit}</td>
                        <td>${row.debt}</td>
                        <td>{row.buy_count}</td>
                        <td>{row.sell_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="txn-stats-empty">No data</div>}
            </div>
          )}
        </div>

      </div>
      );
    }, [user, ladder, loading, selectedStepId, onStepIdClick]);
  return (
    <>
      {transaction_report}
      </>
  )
}

export default memo(TransactionsStats)
