/* 数据转换
	l : 经纬度
	p : 相对于 左上角 的 像素 位置
	i : 矩阵 index
*/ 

import * as d3 from 'd3';

import { boundry,zoom, width,height } from './index'

import { grid_len } from './pic'

let t_boundry , t_width , t_height ,left ,top ,old_t_boundry ,old_zoom


/*
	经纬度排列
	--------->  lng
	^
	|
	|
	|
	|  lat

	pixel 排序
	--------->  x
	|
	|
	|
	|
	V  y
*/


// latlng -> pixel position
//使用  t_boundry  大的瓦片 boundry
// 根据 boundryPixel 等比例转换 相对于左上角的位置


function _l2p(lat,lng) {    
	
	let lngWidth = t_boundry.top_right.lng - t_boundry.bottom_left.lng,
		latHeight = t_boundry.top_right.lat - t_boundry.bottom_left.lat,
		widthPixel = t_width,
		heightPixel = t_height;

	if( lat > t_boundry.top_right.lat || lat < t_boundry.bottom_left.lat 
		|| lng > t_boundry.top_right.lng || lng < t_boundry.bottom_left.lng)  //超出视窗
		return [-1,-1]


	let x = Math.round( (lng - t_boundry.bottom_left.lng) / lngWidth*widthPixel) , 
		y = Math.round( (t_boundry.top_right.lat - lat) / latHeight*heightPixel)

	// console.log(x,y)
    return [x,y]
}

// 与上个函不能互相转换 
// 使用 v_boundry 视窗的边界
function _p2l(x,y){
	let v_boundry = boundry

	let lngWidth = v_boundry.top_right.lng - v_boundry.bottom_left.lng,
		latHeight = v_boundry.top_right.lat - v_boundry.bottom_left.lat,
		widthPixel = width,
		heightPixel = height;

	if(x > width || x < 0 || y > height || y < 0)  return { lng:-1,lat:-1 }

	let lng =  x / widthPixel * lngWidth + v_boundry.bottom_left.lng ,
		lat =  v_boundry.top_right.lat -  y / height * latHeight 

	// 0.00001 => 赤道长 1米
	lng = lng.toFixed(5)
	lat = lat.toFixed(5)

	return {
		lng,
		lat
	}

}




// 使用全局数据 grid_len
function _p2i(x,y){
	let x_i = Math.floor( x / grid_len ) , 
		y_i = Math.floor( y / grid_len )

	return [x_i,y_i]
}





/* 经纬度转成瓦片编号（左上角）

	tile 序号排列
	--------->  x
	|
	|
	|
	|
	v  y

*/

function _l2t(lon,lat){
	let x = long2tilex(lon,zoom),
		y = lat2tiley(lat,zoom)

	return [x,y]
}
function long2tilex(lon){
	let z = zoom
 	return (Math.floor((lon+180)/360*Math.pow(2,z))); }
function lat2tiley(lat) {
	let z = zoom
 	return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,z))); }



function tile2long(x){
	let z = zoom
	return (x/Math.pow(2,z)*360-180);}
function tile2lat(y){ 
	let z = zoom
	var n=Math.PI-2*Math.PI*y/Math.pow(2,z);return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n)))); }



// 获取 瓦片视图上的 位置
// 每当 boundry 变化需要更新
function updateTileBoundry(){ 
	let v_boundry = boundry , v_number
	let ic = isChanged(v_boundry)

	if(ic){

		v_number = {
			top_right : {
				x : long2tilex( v_boundry.top_right.lng ) + 2,
				y : lat2tiley(  v_boundry.top_right.lat ) - 1
			},
			bottom_left: {
				x : long2tilex( v_boundry.bottom_left.lng) - 1 ,
				y : lat2tiley(  v_boundry.bottom_left.lat) + 2
			}
		}
	 	t_boundry = {
			top_right: {
				lng : tile2long( v_number.top_right.x ),
				lat : tile2lat(  v_number.top_right.y )
			},
			bottom_left: {
				lng : tile2long( v_number.bottom_left.x ),
				lat : tile2lat(v_number.bottom_left.y)
			}
		}

		old_t_boundry = t_boundry
	}


	t_width = Math.floor( width * 
		( t_boundry.top_right.lng - t_boundry.bottom_left.lng )
		/( v_boundry.top_right.lng - v_boundry.bottom_left.lng )  )
	t_height = Math.floor( height * 
		( t_boundry.top_right.lat - t_boundry.bottom_left.lat )
		/( v_boundry.top_right.lat - v_boundry.bottom_left.lat ) )

	left = Math.floor( t_width * 
		( v_boundry.bottom_left.lng  - t_boundry.bottom_left.lng )
		/ ( t_boundry.top_right.lng - t_boundry.bottom_left.lng ) )
	top = Math.floor( t_height *
		(t_boundry.top_right.lat - v_boundry.top_right.lat)
		/(  t_boundry.top_right.lat - t_boundry.bottom_left.lat ))


	// console.log(v_number, v_boundry, t_boundry,width,height,t_width,t_height,left,top)


	return ic
}

function isChanged(new_t_boundrt){
	let old_t_boundry = t_boundry

	if(!old_zoom  || old_zoom != zoom){
		old_zoom = zoom
		return true
	}

	if( old_t_boundry &&
		new_t_boundrt.top_right.lng <= old_t_boundry.top_right.lng &&
		new_t_boundrt.top_right.lat <= old_t_boundry.top_right.lat &&
		new_t_boundrt.bottom_left.lng >= old_t_boundry.bottom_left.lng &&
		new_t_boundrt.bottom_left.lat >= old_t_boundry.bottom_left.lat 
	)
		return false
	return true
}


// loading 效果
let loading

function showLoading(){
	if(!loading) loading = d3.select('#loading')
	loading.style("display", 'block'); 
}

function hideLoading(){
	loading.style("display", 'none'); 
}



//  data
function getData(data){
	  let url = "http://localhost:3000/"+'trajdata'
	  return fetch(url, {
	    body: JSON.stringify(data), // must match 'Content-Type' header
	    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
	    credentials: 'same-origin', // include, same-origin, *omit
	    headers: {
	      'user-agent': 'Mozilla/4.0 MDN Example',
	      'content-type': 'application/json'
	    },
	    method: 'GET', // *GET, POST, PUT, DELETE, etc.
	    mode: 'cors', // no-cors, cors, *same-origin
	    redirect: 'follow', // manual, *follow, error
	    referrer: 'no-referrer', // *client, no-referrer
	  })
	  .then(response => response.json()) // parses response to JSON
}

async function loadTrajsData() {
	let  t1 = new Date().getTime();
	console.log("Loading Data....")
	let data = await getData()

	let  t2 = new Date().getTime();
	console.log('loaddata : ' + (t2-t1) + 'ms')
	// return data.slice(0,10)
	return data
}



export { _p2i , _l2p   , _p2l ,updateTileBoundry, showLoading ,hideLoading , loadTrajsData ,
	 t_boundry , t_width , t_height ,left ,top } 


