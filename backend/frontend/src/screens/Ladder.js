import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import {Link, useParams, useNavigate} from 'react-router-dom'
import { Row, Col, Table, Image, ListGroup, Card, Button,InputGroup, Form, Tabs, Tab, Modal  } from 'react-bootstrap'
import { detailsLadder, deleteLadder, updateEnabledLadder, listUsersLadders, createLadder, bulkCreateLadders } from '../actions/ladderActions';
import { tradeSuggestionGROK } from '../actions/tradeActions';
import Loader from '../components/Loader'
import Message from '../components/Message'
import TransactionsStats from '../components/TransactionsStats'
import TransactionsTable from '../components/TransactionsTable'
import Suggestions from '../components/Suggestions'
import LadderStepTab from '../components/LadderStepTab';
import LadderAlert from '../components/Ladder_Alert';
import LadderReport from '../components/LadderReport';
import {formatDate} from '../components/utilities';
import { LADDER_UPDATE_RESET } from '../constants/ladderConstants';
import { CRYPTO_DELETE_RESET, STOCKS_DELETE_RESET, TRANSACTIONS_DELETE_RESET, TRADE_SUGGESTION_RESET } from '../constants/tradeConstants';
import GaugeGraph from '../components/Charts/GaugeGraph';

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
  const [symbol, setSymbol] = useState('')
  const [symbolLocked, setSymbolLocked] = useState(false)
  const [symbolName, setSymbolName] = useState('')

  const [id, setId] = useState(0)
  const [name, setName] = useState('Sample Name')
  const [ladder_alert, setAlert] = useState('Sample Name')
  const [amount_per_trade, setAmountPerTrade] = useState(0)
  const [budget, setBudget] = useState(0)
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
      setType(ladder?.type || '')
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
      <Row>
        <Col>
        <Row>

          <Col>
            
            <Card className="mb-2 text-center " style={{ border: '0', width: 'fit-content', margin: '0 auto' }}>
             
              <GaugeGraph LADDER_DATA={ladder}/>
              <Card.Body className="p-2">
                <Card.Title className="m-0">{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(<><h5>Daily Profit: ${Number(daily_profit).toFixed(2)} | Profit: ${Number(profit).toFixed(2)}</h5></>)}</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          {/* {market.toLowerCase() === 'stocks' && (
          <Col>
          <Card className="mb-2 text-center " style={{ width: 'fit-content', margin: '0 auto' }}>
            <Card.Header>
              <h5>Stock Suggestions</h5>
            </Card.Header>
            <Card.Body className="p-2">
              {!type || !symbol ? (
                <>
                  <p className="mb-2">Please fill out the ladder configuration first.</p>
                  <Button variant='warning' className='p-1 mb-1' onClick={handleEditLadder}>
                    <i className="fas fa-edit"></i> Edit Configuration
                  </Button>
                </>
              ) : (
                <>
                  <p>This provides 10 stock suggestions based on market trends and your ladder configuration.</p>
                  <Button variant='primary' className='p-1 mb-1' onClick={handleAISuggestions}>
                    Search <i className="fas fa-search"></i>
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
          </Col>
          )} */}
          <Col>
            <Row><Col>
            
              <Card md={4}  className="mb-2">
                <Card.Header>
                  <Row>
                    <Col>{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(<h5>{name}:</h5>)}</Col> 
                    
                    <Col xs={5} className="text-end">
                    {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(<>
                      <Form>
                        <Form.Group controlId='enable' style={{cursor: 'pointer'}}>
                            <Form.Check 
                              type='switch' 
                              placeholder='Enter enable' 
                              id={id} 
                              checked={enable} 
                              onChange={enabledHandler}
                              style={{cursor: 'pointer'}}
                              className="pointer-switch"
                            /> 
                        </Form.Group>
                      </Form>
                      <style>{`
                        .pointer-switch, 
                        .pointer-switch input, 
                        .pointer-switch label,
                        .pointer-switch .form-check-input {
                          cursor: pointer !important;
                        }
                      `}</style></>)}
                    </Col>
                    <Col xs={2}>{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) : (<Button variant='warning' className='p-1 mb-1' onClick={handleEditLadder}><i className="fas fa-edit"></i></Button>)}</Col>
                  </Row> 
                </Card.Header>
                <ListGroup variant='flush' className="list-group-vertical">
                  
                  <ListGroup.Item className="p-0">
                    <Row className="g-0">
                    <Col lg={12} xl={5} className="px-2 py-1" style={{ backgroundColor: '#f0f0f0', borderRight:'1px solid darkgrey',color: 'black' }}>PRICE</Col>
                    <Col className="px-2 py-1"><h5 className="m-0">{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) : (`$${last}`)}</h5></Col>
                    </Row>
                    
                  </ListGroup.Item>
                  <ListGroup.Item className="p-0">
                    <Row className="g-0">
                    <Col lg={12} xl={5} className="px-2 py-1" style={{ backgroundColor: '#f0f0f0', borderRight:'1px solid darkgrey',color: 'black' }}>HIGHEST</Col>
                    <Col className="px-2 py-1"><h5 className="m-0">{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) : (`$${highest}`)}</h5></Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className="p-0">
                    <Row className="g-0">
                    <Col  lg={12} xl={5} className="px-2 py-1" style={{ backgroundColor: '#f0f0f0', borderRight:'1px solid darkgrey',color: 'black' }}>LOWEST</Col>
                    <Col className="px-2 py-1"><h5 className="m-0">{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) : (`$${lowest}`)}</h5></Col>
                    </Row>
                  </ListGroup.Item>

                </ListGroup>
                <Card.Footer className="text-center px-2 py-1">{loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(<>Last Ran: {lastRan}</>)}</Card.Footer>
                </Card>
              </Col>
            </Row>
            
          </Col>
          <hr></hr>
        </Row>
        
        <Tabs
          defaultActiveKey="details"
          id="ladder-tabs"
          className="mb-3"
        >
          <Tab eventKey="home" title="Reports" >
           {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(
            <LadderReport LADDER_DATA={ladder} />)}
          </Tab>
          <Tab eventKey="steps" title="Ladder Steps">
            {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(
            <LadderStepTab ladder={ladder} loading={loadingLadder} />)}
          </Tab>
          <Tab eventKey="transactions" title="Ladder Transactions">
            <Row>
              <Col>
              {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(
                <>
                <TransactionsStats ladder={ladder} />
                <TransactionsTable ladder={ladder} status='OPEN' /></>)}
              </Col>
            </Row>
          </Tab>
          <Tab eventKey="details" title="Details">
            {loadingLadder || !ladder || ladder._id !== Number(ladder_id) ? (<Loader /> ) :(
            <Card>
              <Card.Header>
                <Row>
                  <Col><h3>{type}@{profit_per_trade}</h3></Col>
                  <Col md={3} sm={5} xs={7}><h5>Created on {new Date(createdAt).toLocaleDateString()}</h5></Col>
                </Row>
              </Card.Header>
              <Card.Subtitle className=" p-2 mb-2 text-muted">
                {type === 'Fixed' ? (
                  <>
                 <Row>
                      <Col>The profit per trade is FIXED to ${profit_per_trade}. <br></br> 
                    At the moment you are purchaseing {shares_per_trade} Shares per Trade every ${gap}, and selling when the price goes up ${profit_per_trade}.<br></br> 
                    This means you will be purchasing {shares_per_trade} shares every ${gap} until the ladder reaches its cap of ${cap} or the budget of ${budget} is exhausted.<br></br>
                    Each trade will gain ${(Number(profit_per_trade) * Number(shares_per_trade)).toFixed(2)} in profit.<br></br><br></br></Col>
                      <Col md={5} sm={5} xs={7}>
                      <Card md={4}>
                      <Card.Header><h5>At ${Number(last).toFixed(2)} the trade is:</h5></Card.Header>
                      <ListGroup variant='flush'>
                        
                        <ListGroup.Item>
                          Buy Price: ${Number(last).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Sell Price: ${(Number(last) + Number(profit_per_trade)).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Trade Profit: ${((Number(last) + Number(profit_per_trade)) - Number(last)).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Shares Per Trade: {shares_per_trade} shares
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Profit: ${((Number(last) * Number(profit_per_trade)) * (Number(shares_per_trade) / Number(last))).toFixed(2)}
                        </ListGroup.Item>
                      </ListGroup>
                      </Card>
                      </Col>
                    </Row>
                 </>) : type === 'Percentage' ? (
                  <>
                  <div>
                    <Row>
                      <Col>The Percentage ({percent_per_trade}%) is to figure out the sell price.  <br></br>
                    The Amount Per Trade (${amount_per_trade}) is to figure out the amount of shares to buy.<br></br><br></br>
                    Right now we have the buy price at ${Number(last).toFixed(2)}. <br></br>
                    So with an Amount Per Trade of ${amount_per_trade}, we are purchasing {(amount_per_trade / last).toFixed(1)} shares per trade. <br></br>
                    The sell price is then calculated by adding {percent_per_trade}% to the buy price.<br></br><br></br></Col>
                      <Col md={5} sm={5} xs={7}>
                      <Card md={4}>
                      <Card.Header><h5>At ${Number(last).toFixed(2)} the trade is:</h5></Card.Header>
                      <ListGroup variant='flush'>
                        
                        <ListGroup.Item>
                          Buy Price: ${Number(last).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Sell Price: ${(Number(last)+((last * (percent_per_trade/100)))).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Trade Profit: ${((Number(last)+((last * (percent_per_trade/100)))) - (last)).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Shares Per Trade: {(amount_per_trade / last).toFixed(1)} shares
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Profit: ${( (last * (percent_per_trade/100)) * (amount_per_trade / last)).toFixed(2)}
                        </ListGroup.Item>
                      </ListGroup>
                      </Card>
                      </Col>
                    </Row>
                    
                    
                 </div>
                 </>) : type === 'OTOCO' && (<>
                 <div>
                 <Row>
                      <Col>This is just a traditional condtional OTOCO trade. All major Exchanges do this.<br></br>
                  You set your Buy price, your profit trade Profit Sell Price (Limit Price) and your Profit Loss Sell Price (Stop Loss) trade.<br></br>  
                  <br></br>  
                  The profit per trade will fluctuate based on the buy price.  It is currently set to ${limit_price_in_percentage}%. <br></br> 
                  The most the trade will lose will also fluctuate based on the buy price.  It is currently set to ${stop_price_in_percentage}%. <br></br> 
                  <br></br>
                    At the moment you are purchaseing {shares_per_trade} Shares per Trade every ${gap}, and selling when the price goes up {limit_price_in_percentage}% or down {stop_price_in_percentage}%.<br></br> 
                    This means you will be purchasing {shares_per_trade} shares every ${gap} until the ladder reaches its cap of ${cap} or the budget of ${budget} is exhausted.<br></br></Col>
                      <Col md={5} sm={5} xs={7}>
                      <Card md={4}>
                      <Card.Header><h5>At ${Number(last).toFixed(2)} the trade is: (per share)</h5></Card.Header>
                      <ListGroup variant='flush'>
                        
                        <ListGroup.Item>
                          Buy Price: ${Number(last).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Sell Price: ${(Number(last)+((last * (limit_price_in_percentage/100)))).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Trade Profit: ${((Number(last)+((last * (limit_price_in_percentage/100)))) - (last)).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Trade Loss: ${((Number(last)-((last * (stop_price_in_percentage/100)))) - (last)).toFixed(2)}
                        </ListGroup.Item>
                        
                        <ListGroup.Item variant='danger'>
                          Profit: ${((Number(last)+((last * (limit_price_in_percentage/100)))) - (last)).toFixed(2)} or ${((Number(last)-((last * (stop_price_in_percentage/100)))) - (last)).toFixed(2)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Shares Per Trade: {(shares_per_trade).toFixed(0)}
                        </ListGroup.Item>
                      </ListGroup>
                      </Card>
                      </Col>
                    </Row>
                 </div>
                 </>)}

              </Card.Subtitle>
              <Card.Body>
                <Row>
                  <Col>
                    <Card md={4}>
                      <Card.Header><h3>Trading {market} </h3></Card.Header>
                      <ListGroup variant='flush'>
                        <ListGroup.Item>
                          Trading Direction: {direction}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Gap Between Trades: ${gap}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          
                           {type === 'Fixed' ? 
                            (`Shares Per Trade: ${shares_per_trade}`) : 
                          type === 'Percentage' ? 
                            (`Amount Per Trade: $${amount_per_trade}`) : 
                          type === 'OTOCO' && 
                            (`Shares Per Trade: ${shares_per_trade}`)}
                        </ListGroup.Item>
                        
                          {type === 'Fixed' ? 
                            (<ListGroup.Item>Profit Per Trade: ${profit_per_trade}</ListGroup.Item>) : 
                          type === 'Percentage' ? 
                            (<ListGroup.Item>Profit Percentage: {percent_per_trade}%</ListGroup.Item>) : 
                          type === 'OTOCO' && 
                            (<>
                            <ListGroup.Item>Limit Price: {limit_price_in_percentage}% </ListGroup.Item>
                            <ListGroup.Item>Stop Price: {stop_price_in_percentage}%</ListGroup.Item>
                            </>)}
                        
                      </ListGroup>
                    </Card>
                  </Col>
                  <Col>
                    <Card md={4}>
                      <Card.Header><h3>Balance</h3></Card.Header>
                      <ListGroup variant='flush'>
                        <ListGroup.Item>
                          Budget: ${budget}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Debt: ${debt}
                        </ListGroup.Item>
                        <ListGroup.Item variant='success'>
                          Remaining: ${(Number(budget) - Number(debt))}
                        </ListGroup.Item>
                      </ListGroup>
                    </Card>
                  </Col>
                  
                  <Col>
                    <Card md={4}>
                      <Card.Header><h3>Limits</h3></Card.Header>
                      <ListGroup variant='flush'>
                        <ListGroup.Item>
                          Budget: ${budget}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          Stock Cap: ${cap}
                        </ListGroup.Item>
                      </ListGroup>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>)}
            </Tab>
            
        </Tabs>
        </Col>
      </Row>
      </>
    </div>
  )
}

export default Ladder
