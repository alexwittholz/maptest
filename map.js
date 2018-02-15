

function TimelineMap(container){

  var width  = window.innerWidth
  var height = window.innerHeight

  var countryCode = 840 // 36: AUSTRALIA, 643: RUSSIA, 76: BRAZIL, 840: USA

  // ********************************************************

  var canvas, ctx, rafHook
  var path, title, scale
  var land, countries, borders
  var timeline

  var activeCountry = {}
  var activeCountryIndex = -1

  var rotator, rotationProgress, rotationDuration

  queue()
      .defer(d3.json, "world-110m.json")
      .defer(d3.tsv, "world-country-names.tsv")
      .defer(d3.json, "timeline.json")
      .await(setup)

  return {}

  // ********************************************************

  function setup(error, world, names, timelineData){
    if(error) throw error;

    land      = topojson.feature(world, world.objects.land)
    countries = topojson.feature(world, world.objects.countries).features
    borders   = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; })

    canvas = d3.select(container).append('canvas')
    ctx = canvas.node().getContext("2d")
    projection = d3.geo.orthographic()

    title = d3.select(container)
      .append('div')
      .attr('class', 'title')

    path = d3.geo.path()
      .projection(projection)
      .context(ctx)

    window.addEventListener('resize', debounce(resize), false)
    resize()

    // add names to countries
    countries = countries.filter(function(d) {
      return names.some(function(n) {
        if (d.id == n.id) return d.name = n.name
      })
    }).sort(function(a, b) {
      return a.name.localeCompare(b.name)
    })

    timeline = new Timeline({ container, events: timelineData.events })

    draw()

    focusOnCountry('Canada')
  }


  function draw(){
    rafHook = window.requestAnimationFrame(draw)
    ctx.clearRect(0, 0, width, height)


    // rotate the projection (if there's an active rotation tween)
    if(rotationProgress < rotationDuration && rotator){
      rotationProgress += 1

      var easedValue = easeInOutQuart( rotationProgress, 0, 1, rotationDuration )
      projection.rotate( rotator( easedValue ) )
    }

    // draw lands
    ctx.fillStyle = "#ccc"
    ctx.beginPath()
    path(land)
    ctx.fill()

    // draw the active country in red
    ctx.fillStyle = "#f00"
    ctx.beginPath()
    path(activeCountry)
    ctx.fill()

    // draw borders
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = .5
    ctx.beginPath()
    path(borders)
    ctx.stroke()

    // draw globe outline
    ctx.strokeStyle = "#999"
    ctx.lineWidth = 1
    ctx.beginPath()
    path({ type: "Sphere" })
    ctx.stroke()
  }

  /*

    Resize the canvas and projection square to fit inside the container

  */
  function resize(){
    width  = container.offsetWidth
    height = container.offsetHeight

    var smallerDimension = width > height ? height : width

    canvas.attr("width",  smallerDimension)
          .attr("height", smallerDimension)

    var padding = smallerDimension * 0.025
    scale = smallerDimension / 2 - padding

    projection
      .translate([smallerDimension / 2, smallerDimension / 2])
      .scale(scale)
      .clipAngle(90)
      .precision(0.6)
  }

  /*

    Rotate the globe to focus on the specified country index/name

  */
  function focusOnCountry(input){

    if(typeof input === 'string'){
      activeCountry = countries.find(function(c){ return c.name === input })
      if(!activeCountry) throw new Error('No country named "' + input + '" exists')
      activeCountryIndex = countries.indexOf(activeCountry)
    } else if( typeof input === 'number' ){
      activeCountryIndex = input
      activeCountry = countries[activeCountryIndex]
    }

    console.log('focus on %s (%i) %O', activeCountry.name, activeCountryIndex, activeCountry)

    // title.text( activeCountry.name  )

    var centroid = d3.geo.centroid(activeCountry)

    rotator = d3.interpolate(projection.rotate(), [-centroid[0], -centroid[1]] )
    rotationProgress = 0
    rotationDuration = 90




    // var bounds = path.bounds(activeCountry)
    // // var bounds = d3.geo.bounds(activeCountry)

    // //       x-max          x-min
    // var w  = bounds[1][0] - bounds[0][0];

    // //       y-max          y-min
    // var h = bounds[1][1] - bounds[0][1];

    // console.log({
    //   bounds, w, h,
    //   pathCentroid: path.centroid(activeCountry),
    // })
  }


  /*

    Utils

  */

  function debounce(fn){
    var timeout
    return function(){
      if(timeout) clearTimeout(timeout)
      timeout = setTimeout(fn, 250)
    }
  }

  function easeInOutQuad(t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t + b;
    return -c/2 * ((--t)*(t-2) - 1) + b;
  }

  function easeInOutQuart(t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
    return -c/2 * ((t-=2)*t*t*t - 2) + b;
  }

}






/*

  comment

*/
function Timeline(options){

  var container = options.container
  var events = options.events

  var height = 150
  var width = container.offsetWidth
  var padding = 20

  var data = {}
  var dom = {}
  var svg, scale, line, allEvents

  setup()

  return { resize }

  // ********************************************************

  function setup(){

    var c = d3.select(container)

    dom.svg = c.append('svg')
      .attr('class', 'timeline')

    // create the scale, which determines the horizontal
    // position of the years on the line
    data.scale = d3.scaleLinear()

    // input (real vales)
    data.scale.domain([ events[0].year, events[events.length-1].year ])

    // output (pixel size)
    data.scale.range([ padding, width - padding ])

    line = d3.line()
      .x(function(d){ return data.scale(d.year) })
      .y(function(d){ return height - padding })

    dom.svg.append('path')
      .attr('class', 'timeline-line')
      .datum(events)
      .attr('d', line)

    // event pins
    var eventGroup = dom.svg.append('g')
      .attr('class', 'timeline-events')

    var allEvents = eventGroup.selectAll('g.timeline-event')
      .data(events)

    allEvents.enter()
      .append('g')
        .attr('class', 'timeline-event')


    resize()

  }

  function resize(){
    width = container.offsetWidth

    dom.svg
      .attr('width',  width)
      .attr('height', height)

    data.scale.range([ 0, width ])
  }

}


