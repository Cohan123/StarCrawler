

import { Weapon, Armor, Consumable, AnyItem } from '../types';

export const WEAPONS: Weapon[] = [
    // Melee Weapons (Range 1, Ammo 0)
    { id: 1, name: "Brecheisen", attack: 3, cost: 40, range: 1, ammoCost: 0, description: "Ein massives Werkzeug aus Stahl. Öffnet Kisten genauso gut wie Schädel." },
    { id: 2, name: "Schock-Schlagstock", attack: 6, cost: 150, range: 1, ammoCost: 0, description: "Standard-Ausrüstung für Sicherheitskräfte. Verursacht schmerzhafte elektrische Schläge." },
    { id: 3, name: "Trennschleifer", attack: 9, cost: 250, range: 1, ammoCost: 0, description: "Ein modifiziertes Industriewerkzeug. Die rotierende Klinge schneidet durch Metall und Fleisch." },
    { id: 4, name: "Vibro-Klinge", attack: 14, cost: 450, range: 1, ammoCost: 0, description: "Eine Klinge, die mit hoher Frequenz vibriert und so molekulare Bindungen trennt." },
    { id: 9, name: "Nullpunkt-Klinge", attack: 65, cost: 5500, range: 1, ammoCost: 0, description: "Nutzt exotische Materie, um alles in ihrem Weg zu desintegrieren. Experimentell." },
    { id: 11, name: "Göttermörder", attack: 130, cost: 15000, range: 1, ammoCost: 0, description: "Eine uralte Waffe unbekannter Herkunft. Sie pulsiert mit dunkler Energie.", isUnique: true },

    // Ranged Weapons (Range > 1, Ammo > 0)
    { id: 13, name: "Bolzenschießer", attack: 2, cost: 120, range: 6, ammoCost: 1, meleeSidearmDamage: 2, description: "Feuert Metallbolzen mit hoher Geschwindigkeit. Einfach, aber zuverlässig." },
    { id: 5, name: "Laser-Pistole", attack: 8, cost: 300, range: 4, ammoCost: 1, meleeSidearmDamage: 2, description: "Eine leichte Energiewaffe. Präzise, aber mit begrenzter Durchschlagskraft." },
    { id: 6, name: "Impuls-Gewehr", attack: 12, cost: 800, range: 5, ammoCost: 1, meleeSidearmDamage: 3, description: "Militärstandard. Feuert Salven von hochenergetischen Partikeln." },
    { id: 7, name: "Plasma-Cutter", attack: 22, cost: 1400, range: 3, ammoCost: 2, meleeSidearmDamage: 5, description: "Bergbau-Werkzeug. Feuert extrem heißes Plasma auf kurze Distanz." },
    { id: 8, name: "Schwerer Bolter", attack: 30, cost: 2200, range: 6, ammoCost: 2, meleeSidearmDamage: 6, description: "Verschießt explosive Projektile. Enormer Rückstoß." },
    { id: 10, name: "Antimaterie-Gewehr", attack: 85, cost: 9000, range: 8, ammoCost: 5, meleeSidearmDamage: 10, description: "Die ultimative Fernkampfwaffe. Löscht Ziele aus der Existenz." },
    { id: 12, name: "Tesla-Werfer", attack: 40, cost: 3500, range: 4, ammoCost: 3, meleeSidearmDamage: 4, description: "Erzeugt tödliche Lichtbögen, die Panzerung ignorieren." }, 
];

export const ARMORS: Armor[] = [
    { id: 20, name: "Overall", defense: 1, cost: 20, description: "Ein einfacher Arbeitsanzug. Bietet minimalen Schutz vor Kratzern." },
    { id: 21, name: "Arbeitskleidung", defense: 3, cost: 80, description: "Verstärkte Kleidung für gefährliche Arbeitsumgebungen." },
    { id: 22, name: "Verstärkte Weste", defense: 6, cost: 200, description: "Eine ballistische Weste, die vor Projektilen schützt." },
    { id: 23, name: "Gewebepanzer", defense: 10, cost: 500, description: "Mehrschichtiges Gewebe, das Aufprallenergie absorbiert." },
    { id: 24, name: "Kampfanzug MK-I", defense: 15, cost: 1000, description: "Vollständiger Körperschutz mit integrierten Servomotoren." },
    { id: 25, name: "Nano-Gewebe", defense: 22, cost: 1800, description: "Selbstheilendes Material, das sich bei Beschuss verhärtet." },
    { id: 26, name: "Kampf-Exoskelett", defense: 30, cost: 3200, description: "Schwere Panzerung, die den Träger in eine laufende Festung verwandelt." },
    { id: 27, name: "Kraftfeld-Generator", defense: 40, cost: 5500, description: "Erzeugt ein persönliches Kraftfeld, das Schaden absorbiert." },
    { id: 28, name: "Singularitäts-Platte", defense: 55, cost: 9500, description: "Verzerrt den Raum um den Träger, um Angriffe abzulenken." },
];

