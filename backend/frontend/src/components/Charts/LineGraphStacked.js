import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Loader';
import Message from '../Message';
import { Chart as ChartJS, defaults } from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import { snapshotBreakdownChartAction } from '../../actions/chartActions';

defaults.maintainAspectRatio = true;
defaults.responsive = true;
defaults.color = '#8b949e';
defaults.borderColor = 'rgba(139,148,158,0.15)';

// Greenish hues for per-ladder profit areas
const PROFIT_PALETTE = [
    '#00e676', '#69f0ae', '#76ff03', '#b9f6ca',
    '#00c853', '#ccff90', '#1de9b6', '#a5d6a7',
    '#39d353', '#64ffda', '#b2ff59', '#00bfa5',
];

// Reddish hues for per-ladder debt areas
const DEBT_PALETTE = [
    '#ff5252', '#ff1744', '#ff4081', '#f50057',
    '#ff6e40', '#ff3d00', '#e53935', '#c62828',
    '#ef5350', '#ff7043', '#d32f2f', '#e57373',
];

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function LineGraphStacked({ DATE_METHOD }) {
    const dispatch = useDispatch()
    const snapshotBreakdown = useSelector(state => state.snapshotBreakdownChart)
    const { breakdown, loading, error } = snapshotBreakdown

    useEffect(() => {
        dispatch(snapshotBreakdownChartAction(DATE_METHOD || 'all'))
    }, [dispatch, DATE_METHOD])

    const chartRef = useRef(null)
    const [allHidden, setAllHidden] = useState(false)
    const allHiddenRef = useRef(false)
    const xBoundaryMap = Object.create(null)
    const dates = breakdown?.dates || []
    const ladders = breakdown?.ladders || []
    const nLadders = ladders.length

    // When new breakdown data arrives, re-apply the hidden state so date-range
    // changes don't reset the Clear All / Show All toggle
    useEffect(() => {
        if (!breakdown) return
        const n = (breakdown.ladders || []).length
        const timer = setTimeout(() => {
            const chart = chartRef.current
            if (!chart || !chart.data) return
            for (let i = 0; i < n * 2; i++) {
                if (i >= chart.data.datasets.length) break
                allHiddenRef.current ? chart.hide(i) : chart.show(i)
            }
        }, 50)
        return () => clearTimeout(timer)
    }, [breakdown])

    // Toggle all per-ladder datasets (profit + debt areas), leave total lines untouched
    const handleClearAll = () => {
        const chart = chartRef.current
        if (!chart) return
        const hide = !allHidden
        for (let i = 0; i < nLadders * 2; i++) {
            hide ? chart.hide(i) : chart.show(i)
        }
        allHiddenRef.current = hide
        setAllHidden(hide)
    }

    const handleLegendEnter = (i) => {
        const chart = chartRef.current
        if (!chart) return
        const profitDs = chart.data.datasets[i]
        const debtDs = chart.data.datasets[i + nLadders]
        if (profitDs) { profitDs.borderColor = '#ffd700'; profitDs.backgroundColor = 'rgba(255,215,0,0.55)' }
        if (debtDs)   { debtDs.borderColor   = '#ffd700'; debtDs.backgroundColor   = 'rgba(255,215,0,0.55)' }
        chart.update('none')
    }

    const handleLegendLeave = (i) => {
        const chart = chartRef.current
        if (!chart) return
        const pColor = PROFIT_PALETTE[i % PROFIT_PALETTE.length]
        const dColor = DEBT_PALETTE[i % DEBT_PALETTE.length]
        const profitDs = chart.data.datasets[i]
        const debtDs = chart.data.datasets[i + nLadders]
        if (profitDs) { profitDs.borderColor = hexToRgba(pColor, 0.6); profitDs.backgroundColor = hexToRgba(pColor, 0.5) }
        if (debtDs)   { debtDs.borderColor   = hexToRgba(dColor, 0.6); debtDs.backgroundColor   = hexToRgba(dColor, 0.5) }
        chart.update('none')
    }

    const profitTotals = dates.map((_, i) =>
        ladders.reduce((sum, l) => sum + (l.profit[i] || 0), 0)
    )
    const debtTotals = dates.map((_, i) =>
        ladders.reduce((sum, l) => sum + (l.debt[i] || 0), 0)
    )

    // Per-ladder stacked profit areas — greenish, very transparent
    const profitDatasets = ladders.map((ladder, i) => {
        const color = PROFIT_PALETTE[i % PROFIT_PALETTE.length]
        return {
            label: ladder.name,
            data: ladder.profit,
            borderColor: hexToRgba(color, 0.6),
            backgroundColor: hexToRgba(color, 0.5),
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            // 'origin' for first — fills 0→line; '-1' for rest — fills prev line→this line (no overlap)
            fill: i === 0 ? 'origin' : '-1',
            stack: 'profit',
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y',
            isTotal: false,
        }
    })

    // Per-ladder stacked debt areas — reddish, very transparent
    const debtDatasets = ladders.map((ladder, i) => {
        const color = DEBT_PALETTE[i % DEBT_PALETTE.length]
        return {
            label: `${ladder.name} (debt)`,
            data: ladder.debt,
            borderColor: hexToRgba(color, 0.6),
            backgroundColor: hexToRgba(color, 0.5),
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            // 'origin' for first — fills 0→line; '-1' for rest — fills prev line→this line (no overlap)
            fill: i === 0 ? 'origin' : '-1',
            stack: 'debt',
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y1',
            isTotal: false,
        }
    })

    // dataset order: profit areas [0..n-1], debt areas [n..2n-1], totals [2n, 2n+1]
    const datasets = [
        ...profitDatasets,
        ...debtDatasets,
        {
            label: 'Total Profit',
            data: profitTotals,
            borderColor: '#00e676',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: false,
            stack: '_tp',
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y',
            isTotal: true,
        },
        {
            label: 'Total Debt',
            data: debtTotals,
            borderColor: '#ff5252',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: false,
            stack: '_td',
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y1',
            isTotal: true,
        },
    ]

    const isEmpty = !breakdown || !breakdown.dates || breakdown.dates.length === 0

    return (
        <>
            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : isEmpty ? (
                <Message variant='info'>No data available</Message>
            ) : (
                <div>
                    {/* Chart — built-in legend shows Total Profit + Total Debt only */}
                    <div style={{ height: '525px' }}>
                        <Line
                            ref={chartRef}
                            data={{ labels: dates, datasets }}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                interaction: { mode: 'index', intersect: false },
                                elements: { line: { tension: 0.4 } },
                                scales: {
                                    x: {
                                        afterBuildTicks: function(axis) {
                                            for (const k in xBoundaryMap) delete xBoundaryMap[k];
                                            let lastYM = null;
                                            for (const tick of axis.ticks) {
                                                const v = tick.value;
                                                const s = String(dates[v] || '');
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
                                                const s = String(dates[value] || '');
                                                const p = s.split('-');
                                                if (p.length < 3) return s || String(value);
                                                const day = p[2].substring(0, 2);
                                                return (value in xBoundaryMap) ? [day, xBoundaryMap[value]] : day;
                                            }
                                        }
                                    },
                                    y: {
                                        stacked: true,
                                        type: 'linear',
                                        display: true,
                                        position: 'left',
                                        title: { display: true, text: 'Profit ($)', color: '#00e676' },
                                        ticks: { color: '#00e676', callback: (v) => `$${v}` }
                                    },
                                    y1: {
                                        stacked: true,
                                        type: 'linear',
                                        display: true,
                                        position: 'right',
                                        title: { display: true, text: 'Debt ($)', color: '#ff5252' },
                                        ticks: { color: '#ff5252', callback: (v) => `$${v}` },
                                        grid: { drawOnChartArea: false },
                                    }
                                },
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'All Ladders — Profit & Debt Overview',
                                        color: '#c9d1d9',
                                    },
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: '#c9d1d9',
                                            // Only show the two total lines at the top
                                            filter: (item) => item.datasetIndex >= nLadders * 2,
                                        },
                                        onClick: (e, legendItem, legend) => {
                                            const chart = legend.chart
                                            const idx = legendItem.datasetIndex
                                            const totalProfitIdx = nLadders * 2
                                            const totalDebtIdx = nLadders * 2 + 1

                                            // Determine which group indices to toggle
                                            let groupIndices = [idx]
                                            if (idx === totalProfitIdx) {
                                                // Toggle all per-ladder profit areas [0..n-1] + the total line
                                                groupIndices = [...Array(nLadders).keys(), totalProfitIdx]
                                            } else if (idx === totalDebtIdx) {
                                                // Toggle all per-ladder debt areas [n..2n-1] + the total line
                                                groupIndices = [
                                                    ...[...Array(nLadders).keys()].map(i => i + nLadders),
                                                    totalDebtIdx,
                                                ]
                                            }

                                            const isVisible = chart.isDatasetVisible(idx)
                                            groupIndices.forEach(i => {
                                                isVisible ? chart.hide(i) : chart.show(i)
                                            })
                                        },
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) =>
                                                `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toFixed(2)}`,
                                        }
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Custom per-ladder legend below the chart */}
                    {nLadders > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '8px 16px',
                            justifyContent: 'center',
                            padding: '12px 8px 4px',
                        }}>
                            <button
                                className="stock-range-btn"
                                onClick={handleClearAll}
                                style={{ fontSize: '0.72rem', alignSelf: 'center' }}
                            >
                                {allHidden ? 'Show All' : 'Clear All'}
                            </button>
                            {ladders.map((ladder, i) => (
                                <div
                                    key={ladder.name}
                                    className="stacked-legend-item"
                                    onMouseEnter={() => handleLegendEnter(i)}
                                    onMouseLeave={() => handleLegendLeave(i)}
                                >
                                    {/* Green profit swatch */}
                                    <span style={{
                                        display: 'inline-block',
                                        width: '10px', height: '10px',
                                        borderRadius: '2px',
                                        background: PROFIT_PALETTE[i % PROFIT_PALETTE.length],
                                        opacity: 0.8,
                                    }} />
                                    {/* Red debt swatch */}
                                    <span style={{
                                        display: 'inline-block',
                                        width: '10px', height: '10px',
                                        borderRadius: '2px',
                                        background: DEBT_PALETTE[i % DEBT_PALETTE.length],
                                        opacity: 0.8,
                                    }} />
                                    {ladder.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
