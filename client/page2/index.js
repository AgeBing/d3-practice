
import * as d3 from 'd3';

import $ from 'jquery';

require("./index.scss");
require("../common/common.js");



import { draw }  from './pic'
import { addSelect } from './select'



let event_queue = false



let  visBox = document.getElementById("map-container");

let  height = visBox.offsetHeight; //高度
let  width = visBox.offsetWidth; //宽度

//1. 创建地图 、 创建绘制层

// let tilemapservice = 'http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
let tilemapservice = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}@2x.png'
let zoomRate = 12;
let map = L.map('map-container').setView([28.0152686, 120.6558736], zoomRate);

let osmLayer = L.tileLayer(tilemapservice, {
  attribution: 'Wikimedia maps beta | &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let canvas = d3.select(map.getPanes().overlayPane).append("canvas").attr('id','canvas-upon-map')
d3.select(map.getPanes().overlayPane).append("canvas").attr('id','canvas-upon-map-select')


let svg = d3.select(map.getPanes().overlayPane)
	.append("svg")
	.attr('id','svg-select')
	.attr("width",  width)
    .attr("height",height)

let loading = d3.select(map.getPanes().overlayPane)
	.append("div")
		.attr('id','loading')
		.style('width',width+'px')
		.style('height',height+'px')
		.style('display','none')
	.append('div')
		.attr('class','lds-ripple')
		.style('float', 'right')
	loading.append('div')
	loading.append('div')








let boundry ,pixelBoundry , zoom



map.on("moveend",()=>{
	resize()
})
resize()



function resize(){
	event_queue = true

	zoom  = map.getZoom()

	boundry = { 
		bottom_left : map.getBounds().getSouthWest(),
		top_right   : map.getBounds().getNorthEast()
	}
	pixelBoundry = {
		bottom_left : map.latLngToLayerPoint(boundry.bottom_left),
		top_right 	: map.latLngToLayerPoint(boundry.top_right)
	}

	drawPic()
	addSelect()
}



// 实验  经纬度与pixel位置的转换关系
/*
	console.log(map.latLngToLayerPoint(  {
			lat : (boundry.top_right.lat + boundry.bottom_left.lat ) /2,
			lng : boundry.top_right.lng
		}
	))


	console.log(map.latLngToLayerPoint(  {
			lng : (boundry.top_right.lng + boundry.bottom_left.lng ) /2,
			lat : boundry.top_right.lat
		}
	))
*/




async function drawPic() {


	let left = -(map.getPixelOrigin().x -map.getPixelBounds().min.x ) + 'px',
		top  =  -(map.getPixelOrigin().y -map.getPixelBounds().min.y) + 'px'

	d3.select('#canvas-upon-map')
		.style("transform" , "translate(" + left + ","+ top + ")" )

	d3.select('#canvas-upon-map-select')
		.style("transform" , "translate(" + left + ","+ top + ")" )

    svg.style("left", left)
        .style("top",  top);

 	draw()

      	// updateStatis(pic)
}

function updateStatis(statis){
	let { num,opacity,width } = statis

	document.getElementById("valBox1").innerHTML = num.toString();
	document.getElementById("valBox2").innerHTML = width.toString();	
	document.getElementById("valBox3").innerHTML = opacity.toFixed(3).toString();	
}


export { map ,boundry,zoom,width,height }