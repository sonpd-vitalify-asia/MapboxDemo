export function setupFlightRoute(map){
    let drone;
    map.addLayer({
        id: 'flight-route-layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {

            window.tb = new Threebox(
                map,
                mbxContext,
                {
                    defaultLights: true,
                    enableSelectingFeatures: true,
                    enableSelectingObjects: true,
                    enableDraggingObjects: true,
                    enableRotatingObjects: true,
                    enableTooltips: true
                }
            );

            var options = {
				obj: '../Soldier.glb',
                type: 'gltf',
                scale: 50,
                units: 'meters',
                rotation: { x: 90, y: 0, z: 0 },
                anchor: 'center'//default rotation
            }

            tb.loadObj(options, function (model) {
                drone = model.setCoords([139.68786, 35.68355]);
                drone.castShadow = true;

				tb.add(drone);

				let line;

				let flightPlan = {
					"geometry": {
						"coordinates": [
							[
								139.68986,
								35.68555,
								100
							],
							[
								139.686073019972,
								35.68391289628885, 
								100  
							],
							[
								139.67987868274898,
								35.68291119456225, 
								100 
							],
							[
								139.67676744339641,
								35.68532432976451,
								100 
							],
							[
								139.67878545309335,
								35.68830673040096, 
								100 
							],
							[
								139.68094376521736,
								35.689171857699876, 
								100
							],
							[
								139.68523219110548,
								35.6926092889477, 
								100
							],
							[
								139.6901374121977,
								35.68789688658442,
								100
							],
							[
								139.68986,
								35.68555,
								100
							]
						],
						"type": "LineString"
					},
					"type": "Feature",
					"properties": {}
				}

				function fly(data) {
					// extract path geometry from callback geojson, and set duration of travel
					var options = {
						path: data.geometry.coordinates,
						duration: 20000
					}

					drone.followPath(
						options,
						function () {
							// done follow path
						}
					);

					// set up geometry for a line to be added to map, lofting it up a bit for *style*
					let lineGeometry = options.path;

					// create and add line object
					line = tb.line({
						geometry: lineGeometry,
						width: 5,
						color: 'steelblue'
					})

					tb.add(line);

				}

				fly(flightPlan);
            });

        },

        render: function (gl, matrix) {
            tb.update();
        }

    });   

}