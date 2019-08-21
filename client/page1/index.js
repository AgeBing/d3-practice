import * as  api  from './api'
import * as d3 from 'd3';
import $ from 'jquery';
require("./index.scss");

import * as d3Sankey from 'd3-sankey'
import * as dataSankey from '../../data/sankey.json'
import  mysankey from './sankey'


// import * as asd from './fdeb'

import {default as fdebForce} from './edge-bundling-force'
const width = 1000
const height = 1000

function testSankey(argument) {
	let s = new mysankey(dataSankey)
	let svg = d3.select('#map-container')
	       .append('svg')
	     .attr('width',width)
	     .attr('height',height)

	s.renderNodes(svg)
	s.renderLinks(svg)
	s.print()
}




// testSankey()














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

Promise.all(promises).then(processData);

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
  console.log(airports, flights);

	let simulation = d3.forceSimulation()
		.force('fdeb' , fdebForce() )

	simulation.nodes(airports).force('fdeb').links(flights)	

	simulation.restart()

	// let a = fdebForce( )
	// a.initialize( airports ,flights )
	// a()
	// console.log('-------------------------')
	// a()
	// console.log('-------------------------')
	// a()
}



