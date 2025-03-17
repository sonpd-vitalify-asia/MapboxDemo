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

			let windConfig = {
				windStrength: 0.05,
				windDirection: new THREE.Vector3(0, 0, 0),
			}

            tb.loadObj(options, function (model) {
                drone = model.setCoords([139.68786, 35.68355]);
                drone.castShadow = true;

				tb.add(drone);

				let line;
				let line2;

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

				function drawWindDirection() {

					var pointA = [139.69068762354476, 35.683589708868226];
					var pointB = [139.69404922417496, 35.67866108711135];

					var sphereA = tb.sphere({ color: 'red', material: 'MeshToonMaterial', anchor: 'center' })
						.setCoords(pointA);
					tb.add(sphereA);

					var sphereB = tb.sphere({ color: 'green', material: 'MeshToonMaterial', anchor: 'center' })
						.setCoords(pointB);
					tb.add(sphereB);

					var a = new THREE.Vector3(pointA[0], pointA[1], 0);
					var b = new THREE.Vector3(pointB[0], pointB[1], 0);
					var direction = a.clone().sub(b).normalize();

					windConfig.direction = direction; 
				}

				function drawOriginalRoute(data) {
					// extract path geometry from callback geojson, and set duration of travel
					var options = {
						path: data.geometry.coordinates,
						duration: 20000
					}

					//drone.followPath(
					//	options,
					//	function () {
					//		// done follow path
					//	}
					//);

					// set up geometry for a line to be added to map, lofting it up a bit for *style*
					let lineGeometry = options.path;

					// create and add line object
					line = tb.line({
						geometry: lineGeometry,
						width: 5,
						color: 'steelblue',
						opacity: 0.51
					})

					tb.add(line);

				}

				function drawCalculatedRoute(data) {

					let coords = structuredClone(data.geometry.coordinates);
			
					var windStr = new THREE.Vector3(windConfig.windStrength / 100, windConfig.windStrength / 100, windConfig.windStrength / 100);
					var wind = new THREE.Vector3(windConfig.direction.x, windConfig.direction.y, windConfig.direction.z).multiply(windStr);
				
					for (let i = 0; i < coords.length; i++) {

						var coordsVector = new THREE.Vector3(coords[i][0], coords[i][1], 0);

						var result = coordsVector.add(wind);

						coords[i] = [result.x, result.y, 100];
					}

					if (line2 === undefined) {

					} else {
						tb.remove(line2);
					}
					// create and add line object
					line2 = tb.line({
						geometry: coords,
						width: 5,
						color: 'red',
					})

					tb.add(line2);
				}

				function init() {

					let gui = new dat.GUI();
					gui.add(windConfig, 'windStrength', 0, 0.08).onChange(function () {

						drawCalculatedRoute(flightPlan);
					});
				}

				init();
				drawWindDirection();
				drawOriginalRoute(flightPlan);
				drawCalculatedRoute(flightPlan);
            });

        },

        render: function (gl, matrix) {
            tb.update();
        }

    });   

}