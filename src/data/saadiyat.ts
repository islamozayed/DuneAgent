export const ABU_DHABI_CENTER: [number, number] = [54.347552, 24.470985]
export const ABU_DHABI_ZOOM = 15.49
export const ABU_DHABI_PITCH = 79
export const ABU_DHABI_BEARING = 0

export const SAADIYAT_CENTER: [number, number] = [54.42, 24.536]
export const SAADIYAT_ZOOM = 12.7
export const SAADIYAT_PITCH = 54
export const SAADIYAT_BEARING = -22
export const SAADIYAT_BOUNDS: [[number, number], [number, number]] = [
  [54.385, 24.512],
  [54.472, 24.558],
]

export const islandOutline = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [54.385, 24.528],
            [54.392, 24.518],
            [54.41, 24.512],
            [54.44, 24.515],
            [54.465, 24.525],
            [54.472, 24.538],
            [54.458, 24.552],
            [54.43, 24.558],
            [54.405, 24.55],
            [54.39, 24.538],
            [54.385, 24.528],
          ],
        ],
      },
    },
  ],
}

export const shuttleCorridor = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Cultural District shuttle' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [54.3983, 24.5355],
          [54.405, 24.534],
          [54.412, 24.532],
          [54.421, 24.541],
          [54.434, 24.545],
          [54.4347, 24.5238],
        ],
      },
    },
  ],
}

export const cycleSpine = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'NYUAD–beach spine' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [54.4347, 24.5238],
          [54.438, 24.53],
          [54.436, 24.538],
          [54.43, 24.544],
          [54.421, 24.541],
        ],
      },
    },
  ],
}

export const visitorHeat = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { mag: 1 }, geometry: { type: 'Point', coordinates: [54.3983, 24.5355] } },
    { type: 'Feature', properties: { mag: 0.85 }, geometry: { type: 'Point', coordinates: [54.4005, 24.534] } },
    { type: 'Feature', properties: { mag: 0.7 }, geometry: { type: 'Point', coordinates: [54.405, 24.534] } },
    { type: 'Feature', properties: { mag: 0.55 }, geometry: { type: 'Point', coordinates: [54.412, 24.532] } },
    { type: 'Feature', properties: { mag: 0.8 }, geometry: { type: 'Point', coordinates: [54.421, 24.541] } },
    { type: 'Feature', properties: { mag: 0.75 }, geometry: { type: 'Point', coordinates: [54.428, 24.544] } },
    { type: 'Feature', properties: { mag: 0.9 }, geometry: { type: 'Point', coordinates: [54.434, 24.545] } },
    { type: 'Feature', properties: { mag: 0.4 }, geometry: { type: 'Point', coordinates: [54.418, 24.536] } },
    { type: 'Feature', properties: { mag: 0.35 }, geometry: { type: 'Point', coordinates: [54.408, 24.528] } },
  ],
}

export const lastmileHeat = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { mag: 0.95 }, geometry: { type: 'Point', coordinates: [54.4347, 24.5238] } },
    { type: 'Feature', properties: { mag: 0.7 }, geometry: { type: 'Point', coordinates: [54.438, 24.53] } },
    { type: 'Feature', properties: { mag: 0.65 }, geometry: { type: 'Point', coordinates: [54.436, 24.538] } },
    { type: 'Feature', properties: { mag: 0.8 }, geometry: { type: 'Point', coordinates: [54.43, 24.544] } },
    { type: 'Feature', properties: { mag: 0.6 }, geometry: { type: 'Point', coordinates: [54.421, 24.541] } },
    { type: 'Feature', properties: { mag: 0.4 }, geometry: { type: 'Point', coordinates: [54.426, 24.533] } },
  ],
}

export const culturePois = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { mag: 1, name: 'Louvre Abu Dhabi' },
      geometry: { type: 'Point', coordinates: [54.3983, 24.5355] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.7, name: 'Cultural District' },
      geometry: { type: 'Point', coordinates: [54.405, 24.534] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.8, name: 'Saadiyat Beach hotels' },
      geometry: { type: 'Point', coordinates: [54.434, 24.545] },
    },
  ],
}

export const campusPois = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { mag: 1, name: 'NYU Abu Dhabi' },
      geometry: { type: 'Point', coordinates: [54.4347, 24.5238] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.8, name: 'Beach promenade' },
      geometry: { type: 'Point', coordinates: [54.43, 24.544] },
    },
    {
      type: 'Feature',
      properties: { mag: 0.6, name: 'Hotel drive' },
      geometry: { type: 'Point', coordinates: [54.421, 24.541] },
    },
  ],
}
