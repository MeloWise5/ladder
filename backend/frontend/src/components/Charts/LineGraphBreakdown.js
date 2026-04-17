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

export default function LineGraphBreakdown({ DATE_METHOD, MODE = 'profit' }) {
    const dispatch = useDispatch()
    const mode = MODE
    const snapshotBreakdown = useSelector(state => state.snapshotBreakdownChart)
    const { breakdown, loading, error } = snapshotBreakdown
    const chartRef = useRef(null)
    const [allHidden, setAllHidden] = useState(false)

    useEffect(() => {
        dispatch(snapshotBreakdownChartAction(DATE_METHOD || 'all'))
    }, [dispatch, DATE_METHOD])

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

    const handleClearAll = () => {
        const chart = chartRef.current
        if (!chart) return
        const hide = !allHidden
        chart.data.datasets.forEach((_, i) => {
            hide ? chart.hide(i) : chart.show(i)
        })
        setAllHidden(hide)
    }

    const isEmpty = !breakdown || !breakdown.dates || breakdown.dates.length === 0

    return (
        <>
            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : isEmpty ? (
                <Message variant='info'>No breakdown data available</Message>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 0' }}>
                        <button
                            className="stock-range-btn"
                            onClick={handleClearAll}
                            style={{ fontSize: '0.72rem' }}
                        >
                            {allHidden ? 'Show All' : 'Clear All'}
                        </button>
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
                                legend: {
                                    labels: { color: '#8b949e' },
                                    onClick: (e, legendItem, legend) => {
                                        const chart = legend.chart
                                        const idx = legendItem.datasetIndex
                                        if (chart.isDatasetVisible(idx)) {
                                            chart.hide(idx)
                                        } else {
                                            chart.show(idx)
                                            // If user manually shows one, we're no longer "all hidden"
                                            setAllHidden(false)
                                        }
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y ?? '-'}`
                                    }
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
