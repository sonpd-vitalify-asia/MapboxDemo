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
                scale: 100,
                units: 'meters',
                rotation: { x: 90, y: 0, z: 0 },
                anchor: 'center'//default rotation
            }

            var pointA = [139.68986, 35.68555];
            var pointB = [139.68786, 35.67355];

            var sphereA = tb.sphere({color: 'red', material: 'MeshToonMaterial', anchor: 'center'})
                .setCoords(pointA);
            sphereA.addEventListener('ObjectMouseOver', onObjectMouseClick, false);
            tb.add(sphereA);

            var sphereB = tb.sphere({color: 'green', material: 'MeshToonMaterial', anchor: 'center'})
                .setCoords(pointB);
            // sphereB.addEventListener('ObjectMouseOver', onObjectMouseClick, false);
            tb.add(sphereB);

            tb.loadObj(options, function (model) {
                drone = model.setCoords([139.68786, 35.68355]);
                drone.castShadow = true;
                // Listening to the events
                // drone.addEventListener('SelectedChange', onSelectedChange, false);
                // drone.addEventListener('Wireframed', onWireframed, false);
                // drone.addEventListener('IsPlayingChanged', onIsPlayingChanged, false);
                // drone.addEventListener('ObjectDragged', onDraggedObject, false);
                // drone.addEventListener('ObjectMouseOver', onObjectMouseOver, false);
                // drone.addEventListener('ObjectMouseOut', onObjectMouseOut, false);
                // drone.addEventListener('ObjectChanged', onObjectChanged, false);

                var options = {
					animation: 1,
					path: [pointA, pointB],
					duration: 10000
				}

				// start the soldier animation with above options, and remove the line when animation ends
				drone.followPath(
					options,
					function () {
                        // done follow path
					}
				);

				drone.playAnimation(options);

                tb.add(drone);
            });
        },

        render: function (gl, matrix) {
            tb.update();
        }
    });   

    //actions to execute onObjectMouseOver
    function onObjectMouseClick(e) {
        console.log("ObjectMouseClick: " + e.detail.name);
    }
}