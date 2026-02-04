import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Loader'
import Message from '../Message'
import { Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { historicalDataChartAction } from '../../actions/chartActions'; 

defaults.maintainAspectRatio = true;
defaults.responsive = true;

export default function LineLadderStockGraph({ SYMBOL,DATE_METHOD }) {
    const dispatch = useDispatch()
    const historicalDataChart = useSelector(state => state.historicalDataChart)
    const {historical, loading, error } = historicalDataChart
    const chartRef = useRef(null);
    
    // Extract historical and transactions arrays from the response
    const historicalData = historical?.historical || [];
    const transactionData = historical?.transactions || [];
    
    useEffect(() => {
        if(SYMBOL){
            dispatch(historicalDataChartAction(SYMBOL, DATE_METHOD || 'all'));
        }
    }, [dispatch, SYMBOL,DATE_METHOD]);
    
    // Calculate dynamic point sizes based on volume
    const calculatePointSizes = (data) => {
        if (!data || data.length === 0) return [];
        
        const volumes = data.map(item => parseFloat(item.volume) || 0);
        const maxVolume = Math.max(...volumes);
        const minVolume = Math.min(...volumes);
        const maxPointSize = 8; // Maximum point radius
        const minPointSize = 3; // Minimum point radius
        
        return volumes.map(volume => {
            if (maxVolume === minVolume) return minPointSize;
            const normalized = (volume - minVolume) / (maxVolume - minVolume);
            return minPointSize + (normalized * (maxPointSize - minPointSize));
        });
    };
    
    const pointSizes = calculatePointSizes(historicalData);
    
    // Process historical data for main line
    const processHistoricalData = (historical) => {
        if (!historical || historical.length === 0) {
            return { 
                labels: [], 
                close: [], 
                high: [], 
                low: [], 
                sizes: [], 
                fullData: []
            };
        }
        
        const labels = [];
        const close = [];
        const high = [];
        const low = [];
        const sizes = [];
        
        historical.forEach((item, index) => {
            const dateLabel = item.date.split('T')[0] || item.date;
            labels.push(dateLabel);
            close.push(parseFloat(item.close));
            high.push(parseFloat(item.high));
            low.push(parseFloat(item.low));
            sizes.push(pointSizes[index] || 3);
        });
        
        return { labels, close, high, low, sizes, fullData: historical };
    };
    
    // Process transactions as overlay scatter points (separated by buy/sell)
    const processTransactions = (transactions, historicalData) => {
        if (!transactions || transactions.length === 0 || !historicalData || historicalData.length === 0) {
            return { 
                buyData: [], buySizes: [], buyFullData: [],
                sellData: [], sellSizes: [], sellFullData: []
            };
        }
        
        const buyPoints = [];
        const buySizes = [];
        const buyFullData = [];
        
        const sellPoints = [];
        const sellSizes = [];
        const sellFullData = [];
        
        transactions.forEach(trans => {
            // Parse the transaction date - just use the date portion
            const transDateStr = trans.date.split('T')[0] || trans.date.split(' ')[0];
            
            // Find the index in historical data for this date
            let xPosition = -1;
            for (let i = 0; i < historicalData.length; i++) {
                const histDateStr = historicalData[i].date.split('T')[0] || historicalData[i].date.split(' ')[0];
                if (histDateStr === transDateStr) {
                    xPosition = i;
                    break;
                }
            }
            
            // If we found the date, calculate time offset within the day
            if (xPosition >= 0) {
                // Parse the full datetime to get hour and minute (use local time, not UTC)
                const transDate = new Date(trans.date);
                const hours = transDate.getHours();
                const minutes = transDate.getMinutes();
                
                // Calculate percentage of day (0.0 to 1.0)
                const timeOffset = (hours + minutes / 60) / 24;
                
                // Since xPosition is the END of day close, position trades BEFORE it
                const point = {
                    x: xPosition - 1 + timeOffset,
                    y: trans.price
                };
                
                if (trans.side === 'buy') {
                    buyPoints.push(point);
                    buySizes.push(8);
                    buyFullData.push(trans);
                } else {
                    sellPoints.push(point);
                    sellSizes.push(8);
                    sellFullData.push(trans);
                }
            }
        });
        
        return { 
            buyData: buyPoints, buySizes, buyFullData,
            sellData: sellPoints, sellSizes, sellFullData
        };
    };
    
    const chartData = processHistoricalData(historicalData);
    const transactionPoints = processTransactions(transactionData, historicalData);
    
  return (
    <>
    {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : chartData.labels.length === 0 ? (
        <Message variant='info'>No historical data available</Message>
    ) : (<>
        <Line
        ref={chartRef}
        data={{
            
            labels: chartData.labels, 
            datasets: [{
                label: "Stock Price",
                data: chartData.close.map((value, index) => ({ x: index, y: value })),
                borderColor: '#36eb45',
                backgroundColor: '#9bf59b',
                pointBackgroundColor: '#9bf59b',
                pointBorderColor: '#36eb45',
                pointRadius: chartData.sizes,
                pointHoverRadius: chartData.sizes.map(size => size + 2),
                
            },{
                label: "Buy",
                data: transactionPoints.buyData,
                type: 'scatter',
                borderColor: 'transparent',
                backgroundColor: 'rgba(255, 68, 68, 0.2)',
                pointBackgroundColor: 'rgba(255, 68, 68, 0.2)',
                pointBorderColor: 'rgba(255, 68, 68, 0.2)',
                pointRadius: transactionPoints.buySizes,
                pointHoverRadius: transactionPoints.buySizes.map(size => size + 2),
                showLine: false,
                order: 0 // Draw on top
            },{
                label: "Sell",
                data: transactionPoints.sellData,
                type: 'scatter',
                borderColor: 'transparent',
                backgroundColor: 'rgba(68, 255, 68, 0.2)',
                pointBackgroundColor: 'rgba(68, 255, 68, 0.2)',
                pointBorderColor: 'rgba(68, 255, 68, 0.2)',
                pointRadius: transactionPoints.sellSizes,
                pointHoverRadius: transactionPoints.sellSizes.map(size => size + 2),
                showLine: false,
                order: 0 // Draw on top
            },{
                label: "Highest",
                data: chartData.high.map((value, index) => ({ x: index, y: value })),
                borderColor: '#000000',
                backgroundColor: 'rgba(214, 214, 214, 0.5)',
                fill: '+1', // Fills area between this line and Line 2
                pointRadius: 0, // Hide points for this line
                pointHoverRadius: 0
            },{
                label: "Lowest",
                data: chartData.low.map((value, index) => ({ x: index, y: value })),
                borderColor: '#000000',
                backgroundColor: 'rgba(206, 206, 206, 0.5)',
                pointRadius: 0, // Hide points for this line
                pointHoverRadius: 0
                
            }]
        }}
        options={{
            onHover: (event, activeElements, chart) => {
                if (activeElements.length > 0) {
                    const activeElement = activeElements[0];
                    const datasetLabel = chart.data.datasets[activeElement.datasetIndex].label;
                    
                    if (datasetLabel === 'Buy' || datasetLabel === 'Sell') {
                        const dataIndex = activeElement.index;
                        const transData = datasetLabel === 'Buy' 
                            ? transactionPoints.buyFullData[dataIndex]
                            : transactionPoints.sellFullData[dataIndex];
                        
                        //#console.log('Hovering over transaction:', transData);
                        
                        const transactionId = transData?.transaction_id;
                        
                        // Find matching transaction in the opposite dataset
                        let matchingBuyIndex = -1;
                        let matchingSellIndex = -1;
                        
                        if (datasetLabel === 'Buy') {
                            matchingSellIndex = transactionPoints.sellFullData.findIndex(
                                t => t.transaction_id === transactionId
                            );
                            //#console.log('Looking for sell with transaction_id:', transactionId, 'Found at index:', matchingSellIndex);
                        } else {
                            matchingBuyIndex = transactionPoints.buyFullData.findIndex(
                                t => t.transaction_id === transactionId
                            );
                            //#console.log('Looking for buy with transaction_id:', transactionId, 'Found at index:', matchingBuyIndex);
                        }
                        
                        // Update Buy dataset colors
                        const buyColors = transactionPoints.buyFullData.map((t, i) => {
                            // Highlight if this is the hovered buy OR if it matches the hovered sell
                            if ((datasetLabel === 'Buy' && i === dataIndex) || i === matchingBuyIndex) {
                                return 'rgba(255, 68, 68, 1)';
                            }
                            return 'rgba(255, 68, 68, 0.05)';
                        });
                        
                        // Update Sell dataset colors
                        const sellColors = transactionPoints.sellFullData.map((t, i) => {
                            // Highlight if this is the hovered sell OR if it matches the hovered buy
                            if ((datasetLabel === 'Sell' && i === dataIndex) || i === matchingSellIndex) {
                                return 'rgba(68, 255, 68, 1)';
                            }
                            return 'rgba(68, 255, 68, 0.05)';
                        });
                        
                        // Apply the new colors
                        chart.data.datasets[1].backgroundColor = buyColors;
                        chart.data.datasets[1].pointBackgroundColor = buyColors;
                        chart.data.datasets[1].pointBorderColor = buyColors;
                        
                        chart.data.datasets[2].backgroundColor = sellColors;
                        chart.data.datasets[2].pointBackgroundColor = sellColors;
                        chart.data.datasets[2].pointBorderColor = sellColors;
                        
                        chart.update('none');
                    }
                } else {
                    // Reset to original colors when not hovering
                    const buyColors = Array(transactionPoints.buyFullData.length).fill('rgba(255, 68, 68, 0.2)');
                    const sellColors = Array(transactionPoints.sellFullData.length).fill('rgba(68, 255, 68, 0.2)');
                    
                    chart.data.datasets[1].backgroundColor = buyColors;
                    chart.data.datasets[1].pointBackgroundColor = buyColors;
                    chart.data.datasets[1].pointBorderColor = buyColors;
                    
                    chart.data.datasets[2].backgroundColor = sellColors;
                    chart.data.datasets[2].pointBackgroundColor = sellColors;
                    chart.data.datasets[2].pointBorderColor = sellColors;
                    
                    chart.update('none');
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    ticks: {
                        callback: function(value, index) {
                            // Show the date label for whole numbers only
                            if (Number.isInteger(value) && value >= 0 && value < chartData.labels.length) {
                                return chartData.labels[value];
                            }
                            return '';
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4,
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Stock Price Over Time',
                },
                legend: {
                    labels: {
                        filter: function(item, chart) {
                            // Hide Highest and Lowest from legend
                            return item.text !== 'Highest' && item.text !== 'Lowest';
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    position: 'nearest',
                    xAlign: 'left',
                    yAlign: 'bottom',
                    caretPadding: 25,
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            
                            if (context.dataset.label === 'Buy') {
                                const trans = transactionPoints.buyFullData[dataIndex];
                                return [
                                    '🔴 BUY',
                                    `Price: $${trans.price.toFixed(2)}`,
                                    `Transaction ID: ${trans.transaction_id}`
                                ];
                            } else if (context.dataset.label === 'Sell') {
                                const trans = transactionPoints.sellFullData[dataIndex];
                                return [
                                    '🟢 SELL',
                                    `Price: $${trans.price.toFixed(2)}`,
                                    `Transaction ID: ${trans.transaction_id}`
                                ];
                            } else if (context.dataset.label === 'Stock Price') {
                                const item = chartData.fullData[dataIndex];
                                return [
                                    `Close: $${parseFloat(item.close).toFixed(2)}`,
                                    `High: $${parseFloat(item.high).toFixed(2)}`,
                                    `Low: $${parseFloat(item.low).toFixed(2)}`,
                                    `Volume: ${parseFloat(item.volume).toLocaleString()}`
                                ];
                            }
                            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }}
    >
    </Line>
    </>)}
  </>);
}