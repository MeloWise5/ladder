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

// Distinct palette for up to ~12 ladders
const PALETTE = [
    '#36a2eb', '#ff6384', '#ffce56', '#4bc0c0',
    '#9966ff', '#ff9f40', '#00d4aa', '#e74c3c',
    '#3498db', '#f39c12', '#1abc9c', '#9b59b6',
];

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const LEGEND_COLS = 4

export default function LineGraphBreakdown({ DATE_METHOD, MODE = 'profit' }) {
    const dispatch = useDispatch()
    const mode = MODE
    const snapshotBreakdown = useSelector(state => state.snapshotBreakdownChart)
    const { breakdown, loading, error } = snapshotBreakdown
    const chartRef = useRef(null)
    const [allHidden, setAllHidden] = useState(false)
    const [hiddenIndices, setHiddenIndices] = useState(new Set())

    const externalTooltip = (context) => {
        const { chart, tooltip } = context
        const parent = chart.canvas.parentNode
        if (!parent) return
        parent.style.position = 'relative'

        let el = parent.querySelector('[data-breakdown-tooltip]')
        if (!el) {
            el = document.createElement('div')
            el.setAttribute('data-breakdown-tooltip', '1')
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

    useEffect(() => {
        dispatch(snapshotBreakdownChartAction(DATE_METHOD || 'all'))
    }, [dispatch, DATE_METHOD])

    // Auto-hide datasets that are entirely $0 / null whenever data or mode changes
    useEffect(() => {
        const chart = chartRef.current
        if (!chart || !breakdown?.ladders) return
        const newHidden = new Set()
        breakdown.ladders.forEach((ladder, i) => {
            const allZero = (ladder[mode] || []).every(v => !v || Number(v) === 0)
            allZero ? chart.hide(i) : chart.show(i)
            if (allZero) newHidden.add(i)
        })
        setHiddenIndices(newHidden)
        setAllHidden(false)
    }, [breakdown, mode])

    const xBoundaryMap = Object.create(null)
    const dates = breakdown?.dates || []

    const datasets = (breakdown?.ladders || []).map((ladder, i) => {
        const color = PALETTE[i % PALETTE.length]
        return {
            label: ladder.name,
            data: ladder[mode],
            borderColor: color,
            backgroundColor: hexToRgba(color, 0.15),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.4,
            spanGaps: true,
        }
    })

    // Build sorted legend items (highest last-value first)
    const legendItems = datasets
        .map((ds, i) => {
            const vals = ds.data || []
            let lastVal = -Infinity
            for (let j = vals.length - 1; j >= 0; j--) {
                if (vals[j] != null) { lastVal = vals[j]; break }
            }
            return { label: ds.label, color: ds.borderColor, idx: i, lastVal }
        })
        .sort((a, b) => b.lastVal - a.lastVal)

    // Split into LEGEND_COLS columns (fill top-to-bottom per column)
    const colSize = Math.ceil(legendItems.length / LEGEND_COLS)
    const columns = Array.from({ length: LEGEND_COLS }, (_, c) =>
        legendItems.slice(c * colSize, (c + 1) * colSize)
    ).filter(col => col.length > 0)

    const toggleDataset = (idx) => {
        const chart = chartRef.current
        if (!chart) return
        if (chart.isDatasetVisible(idx)) {
            chart.hide(idx)
            setHiddenIndices(prev => new Set([...prev, idx]))
        } else {
            chart.show(idx)
            setAllHidden(false)
            setHiddenIndices(prev => { const n = new Set(prev); n.delete(idx); return n })
        }
    }

    const handleClearAll = () => {
        const chart = chartRef.current
        if (!chart) return
        const hide = !allHidden
        chart.data.datasets.forEach((_, i) => {
            hide ? chart.hide(i) : chart.show(i)
        })
        setAllHidden(hide)
        setHiddenIndices(hide ? new Set(datasets.map((_, i) => i)) : new Set())
    }

    const isEmpty = !breakdown || !breakdown.dates || breakdown.dates.length === 0

    return (
        <>
            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : isEmpty ? (
                <Message variant='info'>No breakdown data available</Message>
            ) : (
                <div>
                    {/* ── Custom legend ── */}
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
                                            onClick={() => toggleDataset(item.idx)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                cursor: 'pointer',
                                                opacity: hidden ? 0.35 : 1,
                                                userSelect: 'none',
                                            }}
                                        >
                                            <span style={{
                                                display: 'inline-block',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '2px',
                                                backgroundColor: item.color,
                                                flexShrink: 0,
                                            }} />
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: hidden ? '#555' : '#8b949e',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {item.label}
                                            </span>
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
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: {
                                        display: true,
                                        text: mode === 'profit' ? 'Profit ($)' : 'Debt ($)',
                                        color: mode === 'profit' ? '#36eb45' : '#eb3636',
                                    },
                                    ticks: {
                                        color: mode === 'profit' ? '#36eb45' : '#eb3636',
                                        callback: (v) => `$${v}`,
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Per-Ladder ${mode === 'profit' ? 'Profit' : 'Debt'} Breakdown`,
                                    color: '#c9d1d9',
                                },
                                legend: { display: false },
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
