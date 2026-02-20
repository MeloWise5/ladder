import React from 'react'
import { Alert } from 'react-bootstrap'
function Message({ variant, children, dismissible = false, onClose }) {
  return (
    <Alert variant={variant} dismissible={dismissible} onClose={onClose}>
      {children}
    </Alert>
  )
}

export default Message
