// Карта клуба — тот же стиль «Loot Arena Dark», что на странице для игроков lootarena.ru/gamers
// (lootarena-landing/components/gamers/GamersMap.tsx): MapLibre + векторные тайлы OpenFreeMap.
// Модуль грузится ДИНАМИЧЕСКИ, только когда блок «Карта» дошёл до экрана: maplibre-gl тяжёлый
// (~250 КБ gzip) и стартовому бандлу формы не нужен.
import maplibregl, { type FilterSpecification, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TILES = 'https://tiles.openfreemap.org';

interface Palette {
    bg: string; water: string; land: string; park: string; building: string;
    road1: string; road2: string; road3: string; roadShadow: string; label: string; halo: string; accentLine: number;
}

const DARK: Palette = {
    bg: '#050607', water: '#061215', land: '#08160e', park: '#0a2818', building: '#22262a',
    road1: '#52615a', road2: '#3b4543', road3: '#252b30', roadShadow: '#050607', label: '#9ba7a1', halo: '#050607', accentLine: 0.34,
};
const LIGHT: Palette = {
    bg: '#eef2ec', water: '#cfe0e6', land: '#e3ecdf', park: '#d3e8cf', building: '#e4e8e1',
    road1: '#ffffff', road2: '#ffffff', road3: '#f7f9f6', roadShadow: '#eef2ec', label: '#525851', halo: '#eef2ec', accentLine: 0,
};

const roads: FilterSpecification = ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['in', ['get', 'class'], ['literal', ['path', 'service', 'track']]]]];

const styleFor = (light: boolean): StyleSpecification => {
    const c = light ? LIGHT : DARK;
    return {
        version: 8,
        glyphs: `${TILES}/fonts/{fontstack}/{range}.pbf`,
        sources: { o: { type: 'vector', url: `${TILES}/planet` } },
        layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': c.bg } },
            { id: 'water', type: 'fill', source: 'o', 'source-layer': 'water', paint: { 'fill-color': c.water } },
            { id: 'landcover', type: 'fill', source: 'o', 'source-layer': 'landcover', paint: { 'fill-color': c.land, 'fill-opacity': 0.78 } },
            { id: 'park', type: 'fill', source: 'o', 'source-layer': 'park', paint: { 'fill-color': c.park, 'fill-opacity': 0.62 } },
            {
                id: 'building', type: 'fill-extrusion', source: 'o', 'source-layer': 'building', minzoom: 13,
                paint: {
                    'fill-extrusion-color': c.building,
                    'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
                    'fill-extrusion-opacity': light ? 0.75 : 0.9,
                    'fill-extrusion-vertical-gradient': true,
                },
            },
            {
                id: 'road-shadow', type: 'line', source: 'o', 'source-layer': 'transportation', filter: roads,
                paint: { 'line-color': c.roadShadow, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 5.2, 16, 12], 'line-opacity': 0.9 },
            },
            {
                id: 'road', type: 'line', source: 'o', 'source-layer': 'transportation', filter: roads,
                paint: {
                    'line-color': ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], c.road1, ['secondary', 'tertiary'], c.road2, c.road3],
                    'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2.3, 16, 6],
                    'line-opacity': 0.9,
                },
            },
            {
                id: 'road-accent', type: 'line', source: 'o', 'source-layer': 'transportation',
                filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
                paint: { 'line-color': '#30D158', 'line-width': 1.7, 'line-opacity': c.accentLine, 'line-blur': 0.8 },
            },
            {
                id: 'road-label', type: 'symbol', source: 'o', 'source-layer': 'transportation_name', minzoom: 11,
                layout: {
                    'symbol-placement': 'line',
                    'text-field': ['coalesce', ['get', 'name:ru'], ['get', 'name']],
                    'text-font': ['Noto Sans Bold'],
                    'text-size': 12,
                },
                paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.6 },
            },
        ],
    };
};

export interface ClubMapHandle { destroy: () => void }

/** Рисует карту в контейнере. Ошибка WebGL/тайлов — исключение: блок покажет адрес без карты. */
export function mountClubMap(el: HTMLElement, opts: {
    lat: number; lng: number; light: boolean; logoUrl?: string; clubName: string; onError: () => void;
}): ClubMapHandle {
    const map = new maplibregl.Map({
        container: el,
        style: styleFor(opts.light),
        center: [opts.lng, opts.lat],
        zoom: 14.6,
        pitch: 40,
        bearing: -18,
        attributionControl: { compact: true },
        // Палец на телефоне листает страницу, а не карту: двигать карту — двумя пальцами.
        cooperativeGestures: true,
        maxZoom: 18,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');

    const marker = document.createElement('div');
    marker.className = 'lf-map-marker';
    marker.setAttribute('role', 'img');
    marker.setAttribute('aria-label', opts.clubName);
    if (opts.logoUrl) {
        const img = document.createElement('img');
        img.src = opts.logoUrl;
        img.alt = '';
        marker.appendChild(img);
    }
    new maplibregl.Marker({ element: marker }).setLngLat([opts.lng, opts.lat]).addTo(map);

    // Компактная подпись источника карты на узком экране открывается раскрытой и закрывает пол-карты —
    // сворачиваем до значка «i» (подпись остаётся по нажатию, как требует лицензия OpenStreetMap).
    map.once('load', () => {
        el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
    });

    let failed = false;
    map.on('error', (e) => {
        // Единичный тайл может не прийти — это не повод прятать карту. Прячем, если не пришёл сам стиль.
        if (!failed && !map.isStyleLoaded() && String((e as { error?: { message?: string } })?.error?.message || '').length) {
            failed = true;
            opts.onError();
        }
    });
    return { destroy: () => map.remove() };
}
