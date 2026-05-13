import { AnyItem } from '../types';

const ITEM_ASSETS: Record<string, string> = {
  'Brecheisen': new URL('../Bilder/Gegenstände/Waffen/Nahkampf/Brechstange.png', import.meta.url).href,
  'Schock-Schlagstock': new URL('../Bilder/Gegenstände/Waffen/Nahkampf/Schock_Schlagstock.png', import.meta.url).href,
  'Trennschleifer': new URL('../Bilder/Gegenstände/Waffen/Nahkampf/Trennschleifer.png', import.meta.url).href,
  'Vibro-Klinge': new URL('../Bilder/Gegenstände/Waffen/Nahkampf/Vibroklinge.png', import.meta.url).href,
  'Nullpunkt-Klinge': new URL('../Bilder/Gegenstände/Waffen/Nahkampf/Nullpunktklinge.png', import.meta.url).href,
  'Göttermörder': new URL('../Bilder/Gegenstände/Waffen/Nahkampf/Göttermörder.png', import.meta.url).href,

  'Bolzenschießer': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/Bolzenschießer.png', import.meta.url).href,
  'Laser-Pistole': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/LaserPistole.png', import.meta.url).href,
  'Impuls-Gewehr': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/Impulsgewehr.png', import.meta.url).href,
  'Plasma-Cutter': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/Plasmacutter.png', import.meta.url).href,
  'Schwerer Bolter': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/Bolter.png', import.meta.url).href,
  'Tesla-Werfer': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/Testla_werfer.png', import.meta.url).href,
  'Antimaterie-Gewehr': new URL('../Bilder/Gegenstände/Waffen/Fernkampf/Antimaterie_Gewehr.png', import.meta.url).href,

  'Overall': new URL('../Bilder/Gegenstände/Rüstung/Overall.png', import.meta.url).href,
  'Arbeitskleidung': new URL('../Bilder/Gegenstände/Rüstung/Arbeitskleidung.png', import.meta.url).href,
  'Verstärkte Weste': new URL('../Bilder/Gegenstände/Rüstung/VerstärkteWeste.png', import.meta.url).href,
  'Gewebepanzer': new URL('../Bilder/Gegenstände/Rüstung/Gewebepanzer.png', import.meta.url).href,
  'Kampfanzug MK-I': new URL('../Bilder/Gegenstände/Rüstung/Kampfanzug.png', import.meta.url).href,
  'Nano-Gewebe': new URL('../Bilder/Gegenstände/Rüstung/Nanogewebe.png', import.meta.url).href,
  'Kampf-Exoskelett': new URL('../Bilder/Gegenstände/Rüstung/Exoskelett.png', import.meta.url).href,
  'Kraftfeld-Generator': new URL('../Bilder/Gegenstände/Rüstung/Schildgenerator.png', import.meta.url).href,
  'Singularitäts-Platte': new URL('../Bilder/Gegenstände/Rüstung/Singularitätsplatten.png', import.meta.url).href,

  'Kleines Medikit': new URL('../Bilder/Gegenstände/Loot/ChatGPT Image 13. Mai 2026, 13_28_31.png', import.meta.url).href,
  'Großes Medikit': new URL('../Bilder/Gegenstände/Loot/ChatGPT Image 13. Mai 2026, 13_28_26.png', import.meta.url).href,
  'Adrenalin-Stim': new URL('../Bilder/Gegenstände/Loot/Adrenalin_Stim.png', import.meta.url).href,
  'Kampf-Stim': new URL('../Bilder/Gegenstände/Loot/Kampf_stim.png', import.meta.url).href,
  'Notfall-Stim': new URL('../Bilder/Gegenstände/Loot/Notfall-Stim.png', import.meta.url).href,
  'EMP-Granate': new URL('../Bilder/Gegenstände/Loot/EMP_Granate.png', import.meta.url).href,
  'Leucht-Fackel': new URL('../Bilder/Gegenstände/Loot/Leuchtstab.png', import.meta.url).href,
  'Munitions-Pack': new URL('../Bilder/Gegenstände/Loot/Munition_klein.png', import.meta.url).href,
  'Große Munitionskiste': new URL('../Bilder/Gegenstände/Loot/Munition_groß.png', import.meta.url).href,
  'Aufklärungsdrohne': new URL('../Bilder/Gegenstände/Loot/Drohne.png', import.meta.url).href,
  'Selbstschussanlage': new URL('../Bilder/Gegenstände/Loot/Selbstschussanlage.png', import.meta.url).href,
  'Schildgenerator': new URL('../Bilder/Gegenstände/Loot/Schildgenerator.png', import.meta.url).href,
  'Splittergranate': new URL('../Bilder/Gegenstände/Loot/Splittergranate.png', import.meta.url).href,
  'Tragbares Fass': new URL('../Bilder/Gegenstände/Loot/Fass.png', import.meta.url).href,
  'Scanner': new URL('../Bilder/Gegenstände/Loot/Scanner.png', import.meta.url).href,
};

export const getItemAsset = (item: AnyItem | null | undefined) => {
  if (!item) return undefined;
  return ITEM_ASSETS[item.name];
};
