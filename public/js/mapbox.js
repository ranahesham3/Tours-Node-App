/* eslint-disable */

export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoicmFuYTAwNy0iLCJhIjoiY21jMHlpeWhlMDc2ejJqcjU3cXd6dWN2dyJ9.41b6xdrg4VjNDY6LGzdpRQ';

    //create a map
    var map = new mapboxgl.Map({
        //put the map into an element with an id of 'map'
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v10',
        scrollZoom: false,
        // //lan,lat
        // center: [-80.647885, 24.909047],
        // zoom: 4,
        // //to make it look like a picture
        //ineractive: false,
    });
    //we want to automaticaly center the map by putting all the locations to the map '

    //bounds object refers to the area that will be displayed in the map
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
        //create marker
        const el = document.createElement('div');
        el.className = 'marker';
        //add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);
        //extend map bounds to include the current location
        bounds.extend(loc.coordinates);

        //add popup
        new mapboxgl.Popup({
            //a single number specifying a distance from the popup's location
            offset: 30,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);
    });

    map.fitBounds(bounds, {
        //specifying the padding
        pading: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};
