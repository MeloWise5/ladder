import React, {useState, useEffect, useMemo, useRef, memo} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Table, ListGroup, Card, Button} from 'react-bootstrap'
import Loader from './Loader'
import { getUserDetails } from '../actions/userActions'


function TransactionsStats({ladder=false}) {
  const hasLoadedUser = useRef(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userDetails = useSelector(state => state.userDetails)
  const {loading, error, user} = userDetails
  useEffect(() => {
    if((!user || !user.name) && !hasLoadedUser.current){
      dispatch(getUserDetails('profile'))
      hasLoadedUser.current = true
    }
  }, [dispatch, user?.name])
  
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
      <>
      <Row>
        <Col lg={6}>
          <Card style={{ border: '0px solid darkgrey' }}>
            <Card.Body>
              {loading ? (
                <Loader />
              ) : (
                <ListGroup><ListGroup.Item className='text-center'><h4>{transactions_stats.open_transaction_count} Open | {transactions_stats.closed_transaction_count} Closed Transactions</h4></ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col><h5>Avg Buy Days</h5></Col>
                      <Col>{transactions_stats.avg_buy_days} </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col><h5>Avg Sell Days</h5></Col>
                      <Col>{transactions_stats.avg_sell_days} </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col><h5>Trades Per Day</h5></Col>
                      <Col>{transactions_stats.avg_trades_per_day} </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col><h5>Profit Per Day</h5></Col>
                      <Col>${transactions_stats.avg_profit_per_day} </Col>
                    </Row>
                  </ListGroup.Item>
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card style={{ border: '0px solid darkgrey' }}  >
            <Card.Body>
              {loading ? (
                <Loader />
              ) : (
                <ListGroup>
                  <ListGroup.Item className='text-center'><h4>Top 5</h4></ListGroup.Item>
                    <ListGroup.Item><Row><Col>
                
                  <h6>Days by Profit:</h6>
                  <ListGroup>
                  {transactions_stats.top_5_days_by_profit && transactions_stats.top_5_days_by_profit.length > 0 ? (
                    transactions_stats.top_5_days_by_profit.map((day, index) => (
                      <ListGroup.Item key={index}>
                        {day.date}: ${day.profit}
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No data available</ListGroup.Item>
                  )}</ListGroup>
                
                </Col><Col>
              
                  <h6>Steps by Profit:</h6>
                  <ListGroup>
                  {transactions_stats.top_5_steps_by_profit && transactions_stats.top_5_steps_by_profit.length > 0 ? (
                    transactions_stats.top_5_steps_by_profit.map((step, index) => (
                      <ListGroup.Item key={index}>
                        <b>{step.step_code}</b> | <i>{typeof step.price === 'number' ? `$${step.price.toFixed(2)}` : step.price}</i> : ${typeof step.profit === 'number' ? step.profit.toFixed(2) : step.profit}
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No data available</ListGroup.Item>
                  )}</ListGroup>
                </Col></Row></ListGroup.Item>
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </>
      );
    }, [user, ladder, loading]);
  return (
    <>
      {transaction_report}
      </>
  )
}

export default memo(TransactionsStats)
