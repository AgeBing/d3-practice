/* 数据转换
	l : 经纬度
	p : 相对于 左上角 的 像素 位置
	i : 矩阵 index
*/ 



import { boundry,zoom, width,height,grid_len } from './pic'


let t_boundry , t_width , t_height ,left ,top ,old_t_boundry

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


// latlng -> pixel position of( **t_boundry**  )
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
function getT(){ 
	let  v_boundry = boundry,
	v_number = {
		top_right : {
			x : long2tilex( v_boundry.top_right.lng ) + 1,
			y : lat2tiley(  v_boundry.top_right.lat )
		},
		bottom_left: {
			x : long2tilex( v_boundry.bottom_left.lng),
			y : lat2tiley(  v_boundry.bottom_left.lat) + 1
		}
	}
 	let old_boundry = 
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


	return isChanged(t_boundry)
}

function isChanged(new_t_boundrt){
	if( old_t_boundry &&
		new_t_boundrt.top_right.lng == old_t_boundry.top_right.lng &&
		new_t_boundrt.top_right.lat == old_t_boundry.top_right.lat &&
		new_t_boundrt.bottom_left.lng == old_t_boundry.bottom_left.lng &&
		new_t_boundrt.bottom_left.lat == old_t_boundry.bottom_left.lat 
	)
		return false
	old_t_boundry = {
		top_right : {
			lng : new_t_boundrt.top_right.lng,
			lat : new_t_boundrt.top_right.lat
		},
		bottom_left :{
			lng : new_t_boundrt.bottom_left.lng,
			lat : new_t_boundrt.bottom_left.lat
		}
	}
	return true
}






export { _p2i , _l2p  ,getT,
	 t_width , t_height ,left ,top } 


