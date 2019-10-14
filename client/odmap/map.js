import * as d3 from 'd3';
import * as topojson from 'topojson'
import * as d3GeoVoronoi from 'd3-geo-voronoi'

import { default as odmap } from './d3.layout.odmap.js'

require('../fdeb/fdeb.scss')
var urls = {
  map: "https://unpkg.com/us-atlas@1/us/10m.json",
  airports: "https://gist.githubusercontent.com/mbostock/7608400/raw/e5974d9bba45bc9ab272d98dd7427567aafd55bc/airports.csv",
  flights: "https://gist.githubusercontent.com/mbostock/7608400/raw/e5974d9bba45bc9ab272d98dd7427567aafd55bc/flights.csv"
};


var svg,
	projection,
	g,
	scales

var od,max,min,color,anim=700,scale_x,scale_y;

export default function() {

	svg  = d3.select("svg");

	projection = d3.geoAlbers().scale(1280).translate([480, 300]);
	// projection = d3.geoAlbers()

	scales = {
	  // used to scale airport bubbles
	  airports: d3.scaleSqrt()
	    .range([4, 18]),

	};

	svg.append('g').attr('id','basemap')
	svg.append('g').attr('id','airports')

	g = {
	  basemap:  svg.select("g#basemap"),
	  flights:  svg.select("g#flights"),
	  airports: svg.select("g#airports"),
	  voronoi:  svg.select("g#voronoi")
	};
	d3.json(urls.map).then(_drawMap);
	// d3.csv(urls.airports).then(_drawAirport)

	let promises = [
	  d3.csv(urls.airports, typeAirport),
	  d3.csv(urls.flights,  typeFlight)
	];
	Promise.all(promises).then(processData);
}

// draws the underlying map
function _drawMap(map) {

  // remove non-continental states
  map.objects.states.geometries = map.objects.states.geometries.filter(isContinental);

  // run topojson on remaining states and adjust projection
  let land = topojson.merge(map, map.objects.states.geometries);

  // use null projection; data is already projected
  let path = d3.geoPath();

  // draw base map
  g.basemap.append("path")
    .datum(land)
    .attr("class", "land")
    .attr("d", path);

  // draw interior borders
  g.basemap.append("path")
    .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
    .attr("class", "border interior")
    .attr("d", path);

  // draw exterior borders
  g.basemap.append("path")
    .datum(topojson.mesh(map, map.objects.states, (a, b) => a === b))
    .attr("class", "border exterior")
    .attr("d", path);
}


function processData(values){

  let airports = values[0];
  let flights  = values[1];
  let odOrigin = JSON.parse(JSON.stringify(flights))
  let iata = new Map(airports.map(node => [node.iata, node]));
  flights.forEach(function(link) {
    link.source = iata.get(link.origin);
    link.target = iata.get(link.destination);

    link.source.outgoing += link.count;
    link.target.incoming += link.count;
  });

  airports = airports.filter(airport => airport.x >= 0 && airport.y >= 0);
  airports = airports.filter(airport => airport.state !== "NA");
  airports = airports.filter(airport => airport.outgoing > 0 && airport.incoming > 0);
  airports.sort((a, b) => d3.descending(a.outgoing, b.outgoing));
  airports = airports.slice(0, 33);
  drawAirports(airports);

  let  odData = []
  airports.forEach((airport)=>{
  	let name  = airport.iata
  	let odObj = {
  		id : name,
  		x  : airport.x,
  		y  : airport.y
  	}
  	for(let i = 0;i < odOrigin.length;i++){
  		if(odOrigin[i]['origin'] == name){
  			let destination = odOrigin[i]['destination'],
  				count = odOrigin[i]['count']
  			for(let j = 0;j < airports.length;j++){
  				if(destination == airports[j].iata){
  					odObj[destination] = count
  					break
  				}
  			}
  		}
  	}
  	odData.push(odObj)
  })
  console.log(odData)


	// var svg = d3.select("#svg").append("g").attr("class","container");

	// d3.csv("data/data.csv", function(error, data){
		od = odmap({
			width:950,
			height:600
		});

	// 	console.log(data)
	// 	return

		od.data(odData);
		od.toggle();

		var d = od.nmap(od.nmap());
		console.log(d)
		// updateData(d);
		drawGrids(d)
	// });
}

