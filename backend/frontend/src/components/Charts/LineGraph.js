import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Loader'
import Message from '../Message'
import { Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { snapshotLadderProfitChartAction } from '../../actions/chartActions'; 

defaults.maintainAspectRatio = true;
defaults.responsive = true;

export default function BarGraph({ LADDER_ID, DATE_METHOD }) {
    const dispatch = useDispatch()
    const snapshotLadderProfitChart = useSelector(state => state.snapshotLadderProfitChart)
    const {snapshot_profit_chart, loading, error } = snapshotLadderProfitChart
    useEffect(() => {
        //console.log("Dispatching snapshotLadderProfitChartAction with:", LADDER_ID, DATE_METHOD || 'all');
        dispatch(snapshotLadderProfitChartAction(LADDER_ID || 'all', DATE_METHOD || 'all'));
    }, [dispatch, LADDER_ID, DATE_METHOD]);
    //console.log("snapshot_profit_chart:", snapshot_profit_chart);
  return (
    <>
    {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message>  : snapshot_profit_chart?.length === 0 ? (
        <Message variant='info'>No historical data available</Message>
    ) : (<>
    <div style={{height: '350px'}}>
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
                    text: 'Ladder Profit and Debt Over Time',}
            },
            legend: {
                labels: {
                    filter: function(item, chart) {
                    // Keep the legend item if its text doesn't match the one to hide
                    return item.text !== 'Highest' || item.text !== 'Lowest'; 
                    // Or filter by index:
                    // return item.datasetIndex !== 1; // Hides the second dataset
                    }
                }
            }
        }}
    >
    </Line>
    </div>
    </>)}
  </>);
}