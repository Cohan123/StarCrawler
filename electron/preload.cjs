// Preload - aktuell keine Bridge nötig, aber Platz für zukünftige APIs
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('starCrawler', {
  version: '0.2.0',
  platform: process.platform,
});
