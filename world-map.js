import {panZoomSetup} from './pan-zoom.js';

// These values were carefully selected to make the map fill the SVG.
const MAP_SCALE = 123;
const SVG_WIDTH = 872;
const SVG_HEIGHT = 600;

// Create a function that a population number
// to a shade of blue for country fills.

const popcolor = d3.scaleSequential(d3.interpolateViridis)
  .domain([0, 1500000000]);

const gdpcolor = d3.scaleSequential(d3.interpolateViridis)
  .domain([0, 22000]);

// Create a function to format numbers with commas.

//const format = d3.format(',');
const tooltip = d3.select('.tooltip');
//const tooltipCountry = tooltip.select('.country');
//const tooltipPopulation = tooltip.select('.population');

function hideTooltip() {
  tooltip.style('opacity', 0);
}

async function load(svg, path) {
  // Load the id, name, and polygon coordinates of each country.
  let res = await fetch('world-countries.json');
  const data = (await res.json()).features;


  res = await fetch('./dataset.tsv');
  const tsv = await res.text();
  const lines = tsv.split('\n');
  const labels = lines[0].split("\t")
  const labelvals = lines.map(line => {
    const columns = line.split('\t');
     const id = columns[1];
     const population= parseFloat(columns[2].replace(/,/g, ''))
     const gdp = columns[12];
     const gdpcapita= columns[16];
     const healthexp =columns[23];
     
     /*
     const healthexp_person = columns[16];
     const military = columns[16];
     const unemployment = columns[16];
      */ 

    return {id, population, gdp, gdpcapita, healthexp};
  });

  var dropdown = d3.select('#dropdown')
    .append('select')
    //.on('change', updateChart);

  var options = dropdown.selectAll('option')
    .data(labels)
    .enter()
    .append('option')
    .text(function(d) { return d; })
    .attr('value', function(d) { 
      if (d === 'population') {
        return d.population
      } else if (d === 'GDP ($ USD billions PPP)') {
        return d.gdp;
      } else {
        return 100;
      }
    
    });

  // Add the population and gdp ( more tbd) of each country to its data object.

  const populationById = {};
  const gdpById = {};

  for (const d of labelvals) {
    populationById[d.id] = d.population; 
    gdpById[d.id] = d.gdp; 

  }
  for (const d of data) {
    d.population = populationById[d.id];
    d.gdp = gdpById[d.id];
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
    .style('fill', d => popcolor(d.population))
    //.on('mouseenter', pathEntered)
    //.on('mousemove', pathMoved)
    //.on('mouseout', hideTooltip);
}

//tooltips for hover 


/*

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

*/ 

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

//more dropdown stuff 

function update(selectedGroup) {
  svg.style('fill', function(d) {
    // use a conditional statement to set the fill color based on the selected value
    if (selectedGroup === 'population') {
      return popcolor(d.population);
    } else if (selectedGroup === 'GDP ($ USD billions PPP)') {
      return gdpcolor(d.gdp);
    } else {
      return gdpcolor(100);
    }
  });
}


d3.select("#dropdown").on("change", function(d) {
  // recover the option that has been chosen
  var selectedOption = d3.select(this).property("value")
  // run the updateChart function with this selected option
  console.log(selectedOption)
  update(selectedOption)
}); 

//dropdown stuff end 

  load(svg, path);


}