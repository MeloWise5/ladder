import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Loader'
import Message from '../Message'
import { Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { snapshotLadderProfitChartAction } from '../../actions/chartActions'; 

defaults.maintainAspectRatio = true;
defaults.responsive = true;
// #region Sample data
// const data = [
//   {
//     date: 'Jan',
//     uv: 400,
//     pv: 2400,
//     amt: 2400,
//   },
//   {
//     date: 'Feb',
//     uv: 300,
//     pv: 4567,
//     amt: 2400,
//   },
//   {
//     date: 'Mar',
//     uv: 320,
//     pv: 1398,
//     amt: 2400,
//   },
//   {
//     date: 'Apr',
//     uv: 200,
//     pv: 9800,
//     amt: 2400,
//   },
//   {
//     date: 'May',
//     uv: 278,
//     pv: 3908,
//     amt: 2400,
//   },
//   {
//     date: 'Jun',
//     uv: 189,
//     pv: 4800,
//     amt: 2400,
//   },
// ];

// #endregion
export default function BarGraph({ LADDER_ID }) {
    const dispatch = useDispatch()
    const snapshotLadderProfitChart = useSelector(state => state.snapshotLadderProfitChart)
    const {snapshot_profit_chart, loading, error } = snapshotLadderProfitChart
    useEffect(() => {
        if(LADDER_ID && snapshot_profit_chart?.length > 0){
            return; 
        }else {
            dispatch(snapshotLadderProfitChartAction(LADDER_ID));
        }
    }, [dispatch, LADDER_ID]);
//console.log(snapshot_profit_chart,LADDER_ID)
    
  return (
    <>
    {loading && <Loader />}
    {error && <Message variant='danger'>{error}</Message>}
    <Bar
        data={{
            labels: snapshot_profit_chart?.map((data) => data.date), 
            datasets: [{
                label: "Profit",
                data: snapshot_profit_chart?.map((data) => data.profit),
                borderColor: '#36eb45',
                backgroundColor: '#9bf59b',
            },{
                label: "debt",
                data: snapshot_profit_chart?.map((data) => data.debt),
                borderColor: '#eb3636',
                backgroundColor: '#f59b9b',
            }]
        }}
        options={{
            elements: {
                bar: {
                    borderWidth: 4,
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Ladder Profit and Debt Over Time',}
            },
        }}
    >
    </Bar>
  </>);
}