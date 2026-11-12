// Карта клуба — как в приложении Loot Arena 2.0 (карта клубов, полоса «Клубы»): MapLibre + векторные тайлы
// OpenFreeMap, стиль «Loot Arena City», клуб — его логотип в плитке «Плитки» с зелёной каймой.
// Модуль грузится ДИНАМИЧЕСКИ, только когда блок «Карта» дошёл до экрана: maplibre-gl тяжёлый
// (~250 КБ gzip) и стартовому бандлу формы не нужен.
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TILES = 'https://tiles.openfreemap.org';

/**
 * Стиль карты — тот же «Loot Arena City», что у карты клубов в приложении 2.0 (lootarena-app/utils/arenaMapStyle.ts):
 * карта в приложении всегда тёмная (картинка — на тёмном), поэтому и здесь одна тёмная схема для всех тем страницы.
 * Цвета — значения стиля приложения 1:1: это данные карты для движка MapLibre, а не цвета интерфейса.
 */
const arenaMapStyle: StyleSpecification = {
    version: 8,
    name: 'Loot Arena City',
    glyphs: `${TILES}/fonts/{fontstack}/{range}.pbf`,
    sources: {
        openmaptiles: {
            type: 'vector',
            url: `${TILES}/planet`,
            attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        },
    },
    layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#050706' } },
        { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: { 'fill-color': '#071416' } },
        { id: 'landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover', paint: { 'fill-color': '#09150e', 'fill-opacity': 0.8 } },
        { id: 'park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park', paint: { 'fill-color': '#0b2115', 'fill-opacity': 0.72 } },
        {
            id: 'building', type: 'fill', source: 'openmaptiles', 'source-layer': 'building', minzoom: 12,
            paint: { 'fill-color': '#202522', 'fill-opacity': 0.82, 'fill-outline-color': '#303832' },
        },
        {
            id: 'road-shadow', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: { 'line-color': '#030504', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.6, 12, 5, 16, 11], 'line-opacity': 0.88 },
        },
        {
            id: 'road-main', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
                'line-color': ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], '#52615a', ['secondary', 'tertiary'], '#38433e', '#252b28'],
                'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.7, 12, 2.3, 16, 5.5],
                'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.44, 13, 0.78],
            },
        },
        {
            id: 'road-label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', minzoom: 11,
            layout: {
                'symbol-placement': 'line',
                'text-field': ['coalesce', ['get', 'name:ru'], ['get', 'name'], ['get', 'ref']],
                'text-font': ['Noto Sans Bold'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 15, 12],
                'text-padding': 2,
            },
            paint: { 'text-color': '#98a39d', 'text-halo-color': '#050706', 'text-halo-width': 1.5, 'text-opacity': 0.82 },
        },
    ],
};

export interface ClubMapHandle { destroy: () => void }

/** Рисует карту в контейнере. Ошибка WebGL/тайлов — исключение: блок покажет адрес без карты. */
export function mountClubMap(el: HTMLElement, opts: {
    lat: number; lng: number; logoUrl?: string; clubName: string; onError: () => void;
}): ClubMapHandle {
    const map = new maplibregl.Map({
        container: el,
        style: arenaMapStyle,
        center: [opts.lng, opts.lat],
        zoom: 14.2,
        attributionControl: { compact: true },
        // Палец на телефоне листает страницу, а не карту: двигать карту — двумя пальцами.
        cooperativeGestures: true,
        maxZoom: 18,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');

    // Значок клуба — как на карте приложения (cityMap.ts → markerEl): логотип в плитке −5° с зелёной каймой
    // («подписан»), логотипа нет или не загрузился — первая буква; под плиткой — название клуба.
    const marker = document.createElement('span');
    marker.className = 'lf-pin';
    marker.setAttribute('role', 'img');
    marker.setAttribute('aria-label', opts.clubName);
    const tile = document.createElement('span');
    tile.className = 'lf-pin-tile';
    const inner = document.createElement('span');
    inner.className = 'lf-pin-in';
    const letter = document.createElement('b');
    letter.textContent = opts.clubName.slice(0, 1).toUpperCase();
    inner.append(letter);
    if (opts.logoUrl) {
        const img = document.createElement('img');
        img.src = opts.logoUrl;
        img.alt = '';
        img.onload = () => letter.remove();
        img.onerror = () => img.remove();
        inner.append(img);
    }
    tile.append(inner);
    const name = document.createElement('span');
    name.className = 'lf-pin-name';
    name.textContent = opts.clubName;
    marker.append(tile, name);
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
