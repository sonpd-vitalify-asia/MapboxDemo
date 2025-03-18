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
				
				const centerLon = 139.68786;
				const centerLat = 35.68355;
				const centerAlt = 100; 

				const gridSize = { width: 20, height: 20, depth: 5 }; 
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
				
								let arrowLine = tb.line({
									geometry: [start, end],
									width: 2,
									color: "blue",
								});
				
								arrowGroup.push(arrowLine);
								tb.add(arrowLine);
				
								let arrowHead = tb.sphere({
									radius: 5, 
									color: "red",
									units: "meters",
									anchor: 'center'
								}).setCoords(end);;
				
								arrowGroup.push(arrowHead);
								tb.add(arrowHead);
							}
						}
					}
				}
				debugWindField(tb);

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