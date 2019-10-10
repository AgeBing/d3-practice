import { scaleLinear } from "d3-scale"
import { quadtree } from "d3-quadtree"


export default function() {
	var nodes,
		links,
		P = 1,
		K = 1,
		compatibilityMap = new Map() , 
		distanceMin = 1e-8 , 
		distanceMax = 2000,
		S = 0.1,
		theta = 0.8,
		c_threshold = 0.4

	function force(alpha) {
		
		if(!links) return

		var t1 = new Date().getTime()
		if( P <= 3){
			P += 1
			_subdivision()
		}


		_springForce()
		_chargeForce()
		_compoForce()

		// console.log(alpha,nodes)

		var t2 = new Date().getTime()
		console.log("时间：" , (t2 -t1) , alpha, nodes.length)
		return nodes
	}

	// 合力 
	function _compoForce() {
		var i,j,
			m = links.length,
			n = Math.pow(2,P),
			segmLinks,node

		// nodes = 
		for(i = 0;i < m;i++){
			segmLinks = links[i].seg
			for(j = 1;j < n;j++){
				node = segmLinks[j].source
				// console.log(node.spring ,node.charge )
				node.vx = S * ( node.spring.x  + node.charge.x )
				node.vy = S * ( node.spring.y  + node.charge.y )
				// nodes.push(node)
			}

		}
	}
	// 弹簧力
	function _springForce(){
		var i,j,
			m = links.length,
			n = Math.pow(2,P),
			segmLinks,
			prev , crnt , next,
			x , y , kp


		for(i = 0;i < m;i++){
			segmLinks = links[i].seg
			// kp = links[i].kp
			
			kp = K / (edge_length(links[i]) * Math.pow(2,P))

			prev = segmLinks[0].source
			for(j = 1;j < n;j++){
				crnt = segmLinks[j].source
				next = segmLinks[j].target

	            x = prev.x - crnt.x + next.x - crnt.x;
	            y = prev.y - crnt.y + next.y - crnt.y;
            
	            x *= kp;
	            y *= kp;

	            crnt.spring = {
	            	x : x ,
	            	y : y
	            }
			}
		}

	}
	// 电荷力
	function _chargeForce(){
		var i,j,k,x,y,w,l,q,
			weight,fx,fy,
			m = links.length,
			n = Math.pow(2,P),
			segmLinks,
			node ,
			quadArray = []

		for(j = 0;j < n - 1;j++){
			quadArray.push(
				new quadtree()
					.x(function(d){return d.x})
					.y(function(d){return d.y})
			)
		}
		for(i = 0;i < m;i++){
			segmLinks = links[i].seg
			for(j = 0;j < n - 1;j++){
				node = segmLinks[j].target
				// console.log(node)
				quadArray[j].add(node)
			}
		}
		// console.log(quadArray[0])
		// console.log('******************************')

		// 创建 四叉树 ，设置各个节点 
		for(j = 0;j < n - 1;j++){
			quadArray[j].visitAfter(function(quad){
				x = 0
				y = 0
				weight = 0
				if(quad.length){  //内部节点
					// console.log(quad)
					for(i = 0;i < 4;i++){
						q = quad[i]
						if(q){
							x += q.x
							y += q.y
							weight += 1
						}
					}
					quad.x = x / weight
					quad.y = y / weight
				}
				else {
					q = quad 
			      	q.x = q.data.x;
			      	q.y = q.data.y;
				}
			})
		}
		// 计算各节点受到的电荷力
		for(i = 0;i < m;i++){
			segmLinks = links[i].seg
			for(j = 0;j < n - 1;j++){
				node = segmLinks[j].target
				fx = 0
				fy = 0
				
				var i_c = 0
				var l_c = 0
				var l_n_c = 0
				quadArray[j].visit(function(quad,x0, y0, x1, y1){
					//比较 node 和 quad
					x = quad.x - node.x 
					y = quad.y - node.y
					w = x1 - x0 		//边界距离
					l = x * x  + y * y  //点距离

					if( w * w / l  < theta ){      //符合 Barnes-Hut 情况
						// console.log( w * w / l  )
						i_c++
						if( x > distanceMin || y > distanceMin ){
							l = Math.sqrt(l)
							fx += x / l
							fy += y / l	
						}else{
							// x,y 距离都很小，说明两个点很相近，不考虑作用力
						}

						return true //不访问子节点
					}
					else if( quad.length || l >= distanceMax ) return //往下走


					// 直接访问叶子节点的情况
					if( x > distanceMin || y > distanceMin ){
						if(_getCompatibility(node.l_i , quad.l_i)){
							l_c++
							l = Math.sqrt(l)
							fx += x / l
							fy += y / l	
						}else{
							l_n_c++
						}
					}

				})
				// console.log("i_c",i_c," l_c",l_c," l_n_c",l_n_c)
				node.charge = {
					x : fx ,
					y : fy
				}
			}
		}

	} 

	function _initialize() {
		if(!links) return
		_subdivision()
	}
	/*
		将一条 link 拆分成两段
		可连续进行拆分
	*/
	function _subdivision() {
		var i,
			j,
			m = links.length,
			link,segmLink,segmLinks,
			mid 

		for(i = 0;i < m;i++){
			link = links[i]
			segmLinks = link.seg
			if(!segmLinks) segmLinks = [ link ]

			var dividLinks = []
			for(j = 0;j < segmLinks.length;j++){
				segmLink = segmLinks[j]
				//对segmlink插入中间点变成两条边
				mid = {
					x : ( segmLink.source.x + segmLink.target.x ) / 2,
					y : ( segmLink.source.y + segmLink.target.y ) / 2,
					l_i: i       //标记属于的原始边 的序号，用于计算 compatibility
				}
				nodes.push( mid )
				dividLinks.push({
					source : segmLink.source,
					target : mid
				})
				dividLinks.push({
					source : mid,
					target : segmLink.target
				})
			}
			link.seg = dividLinks
			// link.kp  = K / (edge_length(link) * Math.pow(2,P))
		}
	}
	/*
		按照论文计算两条link之间的C值
	*/
	function _makeCompatibility() {
		var i,j,
			m = links.length,
			subCompatibilityMap
		for(i = 0;i < m;i++){
			subCompatibilityMap = new Map()
			for(j = i+1;j < m;j++){
				subCompatibilityMap.set(
					j ,
					compatibility_score( links[i] , links[j] ) 
				)
			}
			compatibilityMap.set(
				i,
				subCompatibilityMap
			)
		}
	}
	function _getCompatibility(i,j) {
		var c 
		if(i == j) return false
		if(i > j){
			c = compatibilityMap.get(i).get(j)
		}
		if(j > i){
			c = compatibilityMap.get(j).get(i)
		}

		return c >= c_threshold 

	}


	force.initialize = function(_nodes){
		nodes = _nodes
		_initialize()
	}
	force.links = function(_) {
		if(arguments.length){
			links = _ 
			_initialize()
			return force
		}else{
			var _links = []
			links.forEach((l)=>{
				_links = _links.concat(l.seg)
			})
			console.log(_links)

			return _links

		}
	};
	force.setParam = function(n , v){
		if(n == 'S') S  = v
		if(n == 'K') K  = v
		if(n == 'theta') theta = v
	}

	return force
}





