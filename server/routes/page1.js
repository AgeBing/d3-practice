var fs = require('fs')
// import * as  draw  from './draw'

import { draw }  from './pic'


var express = require('express'),
    router = express.Router();





router.get('/', function(req, res) {
	 res.render('page1');
});




router.post('/getpic', function(req, res) {

	let { height,width,boundry,zoom,line_o,line_w,line_p } = req.body
	// console.log(height,width,boundry,line_o,line_w,line_p )
	let data =	draw( boundry,zoom,width,height,line_o,line_w,line_p )
	res.json(data)
})






router.get('/trajdata', function(req, res) {
	// let traj = draw

		let trajsStr = fs.readFileSync('./image/trajs.json')
	let trajs = JSON.parse(trajsStr)

	res.json(trajs)

})	
module.exports = router;
