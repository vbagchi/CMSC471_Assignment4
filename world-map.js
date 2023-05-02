import {panZoomSetup} from './pan-zoom.js';

// These values were carefully selected to make the map fill the SVG.
const MAP_SCALE = 123;
const SVG_WIDTH = 872;
const SVG_HEIGHT = 600;

// Create a function that a population number
// to a shade of blue for country fills.

//const format = d3.format(',');
// const tooltip = d3.select('.tooltip');
//const tooltipCountry = tooltip.select('.country');
//const tooltipPopulation = tooltip.select('.population');
// function hideTooltip() {
//   tooltip.style('opacity', 0);
// }

var dataset = {
  "GDP ($ USD billions PPP)": {
    "2018": {},
    "2019": {},
    "2020": {},
    "2021": {}
  },
  "GDP per capita in $ (PPP)": {
    "2018": {},
    "2019": {},
    "2020": {},
    "2021": {}
  },
  "Military Spending as % of GDP": {
    "2019": {},
    "2021": {}
  },
  "health expenditure % of GDP": {
    "2014": {},
    "2015": {},
    "2016": {},
    "2017": {},
    "2018": {},
    "2019": {},
    "2020": {},
    "2021": {},
    "2022": {}
  },
  "health expenditure per person": {
    "2015": {},
    "2018": {},
    "2019": {}
  },
  "unemployment (%)": {
    "2018": {},
    "2021": {}
  }
};

var metrics = Object.keys(dataset);
var chosenMetric = "GDP ($ USD billions PPP)";
var years = Object.keys(dataset[chosenMetric]);
var chosenYear = "2018";
var chosenCountry = "USA";
var countryPaths;

var metricDropdown = d3.select('#metric-dropdown')
  .append('select')
  .on('change', function() {
    let newMetric = d3.select(this).property('value');
    changeMetric(newMetric);
  });

metricDropdown.selectAll('option')
  .data(metrics)
  .enter()
  .append('option')
  .text(function(d) { return d; })
  .attr('value', d => d);

var yearDropdown = d3.select('#year-dropdown')
  .append('select')
  .on('change', function() {
    let newYear = d3.select(this).property('value');
    changeYear(newYear);
  });

yearDropdown.selectAll('option')
  .data(years)
  .enter()
  .append('option')
  .text(function(d) { return d; })
  .attr('value', d => d);

function changeYear(newYear) {
  chosenYear = newYear;
  updateChart();
}

function changeMetric(newMetric) {
  chosenMetric = newMetric;
  years = Object.keys(dataset[chosenMetric]);
  yearDropdown.selectAll('option')
    .data(years)
    .join('option')
    .text(function(d) { return d; })
    .attr('value', d => d);
  changeYear(years[0]);
}

function changeCountry(newCountry) {
  chosenCountry = newCountry;
  updateChart();
}

function updateChart() {
  let values = dataset[chosenMetric][chosenYear];
  let numbers = Object.values(values);
  let min = d3.min(numbers, d => d || Infinity);
  let max = d3.max(numbers);
  let baseline = values[chosenCountry];
  let greenScale = d3.scaleSequentialLog(d3.interpolateGreens).domain([baseline, max]);
  console.log(`baseline: ${baseline}, min: ${min}, max: ${max}`)
  let redScale = d3.scaleSequentialLog(d3.interpolateReds).domain([baseline, min]);
  countryPaths.attr('fill', d => {
    if (d.id == chosenCountry) {
      return 'rgb(255, 255, 0)';
    } else if (!(d.id in values) || !values[d.id] || baseline == null) {
      return 'rgb(79,79,79)';
    } else if (values[d.id] > baseline) {
      return greenScale(values[d.id]);
    } else if (values[d.id] < baseline) {
      return redScale(values[d.id]);
    } 
  });
}

async function load(svg, path) {
  // Load the id, name, and polygon coordinates of each country.
  let res = await fetch('world-countries.json');
  const data = (await res.json()).features;
  
  d3.csv("cleaned_dataset.csv", data => {
    let country = data["ISO Country code"]
    let keys = Object.keys(dataset);
    for (let key of keys){ 
      let years = Object.keys(dataset[key]);
      for (let year of years) {
        let value = parseFloat(data[key + " " + year].replace(',', ''));
        value = !isNaN(value) ? value : null;
        dataset[key][year][country] = value;
      }
    }
  })

  // Create an SVG group containing a path for each country.
  countryPaths = svg.append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(data)
    .enter()
    .append('path')
    .attr('d', path) // path is a function that is passed a data object
    .on("click", d => changeCountry(d.id));
    //.on('mouseenter', pathEntered)
    //.on('mousemove', pathMoved)
    //.on('mouseout', hideTooltip);

  updateChart();
}

// This handles when the mouse cursor
// enters an SVG path that represent a country.
function pathEntered() {
  // Move this path element to the end of its SVG group so it
  // renders on top which allows it's entire stroke is visible.
  this.parentNode.appendChild(this);
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