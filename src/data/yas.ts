export const YAS_CENTER: [number, number] = [54.61, 24.49]
export const YAS_ZOOM = 12.1
export const YAS_PITCH = 52
export const YAS_BEARING = 18
export const YAS_BOUNDS: [[number, number], [number, number]] = [
  [54.555, 24.42],
  [54.67, 24.54],
]

export const yasOutline = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [54.575, 24.498],
            [54.584, 24.472],
            [54.598, 24.456],
            [54.616, 24.46],
            [54.632, 24.478],
            [54.638, 24.502],
            [54.628, 24.528],
            [54.612, 24.538],
            [54.592, 24.53],
            [54.576, 24.514],
            [54.575, 24.498],
          ],
        ],
      },
    },
  ],
}

export const tramLine = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Abu Dhabi Tram Line 4' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [54.618, 24.522],
          [54.61, 24.51],
          [54.606, 24.484],
          [54.599, 24.491],
          [54.609, 24.488],
          [54.608, 24.476],
          [54.603, 24.467],
          [54.605, 24.455],
          [54.612, 24.445],
          [54.628, 24.438],
          [54.651, 24.433],
        ],
      },
    },
  ],
}

export const highwayPressure = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Airport–Yas corridor' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [54.651, 24.433],
          [54.632, 24.44],
          [54.612, 24.448],
          [54.598, 24.458],
          [54.59, 24.472],
          [54.582, 24.49],
        ],
      },
    },
  ],
}

export const disneyHeat = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { mag: 1 }, geometry: { type: 'Point', coordinates: [54.618, 24.522] } },
    { type: 'Feature', properties: { mag: 0.92 }, geometry: { type: 'Point', coordinates: [54.612, 24.516] } },
    { type: 'Feature', properties: { mag: 0.85 }, geometry: { type: 'Point', coordinates: [54.61, 24.51] } },
    { type: 'Feature', properties: { mag: 0.7 }, geometry: { type: 'Point', coordinates: [54.606, 24.484] } },
    { type: 'Feature', properties: { mag: 0.68 }, geometry: { type: 'Point', coordinates: [54.599, 24.491] } },
    { type: 'Feature', properties: { mag: 0.6 }, geometry: { type: 'Point', coordinates: [54.609, 24.488] } },
    { type: 'Feature', properties: { mag: 0.78 }, geometry: { type: 'Point', coordinates: [54.612, 24.445] } },
    { type: 'Feature', properties: { mag: 0.88 }, geometry: { type: 'Point', coordinates: [54.651, 24.433] } },
    { type: 'Feature', properties: { mag: 0.55 }, geometry: { type: 'Point', coordinates: [54.603, 24.467] } },
    { type: 'Feature', properties: { mag: 0.5 }, geometry: { type: 'Point', coordinates: [54.59, 24.472] } },
  ],
}

export const disneyPois = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { mag: 1, name: 'Disneyland Abu Dhabi site' },
      geometry: { type: 'Point', coordinates: [54.618, 24.522] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.8, name: 'Ferrari World' },
      geometry: { type: 'Point', coordinates: [54.606, 24.484] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.75, name: 'Warner Bros. World' },
      geometry: { type: 'Point', coordinates: [54.599, 24.491] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.72, name: 'Yas Marina Circuit' },
      geometry: { type: 'Point', coordinates: [54.603, 24.467] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.9, name: 'Zayed International Airport' },
      geometry: { type: 'Point', coordinates: [54.651, 24.433] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.65, name: 'Al Raha' },
      geometry: { type: 'Point', coordinates: [54.612, 24.445] },
    },
  ],
}
