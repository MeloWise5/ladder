import { useEffect, useMemo, useRef, useState } from 'react';
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
    const [hiddenIndices, setHiddenIndices] = useState(new Set())
    const hiddenIndicesRef = useRef(new Set())
    const [hoveredIdx, setHoveredIdx] = useState(null)
    const [hiddenProfitGroup, setHiddenProfitGroup] = useState(false)
    const hiddenProfitGroupRef = useRef(false)
    const [hiddenDebtGroup, setHiddenDebtGroup] = useState(false)
    const hiddenDebtGroupRef = useRef(false)

    const externalTooltip = (context) => {
        const { chart, tooltip } = context
        const parent = chart.canvas.parentNode
        if (!parent) return
        parent.style.position = 'relative'

        let el = parent.querySelector('[data-stacked-tooltip]')
        if (!el) {
            el = document.createElement('div')
            el.setAttribute('data-stacked-tooltip', '1')
            el.style.cssText = [
                'position:absolute',
                'background:rgba(22,27,34,0.96)',
                'border:1px solid rgba(139,148,158,0.3)',
                'border-radius:6px',
                'padding:8px 10px',
                'pointer-events:none',
                'font-size:0.72rem',
                'color:#c9d1d9',
                'min-width:210px',
                'z-index:100',
                'transition:opacity 0.1s',
            ].join(';')
            parent.appendChild(el)
        }

        if (tooltip.opacity === 0) { el.style.opacity = '0'; return }

        const title = tooltip.title?.[0] || ''
        const items = (tooltip.dataPoints || []).filter(p => (p.parsed.y ?? 0) !== 0)
        items.sort((a, b) => b.parsed.y - a.parsed.y)

        let html = `<div style="margin-bottom:5px;color:#8b949e;font-weight:bold;border-bottom:1px solid rgba(139,148,158,0.2);padding-bottom:4px">${title}</div>`
        for (const item of items) {
            const raw = item.dataset.label || ''
            const name = raw.length > 15 ? raw.slice(0, 15) + '\u2026' : raw
            const price = `$${(item.parsed.y ?? 0).toFixed(2)}`
            const color = item.dataset.borderColor || '#8b949e'
            html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:2px 0">` +
                `<div style="display:flex;align-items:center;gap:5px;min-width:0">` +
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>` +
                `<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>` +
                `</div>` +
                `<span style="white-space:nowrap;text-align:right;font-variant-numeric:tabular-nums">${price}</span>` +
                `</div>`
        }
        el.innerHTML = html

        const cx = tooltip.caretX
        const cy = tooltip.caretY
        const w = el.offsetWidth || 220
        const canvasW = chart.canvas.offsetWidth
        el.style.opacity = '1'
        el.style.left = ((cx + w + 10 > canvasW ? cx - w - 10 : cx + 10)) + 'px'
        el.style.top  = (cy - 10) + 'px'
    }
    const xBoundaryMap = Object.create(null)
    const dates = breakdown?.dates || []
    const ladders = breakdown?.ladders || []
    const nLadders = ladders.length

    // When new breakdown data arrives, re-apply ALL hidden states so time-range
    // changes don't reset Clear All, individual ladder toggles, or group toggles
    useEffect(() => {
        if (!breakdown) return
        const n = (breakdown.ladders || []).length
        const totalProfitIdx = n * 2
        const totalDebtIdx   = n * 2 + 1
        const timer = setTimeout(() => {
            const chart = chartRef.current
            if (!chart || !chart.data) return

            // Per-ladder areas
            for (let i = 0; i < n; i++) {
                const profitHidden = allHiddenRef.current || hiddenIndicesRef.current.has(i) || hiddenProfitGroupRef.current
                const debtHidden   = allHiddenRef.current || hiddenIndicesRef.current.has(i) || hiddenDebtGroupRef.current
                profitHidden ? chart.hide(i)         : chart.show(i)
                debtHidden   ? chart.hide(i + n)     : chart.show(i + n)
            }

            // Total lines
            if (totalProfitIdx < chart.data.datasets.length)
                hiddenProfitGroupRef.current ? chart.hide(totalProfitIdx) : chart.show(totalProfitIdx)
            if (totalDebtIdx < chart.data.datasets.length)
                hiddenDebtGroupRef.current   ? chart.hide(totalDebtIdx)   : chart.show(totalDebtIdx)
        }, 50)
        return () => clearTimeout(timer)
    }, [breakdown])

    // Toggle all per-ladder datasets (profit + debt areas), leave total lines untouched
    const handleClearAll = () => {
        const chart = chartRef.current
        if (!chart) return
        const hide = !allHidden
        for (let i = 0; i < nLadders; i++) {
            if (hide) {
                chart.hide(i)
                chart.hide(i + nLadders)
            } else {
                // Show All — respect group toggles
                if (!hiddenProfitGroupRef.current) chart.show(i)
                if (!hiddenDebtGroupRef.current)   chart.show(i + nLadders)
            }
        }
        allHiddenRef.current = hide
        setAllHidden(hide)
        const newSet = hide ? new Set(ladders.map((_, i) => i)) : new Set()
        hiddenIndicesRef.current = newSet
        setHiddenIndices(newSet)
    }

    const toggleLadder = (i) => {
        const chart = chartRef.current
        if (!chart) return
        const isVisible = chart.isDatasetVisible(i)
        if (isVisible) {
            chart.hide(i)
            chart.hide(i + nLadders)
        } else {
            // Only re-show each side if the corresponding group total is still on
            if (!hiddenProfitGroup) chart.show(i)
            if (!hiddenDebtGroup)   chart.show(i + nLadders)
        }
        setAllHidden(false)
        allHiddenRef.current = false
        setHiddenIndices(prev => {
            const n = new Set(prev)
            isVisible ? n.add(i) : n.delete(i)
            hiddenIndicesRef.current = n
            return n
        })
    }

    const handleLegendEnter = (i) => {
        setHoveredIdx(i)
        const chart = chartRef.current
        if (!chart) return
        const profitDs = chart.data.datasets[i]
        const debtDs = chart.data.datasets[i + nLadders]
        if (profitDs) { profitDs.borderColor = '#ffd700'; profitDs.backgroundColor = 'rgba(255,215,0,0.55)' }
        if (debtDs)   { debtDs.borderColor   = '#ffd700'; debtDs.backgroundColor   = 'rgba(255,215,0,0.55)' }
        chart.update('none')
    }

    const handleLegendLeave = (i) => {
        setHoveredIdx(null)
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

    const profitTotals = useMemo(() =>
        dates.map((_, i) => ladders.reduce((sum, l) => sum + (l.profit[i] || 0), 0)),
    [dates, ladders])
    const debtTotals = useMemo(() =>
        dates.map((_, i) => ladders.reduce((sum, l) => sum + (l.debt[i] || 0), 0)),
    [dates, ladders])

    // Per-ladder stacked profit areas — greenish, very transparent
    const profitDatasets = useMemo(() => ladders.map((ladder, i) => {
        const color = PROFIT_PALETTE[i % PROFIT_PALETTE.length]
        return {
            label: ladder.name,
            data: ladder.profit,
            borderColor: hexToRgba(color, 0.6),
            backgroundColor: hexToRgba(color, 0.5),
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            fill: i === 0 ? 'origin' : '-1',
            stack: 'profit',
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y',
            isTotal: false,
        }
    }), [ladders])

    // Per-ladder stacked debt areas — reddish, very transparent
    const debtDatasets = useMemo(() => ladders.map((ladder, i) => {
        const color = DEBT_PALETTE[i % DEBT_PALETTE.length]
        return {
            label: `${ladder.name} (debt)`,
            data: ladder.debt,
            borderColor: hexToRgba(color, 0.6),
            backgroundColor: hexToRgba(color, 0.5),
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            fill: i === 0 ? 'origin' : '-1',
            stack: 'debt',
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y1',
            isTotal: false,
        }
    }), [ladders])

    // dataset order: profit areas [0..n-1], debt areas [n..2n-1], totals [2n, 2n+1]
    const datasets = useMemo(() => [
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
    ], [profitDatasets, debtDatasets, profitTotals, debtTotals])

    const isEmpty = !breakdown || !breakdown.dates || breakdown.dates.length === 0

    return (
        <>
            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : isEmpty ? (
                <Message variant='info'>No data available</Message>
            ) : (
                <div>
                    {/* ── Custom 4-column per-ladder legend ── */}
                    {nLadders > 0 && (() => {
                        const COLS = 4
                        const sortedLadders = ladders
                            .map((l, i) => ({ ...l, idx: i }))
                            .sort((a, b) => a.name.localeCompare(b.name))
                        const colSize = Math.ceil(sortedLadders.length / COLS)
                        const columns = Array.from({ length: COLS }, (_, c) =>
                            sortedLadders.slice(c * colSize, (c + 1) * colSize)
                        ).filter(col => col.length > 0)
                        return (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px 12px',
                                padding: '6px 8px 4px',
                                alignItems: 'flex-start',
                            }}>
                                {columns.map((col, ci) => (
                                    <div key={ci} style={{
                                        flex: '1 1 20%',
                                        minWidth: '110px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                    }}>
                                        {col.map(item => {
                                            const hidden = hiddenIndices.has(item.idx)
                                            return (
                                                <div
                                                    key={item.idx}
                                                    onClick={() => toggleLadder(item.idx)}
                                                    onMouseEnter={() => handleLegendEnter(item.idx)}
                                                    onMouseLeave={() => handleLegendLeave(item.idx)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        cursor: 'pointer',
                                                        opacity: hidden ? 0.35 : 1,
                                                        userSelect: 'none',
                                                    }}
                                                >
                                                    <span style={{
                                                        display: 'inline-block', width: '10px', height: '10px',
                                                        borderRadius: '2px', flexShrink: 0,
                                                        background: PROFIT_PALETTE[item.idx % PROFIT_PALETTE.length],
                                                        opacity: hiddenProfitGroup ? 0.2 : 1,
                                                        transition: 'opacity 0.15s',
                                                    }} />
                                                    <span style={{
                                                        display: 'inline-block', width: '10px', height: '10px',
                                                        borderRadius: '2px', flexShrink: 0,
                                                        background: DEBT_PALETTE[item.idx % DEBT_PALETTE.length],
                                                        opacity: hiddenDebtGroup ? 0.2 : 1,
                                                        transition: 'opacity 0.15s',
                                                    }} />
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        color: hidden ? '#555' : hoveredIdx === item.idx ? '#ffd700' : '#8b949e',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        transition: 'color 0.15s',
                                                    }}>{item.name}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '1px' }}>
                                    <button
                                        className="stock-range-btn"
                                        onClick={handleClearAll}
                                        style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                                    >
                                        {allHidden ? 'Show All' : 'Clear All'}
                                    </button>
                                </div>
                            </div>
                        )
                    })()}

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
                                            if (isVisible) {
                                                // Hiding — always hide all in the group
                                                groupIndices.forEach(i => chart.hide(i))
                                            } else {
                                                // Showing — only show per-ladder datasets that aren't
                                                // individually hidden or covered by Clear All
                                                groupIndices.forEach(i => {
                                                    if (i === totalProfitIdx || i === totalDebtIdx) {
                                                        chart.show(i)
                                                        return
                                                    }
                                                    // i is a per-ladder index (profit: 0..n-1, debt: n..2n-1)
                                                    const ladderIdx = i < nLadders ? i : i - nLadders
                                                    if (!allHiddenRef.current && !hiddenIndicesRef.current.has(ladderIdx)) {
                                                        chart.show(i)
                                                    }
                                                })
                                            }
                                            if (idx === totalProfitIdx) {
                                                setHiddenProfitGroup(isVisible)
                                                hiddenProfitGroupRef.current = isVisible
                                            }
                                            if (idx === totalDebtIdx) {
                                                setHiddenDebtGroup(isVisible)
                                                hiddenDebtGroupRef.current = isVisible
                                            }
                                        },
                                    },
                                    tooltip: {
                                        enabled: false,
                                        external: externalTooltip,
                                    }
                                }
                            }}
                        />
                    </div>


                </div>
            )}
        </>
    )
}
