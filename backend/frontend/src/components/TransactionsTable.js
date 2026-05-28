import React, {useState, useEffect, useCallback, useRef, memo, useMemo} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Table, ListGroup, Card, Button, Pagination} from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import {formatDate} from '../components/utilities';
import { getUserDetails } from '../actions/userActions'
import { cryptoDeleteTrade, stocksDeleteTrade } from '../actions/tradeActions'


function TransactionsTable({ladder=false, status, selectedStep, onStepClick}) {
  const hasLoadedUser = useRef(false)
  const rowRefs = useRef({})
  const tableBodyRef = useRef(null)
  const [flashId, setFlashId] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userDetails = useSelector(state => state.userDetails)
  const {loading, error, user} = userDetails
  const [currentPage, setCurrentPage] = useState(0)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  
  useEffect(() => {
    if((!user || !user.name) && !hasLoadedUser.current){
      dispatch(getUserDetails('profile'))
      hasLoadedUser.current = true
    }
  }, [dispatch, user?.name])

  // Scroll to & highlight the row matching the selected step.
  // The highlight persists as long as selectedStep points to that transaction.
  useEffect(() => {
    if (!selectedStep) {
      setFlashId(null);
      return;
    }
    const match = displayTransactions.find(
      t => String(t.step) === String(selectedStep._id)
    );
    setFlashId(match ? match._id : null);
    if (!match) return;
    const el = rowRefs.current[match._id];
    const container = tableBodyRef.current;
    if (el && container) {
      // Subtract the sticky thead height so the row lands just below the header,
      // not one row-height behind it.
      const thead = container.querySelector('thead');
      const theadHeight = thead ? thead.getBoundingClientRect().height : 0;
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      container.scrollTop += elRect.top - containerRect.top - theadHeight;
    }
  }, [selectedStep]);
  //console.log(user)
  // Helper function to format prices based on ladder type
  const get_price = (transaction, side) => {
    if(transaction && (transaction.ladder_type.toLowerCase() === 'fixed' || transaction.ladder_type.toLowerCase() === 'otoco')){
      if(side === 'BUY'){
        return `$${Number(transaction.buy_price).toFixed(2)}`
      }
      if(side === 'SELL'){
        return `$${Number(transaction.sell_price).toFixed(2)}`
      }
    }
    if(transaction && transaction.ladder_type.toLowerCase() === 'percentage'){
      if(side === 'SELL'){
        if(transaction.ladder_market.toLowerCase() === 'crypto'){
          return `$${Number(transaction.sell_price).toFixed(6)}`
        }else{
          return `$${Number(transaction.sell_price).toFixed(2)}`
        }
      }
      if(side === 'BUY'){
        if(transaction.ladder_market.toLowerCase() === 'crypto'){
          return `$${Number(transaction.buy_price).toFixed(6)}`
        }else{
          return `$${Number(transaction.buy_price).toFixed(2)}`
        }
      }
    }
    return '-'
  }
  
  let all_user_transactions = []
  if (!ladder){
    //console.log('1',status)
    if(status === 'CLOSED'){//console.log('CLOSED')
      all_user_transactions = user?.closed_transactions || [];
    }else if(status === 'OPEN'){//console.log('OPEN')
      all_user_transactions = user?.open_transactions || [];
    }
    // grab the user id from the state
    // grab all ladder from this user
    // then grab all transactions for each ladder.
    // sort list by sell date acending. the newest on top
  }else if(ladder){
    if(status === 'CLOSED'){
      all_user_transactions = ladder.closed_transactions || [];
    }else if(status === 'OPEN'){
      all_user_transactions = ladder.transactions || [];
    }
    // grab all the ladder for this user
    // grab all the transactions for each ladder.
    // sort list by sell date acending. the newest on top
  }

  // Group closed transactions by date
  const transactionsByDate = useMemo(() => {
    if (status !== 'CLOSED' || !all_user_transactions.length) {
      return { dates: [], groupedData: {} };
    }

    const grouped = {};
    all_user_transactions.forEach(transaction => {
      // Use sell_date for closed transactions
      const dateValue = transaction.sell_date;
      if (!dateValue || ['', 0, '0', null, undefined].includes(dateValue)) {
        return; // Skip transactions without sell date
      }

      // Convert to date string (format: "Jan 1")
      const date = new Date(
        typeof dateValue === 'string' && dateValue.includes('-') 
          ? dateValue 
          : parseFloat(dateValue) * 1000
      );
      
      const dateKey = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: date,
          dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          transactions: []
        };
      }
      grouped[dateKey].transactions.push(transaction);
    });

    // Sort dates descending (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      grouped[b].date - grouped[a].date
    );

    return { dates: sortedDates, groupedData: grouped };
  }, [all_user_transactions, status]);

  // Reset to first page if dates change
  useEffect(() => {
    if (status === 'CLOSED' && transactionsByDate.dates.length > 0) {
      setCurrentPage(0);
    }
  }, [transactionsByDate.dates.length, status]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get transactions for current page
  const displayTransactions = useMemo(() => {
    let transactions;
    if (status !== 'CLOSED' || transactionsByDate.dates.length === 0) {
      transactions = all_user_transactions;
    } else {
      const currentDateKey = transactionsByDate.dates[currentPage];
      transactions = transactionsByDate.groupedData[currentDateKey]?.transactions || [];
    }

    // Apply sorting
    if (sortConfig.key) {
      const sorted = [...transactions].sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'step') {
          aValue = parseInt(a.step_details?.['step_code'] || 0);
          bValue = parseInt(b.step_details?.['step_code'] || 0);
        } else if (sortConfig.key === 'id') {
          aValue = parseInt(a._id || 0);
          bValue = parseInt(b._id || 0);
        } else if (sortConfig.key === 'profit') {
          aValue = parseFloat(a.profit || 0);
          bValue = parseFloat(b.profit || 0);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sorted;
    }

    return transactions;
  }, [status, transactionsByDate, currentPage, all_user_transactions, sortConfig]);

  const currentDateLabel = useMemo(() => {
    if (status !== 'CLOSED' || transactionsByDate.dates.length === 0) {
      return '';
    }
    const currentDateKey = transactionsByDate.dates[currentPage];
    return transactionsByDate.groupedData[currentDateKey]?.dateLabel || '';
  }, [status, transactionsByDate, currentPage]);
  const fmt = (v) => {
    if (v === null || v === undefined || v === '' || v === '-') return '-';
    const n = parseFloat(v);
    return isNaN(n) ? '-' : `$${n.toFixed(2)}`;
  };
  const fmtShares = (v) => {
    if (v === null || v === undefined || v === '' || v === '-') return '-';
    const n = parseFloat(v);
    return isNaN(n) ? '-' : n.toFixed(4).replace(/\.?0+$/, '') || '0';
  };

  const cancelOrderHandler = useCallback((market,orderId,transaction_id, side, step_id) => {
    //console.log('cancelOrderHandler called:', {market, orderId, transaction_id, side, step_id});
    if (window.confirm('Are you sure you want to cancel this order? \n\nIf you want to Stop ALL SELLING of shares. \nEdit your ladders direction to BUY.\n Otherwise, the script will make the same trade.')) {
      //console.log('User confirmed cancellation');
      market === 'Crypto' && dispatch(cryptoDeleteTrade({orderId, transaction_id, side, step_id}))
      market === 'Stocks' && dispatch(stocksDeleteTrade({orderId, transaction_id, side, step_id}))
    }
  }, [dispatch])
  //console.log(user)
  const closed_transaction_table = displayTransactions && displayTransactions.length > 0 ? (
    <Table className='table-sm dark-table'>
      <thead>
        <tr>
          <th 
            onClick={() => handleSort('id')} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
          </th>
          <th 
            onClick={() => handleSort('profit')} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            PROFIT {sortConfig.key === 'profit' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
          </th>
          <th 
            onClick={() => handleSort('step')} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            STEP {sortConfig.key === 'step' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
          </th>
          <th>SIDE</th>
          <th>Purchase Date</th>
          <th>Trade Placed</th>
          <th>ID</th>
          <th>Shares</th>
          <th>Price</th>
          <th>Fee</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {displayTransactions.map((closed_transactions, index) => {
          // Find the matching step for this transaction (for click-to-select)
          const handleRowClick = () => {
            if (!onStepClick || !ladder?.steps) return;
            const matchingStep = ladder.steps.find(
              s => String(s.transaction?._id) === String(closed_transactions._id)
            );
            if (!matchingStep) return;
            onStepClick(selectedStep && String(selectedStep._id) === String(matchingStep._id) ? null : matchingStep);
          };
          const isOtoco = closed_transactions.ladder_type?.toLowerCase() === 'otoco';
          const buyCancelId  = isOtoco ? closed_transactions.order_id : closed_transactions.buy_id;
          const sellCancelId = isOtoco ? closed_transactions.order_id : closed_transactions.sell_id;
          const limitPct = Number(closed_transactions.limit_price_in_percentage || 0);
          const stopPct  = Number(closed_transactions.stop_price_in_percentage  || 0);
          return (
            <React.Fragment key={closed_transactions._id}>
              {/* OTOCO Order ID header */}
              {isOtoco && closed_transactions.order_id && (
                <tr className="otoco-order-id-row">
                  <td colSpan={11} className="otoco-order-id-cell">
                    <div className="otoco-order-id-cell-flex">
                    <span className="otoco-order-id-label">ORDER ID</span>
                    <span className="otoco-order-id-value">{closed_transactions.order_id}</span>
                    {buyCancelId && buyCancelId !== '-' && buyCancelId !== '0' && String(buyCancelId).length > 2 && (
                      <Button variant='danger' size='sm' className="otoco-cancel-btn"
                        onClick={(e) => { e.stopPropagation(); cancelOrderHandler(ladder.market, buyCancelId, closed_transactions._id, 'OTOCO', closed_transactions.step); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle', display:'inline-block', marginRight:'4px'}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        Cancel Order
                      </Button>
                    )}</div>
                  </td>
                </tr>
              )}
              {/* Buy Row */}
              <tr
                ref={el => { rowRefs.current[closed_transactions._id] = el; }}
                className={`txn-row-group-start${flashId === closed_transactions._id ? ' txn-row-flash' : ''}`}
                onClick={handleRowClick}
                style={{ cursor: onStepClick ? 'pointer' : 'default' }}
              >
                <td rowSpan={isOtoco ? 3 : 2}>{closed_transactions._id}</td>
                <td rowSpan={isOtoco ? 3 : 2}>{closed_transactions.profit ? fmt(closed_transactions.profit) : '-'}</td>
                <td rowSpan={isOtoco ? 3 : 2}>{closed_transactions.step_details['step_code']}</td>
                <td>BUY</td>
                <td>{closed_transactions.buy_date && !['',0,'0', null, undefined].includes(closed_transactions.buy_date) ? 
                      formatDate(closed_transactions.buy_date) : 
                      (!isOtoco && buyCancelId && buyCancelId !== '-' && buyCancelId !== '0' && String(buyCancelId).length > 2 ? 
                        <Button 
                        variant='danger' 
                        size='sm' 
                        onClick={() => cancelOrderHandler(
                                          ladder.market,
                                          buyCancelId, 
                                          closed_transactions._id, 
                                          'BUY', 
                                          closed_transactions.step )}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle', display:'block'}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </Button> : 
                        ''
                      )
                    }</td>
                <td>{formatDate(closed_transactions.buy_placed) || ''}</td>
                <td>{closed_transactions.buy_id || '-'}</td>
                <td>{fmtShares(closed_transactions.shares_per_trade)}</td>
                <td>{closed_transactions.buy_price && !['',0,'0', null, undefined].includes(closed_transactions.buy_price) ? get_price(closed_transactions,'BUY') : '-'}</td>
                <td>{fmt(closed_transactions.buy_fee)}</td>
                <td>{fmt(closed_transactions.buy_total)}</td>
              </tr>
              {/* Sell Row(s) */}
              {isOtoco ? (
                <>
                  {/* LIMIT sell (profit target) — green */}
                  <tr className={`otoco-limit-row${flashId === closed_transactions._id ? ' txn-row-flash' : ''}`}
                    onClick={handleRowClick}
                    style={{ cursor: onStepClick ? 'pointer' : 'default' }}
                  >
                    <td className="otoco-limit-side">LIMIT SELL</td>
                    <td>{closed_transactions.sell_date && !['',0,'0',null,undefined].includes(closed_transactions.sell_date) ? formatDate(closed_transactions.sell_date) : '—'}</td>
                    <td>{formatDate(closed_transactions.sell_placed) || '—'}</td>
                    <td>{closed_transactions.sell_id || '—'}</td>
                    <td>{fmtShares(closed_transactions.shares_per_trade)}</td>
                    <td className="otoco-limit-price">
                      {closed_transactions.buy_price && !['',0,'0',null,undefined].includes(closed_transactions.buy_price)
                        ? `$${(Number(closed_transactions.buy_price) * (1 + limitPct / 100)).toFixed(2)}`
                        : '—'}
                      {limitPct > 0 && <span className="otoco-pct-badge up">+{limitPct}%</span>}
                    </td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                  {/* STOP sell (stop loss) — red */}
                  <tr className={`otoco-stop-row${flashId === closed_transactions._id ? ' txn-row-flash' : ''}`}
                    onClick={handleRowClick}
                    style={{ cursor: onStepClick ? 'pointer' : 'default' }}
                  >
                    <td className="otoco-stop-side">STOP SELL</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>{fmtShares(closed_transactions.shares_per_trade)}</td>
                    <td className="otoco-stop-price">
                      {closed_transactions.buy_price && !['',0,'0',null,undefined].includes(closed_transactions.buy_price)
                        ? `$${(Number(closed_transactions.buy_price) * (1 - stopPct / 100)).toFixed(2)}`
                        : '—'}
                      {stopPct > 0 && <span className="otoco-pct-badge down">-{stopPct}%</span>}
                    </td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                </>
              ) : (
                <tr className={flashId === closed_transactions._id ? 'txn-row-flash' : ''}
                  onClick={handleRowClick}
                  style={{ cursor: onStepClick ? 'pointer' : 'default' }}
                >
                  <td>SELL</td>
                  <td>{closed_transactions.sell_date && !['',0,'0', null, undefined].includes(closed_transactions.sell_date) ? 
                        formatDate(closed_transactions.sell_date) : 
                        ( sellCancelId && sellCancelId !== '-' && sellCancelId !== '0' && String(sellCancelId).length > 2 ?
                          <Button 
                          variant='danger' 
                          size='sm' 
                          onClick={() => cancelOrderHandler(
                                            closed_transactions.ladder_market,
                                            sellCancelId, 
                                            closed_transactions._id, 
                                            'SELL', 
                                            closed_transactions.step )}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle', display:'block'}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          </Button> : ''
                          )
                      }</td>
                  <td>{formatDate(closed_transactions.sell_placed) || ''}</td>
                  <td>{closed_transactions.sell_id || ''}</td>
                  <td>{fmtShares(closed_transactions.shares_per_trade)}</td>
                  <td>{closed_transactions.sell_price && !['',0,'0', null, undefined].includes(closed_transactions.sell_price) ? get_price(closed_transactions,'SELL') : '-'}</td>
                  <td>{fmt(closed_transactions.sell_fee)}</td>
                  <td>{fmt(closed_transactions.sell_total)}</td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </Table>
  ) : (
    <Message variant='info'>No Closed Transactions available for this ladder.</Message>
  );

  // Pagination component for closed transactions
  const paginationComponent = status === 'CLOSED' && transactionsByDate.dates.length > 1 ? (
    <div className="d-flex justify-content-center mt-3 mb-3">
      <Pagination>
        <Pagination.First 
          onClick={() => setCurrentPage(0)} 
          disabled={currentPage === 0}
        />
        <Pagination.Prev 
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
          disabled={currentPage === 0}
        />
        
        {transactionsByDate.dates.map((dateKey, index) => {
          const pageData = transactionsByDate.groupedData[dateKey];
          // Show max 5 pages at a time, centered on current page
          const maxVisiblePages = 5;
          const halfVisible = Math.floor(maxVisiblePages / 2);
          const startPage = Math.max(0, currentPage - halfVisible);
          const endPage = Math.min(transactionsByDate.dates.length, startPage + maxVisiblePages);
          
          if (index < startPage || index >= endPage) {
            if (index === startPage - 1 || index === endPage) {
              return <Pagination.Ellipsis key={dateKey} disabled />;
            }
            return null;
          }

          return (
            <Pagination.Item
              key={dateKey}
              active={index === currentPage}
              onClick={() => setCurrentPage(index)}
            >
              {pageData.dateLabel}
            </Pagination.Item>
          );
        })}
        
        <Pagination.Next 
          onClick={() => setCurrentPage(prev => Math.min(transactionsByDate.dates.length - 1, prev + 1))} 
          disabled={currentPage === transactionsByDate.dates.length - 1}
        />
        <Pagination.Last 
          onClick={() => setCurrentPage(transactionsByDate.dates.length - 1)} 
          disabled={currentPage === transactionsByDate.dates.length - 1}
        />
      </Pagination>
    </div>
  ) : null;

  return (
    <div className="txn-table-card">
      <div className="txn-table-card-header">
        <span className="txn-stats-title">
          {status === 'CLOSED' ? (
            currentDateLabel
              ? `${displayTransactions.length} Closed Transactions — ${currentDateLabel}`
              : `${all_user_transactions.length} Closed Transactions`
          ) : (
            `${all_user_transactions.length} Open Transactions`
          )}
        </span>
      </div>
      <div className="txn-table-body" ref={tableBodyRef}>
        {paginationComponent}
        {closed_transaction_table}
        {paginationComponent}
      </div>
    </div>
  )
}

export default memo(TransactionsTable)
