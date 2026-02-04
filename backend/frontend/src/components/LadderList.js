import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
function LadderList({ladder}) {
  return (
    <Card className='my-1 p-1 rounded'>
      <Card.Body><Link to={`/ladder/${ladder._id}`} >
        <Card.Title as="div">{ladder.name}</Card.Title></Link>
      </Card.Body>
    </Card>
  )
}

export default LadderList
