import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Loader'
import Message from '../Message'
import { Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { snapshotLadderProfitChartAction } from '../../actions/chartActions'; 

defaults.maintainAspectRatio = true;
defaults.responsive = true;
defaults.color = '#8b949e';
defaults.borderColor = 'rgba(139,148,158,0.15)';
defaults.backgroundColor = 'rgba(139,148,158,0.1)';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BarGraph({ LADDER_ID, DATE_METHOD }) {
    const dispatch = useDispatch()
    const snapshotLadderProfitChart = useSelector(state => state.snapshotLadderProfitChart)
    const {snapshot_profit_chart, loading, error } = snapshotLadderProfitChart
    useEffect(() => {
        //console.log("Dispatching snapshotLadderProfitChartAction with:", LADDER_ID, DATE_METHOD || 'all');
        dispatch(snapshotLadderProfitChartAction(LADDER_ID || 'all', DATE_METHOD || 'all'));
    }, [dispatch, LADDER_ID, DATE_METHOD]);
    //console.log("snapshot_profit_chart:", snapshot_profit_chart);
  // xBoundaryMap keyed by data-index → month abbreviation for the first VISIBLE tick of
  // each month. Populated by afterBuildTicks (post-autoSkip), read by the callback.
  const xBoundaryMap = Object.create(null);

  return (
    <>
    {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message>  : snapshot_profit_chart?.length === 0 ? (
        <Message variant='info'>No historical data available</Message>
    ) : (<>
    <div style={{height: '525px'}}>
    <Line
        data={{
            
            labels: snapshot_profit_chart?.map((data) => data.date), 
            datasets: [{
                label: "Profit",
                data: snapshot_profit_chart?.map((data) => data.profit),
                borderColor: '#36eb45',
                backgroundColor: '#9bf59b',
                yAxisID: 'y',
            },{
                label: "debt",
                data: snapshot_profit_chart?.map((data) => data.debt),
                borderColor: '#eb3636',
                backgroundColor: '#f59b9b',
                yAxisID: 'y1',
            }]
        }}
        options={{
            maintainAspectRatio: false,
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            elements: {
                line: {
                    tension: 0.4,
                },
            },
            scales: {
                x: {
                    afterBuildTicks: function(axis) {
                        for (const k in xBoundaryMap) delete xBoundaryMap[k];
                        let lastYM = null;
                        for (const tick of axis.ticks) {
                            const v = tick.value;
                            const s = String(snapshot_profit_chart?.[v]?.date || '');
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
                            const s = String(snapshot_profit_chart?.[value]?.date || '');
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
                        text: 'Profit',
                        color: '#36eb45'
                    },
                    ticks: {
                        color: '#36eb45'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Debt',
                        color: '#eb3636'
                    },
                    ticks: {
                        color: '#eb3636'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Ladder Profit and Debt Over Time',
                    color: '#c9d1d9'
                },
                legend: {
                    labels: { color: '#8b949e' }
                }
            }
        }}
    >
    </Line>
    </div>
    </>)}
  </>);
}