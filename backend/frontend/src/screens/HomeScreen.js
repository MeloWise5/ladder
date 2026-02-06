import { useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate } from 'react-router-dom'
import {Row, Col, Card} from 'react-bootstrap'
import { listUsersLadders } from '../actions/ladderActions'
import LadderList from '../components/LadderList'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Ladder from './Ladder'

// Module-level flag to prevent duplicate fetches
let fetchInitiated = false
let hasCheckedAuth = false

// Expose reset function for logout
window.resetHomeScreenFlags = () => {
  fetchInitiated = false
  hasCheckedAuth = false
}

function HomeScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const laddersList = useSelector(state => state.ladderList) || []
  const { loading, error, ladders } = laddersList
  const userLogin = useSelector(state => state.userLogin)
  const {userInfo} = userLogin
  const ladderCreate = useSelector(state => state.ladderCreate)
  const { success: createSuccess } = ladderCreate
  const [ladderId, setLadderId] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const changeLadderHandler = (newLadderId) => {
    setLadderId(newLadderId)
  }
  
  useEffect(() => {
      if(userInfo && userInfo?.name){
        hasCheckedAuth = true
        if (!fetchInitiated && (!ladders || ladders.length === 0) && !loading){
          fetchInitiated = true
          dispatch(listUsersLadders())
        }
      } else {
        fetchInitiated = false
      }
  },[dispatch,userInfo,loading,ladders])
  
  // Separate effect to reload ladders when a new one is created
  useEffect(() => {
    if (createSuccess) {
      dispatch(listUsersLadders())
    }
  }, [createSuccess, dispatch])
  
  // Set initial ladder when ladders first load
  useEffect(() => {
    if (ladders && ladders.length > 0 && !isInitialized) {
      setLadderId(ladders[0]._id)
      setIsInitialized(true)
    }
  }, [ladders, isInitialized])
  
  // Show message if not logged in (after all hooks)
  if (!userInfo || !userInfo?.name) {
    return (
      <div>
        <h1>Please log in to view your ladders</h1>
        <Message variant='info'>You need to be logged in to access this page.</Message>
      </div>
    )
  }
  const ladder_list = ladders ? (
    ladders.map(ladder => {
      //console.log(ladder)
      const isSelected = ladderId === ladder._id
      const isSampleName = ladder.name === 'Sample Name'
      const isDisabled = !ladder.enable
      
      let variant = ''
      let textColor = ''
      
      if (isSelected) {
        variant = 'primary'
        textColor = 'dark'
      } else if (isSampleName) {
        variant = 'danger'
        textColor = 'white'
      } else if (isDisabled) {
        variant = 'secondary'
        textColor = 'dark'
      }
      
      return (
        <Card 
          className='my-1 p-0 rounded' 
          style={{cursor:'pointer',backgroundColor: 'lightgrey', height: '75px'}} 
          key={ladder._id}  
          onClick={() => changeLadderHandler(ladder._id)}
          bg={variant}
          text={textColor}
        >
          <Card.Body className="p-0" style={{overflow: 'hidden'}}>
              <div className="p-0">
                <div className="p-0 " style={{display:'flex', flexDirection: 'row', height: '100%'}}>
                  <div 
                    lg={2} 
                    className="p-0 m-0" 
                    style={{
                      borderTopLeftRadius: '5px', 
                      borderBottomLeftRadius: '5px', 
                      writingMode: 'vertical-rl', 
                      textOrientation: 'upright', 
                      border: '1px solid black', 
                      backgroundColor: '#3374ff', 
                      color: ladderId === ladder._id ? '#ffe600' : 'white',
                      fontWeight:'bold',
                      fontSize: '12px',
                      maxHeight: '75px',
                      overflow: 'hidden'
                    }}>
                      {ladder.symbol}
                  </div>
                  <div className="p-0" style={{ 
                    height: '75px', 
                    width: '10px', 
                    position: 'relative', 
                    border: '1px solid black',
                    backgroundColor: '#3374ff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{
                      width: '100%',
                      height: `${ladder.budget && ladder.debt ? (ladder.debt / ladder.budget * 100) : 65}%`,
                      backgroundColor: ladder.budget && ladder.debt && (ladder.debt / ladder.budget) > 0.9 ? '#ff4444' : 
                                      ladder.budget && ladder.debt && (ladder.debt / ladder.budget) > 0.7 ? '#ffaa00' : '#44ff44',
                      transition: 'height 0.3s ease'
                    }} />
                  </div>
                  <div 
                    style={{
                      
                      borderLeft: '1px solid black',
                      display:'flex', 
                      flexDirection: 'column', 
                      flex: 1, 
                      minWidth: 0
                    }}>
                    <div 
                      className="px-1" 
                      style={{
                        whiteSpace: 'nowrap', 
                        borderBottom: '1px solid black', 
                        borderTopRightRadius: '5px', 
                        fontWeight: 'bold', 
                        overflow: 'hidden', 
                        color: ladderId === ladder._id ? '#ffe600' : 'white',
                        backgroundColor: '#3374ff',
                        textOverflow: 'ellipsis'
                      }}>
                      
                      {ladder.name}
                    </div>
                  <div  className="p-0" style={{display:'flex', flexDirection: 'row', color: ladder.percent_change_24h >= 0 ? '#086100' : '#420000', backgroundColor: ladder.percent_change_24h >= 0 ? 'lightgreen' : 'pink', flex: 1}}>
                    <div lg={1} className="p-0"  style={{borderRight: '1px solid black'}}>
                      <div  className="px-1"  style={{borderBottom: '1px solid black', backgroundColor: 'pink'}}>{ladder.open_daily_transaction_count}</div>
                        <div  className="px-1"  style={{borderTop: '1px solid black', backgroundColor: 'lightgreen'}}>{ladder.closed_daily_transaction_count}</div>
                      </div>
                    <div  className="p-0" style={{borderRight: '1px solid black', display:'flex', flexDirection: 'row',  flex: 1}}>
                      <div className="px-1" style={{flex: 1, fontSize: '1.2em', lineHeight: '1', display: 'flex', alignItems: 'center'}}>
                        <div>
                        <div className="p-0 m-0" style={{lineHeight: '1'}}>
                          {Number(ladder.percent_change_24h).toFixed(0)}%
                        </div>
                        <div className="p-0 m-0" style={{lineHeight: '1'}}>
                          <span style={{fontSize: '0.7em'}}>24H</span>
                        </div>
                        </div>
                      </div>
                      <div className="px-1" style={{flex: 1, fontWeight: 'bold', fontSize: '1.1em', display: 'flex', alignItems: 'center'}}>${Number(ladder.last).toFixed(2)}</div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
          </Card.Body>
        </Card>
      )
  })
  ) : null

  return (
    <div>
      <h1>My Ladders</h1>
      {
        <Row>
          <Col sm={2}>
          {loading ? 
        <Loader />
      : error ? 
        <Message variant='danger'>{error}</Message> 
      :(
        ladder_list
        )}
          </Col>
          <Col>
            {ladderId && <Ladder ladder_id={ladderId} />}
          </Col>
        </Row>
      }
    </div>
  )
}

export default HomeScreen
