import * as  api  from './api'
import * as d3 from 'd3';
import $ from 'jquery';
require("./index.scss");

import * as d3Sankey from 'd3-sankey'
import * as dataSankey from '../../data/sankey.json'
import  mysankey from './sankey'

import * as asd from './fdeb'
const width = 1000
const height = 1000

function testSankey(argument) {
	let s = new mysankey(dataSankey)
	let svg = d3.select('#map-container')
	       .append('svg')
	     .attr('width',width)
	     .attr('height',height)

	s.renderNodes(svg)
	s.renderLinks(svg)
	s.print()
}

// testSankey()


