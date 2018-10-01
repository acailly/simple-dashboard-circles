//Canvas 2D used to measure text width
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
context.font = '20px "Helvetica Neue", Helvetica, Arial, sans-serif';

function getTextWidth(text) {
  return context.measureText(text).width + 6;
}

function getTextHeight(text) {
  return 30;
}

//Root svg markup
const svg = d3.select("svg");
//with a margin of 20
const margin = 20;

//Main circle diameter
const diameter = +svg.attr("width");

//Main group
const g = svg
  .append("g")
  .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

//Title
const titleGroup = svg
  .append("g")
  .attr("transform", "translate(" + diameter / 2 + ", 0)");

const titleRect = titleGroup
  .append("rect")
  .style("fill", "lightgray")
  .style("display", "inline");

const titleText = titleGroup.append("text").attr("class", "label");

//Generate colors
const color = d3
  .scaleLinear()
  .domain([-1, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);

//Create the layout
const pack = d3
  .pack()
  .size([diameter - margin, diameter - margin])
  .padding(2);

function draw(data) {
  const root = d3
    //Parse JSON
    .hierarchy(data)
    //Compute each node value size by adding descendant nodes sizes
    .sum(function (d) {
      return d.size;
    })
    //Sort each node childrens
    .sort(function (a, b) {
      return b.value - a.value;
    });

  const nodes =
    //Compute x, y, r properties based on node's value
    pack(root)
    //Get the root children nodes
    .descendants();

  //Current view
  let view;

  //Current circle that has focus
  let focus = root;

  const circle = g
    //Select all circles
    .selectAll("circle")
    //Update circles with data
    .data(nodes)
    //For each data that has not an associated circle already
    .enter()
    //Create a circle
    .append("circle")
    //Style it
    .attr("class", function (d) {
      return d.parent ?
        d.children ?
        "node" :
        "node node--leaf" :
        "node node--root";
    })
    //Style it again
    .style("fill", function (d) {
      return d.children ? color(d.depth) : null;
    })
    //Put a click handler
    .on("click", function (d) {
      if (focus !== d) {
        zoom(d);
        d3.event.stopPropagation();
      }
    });

  const textGroup = g
    //Select all texts
    .selectAll("text")
    //Update texts with data
    .data(nodes)
    //For each data that has not an associated text already
    .enter()
    //Create a group
    .append("g")
    //Style it
    .attr("class", "text-group")
    //Style it again
    .style("fill-opacity", function (d) {
      return d.parent === root ? 1 : 0;
    })
    //Style it again
    .style("display", function (d) {
      return d.parent === root ? "inline" : "none";
    });

  const textRect = textGroup
    //Create a text
    .append("rect")
    //Style it
    .attr("class", "text-rect")
    //Compute text dimensions
    .each(function (d) {
      d.textWidth = getTextWidth(d.data.name);
      d.textHeight = getTextHeight(d.data.name);
    })
    //Set its X position
    .attr("x", function (d) {
      return -d.textWidth / 2;
    })
    //Set its Y position
    .attr("y", function (d) {
      return -d.textHeight / 2 - 6;
    })
    //Set its width
    .attr("width", function (d) {
      return d.textWidth;
    })
    //Set its height
    .attr("height", function (d) {
      return d.textHeight;
    });
  const text = textGroup
    //Create a text
    .append("text")
    //Style it
    .attr("class", "label")
    //Set its text
    .text(function (d) {
      return d.data.name;
    });

  const node = g.selectAll("circle,.text-group");

  svg
    //Set the svg background
    .style("background", color(-1))
    //And put a click handler on it
    .on("click", function () {
      zoom(root);
    });

  //Update title and Zoom on main circle
  updateTitle();
  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    //Set the current focused circle
    focus = d;

    updateTitle();

    const transition = d3
      //Start a transition
      .transition()
      //Set the transition duration
      .duration(d3.event.altKey ? 7500 : 750)
      //Define how the zoom must behave during the transition
      .tween("zoom", function (d) {
        //Get a zoom interpolator
        const i = d3.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 + margin
        ]);
        return function (t) {
          //Apply the zoom interpolator on each time step
          zoomTo(i(t));
        };
      });

    //During this transition...
    transition
      //Get all texts
      .selectAll(".text-group")
      //Keep only past and future visible texts
      .filter(function (d) {
        return (
          /* Future visible texts */
          d.parent === focus ||
          /* Past visible texts */
          this.style.display === "inline"
        );
      })
      //Update their opacity
      .style("fill-opacity", function (d) {
        return d.parent === focus ? 1 : 0;
      })
      //Show future visible texts when transition start
      .on("start", function (d) {
        if (d.parent === focus) this.style.display = "inline";
      })
      //Hide past visible texts when transition end
      .on("end", function (d) {
        if (d.parent !== focus) this.style.display = "none";
      });
  }

  function updateTitle() {
    const title = focus.data.name;

    titleRect
      .attr("x", -getTextWidth(title) / 2 + 28)
      .attr("y", 6)
      .attr("width", getTextWidth(title) + 6)
      .attr("height", getTextHeight(title));

    titleText
      .attr("x", getTextWidth("TOTO") / 2)
      .attr("y", getTextHeight("TOTO"))
      .text(title);
  }

  function zoomTo(targetView) {
    const targetX = targetView[0];
    const targetY = targetView[1];
    const targetRadius = targetView[2];
    const k = diameter / targetRadius;
    view = targetView;
    node.attr("transform", function (d) {
      return (
        "translate(" + (d.x - targetX) * k + "," + (d.y - targetY) * k + ")"
      );
    });
    circle.attr("r", function (d) {
      return d.r * k;
    });
  }
}