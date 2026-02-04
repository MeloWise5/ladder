import React, {useEffect, useMemo, useState} from 'react'
import {Table, Badge, Button, Form} from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { bulkCreateLadders } from '../actions/ladderActions'

function Suggestions({suggestionLadderType, tradeSuggestionData, selectedSymbols, setSelectedSymbols, onCreateLadders}) {
    const userLogin = useSelector(state => state.userLogin)
    const {userInfo} = userLogin
    const laddersList = useSelector(state => state.ladderList) || {}
    const { loading, error, ladders } = laddersList

    // Check if a symbol already exists in user's ladders
    const existingSymbols = useMemo(() => {
        if (!ladders || !Array.isArray(ladders)) return new Set()
        return new Set(ladders.map(ladder => ladder.symbol?.toUpperCase()))
    }, [ladders])

    const handleCheckboxChange = (suggestion) => {
        setSelectedSymbols(prev => {
            const exists = prev.find(s => s.symbol === suggestion.symbol)
            if (exists) {
                return prev.filter(s => s.symbol !== suggestion.symbol)
            } else {
                return [...prev, suggestion]
            }
        })
    }
    console.log(tradeSuggestionData)
    return (
        <div>
            {selectedSymbols.length > 0 && (
                <div className="mb-3 text-end">
                    <Button variant="success" onClick={onCreateLadders}>
                        Create {selectedSymbols.length} Ladder{selectedSymbols.length > 1 ? 's' : ''}
                    </Button>
                </div>
            )}
            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th></th>
                    <th>Symbol</th>
                    <th>Current Price</th>
                    <th>-</th>
                    <th>Week Change</th>
                    <th>Month Change</th>
                    <th>6 Month Change</th>
                    <th>Year Change</th>
                    <th>Notes</th>
                </tr>
                </thead>
                <tbody>
                {tradeSuggestionData?.suggestions?.map((suggestion, index) => {
                    const symbolExists = existingSymbols.has(suggestion.symbol?.toUpperCase())
                    const isSelected = selectedSymbols.find(s => s.symbol === suggestion.symbol)
                    return (
                    <React.Fragment key={index}>
                        <tr style={symbolExists ? {backgroundColor: '#fff3cd'} : {}}>
                            <td rowSpan="3">
                                {!symbolExists && (
                                    <Form.Check 
                                        type="checkbox"
                                        checked={!!isSelected}
                                        onChange={() => handleCheckboxChange(suggestion)}
                                    />
                                )}
                            </td>
                            <td rowSpan="3">
                                <strong>{suggestion.symbol}</strong>
                                {symbolExists && <Badge bg="warning" text="dark" className="ms-2">Exists</Badge>}
                            </td>
                            <td rowSpan="3">${suggestion.currentPrice?.toFixed(2)}</td>

                            <td>Stock Movement</td>  
                            <td>{suggestion.percentChange?.week}</td>
                            <td>{suggestion.percentChange?.month}</td>
                            <td>{suggestion.percentChange?.sixMonth}</td>
                            <td>{suggestion.percentChange?.year}</td>
                            <td rowSpan="3" style={{fontSize: '12px'}}>{suggestion.strategyNotes}</td>
                        </tr>
                        <tr style={symbolExists ? {backgroundColor: '#fff3cd'} : {}}>
                            <td>Profit</td>  
                            <td>${suggestion.ladderData?.week?.profit?.toFixed(2)}</td>
                            <td>${suggestion.ladderData?.month?.profit?.toFixed(2)}</td>
                            <td>${suggestion.ladderData?.sixMonth?.profit?.toFixed(2)}</td>
                            <td>${suggestion.ladderData?.year?.profit?.toFixed(2)}</td>
                        </tr>
                        <tr style={symbolExists ? {backgroundColor: '#fff3cd'} : {}}>
                            <td>Debt</td> 
                            <td>${suggestion.ladderData?.week?.debt?.toFixed(2)}</td>
                            <td>${suggestion.ladderData?.month?.debt?.toFixed(2)}</td>
                            <td>${suggestion.ladderData?.sixMonth?.debt?.toFixed(2)}</td>
                            <td>${suggestion.ladderData?.year?.debt?.toFixed(2)}</td>
                        </tr>
                    </React.Fragment>
                    )
                })}
                </tbody>
            </Table>
        </div>
    )
}

export default Suggestions
