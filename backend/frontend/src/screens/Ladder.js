import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import {Link, useParams, useNavigate} from 'react-router-dom'
import { Row, Col, Table, Image, ListGroup, Card, Button, InputGroup, Form, Modal } from 'react-bootstrap'
import { detailsLadder, deleteLadder, updateEnabledLadder, listUsersLadders, createLadder, bulkCreateLadders } from '../actions/ladderActions';
import { tradeSuggestionGROK } from '../actions/tradeActions';
import Loader from '../components/Loader'
import Message from '../components/Message'
import TransactionsStats from '../components/TransactionsStats'
import TransactionsTable from '../components/TransactionsTable'
import Suggestions from '../components/Suggestions'
import LadderStepTab from '../components/LadderStepTab';
import LadderAlert from '../components/Ladder_Alert';
import {formatDate} from '../components/utilities';
import { LADDER_UPDATE_RESET } from '../constants/ladderConstants';
import { CRYPTO_DELETE_RESET, STOCKS_DELETE_RESET, TRANSACTIONS_DELETE_RESET, TRADE_SUGGESTION_RESET } from '../constants/tradeConstants';
import { HISTORICAL_DATA_RESET, SNAPSHOT_LADDER_PROFIT_RESET } from '../constants/chartConstants';
import LineLadderStockGraph from '../components/Charts/LineLadderStockGraph';
import LineGraph from '../components/Charts/LineGraph';

