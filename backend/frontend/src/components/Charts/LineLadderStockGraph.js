import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Loader'
import Message from '../Message'
import { Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { historicalDataChartAction } from '../../actions/chartActions'; 

// Mounts children with a fade+slide-up enter, fades+slides out before unmounting.
// Accepts children as a render function () => JSX so evaluation is deferred,
// preventing crashes when the source data becomes null during fade-out.
function FadeSlide({ show, children, duration = 200 }) {
    const [render, setRender] = useState(show);
    const [visible, setVisible] = useState(false);
    // Store the render function so we can keep calling it during fade-out
    const renderFn = useRef(typeof children === 'function' ? children : () => children);
    if (show && children != null) {
        renderFn.current = typeof children === 'function' ? children : () => children;
    }
    useEffect(() => {
        let t;
        if (show) {
            setRender(true);
            requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        } else {
            setVisible(false);
            t = setTimeout(() => setRender(false), duration);
        }
        return () => clearTimeout(t);
    }, [show, duration]);
    if (!render) return null;
    return (
        <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(-5px)',
            transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
            pointerEvents: visible ? 'auto' : 'none',
        }}>
            {renderFn.current()}
        </div>
    );
}

defaults.maintainAspectRatio = true;
defaults.responsive = true;
defaults.color = '#8b949e';
defaults.borderColor = 'rgba(139,148,158,0.15)';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Draw a simple ladder shape onto an HTMLCanvasElement.
// size = canvas pixel dimensions; Chart.js scales it to pointRadius*2 when rendering.
function makeLadderCanvas(color, size = 20) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, size * 0.12);
    ctx.lineCap = 'round';
    const lx = size * 0.28, rx = size * 0.72;
    // Left rail
    ctx.beginPath(); ctx.moveTo(lx, 1); ctx.lineTo(lx, size - 1); ctx.stroke();
    // Right rail
    ctx.beginPath(); ctx.moveTo(rx, 1); ctx.lineTo(rx, size - 1); ctx.stroke();
    // Rungs (3)
    for (let i = 0; i < 3; i++) {
        const y = 1 + (i + 0.5) * (size - 2) / 3;
        ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(rx, y); ctx.stroke();
    }
    return c;
}

