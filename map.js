

var TimelineMap = function(container){

  var width = 960
  var height = 580

  var countryCode = 840 //36: AUSTRALIA * 643: RUSSIA * 76: BRAZIL * 840: USA

  // ********************************************************

  var activeProjection = 'orthographic'

  var svg, projectedPath, graticule
  var world, countries, boundaries
  var countryData, neighbourData

  setup()

  // ********************************************************

  function setup(){

    d3.json("world-50m.json", function(error, _world) {
      if(error) throw error;

      world = _world

      countryData   = topojson.feature(world, world.objects.countries).features
      neighbourData = topojson.neighbors(world.objects.countries.geometries)

      svg = d3.select(container).append("svg")

      svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere")

      // Countries
      allCountries = svg.append('g')
        .attr('class', 'countries')

      countries = allCountries.selectAll(".country")
        .data(countryData)

      countries
        .enter()
          .append('path')
          .attr("class", "country")

      // Boundaries & Graticule
      var boundaryGroup = svg.append('g')
        .attr('class', 'boundary')

      graticule = boundaryGroup.append("path")
        .attr("class", "graticule")
        .datum( d3.geo.graticule() )

      boundaries = boundaryGroup.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")

      window.addEventListener('resize', debounce(resize), false)
      resize()

    })

  }

  /*

    set/update active projection and globe position

  */
  function drawProjection(){

    projectedPath = d3.geo.path()
      .projection(buildProjection(activeProjection))

    countries.data(countryData)
      .style("fill", colorCountry)
      .attr("d", projectedPath)

    graticule
      .attr("d", projectedPath)

    boundaries
      .attr("d", projectedPath)

  }

  function buildProjection(type){

    if( type === 'orthographic' ){

      return d3.geo.orthographic()
        .scale(240)
        .translate([width / 2, height / 2])
        .clipAngle(90)
        .precision(.1)

    } else if( type === 'mercator' ){

      return d3.geo.mercator()
        .scale(140)
        .translate([width / 2, height / 2])
        .precision(.1);

    }

  }

  function update(){

  }

  function resize(){
    width  = container.offsetWidth
    height = container.offsetHeight

    svg.attr("width", width)
       .attr("height", height)

    if(world)
      drawProjection()
  }

  function debounce(fn){
    var timeout
    return function(){
      if(timeout) clearTimeout(timeout)
      setTimeout(fn, 250)
    }
  }

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

