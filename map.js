

var TimelineMap = function(container){

  var width = 960
  var height = 580

  var countryCode = 840;   //36: AUSTRALIA * 643: RUSSIA * 76: BRAZIL * 840: USA

  // var color = d3.scale.category10();

  // var projection = d3.geo.orthographic()
  //     .scale(240)
  //     .translate([width / 2, height / 2])
  //     .clipAngle(90)
  //     .precision(.1);

  var projection = d3.geo.mercator()
    .scale(140)
    .translate([width / 2, height / 2])
    .precision(.1);

  var path = d3.geo.path()
    .projection(projection);

  var graticule = d3.geo.graticule();

  var svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height);

  // svg.append("defs").append("path")
  //     .datum({type: "Sphere"})
  //     .attr("id", "sphere")
  //     .attr("d", path);

  // svg.append("use")
  //     .attr("class", "stroke")
  //     .attr("xlink:href", "#sphere");

  svg.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

  d3.json("world-50m.json", function(error, world) {
    if (error) throw error;

    var countries = topojson.feature(world, world.objects.countries).features,
          neighbors = topojson.neighbors(world.objects.countries.geometries);

    svg.selectAll(".country")
        .data(countries)
        .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path)
        .style("fill", colorCountry);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);


  });

  /*HERE*/
  function colorCountry(country) {
    if (country.id == countryCode) {
      return '#FF0000';
    } else {
      return '#717171';
    }
  }

  d3.select(self.frameElement).style("height", height + "px");

}

