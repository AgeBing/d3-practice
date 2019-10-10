import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey'
import * as dataSankey from '../../data/sankey.json'
import  mysankey from './sankey'

export default function(){
	let s = new mysankey(dataSankey)
	let svg = d3.select('svg')
	s.renderNodes(svg)
	s.renderLinks(svg)
	s.print()
}


