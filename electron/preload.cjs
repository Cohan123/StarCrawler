// Preload - aktuell keine Bridge nötig, aber Platz für zukünftige APIs
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('starCrawler', {
  version: '0.4.1',
  platform: process.platform,
});
