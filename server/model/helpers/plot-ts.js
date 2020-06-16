var data=[
    {
      x: ["2013-10-04 22:23:00", "2013-10-04 22:23:01", "2013-10-04 22:23:02"],
      y: [1, 3, 6],
      type: "scatter"
    }
  ];
Plotly.newPlot("graph", data);

// function getData() {
//     return Math.random();
// }  
// Plotly.plot('graph',[{
//     y:[getData()],
//     type:'line'
// }]);

// var cnt = 0;
// setInterval(function(){
//     Plotly.extendTraces('graph',{ y:[[getData()]]}, [0]);
//     cnt++;
//     if(cnt > 500) {
//         Plotly.relayout('graph',{
//             xaxis: {
//                 range: [cnt-500,cnt]
//             }
//         });
//     }
// },15);

// var React = require('react');
// var Plot = require('react-plotly')(process.env.PLOTLY_USER_NAME, process.env.PLOTLY_API_KEY);
// var ReactDOM = require('react-dom');

// const e = React.createElement;

// class TimeSeries extends React.Component {

//     render() {
//       return (
//         e(<Plot
//           data={[
//             {
//               x: ["2013-10-04 22:23:00", "2013-11-04 22:23:00", "2013-12-04 22:23:00"],
//               y: [1, 3, 6],
//               type: "scatter"
//             }
//           ]}
//           graphOptions = { {filename: "date-axes", fileopt: "overwrite"} }
//         />)
//       );
//     }
// }

// const domContainer = document.querySelector('#graph');
// ReactDOM.render(e(TimeSeries), domContainer);