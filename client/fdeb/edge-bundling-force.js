
import { scaleLinear } from "d3-scale"

/*
	循环内
		要用的变量先声明好
		不每次去 length 
		不在循环内调用函数
	不用es6语法
*/


export default function() {
	// nodes 和 segNodes 内部的 node 是同一个 。 同时和 simulation引用的 nodes 是同一个
	var nodes ,
		links , 
		segNodes,
		segeLinks,
		p = 8,
		kp ,      //弹簧力系数
		K = 1 * 0.001,    //值越大 ，线越硬
		step = 1,
		CeMap = []

	/*
		每个node受到两个力
			弹簧力 Fs		
	*/
	function force( alpha ){
		if(!nodes || !links || !segNodes)  return []
		// console.log(segNodes)
 		console.log("alpha   " ,alpha)
 		console.log("K     " , K)
 		console.log("step  " ,step)

		// Fs = 
		// var t1 = new Date().getTime()
		spring()
		// var t2 = new Date().getTime()
		// console.log(t2 -t1)
		charge()
		// var t3 = new Date().getTime()
		// console.log(t3 -t2)
		velocity()
		// var t4 = new Date().getTime()
		// console.log(t4 -t3)
		// console.log(segNodes)
		// console.log(segeLinks)
	    // console.log('-------------------------')
		return nodes	
	}
	function charge(){
		var i,j,
			n = segNodes.length,
			m ,
			node , temp,
			nodeBelong,tempBelong,  // 分段前所属的 link
			Fe_x ,Fe_y , 
			thr = 20,
			max ,min, cemax,
			jw,
			Ca , Cs ,Cp ,Cv ,Ce

		for(i = 0;i < n;i++){
			node = segNodes[i]
			nodeBelong = node['belongs']
			Fe_x = 0
			Fe_y = 0
			for(j = 0;j < n;j++){
				temp = segNodes[j]
				tempBelong = temp['belongs']
				if( i == j ) continue   //同一个
				if( i%p != j%p ) continue  //同一组

				if( nodeBelong > tempBelong ){
					Ce = CeMap[tempBelong][nodeBelong]
				}else{
					Ce = CeMap[nodeBelong][tempBelong]
				}
				// Ce = 1
				cemax = ( cemax == undefined || Ce > cemax ) ? Ce : cemax
				jw = (temp.x - node.x)
				if( jw == 0)
					jw = jiggle()
				Fe_x += Ce/jw
				jw = (temp.y - node.y)
				if( jw == 0)
					jw = jiggle()
				Fe_y += Ce/jw

			}
			node['Fe_x'] = Fe_x
			node['Fe_y'] = Fe_y
		}

		max = ( max == undefined || max > Math.abs(node['Fe_x'])  ) ? Math.abs(node['Fe_x']) : max

		// console.log('Fe max: ',max)
		// console.log('Ce max: ', cemax)

		// console.log('-------------------------------------------------')
	}
	function spring(){
		var i,
			n = segNodes.length,
			node , prev , next,
			connnects , originLink ,
			max ,kpmax 
		
		for(i = 0;i < n;i++){
			node = segNodes[i]
			connnects  = node.connets
			prev = connnects[0]['source']  //与创建connect时的顺序有关
			next = connnects[1]['target']
			originLink = node['belongs']
			kp = K / c_distance( links[originLink] )  
			// console.log( kp )
			node['Fs_x'] = ( prev.x - node.x + next.x - node.x)
			node['Fs_y'] = ( prev.y - node.y + next.y - node.y)
			node['Fs_x']  = kp * node['Fs_x']
			node['Fs_y']  = kp * node['Fs_y']
		
			max = ( max == undefined || max > Math.abs(node['Fs_x'])  ) ? Math.abs(node['Fs_x']) : max
			kpmax = ( kpmax == undefined || kpmax > kp ) ? kp : kpmax
		}


		// console.log('Fs max: ', max)
		// console.log('kp max: ', kpmax)


	}
	function velocity(){
		var i ,
			n = segNodes.length,
			node,
			d , dx2 ,dy2

		let max , min

		for(i = 0;i < n ;i++){
			node = segNodes[i]
			if(node.Fe_x == undefined) continue

			 dx2 = Math.pow(node['Fe_x']   + node['Fs_x'], 2);
			 dy2 = Math.pow(node['Fe_y']   + node['Fs_y'], 2);

			 d = Math.sqrt(dx2 + dy2);

			node['vx'] = ( node['Fe_x']   + node['Fs_x'] ) * step / d
			node['vy'] = ( node['Fe_y']   + node['Fs_y'] ) * step / d

		}

		// console.log('max : ',max)
		// console.log('min : ',min)
	}
	function initialize(){
		console.log(nodes,links)
		if(!links) return
		segments()
		connnects()
		var t1 = new Date().getTime()
		// console.log('start ce')
		initCe()
		var t2 = new Date().getTime()
		// console.log(t2 -t1)
	}
	function segments(){
		//将 link 拆分成 p+1 段 , 头尾两边等比例加入 p 个点
		var i,j,
			n = nodes.length,
			m = links.length,
			source,target,prev,_node,
			link , linkLength , _link ,
			xscale,yscale,
			_segNodes = [],  //新生成的 节点
			_segeLinks = []  //新生成的 边
		
		for(i = 0; i < m ;i++){
			link = links[i]
			source = link.source
			target = link.target
			xscale = scaleLinear()
				.range([source.x , target.x])
				.domain([0 , p+1])
			yscale = scaleLinear()
				.range([source.y , target.y])
				.domain([0 , p+1])
			prev = source
			for(j = 1;j < p+1;j++){    //包括了和 source 和 target 相连的边
				_node = {
					x : xscale(j),
					y : yscale(j),
					i : j,           // 表示第几段
					belongs: i    // 属于哪段线
				}
				_link = {
					source: prev,
					target: _node
				}
				// links.push({
				// 	source : prev,
				// 	target : _node
				// })
				prev = _node

				nodes.push( _node )
				_segeLinks.push(_link)

			}
			_link = {
				source : prev,
				target : target
			}
			_segeLinks.push(_link)
		}

		segeLinks = _segeLinks
	}
	/*
		分段后为每个新增结点添加
			前后两个连接点的链接
	*/
	function connnects(){
		var i,
			m = segeLinks.length,
			link,
			node 

		for(i = 0;i < m;i++){
			link = segeLinks[i]
			var orders = ['source','target']
			orders.forEach(function(order){
				node = link[order]
				node.connets = ( node.connets ==  null ? [] : node.connets)
				node.connets.push(link)
			})
		}
	}
	function initCe(){
		var i , j,
			m = links.length,
			link1 ,link2

		for(i =  0 ;i < m;i++){
			CeMap[i] = []
			for(j = i+1 ; j < m ;j++){
				link1 = links[i]
				link2 = links[j]
				CeMap[i][j] =   c_e( link1 ,link2 ) 
			}
		}

	}
	force.initialize = function(_nodes){
		nodes = _nodes
		initialize()
	}
	force.links = function(_) {
		return arguments.length ? (links = _, initialize(), force) : segeLinks;
	};
	force.set = function(n , v) {
		// let params = {
		// 	'K' : K,
		// 	'k' : K,
		// 	'step' : step,
		// 	's' : step
		// }
		// params[n] = v

		if(n == 'K' || n == 'k'){
			K = v
		}
		if(n == 's' || n =='S' || n == 'step'){
			step = v
		}
		// console.log(n,v,step,K)
	};

	return force
}



