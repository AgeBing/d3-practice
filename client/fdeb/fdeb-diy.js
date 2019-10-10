import * as d3 from 'd3';

// import * as asd from './fdeb'
// import { default as fdebForce } from './edge-bundling-force'

import { forceSimulation } from 'd3-force'
import { default as fdebForce } from './fdeb-util'


var rangeConfig = {
  'S':{
     'min' :  0,
     'max' :  2,
     'step':  0.1,
     'value': 1
  },
  'K' : {
     'min' :  0,
     'max' :  1,
     'step':  1,
     'value': 400
   }
}

function initConfig(){
  let panel = d3.select('.config')
  for(let [name, config] of Object.entries(rangeConfig) ){
    panel.append('label')
      .text( name + ':' + config.value )
      .attr('id' , 'label'+ name )
    panel.append('input')
      .attr('type' , 'number')
      .attr('min' , config.min)
      .attr('max' , config.max)
      .attr('step' , config.step)
      .attr('value' , config.value)
      .attr('id' , name )
  }


  d3.selectAll("input")
    .on("change", inputted);
}



var simulation

var urls = {
  // source: https://observablehq.com/@mbostock/u-s-airports-voronoi
  // source: https://github.com/topojson/us-atlas
  map: "https://unpkg.com/us-atlas@1/us/10m.json",

  // source: https://gist.github.com/mbostock/7608400
  airports:
    "https://gist.githubusercontent.com/mbostock/7608400/raw/e5974d9bba45bc9ab272d98dd7427567aafd55bc/airports.csv",

  // source: https://gist.github.com/mbostock/7608400
  flights:
    "https://gist.githubusercontent.com/mbostock/7608400/raw/e5974d9bba45bc9ab272d98dd7427567aafd55bc/flights.csv"
};


// load the airport and flight data together
let promises = [
  d3.csv(urls.airports, typeAirport),
  d3.csv(urls.flights,  typeFlight)
];


var projection = d3.geoAlbers().scale(1280).translate([480, 300]);

// see airports.csv
// convert gps coordinates to number and init degree
function typeAirport(airport) {
  airport.longitude = parseFloat(airport.longitude);
  airport.latitude  = parseFloat(airport.latitude);

  // use projection hard-coded to match topojson data
  let coords = projection([airport.longitude, airport.latitude]);
  airport.x = coords[0];
  airport.y = coords[1];

  airport.outgoing = 0;  // eventually tracks number of outgoing flights
  airport.incoming = 0;  // eventually tracks number of incoming flights

  airport.flights = [];  // eventually tracks outgoing flights

  return airport;
}

// see flights.csv
// convert count to number
function typeFlight(flight) {
  flight.count = parseInt(flight.count);
  return flight;
}



function processData(values) {
  console.assert(values.length === 2);

  let airports = values[0];
  let flights  = values[1];

  console.log("airports: " + airports.length , airports.slice(0,5));
  console.log(" flights: " + flights.length  , flights.slice(0,5));
  let iata = new Map(airports.map(node => [node.iata, node]));
  

  // calculate incoming and outgoing degree based on flights
  // flights are given by airport iata code (not index)
  flights.forEach(function(link) {
    link.source = iata.get(link.origin);
    link.target = iata.get(link.destination);

    link.source.outgoing += link.count;
    link.target.incoming += link.count;
  });
  // remove airports out of bounds
  let old = airports.length;
  airports = airports.filter(airport => airport.x >= 0 && airport.y >= 0);
  console.log(" removed: " + (old - airports.length) + " airports out of bounds");

  // remove airports with NA state
  old = airports.length;
  airports = airports.filter(airport => airport.state !== "NA");
  console.log(" removed: " + (old - airports.length) + " airports with NA state");

  // remove airports without any flights
  old = airports.length;
  airports = airports.filter(airport => airport.outgoing > 0 && airport.incoming > 0);
  console.log(" removed: " + (old - airports.length) + " airports without flights");

  // sort airports by outgoing degree
  airports.sort((a, b) => d3.descending(a.outgoing, b.outgoing));

  // keep only the top airports
  old = airports.length;
  airports = airports.slice(0, 50);
  console.log(" removed: " + (old - airports.length) + " airports with low outgoing degree");


  // reset map to only include airports post-filter
  iata = new Map(airports.map(node => [node.iata, node]));

  // filter out flights that are not between airports we have leftover
  old = flights.length;
  flights = flights.filter(link => iata.has(link.source.iata) && iata.has(link.target.iata));
  console.log(" removed: " + (old - flights.length) + " flights");

  // done filtering flights can draw
  // console.log(airports, flights.slice(0,10));


	var svg  = d3.select("svg");
	let f =  fdebForce() 

	simulation = forceSimulation()
    .alphaDecay(0.3)
    // .alphaDecay(1 - Math.pow(0.001, 1 / 1000))
    .force('fdeb' , f )
    .on('tick',function(){

    	if(simulation.alpha() < 0.9 ){
	        if(svg.selectAll('line').empty()){
              svg.selectAll("circle")
    		        .data(simulation.nodes().slice(0,50))
    		        .enter()
    		        .append("circle")
    		        .attr("r",  2 )
    		        .attr("cx", d => d.x) // calculated on load
    		        .attr("cy", d => d.y) // calculated on load
        				.style('fill',d => {
        					if(d.name){
        						return 'red'
        					}
        					return 'white'
        				})
        				.style('stroke','gray')
        				.style('opacity',0.5)
        				.style('display',d=>{
        					if(d.name){
        						return 'block'
        					}
        					return 'none'
        				})

    			   svg.selectAll("line")
    			        .data(f.links())
    			        .enter()
    			        .append("line")
    			        .attr('x1',d=>d.source.x)
    			        .attr('y1',d=>d.source.y)
    			        .attr('x2',d=>d.target.x)
    			        .attr('y2',d=>d.target.y)
    			        .style('stroke','gray')
    			        .style('opacity',0.2)
    			        .style('fill','gray')
			    }else{
				      
            // svg.selectAll("circle")
			         // .attr("cx", d => d.x) // calculated on load
	       			 // .attr("cy", d => d.y) // calculated on load

            svg.selectAll("line")
              .attr('x1',d=>d.source.x)
              .attr('y1',d=>d.source.y)
              .attr('x2',d=>d.target.x)
              .attr('y2',d=>d.target.y)
		      }  	
        }
    })

  console.log(airports)
  console.log(flights)


  let vk = d3.select('input#K').attr('value')
  let vstep = d3.select('input#S').attr('value')
  f.setParam( 'K'  , vk )
  f.setParam( 'S' , vstep )

	simulation.nodes(airports).force('fdeb').links(flights.slice(0,500))
	simulation.restart()
}




export default function(){
  initConfig()
  Promise.all(promises).then(processData);
}

function inputted(){
  console.log( this.value , this.id)
  d3.select('#label' + this.id)
    .text(this.id + ':' +  this.value)

  simulation.force('fdeb')
    .setParam(this.id , this.value)

   simulation.alpha(1).restart();
}
