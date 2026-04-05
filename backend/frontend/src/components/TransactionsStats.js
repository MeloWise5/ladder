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
    
    if (!ladder){
      transactions_stats.open_transaction_count = user?.open_transaction_count ?? 0;
      transactions_stats.closed_transaction_count = user?.closed_transaction_count ?? 0;
      transactions_stats.avg_buy_days = user?.avg_buy_days ?? 0;
      transactions_stats.avg_sell_days = user?.avg_sell_days ?? 0;
      transactions_stats.avg_trades_per_day = user?.avg_trades_per_day ?? 0;
      transactions_stats.avg_profit_per_day = user?.avg_profit_per_day ?? 0;
      transactions_stats.top_5_days_by_profit = user?.top_5_days_by_profit || [];
      transactions_stats.top_5_steps_by_profit = user?.top_5_steps_by_profit || [];
    }else if(ladder){
      transactions_stats.open_transaction_count = ladder?.open_transaction_count ?? 0;
      transactions_stats.closed_transaction_count = ladder?.closed_transaction_count ?? 0;
      transactions_stats.avg_buy_days = ladder?.avg_buy_days ?? 0;
      transactions_stats.avg_sell_days = ladder?.avg_sell_days ?? 0;
      transactions_stats.avg_trades_per_day = ladder?.avg_trades_per_day ?? 0;
      transactions_stats.avg_profit_per_day = ladder?.avg_profit_per_day ?? 0;
      transactions_stats.top_5_days_by_profit = ladder?.top_5_days_by_profit || [];
      transactions_stats.top_5_steps_by_profit = ladder?.top_5_steps_by_profit || [];
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
        <div className="txn-stats-card">
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
                      className={`txn-stats-row txn-stats-row--clickable${selectedStepId === step.step_id ? ' txn-stats-row--active' : ''}`}
                      onClick={() => onStepIdClick && onStepIdClick(selectedStepId === step.step_id ? null : step.step_id)}
                    >
                      <span className="txn-stats-label">
                        <b>{step.step_code}</b> &nbsp;
                        <i>{typeof step.price === 'number' ? `$${step.price.toFixed(2)}` : step.price}</i>
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
