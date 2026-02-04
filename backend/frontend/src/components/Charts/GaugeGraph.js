import React from 'react'
import { Chart } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

function index(perc) {
  return perc < 70 ? 0 : perc < 90 ? 1 : 2;
}

function GaugeGraph({LADDER_DATA}) {
    Chart.register(annotationPlugin);
    const COLORS = ['rgb(140, 214, 16)', 'rgb(239, 198, 0)', 'rgb(231, 24, 49)'];
    const MIN = 0;
    const MAX = 100;
    const debt = LADDER_DATA['debt'] || 0;
    const daily_debt = Number(LADDER_DATA['snapshot'] ? LADDER_DATA['snapshot']['daily_debt'] || 0 : 0).toFixed(2);
    const budget = LADDER_DATA['budget'] || 0;
    const total_budget_left = budget - debt;
    //console.log("GaugeGraph total:", total_budget_left, debt, budget);
    const value = budget > 0 ? (debt / budget) * 100 : 0;

    const data = {
        datasets: [{
            data: [value, 100 - value],
            backgroundColor(ctx) {
            if (ctx.type !== 'data') {
                return;
            }
            if (ctx.index === 1) {
                return 'rgb(234, 234, 234)';
            }
            return COLORS[index(ctx.raw)];
            }
        }]
    };
    const annotation = {
    type: 'doughnutLabel',
    content: ({chart}) => [
        
        'Budget used',
        `$${debt} / $${budget} `,
        `Daily: $${daily_debt} `,
    ],
    
    drawTime: 'beforeDraw',
    position: {
        y: '-80%'
    },
    font: [{size: 18, weight: 'bold'}, {size: 16}],
    color: ({chart}) => [COLORS[index(chart.data.datasets[0].data[0])], 'grey']
    };
const config = {
  type: 'doughnut',
  data,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '90%',
    circumference: 180,
    rotation: -90,
    plugins: {
      annotation: {
        annotations: {
          annotation
        }
      }
    }
  }
};
  return (
    <div style={{width:'400px', height: '180px'}}>
      <Doughnut data={data} options={config.options} />
    </div>
  )
}

export default GaugeGraph
