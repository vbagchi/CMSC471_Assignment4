import { panZoomSetup } from "./pan-zoom.js";

const timeSeriesSvg = d3.select("#time-series-graph");
const timeSeriesMargin = { top: 20, right: 20, bottom: 30, left: 50 };

const timeSeriesWidth =
  +timeSeriesSvg.attr("width") - timeSeriesMargin.left - timeSeriesMargin.right;

const timeSeriesHeight =
  +timeSeriesSvg.attr("height") -
  timeSeriesMargin.top -
  timeSeriesMargin.bottom;

const timeSeriesG = timeSeriesSvg
  .append("g")
  .attr(
    "transform",
    `translate(${timeSeriesMargin.left},${timeSeriesMargin.top})`
  );

const xScale = d3.scaleTime().rangeRound([0, timeSeriesWidth]);
const yScale = d3.scaleLinear().rangeRound([timeSeriesHeight, 0]);

const xAxis = d3
  .axisBottom(xScale)
  .tickValues(years)
  .tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(yScale);

timeSeriesG
  .append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${timeSeriesHeight})`)
  .call(xAxis);

timeSeriesG.append("g").attr("class", "y axis").call(yAxis);
timeSeriesG.append("path").attr("class", "line");

// These values were carefully selected to make the map fill the SVG.
const MAP_SCALE = 123;
const SVG_WIDTH = 872;
const SVG_HEIGHT = 600;
const tooltip = d3.select(".tooltip");

var id_to_country = {};
var dataset = {
  "GDP ($ USD billions PPP)": {
    2018: {},
    2019: {},
    2020: {},
    2021: {},
  },
  "GDP per capita in $ (PPP)": {
    2018: {},
    2019: {},
    2020: {},
    2021: {},
  },
  "Military Spending as % of GDP": {
    2019: {},
    2021: {},
  },
  "health expenditure % of GDP": {
    2014: {},
    2015: {},
    2016: {},
    2017: {},
    2018: {},
    2019: {},
    2020: {},
    2021: {},
    2022: {},
  },
  "health expenditure per person": {
    2015: {},
    2018: {},
    2019: {},
  },
  "unemployment (%)": {
    2018: {},
    2021: {},
  },
};

var metrics = Object.keys(dataset);
var chosenMetric = "GDP ($ USD billions PPP)";
var years = Object.keys(dataset[chosenMetric]);
var chosenYear = "2018";
var chosenCountry = "USA";
var countryPaths;
var legend = [];

var metricDropdown = d3
  .select("#metric-dropdown")
  .append("select")
  .on("change", function () {
    let newMetric = d3.select(this).property("value");
    changeMetric(newMetric);
  });

metricDropdown
  .selectAll("option")
  .data(metrics)
  .enter()
  .append("option")
  .text(function (d) {
    return d;
  })
  .attr("value", (d) => d);

var yearDropdown = d3
  .select("#year-dropdown")
  .append("select")
  .on("change", function () {
    let newYear = d3.select(this).property("value");
    changeYear(newYear);
  });

var playAll = d3
  .select("#play-text")
  .attr("class", "play-button")
  .text("▶ PLAY ALL YEARS");

var playInterval;

playAll.on("click", function () {
  var i = 0;
  playInterval = setInterval(function () {
    changeYear(years[i]);
    i++;
    if (i > years.length - 1) {
      clearInterval(playInterval);
    }
  }, 700);
});

yearDropdown
  .selectAll("option")
  .data(years)
  .enter()
  .append("option")
  .text(function (d) {
    return d;
  })
  .attr("value", (d) => d);

function changeYear(newYear) {
  chosenYear = newYear;
  updateChart();
}

function changeMetric(newMetric) {
  chosenMetric = newMetric;
  years = Object.keys(dataset[chosenMetric]);
  yearDropdown
    .selectAll("option")
    .data(years)
    .join("option")
    .text(function (d) {
      return d;
    })
    .attr("value", (d) => d);
  changeYear(years[0]);
}

function changeCountry(newCountry) {
  chosenCountry = newCountry;
  updateChart();
}

function updateChart() {
  let values = dataset[chosenMetric][chosenYear];
  let numbers = Object.values(values);
  let min = d3.min(numbers, (d) => d || Infinity);
  let max = d3.max(numbers);
  let baseline = values[chosenCountry];
  let greenScale = d3
    .scaleSequentialLog(d3.interpolateGreens)
    .domain([baseline, max]);
  let redScale = d3
    .scaleSequentialLog(d3.interpolateReds)
    .domain([baseline, min]);

  countryPaths.attr("fill", (d) => {
    if (d.id == chosenCountry) {
      return "rgb(255, 255, 0)";
    } else if (!(d.id in values) || !values[d.id] || baseline == null) {
      return "rgb(79,79,79)";
    } else if (values[d.id] > baseline) {
      return greenScale(values[d.id]);
    } else if (values[d.id] < baseline) {
      return redScale(values[d.id]);
    }
  })
  .on('mouseenter', function(d) {
    tooltip.transition().duration(200).style('opacity', 0.9);
    tooltip.html(`${d.id}: ${values[d.id]}`)
      .style('left', (d3.event.pageX + 10) + 'px')
      .style('top', (d3.event.pageY - 20) + 'px');
  })
  .on('mousemove', function() {
    tooltip.style('left', (d3.event.pageX + 10) + 'px')
      .style('top', (d3.event.pageY - 20) + 'px');
  })
  .on('mouseleave', function() {
    tooltip.transition().duration(200).style('opacity', 0);
  });

  d3.select("#year-text")
    .attr("class", "play-button")
    .text("Year : " + chosenYear);

  legend[0].select("circle").attr("fill", redScale(min));
  legend[1].select("circle").attr("fill", "rgb(255, 255, 0)");
  legend[2].select("circle").attr("fill", greenScale(max));

  legend[0].select("text").text(min);
  legend[1].select("text").text(baseline);
  legend[2].select("text").text(max);

  const yearsExtent = d3.extent(years, (d) => d);
  xScale.domain(yearsExtent);
  yScale.domain([0, d3.max(numbers)]);

  timeSeriesG.select(".x.axis").transition().duration(500).call(xAxis);
  timeSeriesG.select(".y.axis").transition().duration(500).call(yAxis);

  timeSeriesG
    .selectAll(".x-axis-label")
    .data([null])
    .join("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "end")
    .style("font-size", "14px")
    .attr("x", timeSeriesWidth - 200)
    .attr("y", timeSeriesHeight + timeSeriesMargin.bottom)
    .text("Years");

  timeSeriesG
    .selectAll(".y-axis-label")
    .data([null])
    .join("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .style("font-size", "12px")
    .attr("x", -timeSeriesMargin.top - 10)
    .attr("y", timeSeriesMargin.left - 88)
    .text(chosenMetric);

  const lineGenerator = d3
    .line()
    .defined((d) => d.value !== null && !isNaN(d.value))
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value));

  const countriesData = Object.keys(id_to_country).map((id) => {
    return years.map((year) => ({
      year: year,
      value: dataset[chosenMetric][year][id],
      country: id,
    }));
  });

  const lines = timeSeriesG.selectAll(".line").data(countriesData);

  lines
    .enter()
    .append("path")
    .attr("class", "line")
    .merge(lines)
    .transition()
    .duration(500)
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", (d) =>
      d[0].country === chosenCountry ? "yellow" : "lightgray"
    )
    .attr("stroke-width", (d) => (d[0].country === chosenCountry ? 2 : 1))
    .style("opacity", 0.7);

  lines.exit().remove();
}

async function load(svg, path) {
  // Load the id, name, and polygon coordinates of each country.
  let res = await fetch("world-countries.json");
  const data = (await res.json()).features;
  for (let i = 0; i < data.length; i++) {
    let feature = data[i];
    let id = feature["id"];
    let name = feature["properties"]["name"];
    id_to_country[id] = name;
    console.log(id_to_country);
  }

  let values = await d3.csv("cleaned_dataset.csv");
  await d3.csv("cleaned_dataset.csv", (data) => {
    let country = data["ISO Country code"];
    let keys = Object.keys(dataset);
    for (let key of keys) {
      let years = Object.keys(dataset[key]);
      for (let year of years) {
        let value = parseFloat(data[key + " " + year].replace(",", ""));
        value = !isNaN(value) ? value : null;
        dataset[key][year][country] = value;
      }
    }
  });

  // Create an SVG group containing a path for each country.
  countryPaths = svg
    .append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", path) // path is a function that is passed a data object
    .on("click", (d) => changeCountry(d.id));

  for (let i = 0; i < 3; i++) {
    let group = d3
      .select("#legend")
      .append("g")
      .attr("transform", `translate(${40 + 200 * i}, 20)`);
    group.append("circle").attr("fill", "red").attr("r", 12.5);
    group.append("text").attr("transform", "translate(20, 5)");
    legend.push(group);
  }

  updateChart();
}

export function createWorldMap(svgId) {
  const svg = d3
    .select("#" + svgId)
    .attr("width", SVG_WIDTH)
    .attr("height", SVG_HEIGHT)
    .attr("viewBox", `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);

  panZoomSetup(svgId, SVG_WIDTH, SVG_HEIGHT);

  // Create a function that manages displaying geographical data.
  const projection = d3
    .geoMercator()
    .scale(MAP_SCALE)
    .translate([SVG_WIDTH / 2, SVG_HEIGHT / 1.41]);

  // Create a function generate a value for the "d" attribute of an SVG "path" element given polygon data.
  const path = d3.geoPath().projection(projection);
  load(svg, path);
}
