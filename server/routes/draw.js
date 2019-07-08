var fs = require('fs')

let boundry , width, height 

let x_num = 100 , grid_len , y_num

let trajs 



/*
export function process(argument) {

	let  t1 = new Date().getTime();
		let trajsStr = fs.readFileSync('./image/医院和学校结果.json')
		let trajs = JSON.parse(trajsStr)
	let  t2 = new Date().getTime();
	console.log(t2-t1 + 'ms')

	  t1 = new Date().getTime();
		let siteStr = fs.readFileSync('./image/sites.json')
		let sites = JSON.parse(siteStr)
	  t2 = new Date().getTime();
	console.log(t2-t1 + 'ms')

		// console.log(trajs[0])
		// console.log(sites.slice(0,10))

	  t1 = new Date().getTime();
		let points , siteId 
		trajs.forEach((t)=>{
			points = t.traj
			points.forEach((p)=>{
				siteId = p.site
				p.longitude = sites[siteId][1].longitude
				p.latitude = sites[siteId][1].latitude
			})
		})
	  t2 = new Date().getTime();
	console.log(t2-t1 + 'ms')


	  t1 = new Date().getTime();
		fs.writeFileSync('./image/trajs.json', JSON.stringify(trajs));
	  t2 = new Date().getTime();
	console.log(t2-t1 + 'ms')
}
*/

export function draw(b,w,h,line_o,line_w,line_p) {
	boundry = b
	width   = w
	height  = h

	if(!trajs) trajs = loadTrajsData()
	let trajs_pixel_points = processTrajsData(trajs)
	// console.log(trajs_pixel_points.length)

	let len = Math.floor(trajs_pixel_points.length * line_p)



	let sta = drawTrajs(trajs_pixel_points.slice(0,len),line_o,line_w)


	// createMatrix()
	// let ps = genePoints()
	// console.log(ps)

 //    let url = drawHeatmap()
	return sta
}



/*
export function drawTest(){

	const { createCanvas, loadImage } = require('canvas')
	const canvas = createCanvas(200,500)
	const ctx = canvas.getContext('2d')

	// // ctx.lineWidth = line_width
 //   	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
   	ctx.fillStyle = 'rgba(0,0,0,0.5)';
   	ctx.fillRect(10, 10, 10, 10);
   	ctx.fillRect(15, 15, 10, 10);

	console.log(ctx.getImageData(10,10,1,1))
	console.log(ctx.getImageData(15,15,1,1))

	// 	let sta = {
	// 			url : canvas.toDataURL(),
	// 			num : trajs.length,
	// 			opacity: line_opacity,
	// 			width: line_width,
	// 			image: ctx.getImageData(0,0,width,height)
	// 		}

	// 		ctx.clearRect(0,0,width,height)

	// Use the normal primitives.
	fs.writeFileSync('./image/out.png', canvas.toBuffer())
}
*/


function loadTrajsData() {
	let  t1 = new Date().getTime();

	let trajsStr = fs.readFileSync('./image/trajs.json')
	let trajs = JSON.parse(trajsStr)

	let  t2 = new Date().getTime();
	console.log(t2-t1 + 'ms')

	console.log(trajs.length)

	return trajs
	// return trajs.slice(0,1000)
}
function processTrajsData(data) {
	let  t1 = new Date().getTime();

	let trajs_pixelpoints = []
	let points , siteId 
	data.forEach((t)=>{
		let withinTraj = false
		let pixel_points = []
		points = t.traj
		
		points.forEach((p)=>{
			let xy = _l2p( p.latitude, p.longitude )
			if(xy[0] == -1) withinTraj = true 
			pixel_points.push(xy)
		})

		if(withinTraj) return true  //continue

		trajs_pixelpoints.push({
			pid : t.pid,
			traj : pixel_points,
			withinTraj: withinTraj
		})
	})


	let  t2 = new Date().getTime();
	console.log('process : ' + (t2-t1) + 'ms')

	return trajs_pixelpoints
}

