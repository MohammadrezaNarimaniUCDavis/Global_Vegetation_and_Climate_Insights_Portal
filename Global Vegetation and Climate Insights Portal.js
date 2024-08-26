/*****************************************************
 * University of California, Davis - Digital Agriculture Laboratory
 * Author: Mohammadreza Narimani
 *
 * Description:
 * The Global Vegetation and Climate Insights Portal is designed to operate within Google Earth Engine (GEE) to facilitate dynamic visualization and analysis of global vegetation and climate data. Users can interact with a variety of environmental indicators including NDVI, Evapotranspiration, and Land Surface Temperature across the globe.
 *
 * Key Functionalities Include:
 * 1. Interactive Mapping: Users can view and interact with various global environmental data layers.
 * 2. Data Layer Selection: Choose from different layers such as Evapotranspiration, NDVI, and Land Surface Temperature to visualize.
 * 3. Time-Range Filtering: Adjust time settings to view data for specific periods, enhancing analysis flexibility.
 * 4. Automated Scaling: Data values are scaled appropriately for optimal visualization.
 * 5. Region-Specific Analysis: Focus on specific geographic areas for detailed environmental insights.
 * 6. Legend and Visualization: Dynamic legends update according to the selected data layer, showcasing value ranges with appropriate color coding.
 *
 * This portal utilizes extensive satellite data archives available in GEE, providing a powerful tool for researchers, educators, and policymakers involved in environmental monitoring, agricultural planning, and climate research.
 *
 * The application is user-friendly and equipped with an intuitive interface to ensure accessibility for all users, regardless of their technical background.
 *****************************************************/


// Enhanced tool for charting selected MODIS data products: ET, FPAR, LAI, NDVI, and LST.

/*
 * Global variables and configurations
 */

var products = {
  'Evapotranspiration': {
    collection: 'MODIS/061/MOD16A2GF',
    band: 'ET',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: 0, max: 300, palette: ['ffffff', 'fcd163', '99b718', '66a000', '3e8601', '207401', '056201', '004c00', '011301']},
    label: 'Evapotranspiration (kg/m²/8day)'
  },
  'Leaf Area Index': {
    collection: 'MODIS/061/MOD15A2H',
    band: 'Lai_500m',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: 0, max: 100, palette: ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901', '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01', '012e01', '011d01', '011301']},
    label: 'Leaf Area Index (Area Fraction)'
  },
  'Fraction of Photosynthetically Active Radiation': {
    collection: 'MODIS/061/MOD15A2H',
    band: 'Fpar_500m',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: 0, max: 100, palette: ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901', '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01', '012e01', '011d01', '011301']},
    label: 'Fraction of Photosynthetically Active Radiation (%)'
  },
  'NDVI': {
    collection: 'MODIS/061/MOD13A1',
    band: 'NDVI',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: -2000, max: 10000, palette: ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901', '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01', '012e01', '011d01', '011301']},
    label: 'Normalized Difference Vegetation Index'
  },
  'Land Surface Temperature': {
    collection: 'MODIS/061/MOD11A1',
    band: 'LST_Day_1km',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: 13000.0, max: 16500.0, palette: [
      '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
      '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
      '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
      'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
      'ff0000', 'de0101', 'c21301', 'a71001', '911003'
    ]},
    label: 'Land Surface Temperature (Daytime (F))'
  },
  'Mean Air Temperature': {
    collection: 'ECMWF/ERA5/DAILY',
    band: 'mean_2m_air_temperature',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: 250, max: 320, palette: ['blue', 'green', 'yellow', 'red']},
    label: 'Mean 2m Air Temperature (K)'
  },
  'Precipitation': {
    collection: 'ECMWF/ERA5/DAILY',
    band: 'total_precipitation',
    dateRange: ['2019-01-01', '2019-12-31'],
    visParams: {min: 0, max: 0.02, palette: ['white', 'blue']},
    label: 'Total Daily Precipitation (m)'
  }
};

/*
 * Function to initialize the map and panels
 */
