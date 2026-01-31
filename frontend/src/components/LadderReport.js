import React, {useState, useEffect, memo, useRef} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Card, Button } from 'react-bootstrap'
import BarGraph from './Charts/BarGraph'
import LineGraph from './Charts/LineGraph'
import LineLadderStockGraph from './Charts/LineLadderStockGraph'    
import Loader from './Loader'
import { getUserDetails } from '../actions/userActions'

const LadderReport = memo(function LadderReport({LADDER_DATA=false}) {
  const [ladderId,setLadderId] = useState(false)
  const [ladderSymbol,setLadderSymbol] = useState(false)
  const [ladderName,setLadderName] = useState(false)
  const [date_method,setDateMethod] = useState(false)
  const [shouldLoadCharts, setShouldLoadCharts] = useState(false)
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
  
  // Update ladder data when LADDER_DATA changes
  useEffect(() => {
    if (!LADDER_DATA || !LADDER_DATA._id) {
      setLadderId(false)
      setLadderSymbol(false)
      setLadderName('All Ladders')
    } else {
      setLadderId(LADDER_DATA._id)
      setLadderName(LADDER_DATA.name)
      setLadderSymbol(LADDER_DATA.symbol)
    }
  }, [LADDER_DATA])
  
  // Delay chart loading slightly to let the main page render first
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadCharts(true)
    }, 100) // 100ms delay
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
    <Row className='align-items-center mb-3'>
      <Col>
      
        <h3>Ladder Report for {ladderName}</h3>
      </Col>
      <Col className='text-center text-md-end' xs={12} md={6} lg={4}>
        <Button
            onClick={() => setDateMethod('week')}
            className='p-2 btn btn-primary btn-lg ' style={{borderRadius: '0.25rem 0 0 0.25rem'}}>
          Week
        </Button>
         <Button 
            onClick={() => setDateMethod('month')}
            className='p-2 btn btn-primary btn-lg' style={{borderRadius: 0}}>
          Month
        </Button>
         <Button    
            onClick={() => setDateMethod('year')}  
            className='p-2 btn btn-primary btn-lg ' style={{borderRadius: 0}}>
          Year
        </Button>
         <Button 
            onClick={() => setDateMethod('all')}
            className='p-2 btn btn-primary btn-lg ' style={{borderRadius: '0 0.25rem 0.25rem 0'}}>
          All Time
        </Button>
      </Col>
    </Row>  
    <Row>
        <Col xs={12} md={12} lg={ladderId ? 6 : 12}>
            {shouldLoadCharts ? (
                <LineGraph LADDER_ID={ladderId} DATE_METHOD={date_method} />
            ) : (
                <div style={{padding: '20px', textAlign: 'center'}}>Loading profit chart...</div>
            )}
        </Col>
        {ladderId && (
            <Col md={12} lg={6}>
                {shouldLoadCharts ? (
                    <LineLadderStockGraph SYMBOL={ladderSymbol} DATE_METHOD={date_method} />
                ) : (
                    <div style={{padding: '20px', textAlign: 'center'}}>Loading stock chart...</div>
                )}
            </Col>
        )}
        
    </Row>
        
    </>
  )
})

export default LadderReport
