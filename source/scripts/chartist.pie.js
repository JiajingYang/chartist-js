// Chartist line chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Pie = Chartist.Pie || function (query, data, options, responsiveOptions) {

    var defaultOptions = {
        width: undefined,
        height: undefined,
        chartPadding: 5,
        classNames: {
          series: 'ct-series',
          slice: 'ct-slice',
          donut: 'ct-donut'
        },
        startAngle: 0,
        total: undefined,
        donut: false,
        donutWidth: 60
      },
      currentOptions,
      svg;

    function createChart(options) {
      var seriesGroups = [],
        chartRect,
        radius,
        totalDataSum,
        startAngle = options.startAngle,
        dataArray = Chartist.getDataArray(data);

      // Create SVG.js draw
      svg = Chartist.createSvg(query, options.width, options.height);
      // Calculate charting rect
      chartRect = Chartist.createChartRect(svg, options, 0, 0);
      // Get biggest circle radius possible within chartRect
      radius = Math.min(chartRect.width() / 2, chartRect.height() / 2);
      // Calculate total of all series to get reference value or use total reference from optional options
      totalDataSum = options.total || dataArray.reduce(function(previousValue, currentValue) {
        return previousValue + currentValue;
      }, 0);

      // If this is a donut chart we need to adjust our radius to enable strokes to be drawn inside
      // Unfortunately this is not possible with the current SVG Spec
      // See this proposal for more details: http://lists.w3.org/Archives/Public/www-svg/2003Oct/0000.html
      radius -= options.donut ? options.donutWidth / 2  : 0;

      // Calculate end angle based on total sum and current data value and offset with padding
      var center = {
        x: chartRect.x1 + chartRect.width() / 2,
        y: chartRect.y2 + chartRect.height() / 2
      };

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        seriesGroups[i] = svg.elem('g');
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        var endAngle = startAngle + dataArray[i] / totalDataSum * 360;
        // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
        // with Z and use 359.99 degrees
        if(endAngle - startAngle === 360) {
          endAngle -= 0.01;
        }

        var start = Chartist.polarToCartesian(center.x, center.y, radius, startAngle - (i === 0 ? 0 : 0.2)),
        end = Chartist.polarToCartesian(center.x, center.y, radius, endAngle),
        arcSweep = endAngle - startAngle <= 180 ? '0' : '1',
        d = [
          // Start at the end point from the cartesian coordinates
          'M', end.x, end.y,
          // Draw arc
          'A', radius, radius, 0, arcSweep, 0, start.x, start.y
        ];

        // If regular pie chart (no donut) we add a line to the center of the circle for completing the pie
        if(options.donut === false) {
          d.push('L', center.x, center.y);
        }

        // Create the SVG path
        // If this is a donut chart we add the donut class, otherwise just a regular slice
        var path = seriesGroups[i].elem('path', {
          d: d.join(' ')
        }, options.classNames.slice + (options.donut ? ' ' + options.classNames.donut : ''));

        // If this is a donut, we add the stroke-width as style attribute
        if(options.donut === true) {
          path.attr({
            'style': 'stroke-width: ' + (+options.donutWidth) + 'px'
          });
        }

        // Set next startAngle to current endAngle. Use slight offset so there are no transparent hairline issues
        // (except for last slice)
        startAngle = endAngle;
      }
    }

    // Obtain current options based on matching media queries (if responsive options are given)
    // This will also register a listener that is re-creating the chart based on media changes
    currentOptions = Chartist.optionsProvider(defaultOptions, options, responsiveOptions, function (changedOptions) {
      currentOptions = changedOptions;
      createChart(currentOptions);
    });

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    window.addEventListener('resize', function () {
      createChart(currentOptions);
    });

    // Public members
    return {
      version: Chartist.version,
      update: function () {
        createChart(currentOptions);
      }
    };
  };
}(document, window, window.Chartist));