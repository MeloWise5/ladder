import React, {useState, useEffect, useCallback, useRef, memo, useMemo} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Table, ListGroup, Card, Button, Accordion, Pagination} from 'react-bootstrap'
import Loader from '../components/Loader'
import Message from '../components/Message'
import {formatDate} from '../components/utilities';
import { getUserDetails } from '../actions/userActions'
import { cryptoDeleteTrade, stocksDeleteTrade } from '../actions/tradeActions'


function TransactionsTable({ladder=false, status}) {
  const hasLoadedUser = useRef(false)
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
    console.log('1',status)
    if(status === 'CLOSED'){console.log('CLOSED')
      all_user_transactions = user?.closed_transactions || [];
    }else if(status === 'OPEN'){console.log('OPEN')
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
  const cancelOrderHandler = useCallback((market,orderId,transaction_id, side, step_id) => {
    //console.log('cancelOrderHandler called:', {market, orderId, transaction_id, side, step_id});
    if (window.confirm('Are you sure you want to cancel this order? \n\nIf you want to Stop ALL SELLING of shares. \nEdit your ladders direction to BUY.\n Otherwise, the script will make the same trade.')) {
      console.log('User confirmed cancellation');
      market === 'Crypto' && dispatch(cryptoDeleteTrade({orderId, transaction_id, side, step_id}))
      market === 'Stocks' && dispatch(stocksDeleteTrade({orderId, transaction_id, side, step_id}))
    }
  }, [dispatch])
  //console.log(user)
  const closed_transaction_table = displayTransactions && displayTransactions.length > 0 ? (
    <Table striped bordered hover responsive className='table-sm'>
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
          // Find the matching step by currentStepId (or whatever field links it)
          return (
            <React.Fragment key={closed_transactions._id}>
              {/* Buy Row */}
              <tr style={{ borderTop: '5px solid grey' }}>
                <td rowSpan={2}>{closed_transactions._id}</td>
                <td rowSpan={2}>{closed_transactions.profit || '-'}</td>
                <td rowSpan={2}>{closed_transactions.step_details['step_code']}</td>
                <td>BUY</td>
                <td>{closed_transactions.buy_date && !['',0,'0', null, undefined].includes(closed_transactions.buy_date) ? 
                      formatDate(closed_transactions.buy_date) : 
                      (closed_transactions.buy_id && closed_transactions.buy_id !== '-' && closed_transactions.buy_id !== '0' && closed_transactions.buy_id.length > 2 ? 
                        <Button 
                        variant='danger' 
                        size='sm' 
                        onClick={() => cancelOrderHandler(
                                          ladder.market,
                                          closed_transactions.buy_id, 
                                          closed_transactions._id, 
                                          'BUY', 
                                          closed_transactions.step )}> Cancel Order</Button> : 
                        ''
                      )
                    }</td>
                <td>{formatDate(closed_transactions.buy_placed) || ''}</td>
                <td>{closed_transactions.buy_id || '-'}</td>
                <td rowSpan={2}>{closed_transactions.shares_per_trade || '-'}</td>
                <td>{closed_transactions.buy_price && !['',0,'0', null, undefined].includes(closed_transactions.buy_price) ? get_price(closed_transactions,'BUY') : '-'}</td>
                <td>{closed_transactions.buy_fee || '-'}</td>
                <td>{closed_transactions.buy_total || '-'}</td>
              </tr>
              {/* Sell Row */}
              <tr>
                <td>SELL</td>
                <td>{closed_transactions.sell_date && !['',0,'0', null, undefined].includes(closed_transactions.sell_date) ? 
                      formatDate(closed_transactions.sell_date) : 
                      ( closed_transactions.sell_id && closed_transactions.sell_id !== '-' && closed_transactions.sell_id !== '0' && closed_transactions.sell_id.length > 2 ?
                        <Button 
                        variant='danger' 
                        size='sm' 
                        onClick={() => cancelOrderHandler(
                                          closed_transactions.ladder_market,
                                          closed_transactions.sell_id, 
                                          closed_transactions._id, 
                                          'SELL', 
                                          closed_transactions.step )}> Cancel Order</Button> : ''
                        )
                    }</td>
                <td>{closed_transactions.sell_placed || ''}</td>
                <td>{closed_transactions.sell_id || ''}</td>
                <td>{closed_transactions.sell_price && !['',0,'0', null, undefined].includes(closed_transactions.sell_price) ? get_price(closed_transactions,'SELL') : '-'}</td>
                <td>{closed_transactions.sell_fee || '-'}</td>
                <td>{closed_transactions.sell_total || '-'}</td>
              </tr>
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
    <div>
      <Accordion defaultActiveKey={null} className='mb-2'>
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          {status === 'CLOSED' ? (
            currentDateLabel 
              ? `${displayTransactions.length} Closed Transactions - ${currentDateLabel}` 
              : `${all_user_transactions.length} Closed Transactions`
          ) : (
            `${all_user_transactions.length} Open Transactions`
          )}
        </Accordion.Header>
        <Accordion.Body>
          {paginationComponent}
          {closed_transaction_table}
          {paginationComponent}
        </Accordion.Body>
      </Accordion.Item>
      </Accordion>
    </div>
  )
}

export default memo(TransactionsTable)