/*** edge operating measures ***/
function vector_dot_product(p, q){
    return p.x * q.x + p.y * q.y;
}
function euclidean_distance(p, q){
    return Math.sqrt(Math.pow(p.x-q.x, 2) + Math.pow(p.y-q.y, 2));
}
function edge_as_vector(P){
return {'x': P.target.x - P.source.x,
        'y': P.target.y - P.source.y}
} 
function edge_length(e){
    return Math.sqrt(Math.pow(e.source.x-e.target.x, 2) +
                     Math.pow(e.source.y-e.target.y, 2));
}
function project_point_on_line(p, Q){   
    var L = Math.sqrt((Q.target.x - Q.source.x) * (Q.target.x - Q.source.x) + (Q.target.y - Q.source.y) * (Q.target.y - Q.source.y));
    var r = ((Q.source.y - p.y) * (Q.source.y - Q.target.y) - (Q.source.x - p.x) * (Q.target.x - Q.source.x)) / (L * L);
    
    return  {'x':(Q.source.x + r * (Q.target.x - Q.source.x)), 'y':(Q.source.y + r * (Q.target.y - Q.source.y))};
} 
/*** Edge compatibility measures ***/
function angle_compatibility(P, Q){
    var result = Math.abs(vector_dot_product(edge_as_vector(P),edge_as_vector(Q))/(edge_length(P)*edge_length(Q)));
    return result;
}

function scale_compatibility(P, Q){
    var lavg = (edge_length(P) + edge_length(Q))/2.0;
    var result = 2.0/(lavg/Math.min(edge_length(P),edge_length(Q)) + Math.max(edge_length(P), edge_length(Q))/lavg);
    return result;
}

function position_compatibility(P, Q){
    var lavg = (edge_length(P) + edge_length(Q))/2.0;
    var midP = {'x':(P.source.x + P.target.x)/2.0,
                'y':(P.source.y + P.target.y)/2.0};
    var midQ = {'x':(Q.source.x + Q.target.x)/2.0,
                'y':(Q.source.y + Q.target.y)/2.0};
    var result = lavg/(lavg + euclidean_distance(midP, midQ));
    return result;
}

function edge_visibility(P, Q){
    var I0 = project_point_on_line(Q.source, P );
    var I1 = project_point_on_line(Q.target, P ); //send acutal edge points positions
    var midI = {'x':(I0.x + I1.x)/2.0, 
                'y':(I0.y + I1.y)/2.0};
    var midP = {'x':(P.source.x + P.target.x)/2.0, 
                'y':(P.source.y + P.target.y)/2.0};
    var result = Math.max(0, 1 - 2 * euclidean_distance(midP,midI)/euclidean_distance(I0,I1));
    return result;
}

function visibility_compatibility(P, Q){
    return Math.min(edge_visibility(P,Q), edge_visibility(Q,P));
}

/*
	P {
		source : {
			x : ,
			y : ,
		},
		target : { }
	}
	Q : { source , target }
*/
function compatibility_score(P, Q){
    var result = (angle_compatibility(P,Q) * scale_compatibility(P,Q) * 
                  position_compatibility(P,Q) * visibility_compatibility(P,Q));
    return result;
				node.vx = S * ( node.force.x  + node.charge.x )
}