function Ladder({ladder_id}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userLogin = useSelector(state => state.userLogin)
  const {userInfo} = userLogin
  const ladderDetails = useSelector(state => state.ladderDetails)
  const {loading: loadingLadder, error: errorLadder, ladder} = ladderDetails
  const ladderUpdate = useSelector(state => state.ladderUpdate)
  const {loading: loadingLadderUpdate, error: errorLadderUpdate, success: successUpdate} = ladderUpdate
  const ladderDelete = useSelector(state => state.ladderDelete)
  const { loading: deleteLoading, error: deleteError, success: deleteSuccess } = ladderDelete
  const ladderEnabled = useSelector(state => state.ladderUpdateEnabled)
  const { loading: enabledLoading, error: enabledError, success: enabledSuccess } = ladderEnabled
  const [showModal, setShowModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const abortControllerRef = useRef(null);

  const [message, setMessage] = useState(null)
  const [stockDateMethod, setStockDateMethod] = useState('week')
  const [chartDateMethod, setChartDateMethod] = useState('week')
  const [activeChart, setActiveChart] = useState('stock')
  const [selectedStep, setSelectedStep] = useState(null)
  const [selectedStepId, setSelectedStepId] = useState(null)
  const handleStepIdClick = (id) => {
    setSelectedStepId(id)
    if (id) {
      setStockDateMethod('all')
    } else {
      setStockDateMethod('month')
    }
  }

  // The Steps serializer returns `transaction` as the full transaction object (not just an ID).
  // The chart API returns `transaction_id: transaction._id` for each plotted buy point.
  // So step.transaction._id is the value that matches the chart's transaction_id field.
  const selectedTransactionId = selectedStep?.transaction?._id || null

  const [symbol, setSymbol] = useState('')
  const [symbolLocked, setSymbolLocked] = useState(false)
  const [symbolName, setSymbolName] = useState('')

  const [id, setId] = useState(0)
  const [name, setName] = useState('Sample Name')
  const [ladder_alert, setAlert] = useState('Sample Name')
  const [amount_per_trade, setAmountPerTrade] = useState(0)
  const [budget, setBudget] = useState(0)
  const [buffer_52_week, setBuffer52Week] = useState(0)
  const [cap, setCap] = useState(0)
  const [createdAt, setCreatedAt] = useState(0)
  const [debt, setDebt] = useState(0)
  const [daily_debt, setDailyDebt] = useState(0)
  const [direction, setDirection] = useState('Both')
  const [enable, setEnable] = useState(false)
  const [gap, setGap] = useState(0.00)
  const [highest, setHighest] = useState(0.00)
  const [last, setLast] = useState(0.00)
  const [lastRan, setLastRan] = useState('')
  const [limit_price_in_percentage, setLimitPriceInPercentage] = useState(0)
  const [lowest, setLowest] = useState(0.00)
  const [market, setMarket] = useState('')
  const [profit, setProfit] = useState(0)
  const [daily_profit, setDailyProfit] = useState(0)
  const [profit_per_trade, setProfitPerTrade] = useState(0.00)
  const [percent_per_trade, setPercentPerTrade] = useState(0)
  const [steps, setSteps] = useState([])
  const [shares_per_trade, setSharesPerTrade] = useState(0)
  const [stop_price_in_percentage, setStopPriceInPercentage] = useState(0)
  const [suggestionLadderType, setSuggestionLadderType] = useState(null)
  const [type, setType] = useState('')
  const [trending, setTrending] = useState("")
  const cryptoDelete = useSelector(state => state.cryptoDelete)
  const { loading: tradeCryptoDeleteLoading, error: tradeCryptoDeleteError, success: tradeCryptoDeleteSuccess } = cryptoDelete
  const tradeSuggestion = useSelector(state => state.tradeSuggestion)
  const { loading: tradeSuggestionLoading, error: tradeSuggestionError, suggestion: tradeSuggestionData } = tradeSuggestion
  const stocksDelete = useSelector(state => state.stocksDelete)
  const { loading: tradeStocksDeleteLoading, error: tradeStocksDeleteError, success: tradeStocksDeleteSuccess } = stocksDelete
  const transactionsDelete = useSelector(state => state.transactionsDelete)
  const { loading: tradeTransactionsDeleteLoading, error: tradeTransactionsDeleteError, success: tradeTransactionsDeleteSuccess } = transactionsDelete
  

  // Initial load and trade delete handling
  useEffect(() => {
    const ladderId = Number(ladder_id)
    
    // Validate ladderId is a valid number
    if (!ladderId || isNaN(ladderId)) {
      //console.error('Invalid ladder ID:', ladder_id)
      navigate('/')
      return
    }
    
    // If trade delete succeeded, refetch ladder data
    if(tradeCryptoDeleteSuccess || tradeStocksDeleteSuccess || tradeTransactionsDeleteSuccess){
      dispatch(detailsLadder(ladderId))
      dispatch({type:CRYPTO_DELETE_RESET})
      dispatch({type:STOCKS_DELETE_RESET})
      dispatch({type:TRANSACTIONS_DELETE_RESET})
      return
    }
    
    // Only fetch if we don't have the ladder data yet or ladder_id changed
    const currentLadderId = ladder?._id
    if (!currentLadderId || currentLadderId !== ladderId) {
      if (!loadingLadder) {
        // Clear stale chart data and symbol immediately so chart shows clean loader
        dispatch({ type: HISTORICAL_DATA_RESET })
        dispatch({ type: SNAPSHOT_LADDER_PROFIT_RESET })
        setSymbol('')
        dispatch(detailsLadder(ladderId))
      }
    }
  }, [dispatch, navigate, ladder_id, ladder?._id, loadingLadder, tradeCryptoDeleteSuccess, tradeStocksDeleteSuccess, tradeTransactionsDeleteSuccess])

  // Separate effect for updating state from ladder data (no dispatch, just state updates)
  useEffect(() => {
    if(ladder?.name && ladder?._id === Number(ladder_id)){
      setAlert(ladder?.alert || '')
      setAmountPerTrade(ladder?.amount_per_trade || 0 )
      setBudget(ladder?.budget || 0)
      setBuffer52Week(ladder?.buffer_52_week || 0)
      setCap(Math.floor(ladder?.cap || 0))
      setCreatedAt(ladder?.createdAt || 0)
      setDebt(ladder?.debt || 0)
      setDailyDebt(ladder?.snapshot?.daily_debt || 0)
      setDirection(ladder.direction || "Both")
      setEnable(ladder?.enable || false)
      setGap(ladder?.gap || 0)
      setHighest(ladder?.highest || 0)
      setId(ladder?._id || 0)
      setLast(ladder?.last || 0)
      setLastRan(ladder?.lcd ? formatDate(ladder?.lcd) : 'Never')
      setLimitPriceInPercentage(ladder?.limit_price_in_percentage || 0)
      setLowest(ladder?.lowest || 0)
      setMarket(ladder.market || "")
      setName(ladder.name)
      setProfit(ladder?.profit || 0)
      setDailyProfit(ladder?.snapshot?.daily_profit || 0)
      setProfitPerTrade(ladder?.profit_per_trade || 0.00)
      setPercentPerTrade(ladder?.percent_per_trade || 0)
      setSharesPerTrade(ladder?.shares_per_trade > 1 ? Math.floor(ladder?.shares_per_trade) : Math.floor(ladder?.shares_per_trade) || 0)
      setSteps(ladder?.steps.length > 1 ? ladder?.steps : [])
      setStopPriceInPercentage(ladder?.stop_price_in_percentage || 0)
      setSymbol(ladder?.symbol || '')
      setSymbolName(ladder?.symbol_name || '')
      setTrending(ladder?.trending || "")
      setType(ladder?.type || '')
      setSelectedStep(null)  // clear any selected step when a new ladder loads
    }
  }, [ladder, ladder_id])

  // Auth check - separate effect
  useEffect(() => {
    if(!userInfo || (ladder?.user?._id && userInfo?._id !== ladder?.user?._id)){
      navigate('/login')
    }
  }, [userInfo, ladder?.user?._id, navigate])

  // Update success handling - separate effect
  useEffect(() => {
    if(successUpdate){
      dispatch({type:LADDER_UPDATE_RESET})
    }
  }, [successUpdate, dispatch])

  // Timer for AI suggestions loading
  useEffect(() => {
    let interval = null
    if (tradeSuggestionLoading) {
      setElapsedTime(0)
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (interval) clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [tradeSuggestionLoading])
  
  const enabledHandler = (e) => {
    e.preventDefault()
    dispatch(updateEnabledLadder({
        _id:e.target.id,
        enable: e.target.checked,
    }))
  }

  const handleEditLadder = () => {
    //console.log('Navigating to edit ladder with ID:', id);
    navigate(`/ladder/${id}/edit`, {
      state: { from: `/ladder/${id}` }  // or whatever the current path is
    })
  }

  const handleClose = () => {
    // Abort ongoing API request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Reset loading state to stop timer
    dispatch({ type: TRADE_SUGGESTION_RESET });
    setShowModal(false);
    setSelectedSymbols([]);
    setSuggestionLadderType(null);
  }

  const handleCreateLadders = async () => {
    const laddersData = selectedSymbols.map(suggestion => ({
      symbol: suggestion.symbol,
      name: suggestion.symbol,
      type: type,
      gap: gap,
      shares_per_trade: shares_per_trade,
      profit_per_trade: profit_per_trade,
      market: market,
      direction: direction,
      budget: budget,
      cap: cap,
      amount_per_trade: amount_per_trade,
      percent_per_trade: percent_per_trade,
      limit_price_in_percentage: limit_price_in_percentage,
      stop_price_in_percentage: stop_price_in_percentage,
    }))
    
    await dispatch(bulkCreateLadders(laddersData))
    handleClose()
    // HomeScreen will reload ladders via createSuccess listener
  }
  
  const handleAISuggestions = () => { 
    // Prevent duplicate requests
    if (tradeSuggestionLoading) {
      //console.log('AI suggestion request already in progress');
      return;
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    const suggestion_data = {
      symbol: symbol,
      market: market,
      ladder_type: type,
      gap: gap,
      budget: budget,
      cap: cap,
      profit_per_trade: profit_per_trade,
      amount_per_trade: amount_per_trade,
      debt: debt,
      direction: direction,
      last: last,
      limit_price_in_percentage: limit_price_in_percentage,
      percent_per_trade: percent_per_trade,
      shares_per_trade: shares_per_trade,
      stop_price_in_percentage: stop_price_in_percentage,
    }
    dispatch(tradeSuggestionGROK(suggestion_data, abortControllerRef.current.signal))
    setShowModal(true);
    setSuggestionLadderType(suggestion_data)
  }
  const symbolChartCheck = (symbol, market) => {
    if (market === 'Stocks') {
      const query = `${symbol} price stock`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
    }else if (market === 'Crypto') {
      const query = `${symbol} price crypto`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
    }
  }

  const trending_decoder = (trending) => {
    switch(trending){
      case 'RUN_AWAY': return 'Run Away Train. Never Stops Trading.';
      case 'HOUR_24': return '24 Hour % Change. Good for short term momentum.';
      default: return 'Run Away Train.';
    }
  }
  //console.log(ladder_alert)
  
  // Show loader if loading OR if ladder data doesn't match requested ladder_id (stale data)
  // if (loadingLadder || !ladder || ladder._id !== Number(ladder_id)) {
  //   return <Loader />
  // }
  
  // Show error message if fetch failed
  if (errorLadder) {
    return <Message variant='danger'>{errorLadder}</Message>
  }
  

  return (
    <div style={{ position: 'relative' }}>
      {deleteLoading && <Loader />}
      {deleteError && <Message variant='danger'>{deleteError}</Message>}
      {message && <Message variant='success'>{message}</Message>}
      {loadingLadderUpdate ? <Loader /> : errorLadderUpdate ? <Message variant='danger'>{errorLadderUpdate}</Message> : ''}
      <>
        <Modal show={showModal} onHide={handleClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Trade Suggestions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tradeSuggestionLoading ? (
            <div style={{textAlign: 'center'}}>
              <p style={{marginTop: '20px', fontSize: '18px'}}>{elapsedTime}s</p>
              <p>This takes about 1 minute</p>
              <hr></hr>
              <p>To add the selected suggestions to your ladder list, <br></br>click Green "Create Ladders" at the top right.</p>
              <Loader />
              
            </div>
          ) : tradeSuggestionError ? (
            <Message variant='danger'>{tradeSuggestionError}</Message>
          ) : (
            
            <Suggestions 
              suggestionLadderType={suggestionLadderType}
              tradeSuggestionData={tradeSuggestionData} 
              selectedSymbols={selectedSymbols}
              setSelectedSymbols={setSelectedSymbols}
              onCreateLadders={handleCreateLadders}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Row>
        <LadderAlert ladder_id={id} ladder_alert={ladder_alert} />
      </Row>

      {/* ── Ladder Header Bar ── */}
      {!loadingLadder && ladder && ladder._id === Number(ladder_id) ? (
        <div className="section-fade-in">
          <div className="ldh-bar">
            <div className="ldh-identity">
              <span className="ldh-symbol" title={`ID: ${ladder_id}`} onClick={() => symbolChartCheck(symbol, market)}>{symbol}</span>
              <span className="ldh-name">{name}</span>
            </div>
            <div className="ldh-stats">
              <div className="ldh-stat">
                <span className="ldh-stat-val">${Number(last).toFixed(2)}</span>
                <span className="ldh-stat-label">PRICE</span>
              </div>
              <div className="ldh-stat">
                <span className="ldh-stat-val">${Number(highest).toFixed(2)}</span>
                <span className="ldh-stat-label">HIGH</span>
              </div>
              <div className="ldh-stat">
                <span className="ldh-stat-val">${Number(lowest) >= 1000000 ? '0.00' : Number(lowest).toFixed(2)}</span>
                <span className="ldh-stat-label">LOW</span>
              </div>
              <div className="ldh-sep" />
              <div className="ldh-stat">
                <span className={`ldh-stat-val ${daily_profit >= 0 ? 'pos' : 'neg'}`}>{daily_profit >= 0 ? '+' : ''}${Number(daily_profit).toFixed(2)}</span>
                <span className="ldh-stat-label">DAILY P&L</span>
              </div>
              <div className="ldh-stat">
                <span className={`ldh-stat-val ${profit >= 0 ? 'pos' : 'neg'}`}>{profit >= 0 ? '+' : ''}${Number(profit).toFixed(2)}</span>
                <span className="ldh-stat-label">TOTAL P&L</span>
              </div>
            </div>
            <div className="ldh-controls">
              <div className="ldh-last-ran">
                <span className="ldh-last-ran-date">{lastRan.split(' : ')[0] || lastRan}</span>
                <span className="ldh-last-ran-time">{lastRan.split(' : ')[1] || ''}</span>
              </div>
              <Form.Check
                type='switch'
                id={id}
                checked={enable}
                onChange={enabledHandler}
                className="pointer-switch ldh-toggle"
              />
              <Button variant='outline-warning' size="sm" className="ldh-edit-btn" onClick={handleEditLadder}>
                <i className="fas fa-edit" />
              </Button>
            </div>
          </div>
          <div className="ldh-budget">
            <div className="ldh-budget-meta">
              <span className="ldh-budget-title">BUDGET</span>
              <span className="ldh-budget-detail">
                <span className="ldh-budget-used">${Number(debt).toFixed(0)} used</span>
                <span className="ldh-budget-sep">·</span>
                <span className={`${(Number(budget) - Number(debt)) < 0 ? 'neg' : 'pos'}`}>${(Number(budget) - Number(debt)).toFixed(0)} remaining</span>
                <span className="ldh-budget-sep">·</span>
                <span className="ldh-budget-total">${Number(budget).toFixed(0)} total</span>
              </span>
              <span className="ldh-budget-pct">{budget > 0 ? ((debt / budget) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="ldh-budget-track">
              <div
                className="ldh-budget-fill"
                style={{
                  width: `${budget > 0 ? Math.min((debt / budget) * 100, 100) : 0}%`,
                  background: budget > 0
                    ? (debt / budget) >= 0.9 ? 'var(--color-red)'
                    : (debt / budget) >= 0.7 ? 'var(--color-yellow)'
                    : 'var(--color-green)'
                    : 'var(--color-green)'
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="ldh-loading"><Loader /></div>
      )}

      {/* Chart Section — toggled by buttons */}
      <div className="stock-chart-section">
        <div className="stock-chart-header">
          <div className="chart-view-btns">
            <button
              className={`chart-view-btn${activeChart === 'stock' ? ' active' : ''}`}
              onClick={() => setActiveChart('stock')}
            >
              <i className="fas fa-chart-line" />
              Stock Price
            </button>
            <button
              className={`chart-view-btn${activeChart === 'profit' ? ' active' : ''}`}
              onClick={() => setActiveChart('profit')}
            >
              <i className="fas fa-coins" />
              Profit &amp; Debt
            </button>
          </div>
          <div className="stock-range-btns">
            {[['week','1W'],['month','1M'],['year','1Y'],['all','ALL']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => {
                  setStockDateMethod(val)
                  setChartDateMethod(val)
                }}
                className={`stock-range-btn${
                  (activeChart === 'stock' ? stockDateMethod : chartDateMethod) === val ? ' active' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={`chart-panel${activeChart === 'stock' ? ' chart-panel--visible' : ''}`}>
          {symbol
            ? <LineLadderStockGraph key={ladder_id} SYMBOL={symbol} DATE_METHOD={stockDateMethod} selectedStep={selectedStep} selectedTransactionId={selectedTransactionId} ladder={!loadingLadder && ladder && ladder._id === Number(ladder_id) ? ladder : null} onStepClick={setSelectedStep} selectedStepId={selectedStepId} onStepIdClick={handleStepIdClick} />
            : loadingLadder
              ? <div style={{padding:'40px', textAlign:'center'}}><Loader /></div>
              : <div className="chart-no-symbol">No symbol configured for this ladder.</div>
          }
        </div>
        <div className={`chart-panel${activeChart === 'profit' ? ' chart-panel--visible' : ''}`}>
          {!loadingLadder && ladder && ladder._id === Number(ladder_id)
            ? <LineGraph LADDER_ID={ladder._id} DATE_METHOD={chartDateMethod} />
            : null
          }
        </div>
      </div>

      <div className="ladder-layout">
        <div className="ladder-main">
        <>
          {/* Ladder Steps */}
          {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader />) : (
            <div className="section-fade-in">
            <LadderStepTab
              ladder={ladder}
              loading={loadingLadder}
              selectedStep={selectedStep}
              onStepClick={setSelectedStep}
            />
            </div>
          )}

          {/* Open Transactions — directly below step grid */}
          {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader />) : (
            <div className="section-fade-in">
            <TransactionsTable
              ladder={ladder}
              status='OPEN'
              selectedStep={selectedStep}
              onStepClick={setSelectedStep}
            />
            </div>
          )}

          {/* Stats */}
          {!loadingLadder && ladder && ladder._id === Number(ladder_id) && (
            <div className="section-fade-in">
              <TransactionsStats ladder={ladder} selectedStepId={selectedStepId} onStepIdClick={handleStepIdClick} />
            </div>
          )}

        </>{/* end ladder-main content */}
        </div>{/* end ladder-main */}

        {/* Right panel: Ladder Detail (desktop only) */}
        <div className="ladder-detail-panel">
          <div className="ldp-header">
            <span className="ldp-title">LADDER DETAILS</span>
            {!loadingLadder && ladder && ladder._id === Number(ladder_id) && (
              <Button size="sm" variant="outline-warning" className="p-1 lh-1" onClick={handleEditLadder}>
                <i className="fas fa-edit" />
              </Button>
            )}
          </div>
          {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (
            <div className="p-3"><Loader /></div>
          ) : (
            <div className="ldp-body section-fade-in">
              <div className="ldp-section">
                <div className="ldp-row"><span className="ldp-label">Type</span><span className="ldp-val">{type}</span></div>
                <div className="ldp-row"><span className="ldp-label">Created</span><span className="ldp-val">{new Date(createdAt).toLocaleDateString()}</span></div>
                <div className="ldp-row"><span className="ldp-label">Enabled</span><span className={`ldp-val ${enable ? 'pos' : 'neg'}`}>{enable ? 'Yes' : 'No'}</span></div>
              </div>

              <div className="ldp-section-header">AT ${Number(last).toFixed(2)}</div>
              <div className="ldp-section">
                <div className="ldp-row"><span className="ldp-label">Buy</span><span className="ldp-val">${Number(last).toFixed(2)}</span></div>
                {type === 'Fixed' && <>
                  <div className="ldp-row"><span className="ldp-label">Sell</span><span className="ldp-val">${(Number(last) + Number(profit_per_trade)).toFixed(2)}</span></div>
                  <div className="ldp-row"><span className="ldp-label">Profit/Trade</span><span className="ldp-val pos">${(Number(profit_per_trade) * Number(shares_per_trade)).toFixed(2)}</span></div>
                  <div className="ldp-row"><span className="ldp-label">Step Total</span><span className="ldp-val">${(Number(last) * Number(shares_per_trade)).toFixed(2)}</span></div>
                </>}
                {type === 'Percentage' && <>
                  <div className="ldp-row"><span className="ldp-label">Sell</span><span className="ldp-val">${(Number(last) + (last * (percent_per_trade / 100))).toFixed(2)}</span></div>
                  <div className="ldp-row"><span className="ldp-label">Profit/Trade</span><span className="ldp-val pos">${((last * (percent_per_trade / 100)) * (amount_per_trade / last)).toFixed(2)}</span></div>
                  <div className="ldp-row"><span className="ldp-label">Step Total</span><span className="ldp-val">${(Number(last) * Number((amount_per_trade / last).toFixed(1))).toFixed(2)}</span></div>
                </>}
                {type === 'OTOCO' && <>
                  <div className="ldp-row"><span className="ldp-label">Sell (Limit)</span><span className="ldp-val pos">${(Number(last) + (last * (limit_price_in_percentage / 100))).toFixed(2)}</span></div>
                  <div className="ldp-row"><span className="ldp-label">Sell (Stop)</span><span className="ldp-val neg">${(Number(last) - (last * (stop_price_in_percentage / 100))).toFixed(2)}</span></div>
                </>}
              </div>

              <div className="ldp-section-header">CONFIGURATION</div>
              <div className="ldp-section">
                <div className="ldp-row"><span className="ldp-label">Market</span><span className="ldp-val">{market}</span></div>
                <div className="ldp-row"><span className="ldp-label">Direction</span><span className="ldp-val">{direction}</span></div>
                <div className="ldp-row"><span className="ldp-label">Gap</span><span className="ldp-val">${gap}</span></div>
                {type === 'Fixed' && <div className="ldp-row"><span className="ldp-label">Shares/Trade</span><span className="ldp-val">{shares_per_trade}</span></div>}
                {type === 'Percentage' && <div className="ldp-row"><span className="ldp-label">Amt/Trade</span><span className="ldp-val">${amount_per_trade}</span></div>}
                {type === 'OTOCO' && <div className="ldp-row"><span className="ldp-label">Shares/Trade</span><span className="ldp-val">{shares_per_trade}</span></div>}
                {type === 'Fixed' && <div className="ldp-row"><span className="ldp-label">Profit/Trade</span><span className="ldp-val">${profit_per_trade}</span></div>}
                {type === 'Percentage' && <div className="ldp-row"><span className="ldp-label">% Per Trade</span><span className="ldp-val">{percent_per_trade}%</span></div>}
                {type === 'OTOCO' && <>
                  <div className="ldp-row"><span className="ldp-label">Limit %</span><span className="ldp-val">{limit_price_in_percentage}%</span></div>
                  <div className="ldp-row"><span className="ldp-label">Stop %</span><span className="ldp-val">{stop_price_in_percentage}%</span></div>
                </>}
              </div>

              <div className="ldp-section-header">BALANCE</div>
              <div className="ldp-section">
                <div className="ldp-row"><span className="ldp-label">Budget</span><span className="ldp-val">${budget}</span></div>
                <div className="ldp-row"><span className="ldp-label">Debt</span><span className="ldp-val">${debt}</span></div>
                <div className="ldp-row"><span className="ldp-label">Remaining</span><span className={`ldp-val ${(Number(budget) - Number(debt)) < 0 ? 'neg' : 'pos'}`}>${(Number(budget) - Number(debt)).toFixed(2)}</span></div>
              </div>

              <div className="ldp-section-header">LIMITS & FEATURES</div>
              <div className="ldp-section">
                <div className="ldp-row"><span className="ldp-label">Cap</span><span className="ldp-val">${cap}</span></div>
                <div className="ldp-row"><span className="ldp-label">Buffer 52wk</span><span className="ldp-val">{buffer_52_week}%</span></div>
                <div className="ldp-row"><span className="ldp-label">Trending</span><span className="ldp-val">{trending_decoder(trending)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>{/* end ladder-layout */}
      </>
    </div>
  )
}

export default Ladder