export const CONSUMABLES: Consumable[] = [
    { id: 100, name: "Kleines Medikit", cost: 50, effect: 'HEAL', value: 15, description: "Ein Paket mit Bandagen und Bio-Gel. Heilt 15 HP." },
    { id: 101, name: "Großes Medikit", cost: 120, effect: 'HEAL', value: 40, description: "Fortschrittliche Nanobots zur Gewebereparatur. Heilt 40 HP." },
    { id: 102, name: "Adrenalin-Stim", cost: 100, effect: 'BUFF_ATTACK', value: 5, duration: 20, description: "Erhöht Reaktionszeit und Muskelkraft. +5 ATK für 20 Runden." },
    { id: 103, name: "Kampf-Stim", cost: 300, effect: 'BUFF_ATTACK', value: 15, duration: 15, description: "Militärisches Aufputschmittel. +15 ATK für 15 Runden." },
    { id: 104, name: "EMP-Granate", cost: 200, effect: 'STUN_AOE', value: 4, duration: 5, description: "Deaktiviert elektronische Systeme im Umkreis. Betäubt Roboter (Radius 4)." },
    { id: 105, name: "Leucht-Fackel", cost: 30, effect: 'REVEAL_MAP', value: 12, description: "Erhellt die Dunkelheit und deckt die Umgebungskarte auf." },
    { id: 200, name: "Munitions-Pack", cost: 40, effect: 'RESTORE_AMMO', value: 15, description: "Standard-Energiezellen für Fernkampfwaffen. +15 Schuss." },
    { id: 201, name: "Große Munitionskiste", cost: 100, effect: 'RESTORE_AMMO', value: 40, description: "Eine schwere Kiste voller Munition. +40 Schuss." },
    
    // New Items
    { id: 300, name: "Aufklärungsdrohne", cost: 150, effect: 'SPAWN_DRONE', value: 0, description: "Fliegt geradeaus und scannt den Bereich, bis sie auf ein Hindernis trifft." },
    { id: 301, name: "Selbstschussanlage", cost: 400, effect: 'SPAWN_TURRET', value: 5, duration: 5, description: "Stationäres Geschütz. Feuert automatisch auf nahe Feinde (5 Dmg)." },
    { id: 302, name: "Schildgenerator", cost: 350, effect: 'SPAWN_SHIELD', value: 0, duration: 4, description: "Erzeugt eine Energiebarriere, die den Durchgang für 4 Runden blockiert." },
    { id: 303, name: "Splittergranate", cost: 120, effect: 'EXPLOSIVE_GRENADE', value: 10, description: "Explodiert beim Aufprall und verursacht Flächenschaden (10 Dmg). Vorsicht!" },
];

export const ALL_ITEMS: AnyItem[] = [...WEAPONS, ...ARMORS, ...CONSUMABLES].sort((a, b) => a.cost - b.cost);

// Returns an item appropriate for the current depth
export const getLootItem = (depth: number, uniqueItemFound: boolean = false): AnyItem => {
    
    // Check for Unique Weapon (Göttermörder ID 11)
    if (depth >= 5 && !uniqueItemFound) {
        // 1% chance per loot generation to spawn the Godslayer
        if (Math.random() < 0.01) {
            const godslayer = WEAPONS.find(w => w.id === 11);
            if (godslayer) return godslayer;
        }
    }

    // 35% chance to drop a consumable/ammo
    if (Math.random() < 0.35) {
         const roll = Math.random();
         // 30% chance for ammo if it's a consumable roll
         if (roll < 0.3) return CONSUMABLES.find(c => c.name === "Munitions-Pack") || CONSUMABLES[6];
         if (roll < 0.5) return CONSUMABLES.find(c => c.name === "Kleines Medikit") || CONSUMABLES[0];
         if (roll < 0.6) return CONSUMABLES.find(c => c.name === "Leucht-Fackel") || CONSUMABLES[5];
         if (roll < 0.65) return CONSUMABLES.find(c => c.name === "Splittergranate") || CONSUMABLES[11]; // New
         if (roll < 0.75) return CONSUMABLES.find(c => c.name === "Adrenalin-Stim") || CONSUMABLES[2];
         // Rare consumables
         if (roll < 0.8) return CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)];
         // Very Rare New Consumables
         if (roll < 0.9) return CONSUMABLES.find(c => c.name === "Aufklärungsdrohne") || CONSUMABLES[8];
         if (roll < 0.95) return CONSUMABLES.find(c => c.name === "Selbstschussanlage") || CONSUMABLES[9];
         return CONSUMABLES.find(c => c.name === "Schildgenerator") || CONSUMABLES[10];
    }

    // Exclude unique items from standard pool
    const equipment = [...WEAPONS, ...ARMORS].filter(i => !i.isUnique);
    const totalItems = equipment.length;
    
    const maxIndex = Math.min(totalItems, 5 + Math.ceil(depth * 1.3));
    const minIndex = depth > 3 ? Math.min(maxIndex - 5, Math.floor((depth - 2) * 0.9)) : 0;

    const pool = equipment.slice(minIndex, maxIndex);

    if (pool.length === 0) return equipment[0]; // Fallback

    return pool[Math.floor(Math.random() * pool.length)];
}