function drawTrajs(trajs,line_o,line_w){


	const { createCanvas, loadImage } = require('canvas')
	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	let line_width = line_w,
		line_opacity = line_o	

	// let sta_arr = [] , line_opacity,line_width,line_num 
	
	// for(line_width = 0.5 ; line_width < 2; line_width += 0.5){

	// 	for(line_opacity = 0.005;line_opacity < 0.03 ; line_opacity += 0.005){


		let  t1 = new Date().getTime();
			ctx.lineWidth = line_width
		   	ctx.strokeStyle = 'rgba(0,0,0,'+ line_opacity+')';

			trajs.forEach(t=>{
				drawOneTraj(ctx,t.traj)
			})


   	ctx.fillStyle = 'rgba(0,0,0,0.5)';
   	ctx.fillRect(10, 10, 10, 10);
   	

		let sta = {
				url : canvas.toDataURL(),
				num : trajs.length,
				opacity: line_opacity,
				width: line_width,
				// image: ctx.getImageData(0,0,width,height)
			}


		let alpha_obj = []
				
		let imageData = ctx.getImageData(0,0,width,height)['data']

		for(let i = 3; i < 4 * width * height ; i+= 4){
			if(imageData[i] > 0){
				alpha_obj.push({
					x :  ((i - 3) / 4 ) % width ,
					y :  Math.floor((i - 3) / 4  / width) + 1 ,
					a : imageData[i]
				})
			}
		}


	// 	console.log(imageData.length)
	// 	console.log(width * height * 4)

	// for(let i = 0 ;i < imageData.length ;i++){
	// 	if(imageData[i] != 0){
	// 		alpha_obj.push({
	// 			i : i ,
	// 			d : imageData[i]
	// 		})
	// 		// console.log(i)
	// 	}
	// }


		fs.writeFileSync('./image/alpha.json', JSON.stringify(alpha_obj));



		let  t2 = new Date().getTime();
		console.log('draw: ' + (t2-t1) + 'ms')
		console.log(line_width,line_opacity)

	// 	}
	// }

	return sta

}
function drawOneTraj(ctx,points){
	ctx.beginPath()

   	// ctx.globalAlpha = Math.random()

	let beginPoint = points[0] 
	ctx.moveTo(beginPoint[0],beginPoint[1])

	for(let i = 1;i < points.length;i++){
		let [x,y] = points[i]
		ctx.lineTo(x,y)
	}

	ctx.closePath();
 	ctx.stroke();
}






/**/
function drawHeatmap(){
	let  t1 = new Date().getTime();

	let x_num = 100 ,
		grid_len = width / x_num,
		y_num = Math.ceil(height /  grid_len)


	const { createCanvas, loadImage } = require('canvas')
	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')



	for(let i = 0; i < y_num ;i++){
		for(let j = 0;j < x_num;j++){
			let color = getColor(  Math.floor( Math.random() * 10 )  )
			drawOneGrid(ctx , j , i , color ,grid_len)
		} 
	}

	let  t2 = new Date().getTime();
	console.log('draw heatmap:' + (t2-t1) + 'ms')


	return canvas.toDataURL()
}

function drawOneGrid(ctx,x,y,color,len){
	ctx.fillStyle = color
	ctx.fillRect(x*len ,y*len,len,len)
}
function getColor(i){
	// var gradients = [
	//   {r: 32, g: 144, b: 254},
	//   {r: 41, g: 125, b: 253},
	//   {r: 65, g: 112, b: 251},
	//   {r: 91, g: 96, b: 250},
	//   {r: 118, g: 81, b: 248},
	//   {r: 145, g: 65, b: 246},
	//   {r: 172, g: 49, b: 245},
	//   {r: 197, g: 34, b: 244},
	//   {r: 220, g: 21, b: 242},
	//   {r: 241, g: 22, b: 242},
	// ]
	let gradients = [
		'#e6f7ff',
		'#bae7ff',
		'#91d5ff',
		'#69c0ff',
		'#40a9ff',
		'#1890ff',
		'#096dd9',
		'#0050b3',
		'#003a8c',
		'#002766'
	]

	let rgb = gradients[i]
	return rgb
	// return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')'
}