// calculates the distance between two nodes
// sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
function c_distance({ source, target} ) {
  var dx2 = Math.pow(target.x - source.x, 2);
  var dy2 = Math.pow(target.y - source.y, 2);
  return Math.sqrt(dx2 + dy2);
}

function c_cos( line1 ,line2 ){
	var source1 = line1.source,
		target1 = line1.target,
		source2 = line2.source,
		target2 = line2.target

	var vect1 = [ source1.x - target1.x , source1.y - target1.y ] 
	var vect2 = [ source2.x - target2.x , source2.y - target2.y ]
	var vect1_len = Math.sqrt( Math.pow( vect1[0] , 2) + Math.pow( vect1[1] , 2) )
	var vect2_len = Math.sqrt( Math.pow( vect2[0] , 2) + Math.pow( vect2[1] , 2) )

	var cosv = (vect1[0]*vect2[0] + vect1[1]*vect2[1] ) / (vect1_len * vect2_len)

	return Math.abs(cosv)
}

function c_e( line1 ,line2 ){
	var p = c_distance(line1),
		q = c_distance(line2),
		m = c_distance({
			source : {
				x : (line1.source.x + line1.target.x ) /2,
				y : (line1.source.y + line1.target.y ) /2 
			},
			target : {
				x : (line2.source.x + line2.target.x ) /2,
				y : (line2.source.y + line2.target.y ) /2 
			}
		}),
		avg = (p + q ) /2

	var c_a = c_cos( line1 ,line2 )
	var c_s = 2/(avg *Math.min(p,q) + Math.max(p,q)/avg )
	var c_p = avg / ( avg +  m)

	return c_a * c_s * c_p
}



function jiggle() {
  return (Math.random() - 0.5) * 1e-6;
}