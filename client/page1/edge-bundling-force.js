
import { scaleLinear } from "d3-scale"

/*
	循环内
		要用的变量先声明好
		不每次去 length 
		不在循环内调用函数
	不用es6语法
*/

export default function() {
	var nodes ,
		links , 
		segNodes,
		segeLinks,
		p = 4,
		kp ,      //弹簧力系数
		K = 1

	/*
		每个node受到两个力
			弹簧力 Fs		
	*/
	function force(){
		// Fs = 
		var t1 = new Date().getTime()
		spring()
		var t2 = new Date().getTime()
		console.log(t2 -t1)
		charge()
		var t3 = new Date().getTime()
		console.log(t3 -t2)
		velocity()
		var t4 = new Date().getTime()
		console.log(t4 -t3)
		console.log(segNodes)
		console.log(nodes)
	}
	function charge(){
		var i,j,
			n = segNodes.length,
			m ,
			node , temp,
			Fe_x ,Fe_y

		for(i = 0;i < n;i++){
			node = segNodes[i]
			Fe_x = 0
			Fe_y = 0
			for(j = 0;j < n;j++){
				temp = segNodes[j]
				if( i == j ) continue
				if( i%4 != j%4 ) continue
				Fe_x += 1/Math.abs(node.x -temp.x)
				Fe_y += 1/Math.abs(node.y -temp.y)
			}
			// node.x = temp.x  时 Fe_x 为 Infinity
			node['Fe_x'] = Fe_x == Infinity ? 0 : Fe_x
			node['Fe_y'] = Fe_y == Infinity ? 0 : Fe_y
		}
	}
	function spring(){
		var i,
			n = nodes.length,
			m ,
			node , prev , next,
			connnects 
		
		for(i = 0;i < n;i++){
			node = nodes[i]
			connnects  = node.connets
			if(!connnects)  continue  //该节点没有 link 连接
			if(connnects.length != 2) continue
			prev = connnects[0]['target']  //与创建connect时的顺序有关
			next = connnects[1]['source']
			kp = node.kp
			node['Fs_x'] = kp*( prev.x - node.x + next.x - node.x)
			node['Fs_y'] = kp*( prev.y - node.y + next.y - node.y)
		}
	}
	function velocity(){
		var i ,
			n = nodes.length,
			node,
			theta = 1000

		for(i = 0;i < n ;i++){
			node = nodes[i]
			if(node.Fe_x == undefined) continue
			node['vx'] = node['Fe_x'] /theta  + node['Fs_x']*theta
			node['vy'] = node['Fe_y'] /theta  + node['Fs_y']*theta
		}
	}
	function initialize(){
		console.log(nodes,links)
		if(!links) return
		segments()
		connnects()
	}
	function segments(){
		//将 link 拆分成 p+1 段 , 头尾两边等比例加入 p 个点
		var i,j,
			n = nodes.length,
			m = links.length,
			source,target,temp,prev,
			link , linkLength,
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
			linkLength = c_distance( source,target)
			prev = source
			for(j = 1;j < p+1;j++){    //包括了和 source 和 target 相连的边
				temp = {
					x : xscale(j),
					y : yscale(j),
					i : j,
					kp : K/linkLength
				}
				links.push({
					source : prev,
					target : temp
				})
				prev = temp
				nodes.push( temp )
				_segNodes.push( temp )
			}
			links.push({
				source : prev,
				target : target
			})
		}

		segNodes = _segNodes
		// console.log( links,nodes )
	}
	function connnects(){
		var i,
			n = nodes.length,
			m = links.length,
			link,
			node 
		for(i = 0;i < m;i++){
			link = links[i]
			var orders = ['source','target']
			orders.forEach(function(order){
				node = link[order]
				node.connets = ( node.connets ==  null ? [] : node.connets)
				node.connets.push(link)
			})
		}
		// console.log(nodes,links)
	}

	force.initialize = function(_nodes){
		// nodes = _
		nodes = _nodes
		initialize()
	}
	force.links = function(_) {
		links = _
		initialize()
	};
	return force
}


// calculates the distance between two nodes
// sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
function c_distance(source, target) {
  var dx2 = Math.pow(target.x - source.x, 2);
  var dy2 = Math.pow(target.y - source.y, 2);

  return Math.sqrt(dx2 + dy2);
}



// var source = {
// 	x :10,
// 	y:10
// }
// ,target = {
// 	x :13,
// 	y: 14
// }
// var d = c_distance(source,target)
// var scale = scaleLinear()
// 				.domain([0, c_distance(source,target)])
// 				.range([0,5])
// console.log(d,scale(2))
// console.log(scaleLinear)