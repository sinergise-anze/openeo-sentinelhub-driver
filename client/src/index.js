import L from 'leaflet';
import CodeMirror from 'codemirror';
import '../node_modules/codemirror/lib/codemirror.css';
import './styles/main.css';
import '../node_modules/leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

var GLOBALCNT = 3;

function toClrVal(a) {
  return a < 0 ? 0 : a > 1 ? 255 : Math.round(255 * a);
}

function clrPixel(ndvi) {
  return [0.9 - 0.8 * ndvi, 0.2 + 0.8 * ndvi, GLOBALCNT / 3, 1].map(toClrVal);
}

function recolor(tile) {
  const srcData = tile.originalImage;
  const ctx = tile.getContext('2d');
  const tgtData = ctx.getImageData(0, 0, tile.width, tile.height);
  for (var i = 0; i < tgtData.data.length; i += 4) {
    const pxClrs = clrPixel(tile.originalImage.data[i] / 255 * 2 - 1);
    tgtData.data[i] = pxClrs[0];
    tgtData.data[i + 1] = pxClrs[1];
    tgtData.data[i + 2] = pxClrs[2];
    tgtData.data[i + 3] = pxClrs[3];
  }
  ctx.putImageData(tgtData, 0, 0);
}

var map = new L.Map('map', { center: [45, 15], zoom: 8 });

var tiles = L.tileLayer.wms(
  'http://localhost:8080/download/8b055750-da63-11e7-a7b4-717018423482/wcs',
  {
    request: 'GetCoverage',
    service: 'WCS',
    coverage: 'CUSTOM',
    format: 'image/png',
    tileSize: 512,
    minZoom: 8
  }
);

function recolorTiles() {
  console.log('RECOLOR ' + GLOBALCNT);
  tiles.recolor();
}

tiles.recolor = function() {
  GLOBALCNT = (GLOBALCNT + 1) % 4;

  for (var key in this._tiles) {
    var tile = this._tiles[key];
    recolor(tile.el);
  }
};

tiles.createTile = function(coords) {
  const tile = L.DomUtil.create('canvas', 'leaflet-tile');
  tile.width = tile.height = this.options.tileSize;

  const imageObj = new Image();
  imageObj.crossOrigin = '';
  imageObj.onload = function() {
    const ctx = tile.getContext('2d');
    ctx.drawImage(imageObj, 0, 0);

    tile.originalImage = ctx.getImageData(0, 0, tile.width, tile.height);
    recolor(tile);
  };
  imageObj.src = this.getTileUrl(coords);
  return tile;
};

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
}).addTo(map);

tiles.addTo(map);

map.on('mousemove', e => {
  const containerPoint = e.containerPoint;
});

document
  .getElementById('recolorButton')
  .addEventListener('click', recolorTiles);

document.getElementById('runScript').addEventListener('click', runScript);

const cm = CodeMirror(document.getElementById('editor'), {
  value: 'function myScript() {\n    return 100;\n}',
  mode: 'javascript',
  indentUnit: 4,
  lineNumbers: true
});

function runScript() {
  const scriptArea = document.getElementById('firstTextArea');
  console.log(cm.getValue());
}
