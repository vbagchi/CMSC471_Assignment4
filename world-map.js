import {panZoomSetup} from './pan-zoom.js';

// These values were carefully selected to make the map fill the SVG.
const MAP_SCALE = 123;
const SVG_WIDTH = 872;
const SVG_HEIGHT = 600;

// Create a function that a population number
// to a shade of blue for country fills.
const color = d3
  .scaleThreshold()
  .domain([
    10000,
    100000,
    500000,
    1000000,
    5000000,
    10000000,
    50000000,
    100000000,
    500000000,
    1500000000
  ])
  .range([
    'rgb(247,251,255)',
    'rgb(222,235,247)',
    'rgb(198,219,239)',
    'rgb(158,202,225)',
    'rgb(107,174,214)',
    'rgb(66,146,198)',
    'rgb(33,113,181)',
    'rgb(8,81,156)',
    'rgb(8,48,107)',
    'rgb(3,19,43)'
  ]);

// Create a function to format numbers with commas.
const format = d3.format(',');

const tooltip = d3.select('.tooltip');
const tooltipCountry = tooltip.select('.country');
const tooltipPopulation = tooltip.select('.population');

function hideTooltip() {
  tooltip.style('opacity', 0);
}

async function load(svg, path) {
  // Load the id, name, and polygon coordinates of each country.
  let res = await fetch('world-countries.json');
  const data = (await res.json()).features;

  // Load the id and population of each country.

  /*
  res = await fetch('dataset.tsv');
  const tsv = await res.text();
  const lines = tsv.split('\n');
  const population = lines.map(line => {
    const [id, , population] = line.split('\t');
    return {id, population};
  });

*/

  res = await fetch('./dataset.tsv');
  const tsv = await res.text();
  const lines = tsv.split('\n');
  const population = lines.map(line => {
    const columns = line.split('\t');
     const id = columns[1];
     const population= columns[2];
    return {id, population};
  });


  res = await fetch('dataset.json');
  const countrydata = (await res.json()).features;


  // Add the population of each country to its data object.
  const populationById = {};
  for (const d of population) {
    populationById[d.id] = parseFloat(d.population.replace(/,/g, ''));
  }
  for (const d of data) {
    d.population = populationById[d.id];
    console.log(d)

  }

  // Create an SVG group containing a path for each country.
  svg
    .append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(data)
    .enter()
    .append('path')
    .attr('d', path) // path is a function that is passed a data object
    .style('fill', d => color(d.population))
    .on('mouseenter', pathEntered)
    .on('mousemove', pathMoved)
    .on('mouseout', hideTooltip);
}

// This handles when the mouse cursor
// enters an SVG path that represent a country.
function pathEntered() {
  // Move this path element to the end of its SVG group so it
  // renders on top which allows it's entire stroke is visible.
  this.parentNode.appendChild(this);
}

// This handles when the mouse cursor
// moves over an SVG path that represent a country.
function pathMoved(d) {
  // Configure the tooltip.
  tooltipCountry.text(d.properties.name);
  tooltipPopulation.text(format(d.population));
  tooltip
    .style('left', d3.event.pageX + 'px')
    .style('top', d3.event.pageY + 'px');

  // Show the tooltip.
  tooltip.style('opacity', 0.7);
}

export function createWorldMap(svgId) {
  const svg = d3
    .select('#' + svgId)
    .attr('width', SVG_WIDTH)
    .attr('height', SVG_HEIGHT)
    .attr('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);

  panZoomSetup(svgId, SVG_WIDTH, SVG_HEIGHT);

  // Create a function that manages displaying geographical data.
  const projection = d3
    .geoMercator()
    .scale(MAP_SCALE)
    .translate([SVG_WIDTH / 2, SVG_HEIGHT / 1.41]);

  // Create a function generate a value for the "d" attribute
  // of an SVG "path" element given polygon data.
  const path = d3.geoPath().projection(projection);

  load(svg, path);
}