var fs = require('fs')

let boundry , zoom ,width, height   //视窗 全局变量

let x_num = 100 , grid_len , y_num

let trajsData

let sta

import { _p2i , _l2p, getT , t_width , t_height ,left as t_left ,top as t_top } from './util'


function loadTrajsData() {
	let  t1 = new Date().getTime();

	let trajsStr = fs.readFileSync('./image/trajs.json')
	let trajs = JSON.parse(trajsStr)

	let  t2 = new Date().getTime();
	console.log('loadData: '+ (t2-t1) + 'ms')

	// console.log('数据量: '+trajs.length)
	// return trajs.slice(0,5000)
	return trajs
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
	console.log('轨迹条数 :' + trajs_pixelpoints.length)


	return trajs_pixelpoints
}



export function draw(b,z,w,h,line_o,line_w,line_p) {
	boundry = b
	zoom 	= z
	width   = w
	height  = h


	if( getT() ) {  //瓦片边界变化

		if(!trajsData) trajsData = loadTrajsData()

		let trajs_pixel_points = processTrajsData(trajsData)
		let len = Math.floor(trajs_pixel_points.length * line_p)
		sta = drawTrajs(trajs_pixel_points.slice(0,len),line_o,line_w)

	}else{         //返回旧值

		sta.left = t_left  
		sta.top  = t_top
	}





	// createMatrix()
	// let ps = genePoints()
	// console.log(ps)

 //    let url = drawHeatmap()
	return sta
}



function drawTrajs(trajs,line_o,line_w){


	const { createCanvas, loadImage } = require('canvas')
	const canvas = createCanvas(t_width, t_height)
	const ctx = canvas.getContext('2d')

	let config = lineShowConfig(trajs.length)

	ctx.lineJoin = 'round'
	ctx.imageSmoothingEnabled  = true

	let line_width = config.width,
		line_opacity = config.opacity	

	// let sta_arr = [] , line_opacity,line_width,line_num 
	
	// for(line_width = 0.5 ; line_width < 2; line_width += 0.5){

	// 	for(line_opacity = 0.005;line_opacity < 0.03 ; line_opacity += 0.005){


		let  t1 = new Date().getTime();

			ctx.lineWidth = line_width
		   	ctx.strokeStyle = 'rgba(0,0,0,'+ line_opacity+')';


			trajs.forEach(t=>{
				drawOneTraj(ctx,t.traj)
			})


   	// ctx.fillStyle = 'rgba(0,0,0,0.5)';

   	 //   	ctx.fillStyle = 'rgba(0,0,0,0.5)';
	   	// ctx.fillRect(300, 300, 10, 10);
	   	// ctx.fillRect(115, 115, 10, 10);

		let _sta = {
				url : canvas.toDataURL(),
				num : trajs.length,
				opacity: line_opacity,
				width: line_width,
				left:t_left,
				top :t_top,
				t_width,
				t_height	
			}


		let alpha_obj = []
				
		// let imageData = ctx.getImageData(0,0,width,height)['data']

		// for(let i = 3; i < 4 * width * height ; i+= 4){
		// 	if(imageData[i] > 0){
		// 		alpha_obj.push({
		// 			x :  ((i - 3) / 4 ) % width ,
		// 			y :  Math.floor((i - 3) / 4  / width) + 1 ,
		// 			a : imageData[i]
		// 		})
		// 	}
		// }


		// fs.writeFileSync('./image/alpha.json', JSON.stringify(alpha_obj));



		let  t2 = new Date().getTime();
		console.log('draw: ' + (t2-t1) + 'ms')
		// console.log(line_width,line_opacity)

	// 	}
	// }

	return _sta

}
function drawOneTraj(ctx,points){
	// console.log(points)
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


function lineShowConfig(len){

	let ops = [0.004,0.1 , 0.171,0.357,0.386,0.42, 0.461,0.569,0.643,0.735,0.843,0.945,0.994]
	
	let width , opacity
	if(len > 10000){
		width = 1,
		opacity = ops[0]
	}else if( len > 6000){
		width = 2
		opacity = ops[0]
	}else if( len > 2000){
		width = 4
		opacity = ops[0]
	}else if( len > 500){
		width = 6
		opacity = ops[0]
	}
	else if( len > 200){
		width = 2
		opacity = ops[1]
	}else{
		width = 4
		opacity = ops[1]
	}

	// console.log(len , width ,opacity)
	return {
		width,
		opacity
	}

}

// 变量
export { boundry,zoom,width,height,grid_len }