function drawGrids(d){

	svg = d3.select("svg").append("g").attr("class","container")
		.attr('transform' , "translate(20,15)")

	color = d3.scaleLinear().domain([0,d.smax])
    			.range(['rgba(255,0,0,0)', 'rgba(255,0,0,1)']);
	//Scale for the inner rectangles
	scale_x = ((d.data[0].data.data[0].width/(d.width/d.data[0].width))/d.data[0].data.data[0].width);
	scale_y = ((d.data[0].data.data[0].height/(d.height/d.data[0].height))/d.data[0].data.data[0].height);

	//Create Groups
	var groups = svg.selectAll("g.group").data(d.data);

	groups = groups.enter().append("g")
		.attr("class", "group");

	console.log(groups)
	groups.attr("transform", function(d){ 
		console.log(d)
		return "translate("+d.x+","+d.y+") scale("+scale_x+","+scale_y+")"; 
	});


	groups.on('mouseenter',function(){
		// console.log(d3.select(this))
		let selected = d3.select(this)
		groups.style('opacity',0.1)
		selected.style('opacity',1)
	})

	groups.on('mouseout',function(){
		// console.log(d3.select(this))
		// let selected = d3.select(this)
		groups.style('opacity',1)
		// selected.style('opacity',1)
	})

//Create Sub-Groups
	var subgroups = groups.selectAll("rect.data").data(function(d){ return d.data.data; });

	subgroups = subgroups.enter().append("rect")
		.attr("class", "data")
		.style("stroke", "#000");

	subgroups.transition().duration(anim)
		.style("fill", function(d){ return color(d.amount) || 'rgba(255,0,0,0)';})
		.attr("width", function(d){ return d.width; })
		.attr("height", function(d){ return d.height; })
		.attr("x", function(d){ return d.x; })
		.attr("y", function(d){ return d.y; });

	subgroups.exit().remove();

	//Draw Borders
	var border = svg.selectAll("rect.borde").data(d.data);

	border = border.enter().append("rect")
		.attr("class", "borde")
		.style("fill", "none");

	border.transition().duration(anim)
		.style("stroke", "#000")
		.style('opacity',0.5)
		.attr("width", function(d){ return d.width })
		.attr("height", function(d){ return d.height; })
		.attr("x", function(d){ return d.x; })
		.attr("y", function(d){ return d.y; });

	border.exit().remove();

}

function drawAirports(airports){
	let bubbles = g.airports.selectAll("circle.airport")
		.data(airports, d => d.iata)
		.enter()
		.append("circle")
		.attr("r",  4)
		.attr("cx", d => d.x) // calculated on load
		.attr("cy", d => d.y) // calculated on load
		.attr("class", "airport")
		.each(function(d) {
		  // adds the circle object to our airport
		  // makes it fast to select airports on hover
		  d.bubble = this;
		});
}
// function typedAirportData(airport){
//   airport.longitude = parseFloat(airport.longitude);
//   airport.latitude  = parseFloat(airport.latitude);

//   // use projection hard-coded to match topojson data
//   let coords = projection([airport.longitude, airport.latitude]);
//   airport.x = coords[0];
//   airport.y = coords[1];

//   airport.outgoing = 0;  // eventually tracks number of outgoing flights
//   airport.incoming = 0;  // eventually tracks number of incoming flights

//   airport.flights = [];  // eventually tracks outgoing flights
//   return airport;
// }





/*---------------------------------------------------------------*/


// determines which states belong to the continental united states
// https://gist.github.com/mbostock/4090846#file-us-state-names-tsv
function isContinental(state) {
  var id = parseInt(state.id);
  return id < 60 && id !== 2 && id !== 15;
}
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