/*
function createMatrix(){
	grid_len = width / x_num,
	y_num = Math.ceil(height /  grid_len)

	console.log( 'matrix : '  + x_num + ' * ' + y_num)
	let matrix = []
	for(let i = 0; i < y_num ;i++){
		matrix[i] = []
		for(let j = 0;j < x_num;j++){
			matrix[i][j] = 0
		} 
	}
	return matrix
}
function loadTrajsData() {
	let  t1 = new Date().getTime();

	let trajsStr = fs.readFileSync('./image/trajs.json')
	let trajs = JSON.parse(trajsStr)

	let  t2 = new Date().getTime();
	console.log('loaddata: '+ (t2-t1) + 'ms')

	// console.log(trajs.length)

	// return trajs
	return trajs.slice(0,100)
}
function processTrajsData() {
	let data = loadTrajsData()

	let trajs_pixelpoints = []
	let points , siteId 
	data.forEach((t)=>{
		let withinTraj = false
		let pixel_points = []
		points = t.traj
		
		points.forEach((p)=>{
			let xy = _l2p( p.latitude, p.longitude )
			if(xy[0] == -1) withinTraj = true 
			pixel_points.push(xy)
		})

		if(withinTraj) return true  //continue

		trajs_pixelpoints.push({
			pid : t.pid,
			traj : pixel_points,
			withinTraj: withinTraj
		})
	})
	return trajs_pixelpoints
}
function genePoints(){
	let trajs = processTrajsData()
	console.log('trajs length:' ,trajs.length)
	let points , p1,p2 , ps = []

	let  t1 = new Date().getTime();

	trajs.forEach((t)=>{
		points = t.traj
		for(let i = 1;i < points.length;i++){
			p1 = points[i-1]
			p2 = points[i]
			let _ps = genePointsIn2P( p1,p2 )

			ps = ps.concat( _ps )
		}
	})

	let  t2 = new Date().getTime();
	console.log('genePoints: '+ (t2-t1) + 'ms')

	return ps 
}

function genePointsIn2P( p1_p,p2_p){
	let p1 = _p2i(p1_p[0],p1_p[1]),
		p2 = _p2i(p2_p[0],p2_p[1]),
		pt , k ,ps = []

	if( p1[0] == p2[0]  && p1[1] == p2[1] ) 
		return [{
			x : p1[0],
			y : p1[1]
		}]


	if( p1[0] < p2[0] ){
		pt = p2
		p2 = p1
		p1 = pt
	}
	for(let i = p2[0];i < p1[0];i++){
		k = ( p1[1] - p2[1] ) / ( p1[0] - p2[0] )
		ps.push({
			x : i,
			y : Math.round( (i - p2[0]) * k + p2[1] )
		})
	}

	if(p1[1] < p2[1]){
		pt = p2
		p2 = p1
		p1 = pt
	}
	for(let i = p2[1];i < p1[1];i++){
		k = ( p1[0] - p2[0] ) / ( p1[1] - p2[1] )
		ps.push({
			x : Math.round( (i - p2[1]) * k + p2[0] ),
			y : i
		})
	}
	return ps
}

*/

/* 数据转换
	l : 经纬度
	p : 相对于 左上角 的 像素 位置
	i : 矩阵 index
*/ 

// latlng -> pixel position
// 根据 boundryPixel 等比例转换 相对于左上角的位置
// 使用全局数据 boundry , width , height 
function _l2p(lat,lng) {    
	
	let lngWidth = boundry.top_right.lng - boundry.bottom_left.lng,
		latHeight = boundry.top_right.lat - boundry.bottom_left.lat,
		widthPixel = width,
		heightPixel = height;

	if( lat > boundry.top_right.lat || lat < boundry.bottom_left.lat 
		|| lng > boundry.top_right.lng || lng < boundry.bottom_left.lng)  //超出视窗
		return [-1,-1]


	let x = Math.round( (lng - boundry.bottom_left.lng) / lngWidth*widthPixel) , 
		y = Math.round( (boundry.top_right.lat - lat) / latHeight*heightPixel)

    return [x,y]
}


// 使用全局数据 grid_len
function _p2i(x,y){
	let x_i = Math.floor( x / grid_len ) , 
		y_i = Math.floor( y / grid_len )

	return [x_i,y_i]
}