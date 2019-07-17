(function (PV) {
	"use strict";

	function symbolVis() { };
	PV.deriveVisualizationFromBase(symbolVis);

	var definition = { 
		typeName: "insertupdatedeletevalue",
		visObjectType: symbolVis,
		datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
		getDefaultConfig: function(){ 
			return { 
				DataShape: 'Timeseries',
				Height: 150,
				Width: 150,
				TextColor: 'white',
				btnText: 'BtnText',
			} 
		},
		configOptions: function(){
			return [
				{
					title: "Format Symbol",
					mode: "format"
				}
			];
		},
        inject: ['$http', '$q'],
	}

	var origin = window.location.origin;
	var baseUrl = origin + "/piwebapi/"
	
	symbolVis.prototype.init = function(scope, elem, $http, $q) { 
		this.onDataUpdate = dataUpdate;
		
		scope.inputInEdition = false;
	
		function dataUpdate(data){
						
			if(!data) return;
			
			if(scope.inputInEdition) return;
			
			var dataValues = data.Data[0];
			var i;
			for (i=0; i<dataValues.Values.length; i++){				
					dataValues.Values[i].Value = dataValues.Values[i].Value.replace('.','').replace(',','.');							
			}
						
			scope.Values = dataValues.Values;
			
			if(dataValues.Label){
				scope.Units = dataValues.Units;
				scope.Label = dataValues.Label;
			}
		};
			   
	    scope.insertUpdateDeleteValue = function(index,type){
			
			scope.inputInEdition = true;
			
			var namestream = scope.symbol.DataSources[0];
			var datastream = scope.Values[index];
			
			var body = {};
			
			var isAttribute = /af:/.test(namestream);
			var path = isAttribute ? namestream.replace(/af\:(.*)/,'$1') : namestream.replace(/pi\:(\\\\.*)\?{1}.*(\\.*)\?{1}.*/,'$1$2');
			var label = isAttribute ? path.match(/\w*\|.*$/)[0] : path.match(/\w+$/)[0];
			var friendlyName = isAttribute ? label.match(/\|(.*$)/)[1] : label;		
						
			var getDataStreamURL = encodeURI(baseUrl + "attributes?path=" + path);
			
			var dateTimeSplit = datastream.Time.split(' ');
			var dateSplit = dateTimeSplit[0].split('/');
			var timeSplit = dateTimeSplit[1].split(':');
			var dateTimeString = new Date(dateSplit[2],dateSplit[1]-1,dateSplit[0],timeSplit[0],timeSplit[1],timeSplit[2])
						
			var data = {
                        "Timestamp": dateTimeString.toISOString(),
                        "Value": datastream.Value.replace(',','.')
					};
			
			var method = "POST";
			
			body = {
				"1": {
					"Method": "GET",
					"Resource": getDataStreamURL						
				},
				"2": {
					"Method": method,
					"Resource": (type == 'Delete'?"{0}?updateOption=remove":"{0}"),
					"Content": JSON.stringify(data),
					"Headers": {
						'Content-Type': 'application/json'
					},
					"ParentIds": ["1"],
					"Parameters": ["$.1.Content.Links.Value"],				
				}
			}
						
			return $http.post(baseUrl + 'batch', JSON.stringify(body), {withCredentials: true})
					.then(function successCallback(response) {
						scope.inputInEdition = false;
					}, function errorCallback(response) {
						scope.inputInEdition = false;
					});
		};
		
		scope.newValue = function(){
			
			scope.inputInEdition = true;
			
			var valuesLength = scope.Values.length;
			var values;
			if(valuesLength>0){
				values	= scope.Values[valuesLength-1];
			}
			else{
				values = {};
			}
			
			var localeDate = new Date();
			
			if(values.New == undefined ){
				scope.Values.push({'Value':"",
								   'Time':localeDate.toLocaleString(),
								   'New':true
								 })
			}
						
		}
		
		
		scope.inputClick = function(index){
			scope.inputInEdition = true;
		};	   	   
	};

	PV.symbolCatalog.register(definition); 
})(window.PIVisualization); 
