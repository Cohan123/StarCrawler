
import { CellType } from '../types';

const ATMOSPHERE_TEXTS = [
    "Ein kalter Luftzug streift deinen Nacken.",
    "Du hörst ferne, mechanische Schritte in der Dunkelheit.",
    "Der Geruch von Ozon und verbranntem Plastik liegt in der Luft.",
    "Ein Rohr birst in der Ferne. Dampf zischt.",
    "Das Flackern der Lichter wirft unheimliche Schatten.",
    "Staub rieselt von der Decke. Etwas bewegt sich im Lüftungsschacht.",
    "Du trittst auf etwas Knackendes. Knochen?",
    "Die Stille hier ist unnatürlich laut.",
    "Ein leises Summen geht von den Wänden aus.",
    "Kondenswasser tropft rhythmisch auf den Metallboden.",
    "Du fühlst dich beobachtet.",
    "Ein alter Blutfleck am Boden. Er ist trocken.",
    "Kabel hängen wie Gedärme aus der offenen Deckenverkleidung.",
    "Der Monitor an der Wand zeigt nur noch statisches Rauschen.",
];

const HAZARD_TEXTS = [
    "Dein Geigerzähler klickt nervös.",
    "Die Luft schmeckt metallisch. Strahlung.",
    "Warnleuchten rotieren stumm an den Wänden.",
    "Der Druck in deinem Anzug fällt leicht ab.",
    "Elektrische Entladungen knistern in der Nähe.",
];

export const getFlavorText = (chance: number = 0.05, hazardType: 'none' | 'radiation' | 'vacuum' = 'none'): string | null => {
    if (Math.random() > chance) return null;

    if (hazardType !== 'none' && Math.random() < 0.4) {
         return HAZARD_TEXTS[Math.floor(Math.random() * HAZARD_TEXTS.length)];
    }

    return ATMOSPHERE_TEXTS[Math.floor(Math.random() * ATMOSPHERE_TEXTS.length)];
};
