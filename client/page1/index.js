import * as d3 from 'd3';
require("./index.scss");


import { default as fdeb_refer_run } from '../fdeb/flight-paths-edge-bundling.js'
import { default as fdeb_diy_run } from '../fdeb/fdeb-diy.js'
import { default as sankey_run } from '../sankey/index.js'
import { default as odmap_run } from '../odmap/map.js'


// fdeb_refer_run()
// sankey_run()

odmap_run()

var layouts = [
  {
    name : '桑基图',
    value : 'sankey',
    func : sankey_run,
    // checked : true
  },
  {
    name : '边捆绑「参考」',
    value: 'fdeb',
    func : fdeb_refer_run,
  },
  {
    name : '边捆绑「DIY」',
    value: 'fdeb-diy',
    func : fdeb_diy_run
  },
  {
    name : 'OD Map',
    value: 'odmap',
    func : odmap_run,
    checked : true
  }
]


layouts.forEach((layout)=>{
  d3.select('form').append('p').text(layout.name)
  d3.select('form').append('input')
    .attr('type','radio')
    .attr('name','layout')
    .attr('value',layout.value)
    .attr('checked',layout.checked)
})

d3.select('form').on('change',function(){
  let layout = d3.event.target.value
  layouts.forEach(function(_layout){
    if(_layout['value']  == layout){
      console.log('switch to layout',layout)
      d3.select('svg').selectAll('*').remove()
      d3.select('.config').selectAll('*').remove()
      _layout['func'].call()
    }
  })
})


