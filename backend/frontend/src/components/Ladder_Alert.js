import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button } from 'react-bootstrap'
import Message from '../components/Message'
import { updateAlertLadder } from '../actions/ladderActions'
function getAlertConfig(alertCode) {
  switch (alertCode) {
    case 'INSUFFICIENT_FUNDS_STOCKS':
      return { variant: 'danger', message: 'Insufficient funds on Tradier. Ladder has stopped until you fix the issue.', iconType: 'fa', icon: 'fa-building-columns', iconClass: 'lc-alert-icon lc-alert-icon--danger' }
    case 'INSUFFICIENT_FUNDS_CRYPTO':
      return { variant: 'danger', message: 'Insufficient funds on Coinbase. Ladder has stopped until you fix the issue.', iconType: 'fa', icon: 'fa-building-columns', iconClass: 'lc-alert-icon lc-alert-icon--danger' }
    case 'BUDGET_MAXED':
      return { variant: 'warning', message: 'Budget is maxed out for this ladder.', iconType: 'fa', icon: 'fa-dollar-sign', iconClass: 'lc-alert-icon lc-alert-icon--warning' }
    case 'NO_FUNDS_CRYPTO':
      return { variant: 'danger', message: 'No Crypto funds available for this ladder.', iconType: 'fa', icon: 'fa-building-columns', iconClass: 'lc-alert-icon lc-alert-icon--danger' }
    case 'NO_FUNDS_STOCKS':
      return { variant: 'danger', message: 'No Stock funds available for this ladder.', iconType: 'fa', icon: 'fa-building-columns', iconClass: 'lc-alert-icon lc-alert-icon--danger' }
    case 'BUFFER_52_WEEK':
      return { variant: 'info', message: '52-week high alert triggered. All Buys have stopped.', iconType: 'text', icon: '52', iconClass: 'lc-alert-icon lc-alert-icon--warning' }
    case 'LADDER_CAP':
      return { variant: 'warning', message: 'Ladder cap alert triggered.', iconType: 'fa', icon: 'fa-dollar-sign', iconClass: 'lc-alert-icon lc-alert-icon--warning' }
    case 'HOUR_24':
      return { variant: 'warning', message: 'STOPPED: Price is trending downwards in the last 24 hours.', iconType: 'fa', icon: 'fa-arrow-trend-down', iconClass: 'lc-alert-icon lc-alert-icon--warning' }
    default:
      return { variant: 'warning', message: alertCode, iconType: null, icon: null, iconClass: '' }
  }
}

function isSeriousAlert(alertCode) {
  return (
    alertCode === 'NO_FUNDS_CRYPTO' ||
    alertCode === 'NO_FUNDS_STOCKS' ||
    alertCode.startsWith('INSUFFICIENT_FUNDS_')
  )
}

function Ladder_Alert({ ladder_id, ladder_alert }) {
  const dispatch = useDispatch()
  const [dismissedCodes, setDismissedCodes] = useState([])
  const [closingCodes, setClosingCodes] = useState([])

  const fadeDurationMs = 250

  useEffect(() => {
    setDismissedCodes([])
    setClosingCodes([])
  }, [ladder_alert])

  const closeAlert = (code) => {
    setClosingCodes((prev) => (prev.includes(code) ? prev : [...prev, code]))

    window.setTimeout(() => {
      setDismissedCodes((prev) => (prev.includes(code) ? prev : [...prev, code]))
      setClosingCodes((prev) => prev.filter((item) => item !== code))
    }, fadeDurationMs)
  }

  const issueFixedAlert = (code) => {
    const updatedAlert = alertCodes.filter((item) => item !== code).join(',')
    closeAlert(code)

    if (ladder_id) {
      dispatch(updateAlertLadder(ladder_id, updatedAlert))
    
    }
  }

  const alertCodes = (ladder_alert || '')
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code)

  return (
    <div>
      {alertCodes.map((code) => {
        if (dismissedCodes.includes(code)) {
          return null
        }

        const config = getAlertConfig(code)
        return (
          <div
            key={code}
            style={{
              opacity: closingCodes.includes(code) ? 0 : 1,
              transform: closingCodes.includes(code) ? 'translateY(-4px)' : 'translateY(0)',
              transition: `opacity ${fadeDurationMs}ms ease, transform ${fadeDurationMs}ms ease`,
            }}
          >
            <Message
              variant={config.variant}
              dismissible
              onClose={() => closeAlert(code)}
            >
              <div className='d-flex justify-content-between align-items-center gap-2'>
                <span className='d-flex align-items-center gap-2'>
                  {config.iconType === 'fa' && (
                    <span className={config.iconClass}>
                      <i className={`fas ${config.icon}`} />
                    </span>
                  )}
                  {config.iconType === 'text' && (
                    <span className={config.iconClass}>{config.icon}</span>
                  )}
                  {config.message}
                </span>
                {isSeriousAlert(code) ? (
                  <Button
                    size='sm'
                    variant='light'
                    onClick={() => issueFixedAlert(code)}
                  >
                    Issue Fixed
                  </Button>
                ) : null}
              </div>
            </Message>
          </div>
        )
      })}
    </div>
  )
}

export default Ladder_Alert
