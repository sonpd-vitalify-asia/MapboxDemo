import { Tween, Group, Easing } from '@tweenjs/tween.js'

export function setupFlightRoute(map) {
	let drone;
	let ring;
	let clock;
	let timeStats;
	let keepTrackTime = false;

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
				obj: '../drone.glb',
                type: 'gltf',
                scale: 50,
                units: 'meters',
				rotation: { x: 90, y: 0, z: 0 },
				adjustment: { x: 0, y: 0, z: -1.5 },
				anchor: 'center',
			}

			let windConfig = {
				windStrength: 0.05,
				windDirection: new THREE.Vector3(0, 0, 0),
				routeProgress: 0,
				time: 0,
			}

			clock = new THREE.Clock();

			tb.loadObj(options, function (model) {

				drone = model.setCoords([139.69068762354476, 35.683589708868226]);
				drone.castShadow = true;

				tb.add(drone);

				let line;
				let line2;
				let calculatedPath;
				let path;

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
								240
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

				let points = [];
				let threeMaterial;

				function drawWindDirection() {

					var pointA = [139.69068762354476, 35.683589708868226];
					var pointB = [139.69404922417496, 35.67866108711135];

					var sphereA = tb.sphere({ color: 'red', material: threeMaterial, anchor: 'center' })
						.setCoords(pointA);
					//tb.add(sphereA);

					var sphereB = tb.sphere({ color: 'green', material: 'MeshToonMaterial', anchor: 'center' })
						.setCoords(pointB);
					//tb.add(sphereB);

					var a = new THREE.Vector3(pointA[0], pointA[1], 0);
					var b = new THREE.Vector3(pointB[0], pointB[1], 0);
					var direction = a.clone().sub(b).normalize();

					windConfig.direction = direction;
				}

				function drawOriginalRoute(data) {
					// extract path geometry from callback geojson, and set duration of travel
					var options = {
						path: data.geometry.coordinates,
					}

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
					calculatedPath = structuredClone(data.geometry.coordinates);

					for (let i = 0; i < calculatedPath.length; i++) {
						let [lon, lat, alt] = calculatedPath[i];

						let nearestWind = getNearestWindVector(lon, lat, alt);

						let newLon = lon + nearestWind.x * windConfig.windStrength / 50;
						let newLat = lat + nearestWind.y * windConfig.windStrength / 50;
						let newAlt = alt + nearestWind.z * windConfig.windStrength / 50;

						calculatedPath[i] = [newLon, newLat, newAlt];
					}

					if (line2 !== undefined) {
						tb.remove(line2);
					}

					line2 = tb.line({
						geometry: calculatedPath,
						width: 5,
						color: "red",
					});

					tb.add(line2);

					points = [];

					for (var i = 1; i < calculatedPath.length; i++) {
						var lastCoord = calculatedPath[i - 1];
						var currentCoord = calculatedPath[i];
						var step = 0.005;

						for (var progress = 0; progress < 1; progress += step) {
							var point = intermediatePointTo(lastCoord[1], lastCoord[0], currentCoord[1], currentCoord[0], progress);
							point[2] = currentCoord[2];

							points.push(point);
						}
					}
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
						drawProgress(windConfig.routeProgress);

					});

					gui.add(windConfig, 'routeProgress', 0, 1).onChange(function () {

						drawProgress(windConfig.routeProgress,true);

					});

					var perfFolder = gui.addFolder('Performance');

					timeStats = document.createElement('li');
					timeStats.classList.add('gui-stats');

					timeStats.innerHTML = '<i>Time: </i> ' + windConfig.time;

					var trackObj = {
						Track: function () {
							keepTrackTime = true;
							drawProgress(windConfig.routeProgress);
						}
					};
					gui.add(trackObj, 'Track');

					var stopObj = {
						Stop: function () {
							keepTrackTime = false;
						}
					};
					gui.add(stopObj, 'Stop');

					var resetObj = {
						Reset: function () {
							windConfig.time = 0;
							timeStats.innerHTML = '<i>Time: </i> ' + formatSeconds(windConfig.time);
						}
					};
					gui.add(resetObj, 'Reset');

					perfFolder.domElement.appendChild(timeStats);
					perfFolder.open();
				}

				const group = new Group();
				let curve;
				let progress = 0;
				const increment = 0.001; // Adjust for desired speed

				init();

				drawWindDirection();
				drawOriginalRoute(flightPlan);
				drawCalculatedRoute(flightPlan);
				debugWindField(tb);

				drawRing();
				animate();

				var pulseRate = 1;
				var timeCount = pulseRate;
				var blink = true;
				var tween;

				windConfig.routeProgress = 0;
				drone = model.setCoords(points[0]);
				console.log("total points: " + points.length);

				function animate(time) {
					requestAnimationFrame(animate);

					if (ring.coordinates !== drone.coordinates) {
						ring.setCoords(drone.coordinates);
					}

					var delta = clock.getDelta();

					timeCount += delta;

					if (timeCount > pulseRate) {

						blink = !blink;

						if (blink) {
							tween = new Tween(threeMaterial.color).to({ r: 0, g: 1, b: 0 }, pulseRate * 1000).start();
						}
						else {
							tween = new Tween(threeMaterial.color).to({ r: 0, g: 0, b: 0 }, pulseRate * 1000).start();
						}
						timeCount = 0;
					}
				

					if (tween) tween.update(time);

					if (keepTrackTime) {

						windConfig.time += delta;
						timeStats.innerHTML = '<i>Time: </i> ' + formatSeconds(windConfig.time);

						if (curve) {
							windConfig.routeProgress += increment;
							if (windConfig.routeProgress > 1) {
								windConfig.routeProgress = 0; // Or reset to 0, or loop to the beginning
							}

							const point = curve.getPointAt(windConfig.routeProgress);

							// Use 'point' to position your object
							var p = tb.unprojectFromWorld(point);

							drone.setCoords(p);

							// Imported code from Threebox source, for drone rotation
							let tangent = curve
								.getTangentAt(windConfig.routeProgress)
								.normalize();

							let axis = new THREE.Vector3(0, 0, 0);
							let up = new THREE.Vector3(0, 1, 0);

							axis
								.crossVectors(up, tangent)
								.normalize();

							let radians = Math.acos(up.dot(tangent));

							let objectState = { worldCoordinates: point };

							objectState.quaternion = [axis, radians];

							drone._setObject(objectState);
						}
					}
					else {
						drone.setCoords(drone.coordinates);
                    }
				}

				function formatSeconds(seconds) {
					var date = new Date(1970, 0, 1);
					date.setSeconds(seconds);
					return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
				}

				function drawProgress(setPosition)
				{
					var options = {
						path: points,
						duration: 20000
					}

					path = drone.followPath(
						options,
						function () {

						}
					);

					curve = path.animationQueue[0].parameters.pathCurve;

					if (setPosition) {
						const point = curve.getPointAt(windConfig.routeProgress);

						// Use 'point' to position your object
						var p = tb.unprojectFromWorld(point);

						drone.setCoords(p);
					}
				}

				function drawRing() {

					threeMaterial = tb.material({
						material: new THREE.MeshStandardMaterial({ color: '#adfc03' }),
					});

					var geometry = new THREE.TorusGeometry(40, 3, 9, 18);
					ring = new THREE.Mesh(geometry, threeMaterial);
					ring = tb.Object3D({ obj: ring, units: 'meters', adjustment: { x: 0, y: 0, z: 1 }, anchor: 'center' });
					ring.setCoords(drone.coordinates);
					tb.add(ring);
				}


				function clamp(num, min, max) {
					return num <= min
						? min
						: num >= max
							? max
							: num
				}

				function intermediatePointTo(thisLat, thisLon, pointLat, pointLon, fraction)
				{
					var phi1 = toRadians(thisLat);

					var ramda1 = toRadians(thisLon);

					var phi2 = toRadians(pointLat);

					var ramda2 = toRadians(pointLon);

					var sinTheta1 = Math.sin(phi1);

					var cosTheta1 = Math.cos(phi1);

					var sinRamda1 = Math.sin(ramda1);

					var cosRamda1 = Math.cos(ramda1);

					var sinPhi2 = Math.sin(phi2);

					var cosPhi2 = Math.cos(phi2);

					var sinRamda2 = Math.sin(ramda2);

					var cosRamda2 = Math.cos(ramda2);

					var deltaPhi = phi2 - phi1;

					var deltaRamda = ramda2 - ramda1;

					var a = Math.sin(deltaPhi / 2.0) * Math.sin(deltaPhi / 2.0) + Math.cos(phi1) *

						Math.cos(phi2) * Math.sin(deltaRamda / 2.0) * Math.sin(deltaRamda / 2.0);

					var delta = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

					var A = Math.sin((1.0 - fraction) * delta) / Math.sin(delta);

					var B = Math.sin(fraction * delta) / Math.sin(delta);


					var x = A * cosTheta1 * cosRamda1 + B * cosPhi2 * cosRamda2;

					var y = A * cosTheta1 * sinRamda1 + B * cosPhi2 * sinRamda2;

					var z = A * sinTheta1 + B * sinPhi2;

					var theta3 = Math.atan2(z, Math.sqrt(x * x + y * y));

					var ramda3 = Math.atan2(y, x);

					var result = [(toDegrees(ramda3) + 540.0) % 360.0 - 180.0, toDegrees(theta3)];

					return result; // normalise lon to −180..+180°
				}

				function toRadians(degree) {
					return degree * Math.PI / 180.0;
				}

				function toDegrees(radian) {
					return radian * 180.0 / Math.PI;
				}
            });

        },

        render: function (gl, matrix) {
			tb.update();
        }


	});


}