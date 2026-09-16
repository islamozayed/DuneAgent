import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  SAADIYAT_BEARING,
  SAADIYAT_BOUNDS,
  SAADIYAT_CENTER,
  SAADIYAT_PITCH,
  SAADIYAT_ZOOM,
  campusPois,
  culturePois,
  cycleSpine,
  islandOutline,
  lastmileHeat,
  shuttleCorridor,
  visitorHeat,
} from '../data/saadiyat'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const STYLE =
  import.meta.env.VITE_MAPBOX_STYLE ||
  'mapbox://styles/pixonal/cmnpx8l6b002y01qs7t6odrgt'

type Variant = 'bleed' | 'widget'

type Props = {
  layers: string[]
  variant?: Variant
  onReady?: () => void
}

export function MobilityMap({ layers, variant = 'bleed', onReady }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const layersRef = useRef(layers)
  const variantRef = useRef(variant)
  const onReadyRef = useRef(onReady)
  layersRef.current = layers
  variantRef.current = variant
  onReadyRef.current = onReady

  useEffect(() => {
    if (!TOKEN) {
      onReadyRef.current?.()
      return
    }
    if (!host.current || mapRef.current) return

    mapboxgl.accessToken = TOKEN
    const map = new mapboxgl.Map({
      container: host.current,
      style: STYLE,
      center: SAADIYAT_CENTER,
      zoom: SAADIYAT_ZOOM,
      pitch: SAADIYAT_PITCH,
      bearing: SAADIYAT_BEARING,
      attributionControl: false,
      antialias: true,
      interactive: false,
      fadeDuration: 0,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.AttributionControl({ compact: true }))

    const onStyleReady = () => {
      paintOverlays(map)
      applyLayers(map, layersRef.current, variantRef.current)
      map.resize()
      frameIsland(map, 0)
      map.once('idle', () => onReadyRef.current?.())
    }

    map.on('load', onStyleReady)
    map.on('style.load', onStyleReady)
    const resize = () => {
      map.resize()
    }
    window.addEventListener('resize', resize)
    const ro = new ResizeObserver(() => {
      map.resize()
    })
    ro.observe(host.current)
    const mapHost = host.current.closest('.map-host')
    if (mapHost instanceof HTMLElement) ro.observe(mapHost)

    return () => {
      window.removeEventListener('resize', resize)
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.resize()
    frameIsland(map, 1600)
    const start = performance.now()
    let raf = 0
    const tick = () => {
      map.resize()
      if (performance.now() - start < 800) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [variant])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => applyLayers(map, layers, variant)
    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
  }, [layers, variant])

  if (!TOKEN) {
    return <div className="map-missing">Add a Mapbox token to load the Saadiyat map.</div>
  }

  return (
    <div className="map-frame">
      <div ref={host} className="map-canvas" />
    </div>
  )
}

const ALL = [
  'visitors-heat',
  'lastmile-heat',
  'shuttle-corridor',
  'cycle-spine',
  'pois-culture',
  'pois-campus',
]

const CONTEXT = ['island-fill', 'island-line']

function frameIsland(map: mapboxgl.Map, duration: number) {
  map.fitBounds(SAADIYAT_BOUNDS, {
    padding: { top: 48, right: 36, bottom: 72, left: 36 },
    pitch: SAADIYAT_PITCH,
    bearing: SAADIYAT_BEARING,
    duration,
    maxZoom: 13.25,
  })
}

function paintOverlays(map: mapboxgl.Map) {
  if (!map.getSource('island')) {
    map.addSource('island', { type: 'geojson', data: islandOutline })
  }
  if (!map.getSource('shuttle')) {
    map.addSource('shuttle', { type: 'geojson', data: shuttleCorridor, lineMetrics: true })
  }
  if (!map.getSource('cycle')) {
    map.addSource('cycle', { type: 'geojson', data: cycleSpine, lineMetrics: true })
  }
  if (!map.getSource('visitors')) {
    map.addSource('visitors', { type: 'geojson', data: visitorHeat })
  }
  if (!map.getSource('lastmile')) {
    map.addSource('lastmile', { type: 'geojson', data: lastmileHeat })
  }
  if (!map.getSource('pois-culture')) {
    map.addSource('pois-culture', { type: 'geojson', data: culturePois })
  }
  if (!map.getSource('pois-campus')) {
    map.addSource('pois-campus', { type: 'geojson', data: campusPois })
  }

  addOverlay(map, {
    id: 'island-fill',
    type: 'fill',
    source: 'island',
    paint: {
      'fill-color': '#e4b36a',
      'fill-opacity': 0.08,
    },
  })
  addOverlay(map, {
    id: 'island-line',
    type: 'line',
    source: 'island',
    paint: {
      'line-color': '#f0d2a8',
      'line-width': 1.4,
      'line-opacity': 0.55,
    },
  })
  addOverlay(map, {
    id: 'visitors-heat',
    type: 'heatmap',
    source: 'visitors',
    paint: {
      'heatmap-weight': ['get', 'mag'],
      'heatmap-intensity': 1.4,
      'heatmap-radius': 42,
      'heatmap-opacity': 0.82,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(228,179,106,0)',
        0.2,
        'rgba(138,91,98,0.4)',
        0.5,
        'rgba(228,179,106,0.7)',
        0.85,
        'rgba(255,220,170,0.95)',
      ],
    },
  })
  addOverlay(map, {
    id: 'lastmile-heat',
    type: 'heatmap',
    source: 'lastmile',
    paint: {
      'heatmap-weight': ['get', 'mag'],
      'heatmap-intensity': 1.05,
      'heatmap-radius': 28,
      'heatmap-opacity': 0.8,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(61,74,92,0)',
        0.3,
        'rgba(80,140,170,0.45)',
        0.7,
        'rgba(180,220,200,0.85)',
      ],
    },
  })
  addOverlay(map, {
    id: 'shuttle-corridor',
    type: 'line',
    source: 'shuttle',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-width': 3.2,
      'line-opacity': 0.95,
      'line-gradient': [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0,
        '#e4b36a',
        0.5,
        '#f4c9a8',
        1,
        '#8a5b62',
      ],
    },
  })
  addOverlay(map, {
    id: 'cycle-spine',
    type: 'line',
    source: 'cycle',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#9ad4c4',
      'line-width': 3,
      'line-dasharray': [1.2, 1.4],
      'line-opacity': 0.95,
    },
  })
  addOverlay(map, {
    id: 'pois-culture',
    type: 'circle',
    source: 'pois-culture',
    paint: {
      'circle-radius': 5.5,
      'circle-color': '#f4d2a8',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#1a1420',
    },
  })
  addOverlay(map, {
    id: 'pois-campus',
    type: 'circle',
    source: 'pois-campus',
    paint: {
      'circle-radius': 5.5,
      'circle-color': '#9ad4c4',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#1a1420',
    },
  })
}

function addOverlay(map: mapboxgl.Map, layer: mapboxgl.LayerSpecification) {
  if (map.getLayer(layer.id)) return
  try {
    map.addLayer({ ...layer, slot: 'top' })
  } catch {
    map.addLayer(layer)
  }
}

function applyLayers(map: mapboxgl.Map, layers: string[], variant: Variant) {
  for (const id of [...CONTEXT, ...ALL]) {
    if (!map.getLayer(id)) continue
    const wanted =
      variant === 'widget' && (CONTEXT.includes(id) || layers.includes(id))
    map.setLayoutProperty(id, 'visibility', wanted ? 'visible' : 'none')
  }
}
