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
								139.6870850942044,
								35.68271466831231, 
								240
							],
							[
								139.690901499203,
								35.68510234388414, 
								240  
							],
							[
								139.6866881438094,
								35.69385167099468, 
								220
							],
							[
								139.6870850942044,
								35.68271466831231,
								240
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
				
				const centerLon = 139.68786;
				const centerLat = 35.68355;
				const centerAlt = 100; 

				const gridSize = { width: 15, height: 15, depth: 5 }; 
				const radius = 0.05; // radius arund center point

				const centralWind = new THREE.Vector3(0.2, 0.1, 0.05);
				const altStepInMetter = 50;

				let windField = Array.from({ length: gridSize.width }, (_, x) =>
					Array.from({ length: gridSize.height }, (_, y) =>
						Array.from({ length: gridSize.depth }, (_, z) => {
							let lon = centerLon + ((x - gridSize.width / 2) / gridSize.width) * radius * 2;
							let lat = centerLat + ((y - gridSize.height / 2) / gridSize.height) * radius * 2;
							let alt = centerAlt + (z - gridSize.depth / 2) * altStepInMetter;

							let noise = new THREE.Vector3(
								(Math.random() - 0.5) * 0.1,
								(Math.random() - 0.5) * 0.1,
								(Math.random() - 0.5) * 0.05
							);

							return {
								position: [lon, lat, alt], 
								wind: centralWind.clone().add(noise)
							};
						})
					)
				);

				function drawCalculatedRoute(data) {
					let coords = structuredClone(data.geometry.coordinates);
				
					for (let i = 0; i < coords.length; i++) {
						let [lon, lat, alt] = coords[i];
				
						let nearestWind = getNearestWindVector(lon, lat, alt);
				
						let newLon = lon + nearestWind.x * windConfig.windStrength / 50;
						let newLat = lat + nearestWind.y * windConfig.windStrength / 50;
						let newAlt = alt + nearestWind.z * windConfig.windStrength / 50; 
				
						coords[i] = [newLon, newLat, newAlt];
					}
				
					if (line2 !== undefined) {
						tb.remove(line2);
					}
				
					line2 = tb.line({
						geometry: coords,
						width: 5,
						color: "red", 
					});
				
					tb.add(line2);
				}
				

				function getNearestWindVector(lon, lat, alt) {
					let nearestWind = new THREE.Vector3(0, 0, 0);
					let minDistance = Infinity;
				
					for (let x = 0; x < windField.length; x++) {
						for (let y = 0; y < windField[x].length; y++) {
							for (let z = 0; z < windField[x][y].length; z++) {
								let data = windField[x][y][z];
								let [wx, wy, wz] = data.position;
				
								let distance = Math.sqrt(
									Math.pow(wx - lon, 2) +
									Math.pow(wy - lat, 2) +
									Math.pow(wz - alt, 2)
								);
				
								if (distance < minDistance) {
									minDistance = distance;
									nearestWind = data.wind;
								}
							}
						}
					}
				
					return nearestWind;
				}

				function debugWindField(tb) {
					let arrowGroup = [];
				
					for (let x = 0; x < windField.length; x++) {
						for (let y = 0; y < windField[x].length; y++) {
							for (let z = 0; z < windField[x][y].length; z++) {
								let data = windField[x][y][z];
								let windVector = data.wind; 
								let start = data.position; 
				
								let end = [
									start[0] + windVector.x * 0.01, 
									start[1] + windVector.y * 0.01,
									start[2] + windVector.z * 5
								];
				
								//let arrowLine = tb.line({
								//	geometry: [start, end],
								//	width: 2,
								//	color: "blue",
								//});
				
								//arrowGroup.push(arrowLine);
								//tb.add(arrowLine);
				
								//let arrowHead = tb.sphere({
								//	radius: 5, 
								//	color: "red",
								//	units: "meters",
								//	anchor: 'center'
								//}).setCoords(end);;
				
								//arrowGroup.push(arrowHead);
								//tb.add(arrowHead);

								var startCoord = new THREE.Vector3(start[0], start[1], start[2]);

								var endCoord = new THREE.Vector3(end[0], end[1], end[2]);

								var direction = startCoord.clone().sub(endCoord);

								var segmentCount = 5;

								var lastPosition = startCoord.clone();

								for (let i = 1; i < segmentCount; i++) {

									var segment = new THREE.Vector3(direction.x * i / segmentCount, direction.y * i / segmentCount, direction.z * i / segmentCount);
									var position = startCoord.clone().add(segment);


									var point2 = [lastPosition.x, lastPosition.y, lastPosition.z];
									var point1 = [position.x, position.y, position.z];

									var length = 0.00025;

									var D = [point1[0] - point2[0], point1[1] - point2[1]];
									var Norm = Math.sqrt(D[0] * D[0] + D[1] * D[1]);
									var uD = [D[0] / Norm, D[1] / Norm];

									var ax = uD[0] * Math.sqrt(3) / 2 - uD[1] * 1 / 2;
									var ay = uD[0] * 1 / 2 + uD[1] * Math.sqrt(3) / 2;

									var bx = uD[0] * Math.sqrt(3) / 2 + uD[1] * 1 / 2;
									var by = - uD[0] * 1 / 2 + uD[1] * Math.sqrt(3) / 2;

									let wing1Position = [point2[0] + length * ax, point2[1] + length * ay, point2[2]];
									let wing2Position = [point2[0] + length * bx, point2[1] + length * by, point2[2]];

									let wing1 = tb.line({
										geometry: [point2, wing1Position],
										width: 3,
										color: "blue",
									});


									let wing2 = tb.line({
										geometry: [point2, wing2Position],
										width: 3,
										color: "blue",
									});

									tb.add(wing1);
									tb.add(wing2);

									lastPosition = position.clone();
								} 
							}
						}
					}
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

				debugWindField(tb);
            });

        },

        render: function (gl, matrix) {
            tb.update();
        }

    });   

}