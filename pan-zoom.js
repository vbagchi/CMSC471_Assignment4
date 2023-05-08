// Each pan using the arrow keys pans the SVG by this percentage.
const PAN_PERCENT = 0.05;

// Each zoom in/out does so by this percentage.
const ZOOM_PERCENT = 0.15;

// This maps key names to functions that should be invoked when they are pressed.
const keyToFnMap = {
  "+": zoomIn,
  "-": zoomOut,
  ArrowLeft: panLeft,
  ArrowRight: panRight,
  ArrowUp: panUp,
  ArrowDown: panDown,
};

function addControlButtons(svg, svgWidth, svgHeight) {
  function addButton(parent, html, onClick) {
    parent
      .append("button")
      .html(html)
      .on("click", () => onClick(svg));
  }

  // This resets the SVG viewBox to its original values which undoes all panning and zooming.
  function reset(svg) {
    svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  }

  const container = getParentSelection(svg);
  const controls = container.append("div").attr("class", "controls");
  const panDiv = controls.append("div").attr("class", "pan");

  let div = panDiv.append("div");
  addButton(div, "&#x25b2;", panUp);

  div = panDiv.append("div");
  addButton(div, "&#x25c0;", panLeft);
  addButton(div, "&#x21ba;", reset);
  addButton(div, "&#x25b6;", panRight);

  div = panDiv.append("div");
  addButton(div, "&#x25bc;", panDown);

  div = controls.append("div").attr("class", "zoom");
  addButton(div, "&#x2795;", zoomIn);
  addButton(div, "&#x2796;", zoomOut);
}

function getParentSelection(selection) {
  return selection.select(function () {
    return this.parentNode;
  });
}

function panDown(svg) {
  const [x, y, width, height] = svg.attr("viewBox").split(" ");
  const dy = Number(height) * PAN_PERCENT;
  svg.attr("viewBox", `${x} ${Number(y) + dy} ${width} ${height}`);
}

function panLeft(svg) {
  const [x, y, width, height] = svg.attr("viewBox").split(" ");
  const dx = Number(width) * PAN_PERCENT;
  svg.attr("viewBox", `${Number(x) - dx} ${y} ${width} ${height}`);
}

function panRight(svg) {
  const [x, y, width, height] = svg.attr("viewBox").split(" ");
  const dx = Number(width) * PAN_PERCENT;
  svg.attr("viewBox", `${Number(x) + dx} ${y} ${width} ${height}`);
}

function panUp(svg) {
  const [x, y, width, height] = svg.attr("viewBox").split(" ");
  const dy = Number(height) * PAN_PERCENT;
  svg.attr("viewBox", `${x} ${Number(y) - dy} ${width} ${height}`);
}

// This zooms in or out depending on whether the shift key is down.
function zoom(svg) {
  const fn = d3.event.shiftKey ? zoomOut : zoomIn;
  fn(svg);
}

// This zooms in on the SVG, maintaining the current center.
function zoomIn(svg) {
  const [x, y, width, height] = svg.attr("viewBox").split(" ");
  const factor = 1 - ZOOM_PERCENT;
  const newWidth = Number(width) * factor;
  const dx = (newWidth - width) / 2;
  const newHeight = Number(height) * factor;
  const dy = (newHeight - height) / 2;
  svg.attr("viewBox", `${x - dx} ${y - dy} ${newWidth} ${newHeight}`);
}

// This zooms out on the SVG, maintaining the current center.
function zoomOut(svg) {
  const [x, y, width, height] = svg.attr("viewBox").split(" ");
  const factor = 1 + ZOOM_PERCENT;
  const newWidth = Number(width) * factor;
  const dx = (newWidth - width) / 2;
  const newHeight = Number(height) * factor;
  const dy = (newHeight - height) / 2;
  svg.attr("viewBox", `${x - dx} ${y - dy} ${newWidth} ${newHeight}`);
}

export function panZoomSetup(svgId, svgWidth, svgHeight) {
  const svg = d3.select("#" + svgId);

  let lastX, lastY;

  // This handles dragging on the SVG to change the visible portion.
  function dragged() {
    const [boxX, boxY, width, height] = svg.attr("viewBox").split(" ");
    const { x, y } = d3.event;
    const scaleX = width / svgWidth;
    const scaleY = height / svgHeight;
    const dx = (lastX - x) * scaleX;
    const dy = (lastY - y) * scaleY;
    lastX = x;
    lastY = y;
    svg.attr(
      "viewBox",
      `${Number(boxX) + dx} ${Number(boxY) + dy} ${width} ${height}`
    );
  }

  function dragStarted() {
    lastX = d3.event.x;
    lastY = d3.event.y;
  }

  // Create a function that will manage mouse drags on the SVG.
  const drag = d3.drag().on("start", dragStarted).on("drag", dragged);

  svg.call(drag);

  svg.on("dblclick", () => zoom(svg));

  // Set up event handling for all the keyboard shortcuts in keyToFnMap.
  d3.select("body").on("keydown", () => {
    const fn = keyToFnMap[d3.event.key];
    if (fn) fn(svg);
  });

  addControlButtons(svg, svgWidth, svgHeight);
}
