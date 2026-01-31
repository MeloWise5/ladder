import React from 'react'
import { ProgressBar } from 'react-bootstrap'
function Loader() {
  return (
    <ProgressBar animated now={100} variant='info' >
      
    </ProgressBar>
  )
}

export default Loader