function initializeUI() {
  var mapPanel = ui.Map();
  mapPanel.setOptions('HYBRID');
  mapPanel.style().set('cursor', 'crosshair');

  // Set the initial view to focus on Davis, California
  var davisCoords = {lon: -103.46, lat: 44.58};
  mapPanel.setCenter(davisCoords.lon, davisCoords.lat, 3); // Adjusted zoom level for broader view

  var inspectorPanel = ui.Panel({style: {width: '30%', padding: '8px'}});
  var title = ui.Label({
    value: 'Global Vegetation and Climate Insights Portal',
    style: {fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'navy'}
  });

  inspectorPanel.add(title);

  var productSelector = ui.Select({
    items: Object.keys(products),
    onChange: function(selectedProduct) {
      setupProductLayer(selectedProduct, mapPanel, inspectorPanel);
    },
    value: 'Fraction of Photosynthetically Active Radiation'  // Default selected product
  });

  inspectorPanel.add(productSelector);

  // Adding the legend panel
  var legendPanel = ui.Panel();
  inspectorPanel.add(legendPanel);

  // Trigger the display of Fraction of Photosynthetically Active Radiation layer and chart at initialization
  setupProductLayer('Fraction of Photosynthetically Active Radiation', mapPanel, inspectorPanel);
  displayInitialChart(davisCoords, 'Fraction of Photosynthetically Active Radiation', inspectorPanel, mapPanel, legendPanel); // Automatically display the chart

  // Description and additional information
  var description = ui.Label({
    value: 'Explore dynamic visualization and analysis of global vegetation and climate indicators such as NDVI, Evapotranspiration, and more. This portal allows for comprehensive environmental monitoring and insight.',
    style: {fontSize: '13px', margin: '10px 0'}
  });

  var authors = ui.Label({
    value: 'Authors: Mohammadreza Narimani, Nicholas Richmond',
    style: {fontSize: '13px', fontWeight: 'bold', margin: '4px 0'}
  });

  var labInfo = ui.Label({
    value: 'Digital Agriculture Laboratory of the University of California, Davis',
    style: {fontSize: '13px', margin: '4px 0', color: 'gray'}
  });

  var link = ui.Label('Visit Digital Agriculture Lab', {fontSize: '13px', color: 'blue'});
  link.setUrl('https://digitalag.ucdavis.edu/');

  inspectorPanel.add(description);
  inspectorPanel.add(authors);
  inspectorPanel.add(labInfo);
  inspectorPanel.add(link);

  ui.root.clear();
  ui.root.add(ui.SplitPanel(inspectorPanel, mapPanel));
}

/*
 * Automatically display chart for a default location
 */
function displayInitialChart(coords, productKey, panel, mapPanel, legendPanel) {
  var product = products[productKey];
  var collection = ee.ImageCollection(product.collection)
                    .filterDate(product.dateRange[0], product.dateRange[1])
                    .select(product.band);
  displayChart({lon: coords.lon, lat: coords.lat}, collection, product, panel, mapPanel, legendPanel);
}

/*
 * Function to set up map layers based on product selection
 */
function setupProductLayer(productKey, mapPanel, inspectorPanel) {
  var product = products[productKey];
  var collection = ee.ImageCollection(product.collection)
                    .filterDate(product.dateRange[0], product.dateRange[1])
                    .select(product.band);
  var composite = collection.mean().visualize(product.visParams);

  mapPanel.clear();
  mapPanel.setOptions('HYBRID');
  mapPanel.add(ui.Map.Layer(composite, {}, product.label));

  updateLegend(inspectorPanel, product.visParams, productKey); // Updated to pass productKey

  mapPanel.onClick(function(coords) {
    displayChart(coords, collection, product, inspectorPanel, mapPanel);
  });
}

/*
 * Function to generate and display the chart and mark the selected point
 */
function displayChart(coords, collection, product, panel, mapPanel) {
  var point = ee.Geometry.Point([coords.lon, coords.lat]);
  var dot = ui.Map.Layer(point, {color: 'black'}, 'Selected Location');
  mapPanel.layers().set(1, dot);

  var chartCollection = collection.map(function(image) {
    var factor = product.band === 'Lai_500m' ? 100 :
                 product.band === 'NDVI' ? 10000 :
                 product.band === 'ET' ? 10 :
                 product.band === 'LST_Day_1km' ? 200 : 1;

    return image.select([product.band])
                .divide(factor)
                .copyProperties(image, ['system:time_start']);
  });

  var chart = ui.Chart.image.series(chartCollection, point, ee.Reducer.mean(), 500)
    .setOptions({
      title: product.label + ' Time Series',
      vAxis: {title: product.label},
      hAxis: {title: 'Date', format: 'MM-yy', gridlines: {count: 7}},
      colors: [product.visParams.palette[1]],
      pointSize: 4,
      lineWidth: 0
    });

  panel.widgets().set(2, chart);
}

/*
 * Function to create and update the legend based on selected product's visualization parameters
 */
function updateLegend(panel, visParams, productKey) {
  var min = visParams.min;
  var max = visParams.max;
  var factor = 1; // Default factor for legend scaling

  // Adjust factors to match those used in chart scaling
  if (productKey === 'Leaf Area Index') {
    factor = 100;
  } else if (productKey === 'NDVI') {
    factor = 10000;
  } else if (productKey === 'Evapotranspiration') {
    factor = 10;
  } else if (productKey === 'Land Surface Temperature') {
    factor = 200;
  }

  min /= factor; // Adjust min for legend
  max /= factor; // Adjust max for legend

  var legend = ui.Panel({
    style: {
      position: 'bottom-center',
      padding: '8px 15px'
    }
  });

  var title = ui.Label({
    value: 'Legend',
    style: {fontWeight: 'bold'}
  });

  var makeColorBarParams = function(palette) {
    return {
      bbox: [0, 0, 1, 0.1],
      dimensions: '100x10',
      format: 'png',
      min: 0,
      max: 1,
      palette: palette,
    };
  };

  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: makeColorBarParams(visParams.palette),
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'}
  });

  var labels = ui.Panel({
    widgets: [
      ui.Label(min.toFixed(2).toString()),
      ui.Label(((min + max) / 2).toFixed(2).toString(), {textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(max.toFixed(2).toString())
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal', textAlign: 'center', margin: '0px 8px'}
  });

  legend.add(title);
  legend.add(colorBar);
  legend.add(labels);

  panel.widgets().set(3, legend); // Replace the legend in the UI
}

/*
 * Initialize the app
 */
initializeUI();
