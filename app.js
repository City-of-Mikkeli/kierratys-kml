var http = require('http');
var url = require('url');
var parseString = require('xml2js').parseString;
var XMLWriter = require('xml-writer');
var wasteTypes = [
	"seka",
	"bio",
	"energia",
	"paperi",
	"pahvi",
	"kartonki",
	"metalli",
	"lasi",
	"vaarallinen",
	"ser",
	"paristot",
	"muovi",
	"tekstiili",
	"muu",
	"akut",
	"lamput",
	"puu"
];

var options = {
		  host: 'www.kierratys.info',
		  port: 80,
		  path: '/1.5/sitexml.php?municipal_id=491'
};

function validate(point, types, filters){
	if(types){
		for(var i = 0; i < types.length;i++){
			if(point[types[i]] != 1){
				return false;
			}	
		}
	}
	if(filters){
		for (var k in filters){
		    if (filters.hasOwnProperty(k)) {
		    	if(point[k]){
		    		var pointProp = point[k].toLowerCase();
		    		var filterProp = filters[k].toLowerCase(); 
			    	if(pointProp.indexOf(filterProp) == -1){
			    		return false;
			    	}
		    	}
		    }
		}
	}
	return true;
}

http.createServer(function handler(req, res) {
    res.writeHead(200, {'Content-Type': 'application/xml'});
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    if(query.types){
    	var types = query.types.split(",");
    }
    var filters = {};
    if(query.filter){
    var propertygroups = query.filter.split(",");
	    for(var i = 0; i < propertygroups.length;i++){
	    	var propParts = propertygroups[i].split(":");
	    	var key = propParts[0];
	    	var value = propParts[1];
	    	filters[key] = value;
	    }
    }
    http.get(options, function(res2) {
  	  var respBody = '';
  	  res2.on("data", function(chunk) {
  		  respBody += chunk;
  	  });
  	  res2.on('end', function() {
  		  parseString(respBody, function (err, result) {
  			 var xw = new XMLWriter;
  			 xw.startDocument().startElement('kml').writeAttribute('xmlns', 'http://www.opengis.net/kml/2.2');
  			 xw.startElement('Document');
  			 var points = result.response.markers[0].marker;
  			 for(var i = 0; i < points.length;i++){
  				 var point = points[i]['$'];
  				 if(validate(point, types, filters)){	 
	  				 xw.startElement('Placemark').writeAttribute('id', point['paikka_id']);
	  				 xw.writeElement('name', point['nimi']);
	  				 xw.startElement('Point')
	  				 xw.writeElement('coordinates', point['lng']+","+point['lat']);
	  				 xw.endElement();
	  				 var descHtml = '';
	  				 descHtml += 'puh: '+point['yhteys']+'<br/>';
	  				 descHtml += point['osoite']+"<br/>";
	  				 descHtml += point['pnro']+' '+point['paikkakunta']+'<br/>';
	  				 if(point['aukiolo'] != ""){
	  					 descHtml += 'Avoinna: '+point['aukiolo']+'<br/>';
	  				 }
	  				 descHtml += 'Ylläpitäjä: '+point['yllapitaja']+'<br/>';
	  				 descHtml += 'Kerättävät jätelajit (kotitalouksille): <br/><ul>';
	  				 for(var j = 0; j < wasteTypes.length;j++){
	  					 if(point[wasteTypes[j]] == 1){
	  						 descHtml += '<li>'+wasteTypes[j]+'</li>';
	  					 }
	  				 }
	  				 descHtml += '</ul>';
	  				 xw.writeElement('description', descHtml);
	  				 xw.endElement();
  				 }
  			 }
  			 xw.endElement();
  			 xw.endDocument();
  			 res.end(xw.toString());
  		  });
  	  });
  	}).on('error', function(e) {
  		res.end("Error getting xml from api");
  	});
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
