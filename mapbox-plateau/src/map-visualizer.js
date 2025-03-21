export function setupPlateau(map){
    map.addSource('vector-array-source', {
        "type": "vector",
        // Replace this URL with a 'mapbox://TILESET_ID'
        "tiles": [
            "https://indigo-lab.github.io/plateau-tokyo23ku-building-mvt-2020/{z}/{x}/{y}.pbf"
        ],
        "minzoom": 10,
        "maxzoom": 16,
    });

    map.addLayer({
        "id": "bldg",
        "type": "fill-extrusion",
        "source": "vector-array-source",
        "source-layer": "bldg",
        "minzoom": 10,
        "maxzoom": 20,
        "paint": {
            "fill-extrusion-color": [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                "#9e9e9e", "#b0b0b0"
            ],
            "fill-extrusion-height": ["get", "measuredHeight"]
        }
    });
}

export function setupWind(map){
    const color = {
        wind: [
            [0, [98, 113, 183, 255]],
            [1, [57, 97, 159, 255]],
            [3, [74, 148, 169, 255]],
            [5, [77, 141, 123, 255]],
            [7, [83, 165, 83, 255]],
            [9, [53, 159, 53, 255]],
            [11, [167, 157, 81, 255]],
            [13, [159, 127, 58, 255]],
            [15, [161, 108, 92, 255]],
            [17, [129, 58, 78, 255]],
            [19, [175, 80, 136, 255]],
            [21, [117, 74, 147, 255]],
            [24, [109, 97, 163, 255]],
            [27, [68, 105, 141, 255]],
            [29, [92, 144, 152, 255]],
            [36, [125, 68, 165, 255]],
            [46, [231, 215, 215, 255]],
            [51, [219, 212, 135, 255]],
            [77, [205, 202, 112, 255]],
            [104, [128, 128, 128, 255]]
        ],
    };

    fetch('https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/json/wind.json')
    .then(res => res.json())
    .then(data => {
        data = data.map((item, idx) => {
            item.header = Object.assign(item.header, {
                parameterCategory: 1,
                parameterNumber: idx === 0 ? 2 : 3,
            });
            return item;
        });

        const windInterpolateColor = color.wind.reduce((result, item, key) => result.concat(item[0], 'rgba(' + item[1].join(',') + ')'), []);

        const fillLayer1 = new mapboxWind.ScalarFill('wind1', {
            "type": "image",
            "url": "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv.png",
            "extent": [
                [-180, 85.051129],
                [-180, -85.051129],
                [180, 85.051129],
                [180, -85.051129],
            ],
            "width": 1440,
            "height": 720,
            "uMin": -34.37186050415039,
            "uMax": 46.51813888549805,
            "vMin": -42.12305450439453,
            "vMax": 49.66694259643555,
        }, {
            wrapX: true,
            styleSpec: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'value'],
                    ...windInterpolateColor
                ],
                'opacity': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    0,
                    1,
                    10,
                    0
                ],
            },
            renderForm: 'rg',
            // widthSegments: 720,
            // heightSegments: 360,
            widthSegments: 1,
            heightSegments: 1,
            displayRange: [0, 150],
            // mappingRange: [0, 500000],
            mappingRange: [0, 0],
            wireframe: false,
        });

        map.addLayer(fillLayer1);

        const fillLayer = new mapboxWind.ScalarFill('wind', {
            "type": "image",
            "url": "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv.png",
            "extent": [
                [-180, 85.051129],
                [-180, -85.051129],
                [180, 85.051129],
                [180, -85.051129],
            ],
            "width": 1440,
            "height": 720,
            "uMin": -34.37186050415039,
            "uMax": 46.51813888549805,
            "vMin": -42.12305450439453,
            "vMax": 49.66694259643555,
        }, {
            wrapX: true,
            styleSpec: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'value'],
                    ...windInterpolateColor
                ],
                'opacity': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    1,
                    0,
                    10,
                    1
                ],
            },
            renderForm: 'rg',
            // widthSegments: 720,
            // heightSegments: 360,
            widthSegments: 1,
            heightSegments: 1,
            displayRange: [0, 150],
            // mappingRange: [0, 500000],
            mappingRange: [0, 0],
            wireframe: false,
        });

        map.addLayer(fillLayer);

        const particlesConfig = {
            wrapX: true,
            speedFactor: 1,
            fadeOpacity: 0.93,
            dropRate: 0.003,
            dropRateBump: 0.002,
            lineWidth: 2.1,
            opacity: 1,
        }

        const particles = new mapboxWind.Particles('particles', {
            "type": "image",
            "url": "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv-mc.png",
            "extent": [
                [-180, 85.051129],
                [-180, -85.051129],
                [180, 85.051129],
                [180, -85.051129],
            ],
            "width": 1024,
            "height": 1024,
            "uMin": -34.37186050415039,
            "uMax": 46.51813888549805,
            "vMin": -42.12305450439453,
            "vMax": 49.66694259643555,
        }, {
            wrapX: true,
            lineWidth: 2.2,
            styleSpec: {
                'color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'value'],
                    0.0,
                    '#fff',
                    100.0,
                    '#fff',
                ],
                'opacity': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    1, // zoom
                    1, // opacity
                    5, // zoom
                    0.8 // opacity
                ],
                'numParticles': [
                    'interpolate',
                    ['exponential', 0.5],
                    ['zoom'],
                    0, // zoom
                    0, // numParticles
                    8, // zoom
                    0 // numParticles
                ],
            },
        });

        map.addLayer(particles);

        //let gui = new dat.GUI();

        //gui.add({
        //    addParticles: true,
        //}, 'addParticles').onChange(function (state) {
        //    if (state) {
        //        map.addLayer(particles);
        //    } else {
        //        map.removeLayer('particles');
        //    }
        //});

        //gui.add({
        //    addScalarFill: true,
        //}, 'addScalarFill').onChange(function (state) {
        //    if (state) {
        //        if (map.getLayer('particles')) {
        //            map.addLayer(fillLayer, 'particles');
        //        } else {
        //            map.addLayer(fillLayer);
        //        }
        //    } else {
        //        map.removeLayer('wind');
        //    }
        //});

        //gui.add({
        //    colorful: false,
        //}, 'colorful').onChange(function (state) {
        //    if (!state) {
        //        particles.updateOptions({
        //            styleSpec: {
        //                color: [
        //                    'interpolate',
        //                    ['linear'],
        //                    ['get', 'value'],
        //                    0.0,
        //                    '#fff',
        //                    100.0,
        //                    '#fff',
        //                ]
        //            },
        //        });
        //    } else {
        //        particles.updateOptions({
        //            styleSpec: {
        //                'color': [
        //                    'interpolate',
        //                    ['linear'],
        //                    ['get', 'value'],
        //                    ...windInterpolateColor
        //                ]
        //            },
        //        });
        //    }
        //});

        //gui.add({
        //    numParticles: 65535,
        //}, 'numParticles', 0, 65535).onChange(function (num) {
        //    particles.updateOptions({
        //        styleSpec: {
        //            numParticles: num
        //        },
        //    });
        //});

        //gui.add(particlesConfig, 'speedFactor', 0, 2).onChange(function () {
        //    particles.updateOptions(particlesConfig);
        //});

        //gui.add(particlesConfig, 'fadeOpacity', 0, 1).onChange(function () {
        //    particles.updateOptions(particlesConfig);
        //});

        //gui.add(particlesConfig, 'dropRate', 0, 0.1).onChange(function () {
        //    particles.updateOptions(particlesConfig);
        //});

        //gui.add(particlesConfig, 'dropRateBump', 0, 0.1).onChange(function () {
        //    particles.updateOptions(particlesConfig);
        //});

        //gui.add(particlesConfig, 'lineWidth', 0, 10).onChange(function () {
        //    particles.updateOptions(particlesConfig);
        //});

        //gui.add(particlesConfig, 'wrapX').onChange(function () {
        //    particles.updateOptions(particlesConfig);
        //});



    });
}