export default function LineLadderStockGraph({ SYMBOL, DATE_METHOD, selectedStep, selectedTransactionId, ladder, onStepClick, selectedStepId, onStepIdClick, onDotSelected }) {
    const dispatch = useDispatch()
    const historicalDataChart = useSelector(state => state.historicalDataChart)
    const {historical, loading, error } = historicalDataChart
    const chartRef = useRef(null);
    const fadeAnimRef = useRef(null);

    // displayStep trails selectedStep — it holds the previous value during fade-out
    // so the chart overlay lingers visually instead of vanishing instantly.
    const [displayStep, setDisplayStep] = useState(null);

    // selectedDotTxnId: transaction_id of a non-heatmap dot the user clicked —
    // shows a connector line between that trade's buy and sell dots.
    const [selectedDotTxnId, setSelectedDotTxnId] = useState(null);
    const [hoveredStepTxnId, setHoveredStepTxnId] = useState(null);

    // Pre-built ladder icon canvases — stable references, created once.
    const ladderIcons = useMemo(() => ({
        buyNormal:      makeLadderCanvas('rgba(255, 68, 68, 0.10)'),
        buySolid:       makeLadderCanvas('rgba(255, 68, 68, 1)'),
        buyFaded:       makeLadderCanvas('rgba(255, 68, 68, 0.08)'),
        buyStepFaded:   makeLadderCanvas('rgba(255, 68, 68, 0.02)'),
        sellNormal:     makeLadderCanvas('rgba(68, 255, 68, 0.10)'),
        sellSolid:      makeLadderCanvas('rgba(68, 255, 68, 1)'),
        sellFaded:      makeLadderCanvas('rgba(68, 255, 68, 0.08)'),
        sellStepFaded:  makeLadderCanvas('rgba(68, 255, 68, 0.02)'),
        buyHighlight:   makeLadderCanvas('rgba(245, 166, 35, 1)', 26),
    }), []);

    useEffect(() => {
        if (selectedStep) {
            // New selection: cancel any ongoing fade and show immediately
            if (fadeAnimRef.current) { cancelAnimationFrame(fadeAnimRef.current); fadeAnimRef.current = null; }
            setSelectedDotTxnId(null);  // clear non-heatmap connector when a heatmap step is selected
            if (onStepIdClick) onStepIdClick(null); // clear step-id selection
            setDisplayStep(selectedStep);
        } else if (displayStep) {
            // Deselection: fade all overlay datasets to alpha 0 over 500ms, then clear
            const startTime = performance.now();
            const DURATION = 500;
            const step = (now) => {
                const t = Math.min((now - startTime) / DURATION, 1);
                const a = 1 - t;
                const chart = chartRef.current;
                if (chart) {
                    chart.data.datasets.forEach(ds => {
                        if (ds.label === 'Step Price') {
                            ds.borderColor = `rgba(245,166,35,${(0.9 * a).toFixed(3)})`;
                        } else if (ds.label === 'Sell Price') {
                            ds.borderColor = `rgba(68,220,100,${(0.9 * a).toFixed(3)})`;
                        } else if (ds.label === 'Highlighted Buy') {
                            // Recreate a faded canvas icon each frame
                            ds.pointStyle = makeLadderCanvas(`rgba(245,166,35,${(0.95 * a).toFixed(3)})`, 26);
                        }
                    });
                    chart.update('none');
                }
                if (t < 1) {
                    fadeAnimRef.current = requestAnimationFrame(step);
                } else {
                    fadeAnimRef.current = null;
                    setDisplayStep(null);
                }
            };
            fadeAnimRef.current = requestAnimationFrame(step);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStep]);

    // Derive transaction id locally from displayStep so it stays valid during fade
    const displayTransactionId = displayStep?.transaction?._id || null;

    // Extract historical and transactions arrays from the response
    const historicalData = historical?.historical || [];
    const transactionData = historical?.transactions || [];
    
    useEffect(() => {
        if(SYMBOL){
            dispatch(historicalDataChartAction(SYMBOL, DATE_METHOD || 'all'));
        }
    }, [dispatch, SYMBOL,DATE_METHOD]);

    // When a top-5 step is selected, clear any individual dot/transaction selection and heatmap selection
    useEffect(() => {
        if (selectedStepId) {
            setSelectedDotTxnId(null);
            if (onStepClick) onStepClick(null);
        }
    }, [selectedStepId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const parseDateValue = (value) => {
        if (value === null || value === undefined) return null;

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        if (typeof value === 'number') {
            const timestampMs = Math.abs(value) < 1000000000000 ? value * 1000 : value;
            const parsedFromNumber = new Date(timestampMs);
            return Number.isNaN(parsedFromNumber.getTime()) ? null : parsedFromNumber;
        }

        if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (!trimmedValue) return null;

            if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
                const numericValue = Number(trimmedValue);
                const timestampMs = Math.abs(numericValue) < 1000000000000 ? numericValue * 1000 : numericValue;
                const parsedFromTimestamp = new Date(timestampMs);
                return Number.isNaN(parsedFromTimestamp.getTime()) ? null : parsedFromTimestamp;
            }

            const parsedFromString = new Date(trimmedValue);
            if (!Number.isNaN(parsedFromString.getTime())) {
                return parsedFromString;
            }
        }

        return null;
    };

    const getDateKey = (value) => {
        if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (!trimmedValue) return '';

            if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
                const parsedDate = parseDateValue(trimmedValue);
                return parsedDate ? parsedDate.toISOString().split('T')[0] : trimmedValue;
            }

            if (trimmedValue.includes('T')) {
                return trimmedValue.split('T')[0];
            }

            if (trimmedValue.includes(' ')) {
                return trimmedValue.split(' ')[0];
            }

            return trimmedValue;
        }

        const parsedDate = parseDateValue(value);
        return parsedDate ? parsedDate.toISOString().split('T')[0] : '';
    };
    
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
            const dateLabel = getDateKey(item.date) || String(item.date || '');
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

        const historicalDateIndexMap = new Map();
        historicalData.forEach((item, index) => {
            const dateKey = getDateKey(item.date);
            if (dateKey && !historicalDateIndexMap.has(dateKey)) {
                historicalDateIndexMap.set(dateKey, index);
            }
        });
        
        transactions.forEach(trans => {
            // Parse the transaction date - just use the date portion
            const transDateStr = getDateKey(trans.date);
            
            // Find the index in historical data for this date
            const xPosition = historicalDateIndexMap.has(transDateStr)
                ? historicalDateIndexMap.get(transDateStr)
                : -1;
            
            // If we found the date, calculate time offset within the day
            if (xPosition >= 0) {
                // Parse the full datetime to get hour and minute (use local time, not UTC)
                const transDate = parseDateValue(trans.date);
                const hours = transDate ? transDate.getHours() : 0;
                const minutes = transDate ? transDate.getMinutes() : 0;
                
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

    // Highlight the buy/sell dots for the hovered stacked-bar row in burnt orange
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        const stepSid = selectedStepId ? String(selectedStepId) : null;
        chart.data.datasets[1].pointStyle = transactionPoints.buyFullData.map((t) => {
            if (hoveredStepTxnId && String(t.transaction_id) === hoveredStepTxnId) return ladderIcons.buyHighlight;
            if (selectedDotTxnId && String(t.transaction_id) === selectedDotTxnId) return ladderIcons.buySolid;
            if (stepSid && t.step_id != null && String(t.step_id) === stepSid) return ladderIcons.buySolid;
            return stepSid ? ladderIcons.buyStepFaded : ladderIcons.buyNormal;
        });
        chart.data.datasets[2].pointStyle = transactionPoints.sellFullData.map((t) => {
            if (hoveredStepTxnId && String(t.transaction_id) === hoveredStepTxnId) return ladderIcons.buyHighlight;
            if (selectedDotTxnId && String(t.transaction_id) === selectedDotTxnId) return ladderIcons.sellSolid;
            if (stepSid && t.step_id != null && String(t.step_id) === stepSid) return ladderIcons.sellSolid;
            return stepSid ? ladderIcons.sellStepFaded : ladderIcons.sellNormal;
        });
        chart.update('none');
    }, [hoveredStepTxnId, selectedDotTxnId, selectedStepId, transactionPoints, ladderIcons]);

    // Derive display data for a clicked non-heatmap dot pair
    const selectedDotInfo = (() => {
        if (!selectedDotTxnId) return null;
        const bi = transactionPoints.buyFullData.findIndex(d => String(d.transaction_id) === selectedDotTxnId);
        if (bi < 0) return null;
        const buyTxn = transactionPoints.buyFullData[bi];
        const si = transactionPoints.sellFullData.findIndex(d => String(d.transaction_id) === selectedDotTxnId);
        const sellTxn = si >= 0 ? transactionPoints.sellFullData[si] : null;
        const profit = buyTxn.profit != null ? buyTxn.profit : null;
        const shares = buyTxn.shares != null ? buyTxn.shares : null;
        const buyTotal = (shares != null && buyTxn.price != null) ? shares * buyTxn.price : null;
        const profitPct = (profit != null && buyTotal) ? (profit / buyTotal) * 100 : null;
        const fmtDate = (raw) => {
            if (!raw) return '—';
            const d = parseDateValue(raw);
            if (!d) return '—';
            const day  = d.toLocaleDateString('en-US', { weekday: 'short' });
            const mon  = d.toLocaleDateString('en-US', { month: 'short' });
            const num  = d.getDate();
            return `${day} - ${mon} ${num}`;
        };
        return { buyTxn, sellTxn, profit, shares, buyTotal, profitPct, fmtDate };
    })();

    // Derive all transactions for a step-level click (top-5 steps by profit)
    const selectedStepTxns = (() => {
        if (!selectedStepId) return null;
        const sid = String(selectedStepId);
        const fmtDate = (raw) => {
            if (!raw) return '—';
            const d = parseDateValue(raw);
            if (!d) return '—';
            const day = d.toLocaleDateString('en-US', { weekday: 'short' });
            const mon = d.toLocaleDateString('en-US', { month: 'short' });
            const num = d.getDate();
            return `${day} - ${mon} ${num}`;
        };
        // Collect unique transaction_ids for this step from buy side
        const txnIds = [...new Set([
            ...transactionPoints.buyFullData
                .filter(d => d.step_id != null && String(d.step_id) === sid)
                .map(d => String(d.transaction_id)),
            ...transactionPoints.sellFullData
                .filter(d => d.step_id != null && String(d.step_id) === sid)
                .map(d => String(d.transaction_id)),
        ])];
        if (!txnIds.length) return null;
        // Build per-txn info, sorted by buy date
        const pairs = txnIds.map(txnId => {
            const bi = transactionPoints.buyFullData.findIndex(d => String(d.transaction_id) === txnId);
            const buyTxn = bi >= 0 ? transactionPoints.buyFullData[bi] : null;
            const si = transactionPoints.sellFullData.findIndex(d => String(d.transaction_id) === txnId);
            const sellTxn = si >= 0 ? transactionPoints.sellFullData[si] : null;
            if (!buyTxn) return null;
            const profit = buyTxn.profit != null ? buyTxn.profit : null;
            const shares = buyTxn.shares != null ? buyTxn.shares : null;
            const buyTotal = (shares != null && buyTxn.price != null) ? shares * buyTxn.price : null;
            const profitPct = (profit != null && buyTotal) ? (profit / buyTotal) * 100 : null;
            return { txnId, buyTxn, sellTxn, profit, shares, buyTotal, profitPct };
        }).filter(Boolean);
        // Sort by buy date ascending
        pairs.sort((a, b) => {
            const da = parseDateValue(a.buyTxn.date);
            const db = parseDateValue(b.buyTxn.date);
            return (da?.getTime() || 0) - (db?.getTime() || 0);
        });
        return { pairs, fmtDate };
    })();

  // xBoundaryMap is populated by the afterBuildTicks plugin below.
  // It keys data-index → month abbreviation for the FIRST VISIBLE tick of each month.
  // Using afterBuildTicks guarantees we work from the post-autoSkip tick list, not the
  // full label array, so skipped boundary dates never cause a missing month label.
  const xBoundaryMap = Object.create(null);

  return (
    <>
    {(loading || (!loading && !error && chartData.labels.length === 0 && SYMBOL)) ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : chartData.labels.length === 0 ? (
        <Message variant='info'>No historical data available</Message>
    ) : (<>
    <div style={{height: '525px'}}>
        <Line
        ref={chartRef}
        data={{
            
            labels: chartData.labels, 
            datasets: [{
                label: "Stock Price",
                data: chartData.close.map((value, index) => ({ x: index, y: value })),
                borderColor: '#f0e040',
                backgroundColor: 'rgba(240, 224, 64, 0.18)',
                pointBackgroundColor: 'rgba(240, 224, 64, 0.18)',
                pointBorderColor: '#f0e040',
                pointStyle: 'circle',
                pointRadius: chartData.sizes,
                pointHoverRadius: chartData.sizes.map(size => size + 2),
            },{
                label: "Buy",
                data: transactionPoints.buyData,
                type: 'scatter',
                borderColor: 'rgba(255, 68, 68, 1)',
                backgroundColor: 'rgba(255, 68, 68, 0.85)',
                pointStyle: transactionPoints.buyData.map(() => ladderIcons.buyNormal),
                pointRadius: transactionPoints.buySizes,
                pointHoverRadius: transactionPoints.buySizes.map(size => size + 2),
                showLine: false,
                order: 0,
            },{
                label: "Sell",
                data: transactionPoints.sellData,
                type: 'scatter',
                borderColor: 'rgba(68, 255, 68, 1)',
                backgroundColor: 'rgba(68, 255, 68, 0.85)',
                pointStyle: transactionPoints.sellData.map(() => ladderIcons.sellNormal),
                pointRadius: transactionPoints.sellSizes,
                pointHoverRadius: transactionPoints.sellSizes.map(size => size + 2),
                showLine: false,
                order: 0,
            },{
                label: "Highest",
                data: chartData.high.map((value, index) => ({ x: index, y: value })),
                borderColor: '#000000',
                backgroundColor: 'rgba(214, 214, 214, 0.5)',
                fill: '+1', // Fills area between this line and Line 2
                pointRadius: 0, // Hide points for this line
                pointHoverRadius: 0,
                order: 1,
            },{
                label: "Lowest",
                data: chartData.low.map((value, index) => ({ x: index, y: value })),
                borderColor: '#000000',
                backgroundColor: 'rgba(206, 206, 206, 0.5)',
                pointRadius: 0, // Hide points for this line
                pointHoverRadius: 0,
                order: 1,
            },
            // ── Selected step highlight (uses displayStep so it fades rather than vanishing) ──
            ...(displayStep ? [{
                label: 'Step Price',
                data: chartData.labels.map((_, i) => ({ x: i, y: Number(displayStep.transaction?.buy_price || displayStep.price) })),
                borderColor: 'rgba(245, 166, 35, 0.9)',
                borderWidth: 2,
                borderDash: [6, 3],
                backgroundColor: 'transparent',
                pointRadius: 0,
                pointHoverRadius: 0,
                showLine: true,
                fill: false,
                order: 0,
            // Only show the highlighted dot for SELL/OPEN steps — BUY status means the
            // position is still open and not yet plotted on the chart as a completed trade.
            }, ...(displayStep.status?.toUpperCase() !== 'BUY' ? [{
                label: 'Highlighted Buy',
                data: transactionPoints.buyData.filter((_, i) => {
                    const d = transactionPoints.buyFullData[i];
                    if (!displayTransactionId) return false;
                    return String(d?.transaction_id) === String(displayTransactionId);
                }),
                type: 'scatter',
                borderColor: 'rgba(245, 166, 35, 1)',
                backgroundColor: 'transparent',
                pointStyle: ladderIcons.buyHighlight,
                pointRadius: 13,
                pointHoverRadius: 16,
                showLine: false,
                order: 0,
            }] : [])] : []),
            // ── Sell price line (Percentage & Fixed ladders, completed sells only) ──
            // Skip for BUY-status steps — sell_price is a target, not yet executed.
            ...(displayStep?.status?.toUpperCase() !== 'BUY' &&
                ['percentage', 'fixed'].includes(displayStep?.transaction?.ladder_type?.toLowerCase()) &&
                displayStep?.transaction?.sell_price ? [{
                label: 'Sell Price',
                data: chartData.labels.map((_, i) => ({ x: i, y: Number(displayStep.transaction.sell_price) })),
                borderColor: 'rgba(68, 220, 100, 0.9)',
                borderWidth: 2,
                borderDash: [6, 3],
                backgroundColor: 'transparent',
                pointRadius: 0,
                pointHoverRadius: 0,
                showLine: true,
                fill: false,
                order: 0,
            }] : []),
            // ── Non-heatmap dot connector (line from buy dot to sell dot) ──
            ...((() => {
                if (!selectedDotTxnId) return [];
                const bi = transactionPoints.buyFullData.findIndex(d => String(d.transaction_id) === selectedDotTxnId);
                const si = transactionPoints.sellFullData.findIndex(d => String(d.transaction_id) === selectedDotTxnId);
                if (bi < 0 || si < 0) return [];
                return [{
                    label: 'Dot Connector',
                    data: [transactionPoints.buyData[bi], transactionPoints.sellData[si]],
                    borderColor: 'rgba(245, 166, 35, 0.85)',
                    borderWidth: 2,
                    borderDash: [4, 3],
                    backgroundColor: 'transparent',
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    showLine: true,
                    fill: false,
                    order: 0,
                }];
            })()),
            // ── Step-level connectors (all txns for a top-5 step click) ──
            ...((() => {
                if (!selectedStepId) return [];
                const sid = String(selectedStepId);
                const txnIds = [...new Set(
                    transactionPoints.buyFullData
                        .filter(d => d.step_id != null && String(d.step_id) === sid)
                        .map(d => String(d.transaction_id))
                )];
                return txnIds.flatMap(txnId => {
                    const bi = transactionPoints.buyFullData.findIndex(d => String(d.transaction_id) === txnId);
                    const si = transactionPoints.sellFullData.findIndex(d => String(d.transaction_id) === txnId);
                    if (bi < 0 || si < 0) return [];
                    return [{
                        label: 'Step Connector',
                        data: [transactionPoints.buyData[bi], transactionPoints.sellData[si]],
                        borderColor: 'rgba(100, 180, 255, 0.7)',
                        borderWidth: 1.5,
                        borderDash: [4, 3],
                        backgroundColor: 'transparent',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        showLine: true,
                        fill: false,
                        order: 0,
                        legend: { display: false },
                        animation: false,
                    }];
                });
            })()),
            // ────────────────────────────────────────────────────────────
            ]
        }}
        options={{
            maintainAspectRatio: false,
            onClick: (event, activeElements, chart) => {
                if (!activeElements.length) return;
                const el = activeElements[0];
                const datasetLabel = chart.data.datasets[el.datasetIndex].label;
                if (datasetLabel !== 'Buy' && datasetLabel !== 'Sell') return;
                const fullData = datasetLabel === 'Buy'
                    ? transactionPoints.buyFullData[el.index]
                    : transactionPoints.sellFullData[el.index];
                if (!fullData) return;
                const txnId = String(fullData.transaction_id);

                // Check if this dot belongs to a heatmap step
                if (onStepClick && ladder?.steps) {
                    const matchingStep = ladder.steps.find(
                        s => String(s.transaction?._id) === txnId
                    );
                    if (matchingStep) {
                        // Heatmap dot: clear connector, toggle step selection
                        setSelectedDotTxnId(null);
                        onStepClick(selectedStep && String(selectedStep._id) === String(matchingStep._id) ? null : matchingStep);
                        return;
                    }
                }

                // Non-heatmap dot: clear heatmap selection, clear step selection, toggle connector line
                if (onStepClick) onStepClick(null);
                if (onStepIdClick) onStepIdClick(null);
                const isSelecting = selectedDotTxnId !== txnId;
                setSelectedDotTxnId(isSelecting ? txnId : null);
                if (isSelecting && onDotSelected) {
                    const bi = transactionPoints.buyFullData.findIndex(d => String(d.transaction_id) === txnId);
                    const buyTxn = bi >= 0 ? transactionPoints.buyFullData[bi] : null;
                    const si = transactionPoints.sellFullData.findIndex(d => String(d.transaction_id) === txnId);
                    const sellTxn = si >= 0 ? transactionPoints.sellFullData[si] : null;
                    onDotSelected(buyTxn?.date ?? null, sellTxn?.date ?? null);
                }
            },
            onHover: (event, activeElements, chart) => {
                if (activeElements.length > 0) {
                    const activeElement = activeElements[0];
                    const datasetLabel = chart.data.datasets[activeElement.datasetIndex].label;

                    if (datasetLabel === 'Buy' || datasetLabel === 'Sell') {
                        event.native.target.style.cursor = 'pointer';
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
                        
                        // Update Buy icon styles — solid for hovered/selected pair or step selection, faded for all others
                        const stepSid = selectedStepId ? String(selectedStepId) : null;
                        chart.data.datasets[1].pointStyle = transactionPoints.buyFullData.map((t, i) => {
                            const isActive = (datasetLabel === 'Buy' && i === dataIndex) || i === matchingBuyIndex
                                || (selectedDotTxnId && String(t.transaction_id) === selectedDotTxnId)
                                || (stepSid && t.step_id != null && String(t.step_id) === stepSid);
                            if (isActive) return ladderIcons.buySolid;
                            return stepSid ? ladderIcons.buyStepFaded : ladderIcons.buyFaded;
                        });

                        // Update Sell icon styles
                        chart.data.datasets[2].pointStyle = transactionPoints.sellFullData.map((t, i) => {
                            const isActive = (datasetLabel === 'Sell' && i === dataIndex) || i === matchingSellIndex
                                || (selectedDotTxnId && String(t.transaction_id) === selectedDotTxnId)
                                || (stepSid && t.step_id != null && String(t.step_id) === stepSid);
                            if (isActive) return ladderIcons.sellSolid;
                            return stepSid ? ladderIcons.sellStepFaded : ladderIcons.sellFaded;
                        });

                        chart.update('none');
                    } else {
                        // Hovering a non-clickable element (stock line etc.) — reset cursor
                        event.native.target.style.cursor = 'default';
                    }
                } else {
                    // Reset cursor — restore icons respecting both single-txn and step-level selections
                    event.native.target.style.cursor = 'default';
                    const stepSid = selectedStepId ? String(selectedStepId) : null;
                    chart.data.datasets[1].pointStyle = transactionPoints.buyFullData.map(t => {
                        if (selectedDotTxnId && String(t.transaction_id) === selectedDotTxnId) return ladderIcons.buySolid;
                        if (stepSid && t.step_id != null && String(t.step_id) === stepSid) return ladderIcons.buySolid;
                        return stepSid ? ladderIcons.buyStepFaded : ladderIcons.buyNormal;
                    });
                    chart.data.datasets[2].pointStyle = transactionPoints.sellFullData.map(t => {
                        if (selectedDotTxnId && String(t.transaction_id) === selectedDotTxnId) return ladderIcons.sellSolid;
                        if (stepSid && t.step_id != null && String(t.step_id) === stepSid) return ladderIcons.sellSolid;
                        return stepSid ? ladderIcons.sellStepFaded : ladderIcons.sellNormal;
                    });
                    chart.update('none');
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    afterBuildTicks: function(axis) {
                        for (const k in xBoundaryMap) delete xBoundaryMap[k];
                        let lastYM = null;
                        for (const tick of axis.ticks) {
                            const v = Math.round(tick.value);
                            const s = String(chartData.labels[v] || '');
                            const p = s.split('-');
                            if (p.length < 3) continue;
                            const ym = p[0] + '-' + p[1];
                            if (ym !== lastYM) {
                                lastYM = ym;
                                xBoundaryMap[v] = MONTH_ABBR[parseInt(p[1], 10) - 1] || '';
                            }
                        }
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function(value) {
                            const v = Math.round(value);
                            if (v < 0 || v >= chartData.labels.length) return '';
                            const s = String(chartData.labels[v] || '');
                            const p = s.split('-');
                            if (p.length < 3) return s;
                            const day = p[2].substring(0, 2);
                            return (v in xBoundaryMap) ? [day, xBoundaryMap[v]] : day;
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
                        usePointStyle: true,
                        pointStyleWidth: 16,
                        boxHeight: 10,
                        padding: 16,
                        color: '#8b949e',
                        filter: function(item, chart) {
                            // Hide Highest and Lowest from legend
                            return item.text !== 'Highest' && item.text !== 'Lowest'
                                && item.text !== 'Step Price' && item.text !== 'Highlighted Buy'
                                && item.text !== 'Sell Price' && item.text !== 'Dot Connector'
                                && item.text !== 'Step Connector';
                        }
                    },
                    onHover: (event, legendItem, legend) => {
                        event.native.target.style.cursor = 'pointer';
                        // Fade all datasets except the hovered one
                        legend.chart.data.datasets.forEach((ds, i) => {
                            ds._savedAlpha = ds._savedAlpha ?? 1;
                            if (i === legendItem.datasetIndex) {
                                ds.borderColor = ds.borderColor?.replace(/[\d.]+\)$/, '1)') ?? ds.borderColor;
                                ds.backgroundColor = ds.backgroundColor?.replace(/[\d.]+\)$/, '1)') ?? ds.backgroundColor;
                            } else {
                                ds.borderColor = ds.borderColor?.replace(/[\d.]+\)$/, '0.15)') ?? ds.borderColor;
                                ds.backgroundColor = ds.backgroundColor?.replace(/[\d.]+\)$/, '0.15)') ?? ds.backgroundColor;
                            }
                        });
                        legend.chart.update('none');
                    },
                    onLeave: (event, legendItem, legend) => {
                        event.native.target.style.cursor = 'default';
                        // Restore all datasets to their default opacity
                        legend.chart.data.datasets.forEach((ds, i) => {
                            if (ds.label === 'Buy') {
                                ds.borderColor = 'rgba(255, 68, 68, 1)';
                                ds.backgroundColor = 'rgba(255, 68, 68, 0.85)';
                            } else if (ds.label === 'Sell') {
                                ds.borderColor = 'rgba(68, 255, 68, 1)';
                                ds.backgroundColor = 'rgba(68, 255, 68, 0.85)';
                            } else if (ds.label === 'Stock Price') {
                                ds.borderColor = '#f0e040';
                                ds.backgroundColor = 'rgba(240, 224, 64, 0.18)';
                            }
                        });
                        legend.chart.update('none');
                    },
                },
                tooltip: {
                    enabled: true,
                    position: 'nearest',
                    xAlign: 'left',
                    yAlign: 'bottom',
                    caretPadding: 25,
                    filter: function(item) {
                        // Only show tooltip for Stock Price line, not for Buy/Sell dots
                        return item.dataset.label === 'Stock Price';
                    },
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
    </div>
    <FadeSlide show={!!selectedDotInfo}>{() =>
        <div className="dot-txn-bar">
            <div className="dot-txn-side dot-txn-buy">
                <span className="dot-txn-label">BUY</span>
                <span className="dot-txn-price">
                    {selectedDotInfo.shares != null ? `${selectedDotInfo.shares}@` : ''}
                    ${Number(selectedDotInfo.buyTxn.price).toFixed(2)}
                </span>
                <span className="dot-txn-date">{selectedDotInfo.fmtDate(selectedDotInfo.buyTxn.date)}</span>
                {selectedDotInfo.buyTotal != null && (
                    <span className="dot-txn-total">Total ${selectedDotInfo.buyTotal.toFixed(2)}</span>
                )}
            </div>
            <span className="dot-txn-arrow">→</span>
            {selectedDotInfo.sellTxn ? (
                <div className="dot-txn-side dot-txn-sell">
                    <span className="dot-txn-label">SELL</span>
                    <span className="dot-txn-price">
                        {selectedDotInfo.shares != null ? `${selectedDotInfo.shares}@` : ''}
                        ${Number(selectedDotInfo.sellTxn.price).toFixed(2)}
                    </span>
                    <span className="dot-txn-date">{selectedDotInfo.fmtDate(selectedDotInfo.sellTxn.date)}</span>
                </div>
            ) : (
                <div className="dot-txn-side dot-txn-open">
                    <span className="dot-txn-label">OPEN</span>
                    <span className="dot-txn-date">position not yet closed</span>
                </div>
            )}
            {selectedDotInfo.profit !== null && (
                <>
                    <span className="dot-txn-sep" />
                    <div className={`dot-txn-pnl ${selectedDotInfo.profit >= 0 ? 'pos' : 'neg'}`}>
                        <span className="dot-txn-label">Total P&amp;L</span>
                        <span className="dot-txn-price">{selectedDotInfo.profit >= 0 ? '+' : ''}${Math.abs(selectedDotInfo.profit).toFixed(2)}</span>
                        {selectedDotInfo.profitPct != null && (
                            <span className="dot-txn-pct">{selectedDotInfo.profitPct >= 0 ? '+' : ''}{selectedDotInfo.profitPct.toFixed(2)}%</span>
                        )}
                    </div>
                </>
            )}
            <button className="dot-txn-close" onClick={() => setSelectedDotTxnId(null)} title="Dismiss">✕</button>
        </div>
    }</FadeSlide>
    <FadeSlide show={!!selectedStepTxns}>{() => (() => {
        const stepCode = ladder?.top_5_steps_by_profit?.find(s => s.step_id === selectedStepId)?.step_code;
        const validPricePairs = selectedStepTxns?.pairs.filter(p => p.buyTotal != null) ?? [];
        const avgPrice = validPricePairs.length
            ? validPricePairs.reduce((sum, p) => sum + p.buyTotal, 0) / validPricePairs.length
            : null;
        const pairsWithProfit = selectedStepTxns?.pairs.filter(p => p.profit != null) ?? [];
        const totalProfit = pairsWithProfit.length
            ? pairsWithProfit.reduce((sum, p) => sum + p.profit, 0)
            : null;
        const totalBuyTotal = selectedStepTxns.pairs.reduce((sum, p) => sum + (p.buyTotal ?? 0), 0);
        const totalReturnPct = (totalProfit != null && avgPrice != null && avgPrice > 0)
            ? (totalProfit / avgPrice) * 100
            : null;
        return (
        <div className="dot-txn-stack">
            <div className="dot-txn-stack-header">
                <span className="dot-txn-stack-title">
                    {stepCode ? `Step ${stepCode} Transactions` : 'Step Transactions'}
                    {selectedStepTxns?.pairs?.length ? ` (${selectedStepTxns.pairs.length})` : ''}
                </span>
                <button className="dot-txn-close" onClick={() => onStepIdClick && onStepIdClick(null)} title="Dismiss">✕</button>
            </div>
            <div className="dot-txn-stack-summary">
                {avgPrice != null && (
                    <span>Trade Price (AVG): <b>${avgPrice.toFixed(2)}</b></span>
                )}
                {totalProfit != null && (
                    <>
                        <span className="dot-txn-stack-sep">|</span>
                        <span className={totalProfit >= 0 ? 'pos' : 'neg'}>
                            {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toFixed(2)}
                            {totalReturnPct != null && (
                                <span className="dot-txn-stack-ret"> &nbsp;{totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%</span>
                            )}
                        </span>
                    </>
                )}
            </div>
            <div className="dot-txn-stack-body">
            {selectedStepTxns.pairs.map(({ txnId, buyTxn, sellTxn, profit, shares, buyTotal, profitPct }) => (
                <div key={txnId} className="dot-txn-bar dot-txn-bar--stacked"
                    onMouseEnter={() => setHoveredStepTxnId(String(txnId))}
                    onMouseLeave={() => setHoveredStepTxnId(null)}
                    style={{ cursor: 'default' }}
                >
                    <div className="dot-txn-side dot-txn-buy">
                        <span className="dot-txn-label">BUY</span>
                        <span className="dot-txn-price">
                            {shares != null ? `${shares}@` : ''}${Number(buyTxn.price).toFixed(2)}
                        </span>
                        <span className="dot-txn-date">{selectedStepTxns.fmtDate(buyTxn.date)}</span>
                        {buyTotal != null && (
                            <span className="dot-txn-total">Total ${buyTotal.toFixed(2)}</span>
                        )}
                    </div>
                    <span className="dot-txn-arrow">→</span>
                    {sellTxn ? (
                        <div className="dot-txn-side dot-txn-sell">
                            <span className="dot-txn-label">SELL</span>
                            <span className="dot-txn-price">
                                {shares != null ? `${shares}@` : ''}${Number(sellTxn.price).toFixed(2)}
                            </span>
                            <span className="dot-txn-date">{selectedStepTxns.fmtDate(sellTxn.date)}</span>
                        </div>
                    ) : (
                        <div className="dot-txn-side dot-txn-open">
                            <span className="dot-txn-label">OPEN</span>
                            <span className="dot-txn-date">not yet closed</span>
                        </div>
                    )}
                    {profit !== null && (
                        <>
                            <span className="dot-txn-sep" />
                            <div className={`dot-txn-pnl ${profit >= 0 ? 'pos' : 'neg'}`}>
                                <span className="dot-txn-price">{profit >= 0 ? '+' : ''}${Math.abs(profit).toFixed(2)}</span>
                                {profitPct != null && (
                                    <span className="dot-txn-pct">{profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ))}
            </div>
        </div>
        );
    })()}</FadeSlide>
    </>)}
  </>);
}