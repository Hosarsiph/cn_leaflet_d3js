
var slider_time = ["Pro_CN_T1", "Prop_CN_T2", "Prop_CN_T3", "Prop_CN_T4", "Prop_CN_T5"];

var slider_year = ["1976", "1997", "2003", "2007", "2011"];

var valueData;

var statesLayer;

var essai = d3.slider()
            .scale(d3.scale.ordinal().domain(slider_time)
            .rangePoints([0, 1], 0.5))

            .axis(d3.svg.axis().tickFormat(function(d, i){

                return slider_year[i]
            }))



            .snap(true).value(slider_time[0])
            d3.select('#slider').call(essai);

/*
L.mapbox.accessToken = 'pk.eyJ1IjoiaG9zYXJzaXBoIiwiYSI6ImNpZnFzajQ1ODc2MHRzaWtxemV6ZWtkdHEifQ.8uQq7HtgqwHVAsk-lZO3ug';
  var map = L.mapbox.map('map', 'mapbox.run-bike-hike')
    .setView([17, -97], 6);
*/

var popup = new L.Popup({ autoPan: false });

var southWest = L.latLng(12, -90),
    northEast = L.latLng(21.5, -110),
    bounds = L.latLngBounds(southWest, northEast);


var map = L.map('map', {
    center: [17, -97],
    zoom: 7,
    maxBounds: bounds,
    maxZoom: 19,
    minZoom: 7
});

var layer = L.esri.basemapLayer('ShadedRelief').addTo(map);

var layerLabels;

 function setBasemap(basemap) {
   if (layer) {
     map.removeLayer(layer);
   }
   layer = L.esri.basemapLayer(basemap);
   map.addLayer(layer);
   if (layerLabels) {
     map.removeLayer(layerLabels);
   }

   if (basemap === 'ShadedRelief' || basemap === 'Oceans' || basemap === 'Gray' || basemap === 'DarkGray' || basemap === 'Imagery' || basemap === 'Terrain') {

     layerLabels = L.esri.basemapLayer(basemap + 'Labels');
     map.addLayer(layerLabels);
   }
 }

 var basemaps = document.getElementById('basemaps');


 basemaps.addEventListener('change', function() {
   setBasemap(basemaps.value);
 });


function getStyle(feature) {
    return  {
        weight: .7,
        opacity: 1,
        color: 'gray',
        dashArray: '',
        fillOpacity: 0.6,
        fillColor: getColor(feature.properties.Pro_CN_T1)
    };

}

statesLayer = L.geoJson(cn_json,  {
    style: getStyle,
    onEachFeature: onEachFeature
}).addTo(map);


  essai.on("slide",
                function(evt, value) {
                   d3.select('#position').text(value);
                   valueData = value;
                   statesLayer = L.geoJson(cn_json,  {
                       style: getStyle,
                       onEachFeature: onEachFeature
                   }).addTo(map);
                   function getStyle(feature) {
                       return  {
                           weight: .7,
                           opacity: 1,
                           color: 'gray',
                           dashArray: '',
                           fillOpacity: 0.6,
                           fillColor: getColor(feature.properties[valueData])
                       };
                     }
               });

  // get color depending on population density value
  function getColor(d) {
        return d >  1 ? '#006d2c' :
               d > .75 ? '#2ca25f' :
               d > .50   ? '#66c2a4' :
               d > .25   ? '#b2e2e2' :
               d > .0  ? '#edf8fb' :
                      '#fff';
    }

  function onEachFeature(feature, layer) {
      layer.on({
          mousemove: mousemove,
          mouseout: mouseout,
          click: zoomToFeature
      });
  }

  var closeTooltip;

  function mousemove(e) {
      var layer = e.target;

      if (valueData == null) {

        popup.setLatLng(e.latlng);
        popup.setContent('<div class="marker-title">' + layer.feature.properties.NOM_MUN + '</div>' +
            (layer.feature.properties.Pro_CN_T1 * 100).toFixed(2) + ' % ');
      }

      else {

        popup.setLatLng(e.latlng);
        popup.setContent('<div class="marker-title">' + layer.feature.properties.NOM_MUN + '</div>' +
            (layer.feature.properties[valueData] * 100).toFixed(2) + ' % ' );
      }

      if (!popup._map) popup.openOn(map);
      window.clearTimeout(closeTooltip);

      // highlight feature
      layer.setStyle({
          weight: 3,
          opacity: 0.3,
          fillOpacity: 0.9
      });

      if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
      }
  }

  function mouseout(e) {
      statesLayer.resetStyle(e.target);
      closeTooltip = window.setTimeout(function() {
          map.closePopup();
      }, 100);
  }

  function zoomToFeature(e) {
      map.fitBounds(e.target.getBounds());
  }

  var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [ ".0",".25", ".50", ".75", "1"],
            labels = ["% Capital  Natutal"],
            from, to;

        for (var i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];

            labels.push(
                '<i style="background:' + getColor(from + 1) + '"></i> ' +
                from  * 100 + (to  ? '&ndash;' + to * 100 : ''));
        }

        div.innerHTML = labels.join('<br>');
        return div;
    };

    legend.addTo(map);

/*############################### [BAR CHART] ################################*/
var margin = {top: 70, right: 20, bottom: 40, left: 40},
              w = 500 - margin.left - margin.right,
              h = 400 - margin.top - margin.bottom;

var color = d3.scale.category20();

var circleConstraint = d3.min([h, w]);

var radius = d3.scale.linear()
            .range([0, (circleConstraint / 2)]);

var centerXPos = w / 2 + margin.left;
var centerYPos = h / 2 + margin.top;

var svg = d3.select("#chart").append("svg")
.attr("width", w + margin.left + margin.right)
.attr("height", h + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + centerXPos + ", " + centerYPos + ")");

// Read cn.csv
d3.csv("data/data_11.csv", function(error, data) {
  var maxValue = 0;
  data.forEach(function(d) {
    d.set1 = +d.set1;
    d.set2 = +d.set2;
    if(d.set1 > maxValue)
    maxValue = d.set1;
    console.log(maxValue);
    if(d.set2 > maxValue)
    maxValue = d.set2;
    // console.log(maxValue);
  });

  var topValue =1.5 * maxValue;

  var ticks = [];
  for(i =0; i <5;i += 1){
  ticks[i] = topValue * i / 5;
  }
  radius.domain([0,topValue]);

  var circleAxes = svg.selectAll(".circle-ticks")
                  .data(ticks)
                  .enter().append("g")
                  .attr("class", "circle-ticks");
                  circleAxes.append("svg:circle")
                  .attr("r", function(d) {return radius(d);})
                  .attr("class", "circle")
                  .style("stroke", "#CCC")
                  .style("fill", "none");

  circleAxes.append("svg:text")
  .attr("text-anchor", "middle")
  .attr("dy", function(d) {return radius(d)})
  .text(String);
});
