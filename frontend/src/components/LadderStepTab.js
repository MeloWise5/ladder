import React from 'react'
import { Link } from 'react-router-dom'
import { Row, Col, Table, Image, ListGroup, Card, Button,InputGroup, Form, Tabs, Tab } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
function LadderStepTab({ladder, loading}) {
  const stepStatusToVariant = {
    Buy: 'warning',
    BUY: 'warning',
    Sell: 'success',
    SELL: 'success',
    Open: 'secondary',
    OPEN: 'secondary',
    // Closed: 'Secondary', // Add more as needed
  };
  const adjust_last_price_image = (ladder,attr,price) => {
    let output = ''
    const ladder_last = Number(ladder['last']).toFixed(6)
    const ladder_gap = Number(ladder['gap'])
    const nextTrigger = Number((1+ Math.floor(ladder_last / ladder_gap)) * ladder_gap).toFixed(6);
    const lastTrigger = Number((Math.floor(ladder_last / ladder_gap)) * ladder_gap).toFixed(6);
    const distanceIntoGap = nextTrigger - ladder_last;
    const percentageTowardNext = Math.floor(100 - ((distanceIntoGap / ladder_gap) * 100));

    if(Number(price) === Number(lastTrigger) && Number(ladder_last) > Number(lastTrigger) && Number(ladder_last) < Number(nextTrigger)){
      output = percentageTowardNext + '%';
      if (attr === 'opacity'){output = 1;}
    }else{
      if (attr === 'opacity'){output = 0;}
    }
    return output
  }
  //console.log(ladder.steps)
  return (
    <Row>
      <Col md={4}>
        {loading ? (
          <Loader />
        ) : ladder && ladder.steps && ladder.steps.length > 0 ? (

          <div style={{paddingBottom: '20px', maxHeight: '500px', overflowY: 'auto' }}>
            {ladder.steps.map((step, index) => (
              <Card style={{ height: '50px', overflow: 'hidden', marginBottom:'5px' }} key={index} bg={stepStatusToVariant[step.status]}>
                <div>
                <Card.Img 
                  src="price_line.png" 
                  alt="Card image" 
                  style={{ 
                    height:'2px',
                    position: 'absolute',
                    top: adjust_last_price_image(ladder, 'top',step.price),
                    opacity: adjust_last_price_image(ladder,'opacity',step.price),
                  }}
                />
                </div>
                <Card.ImgOverlay>
                  <Card.Title>{step.price}</Card.Title>
                </Card.ImgOverlay>
              </Card>
            ))}
          </div>
          ) : (
      <Message variant='info'>No steps available for this ladder.</Message>
    )}
      </Col>
      <Col>
      {loading ? (
        <Loader />
      ) : ladder && ladder.steps && ladder.steps.length > 0 ? (
      <Table striped bordered hover responsive className='table-sm'>
        <thead>
          <tr>
              <th>ID</th>
              <th>Step</th>
              <th>Price</th>
              <th>Transaction ID</th>
              <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ladder.steps.map((step, index) => (

            <tr key={index}>
              <td>{step._id}</td>
              <td>{step.step_code}</td>
              <td>{step.price}</td>
              <td>{step.status === 'BUY' ? step.transaction.buy_id : step.transaction.sell_id}</td>
              <td>{step.status}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    ) : (
      <Message variant='info'>No steps available for this ladder.</Message>
    )}
    </Col>
    </Row>
  )
}

export default LadderStepTab
