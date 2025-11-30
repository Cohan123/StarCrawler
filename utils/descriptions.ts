
import { CellType, Enemy, EnemyType, GroundItem } from '../types';

const adjectives = [
    "Kalt", "Staubig", "Blutverschmiert", "Rostig", "Dunkel", "Metallisch", "Verfallen", "Summend", "Korridiert", "Steril"
];

const getAdjective = (x: number, y: number) => {
    // Deterministic pseudo-random based on coordinates
    const index = (x * 3 + y * 7) % adjectives.length;
    return adjectives[index];
};

export const getTileDescription = (
    x: number, 
    y: number, 
    cell: CellType, 
    isVisible: boolean, 
    isRevealed: boolean,
    enemy?: Enemy,
    item?: GroundItem
): string | null => {
    
    if (!isVisible && !isRevealed) return "Unbekannter Bereich";
    if (!isVisible && isRevealed) return "Erinnerung: Bereich außer Sicht";

    // High priority: Entities
    if (isVisible && enemy) {
        let name = "Unbekannte Entität";
        switch(enemy.type) {
            case EnemyType.NEUTRAL_ROBOT: name = "Wartungs-Einheit (Neutral)"; break;
            case EnemyType.HOSTILE_ROBOT: name = "Kampf-Roboter (Feindlich)"; break;
            case EnemyType.LARGE_DRONE: name = "Schwere Sicherheitsdrohne"; break;
            case EnemyType.SMALL_DRONE: name = "Aufklärungsdrohne"; break;
            case EnemyType.ANDROID: name = "Beschädigter Android"; break;
            case EnemyType.MERCHANT: name = "Handels-Einheit VK-55"; break;
            case EnemyType.BOSS_MELEE: name = `BOSS: ${enemy.name}`; break;
            case EnemyType.BOSS_RANGED: name = `BOSS: ${enemy.name}`; break;
            case EnemyType.ELITE_GUARD: name = "Elite Wacheinheit"; break;
        }
        return `${name} [HP: ${enemy.health}/${enemy.maxHealth}]`;
    }

    if (isVisible && item) {
        if ('attack' in item.item) {
            return `Waffe: ${item.item.name} (ATK: ${item.item.attack})`;
        } else if ('defense' in item.item) {
            return `Rüstung: ${item.item.name} (DEF: ${item.item.defense})`;
        } else {
            return `Gegenstand: ${item.item.name}`;
        }
    }

    // Map Features
    const adj = getAdjective(x, y);

    switch(cell) {
        case CellType.WALL: return `${adj}e Stationswand`;
        case CellType.FLOOR: return `${adj}er Bodenbelag`;
        case CellType.DOOR_CLOSED: return "Geschlossene Druckschleuse";
        case CellType.DOOR_OPEN: return "Offene Druckschleuse";
        case CellType.TERMINAL_OFF: return "Inaktives Daten-Terminal";
        case CellType.TERMINAL_ON: return "Aktives Daten-Terminal";
        case CellType.ENTRANCE: return "Zugang zum oberen Sektor";
        case CellType.EXIT: return "Notluke zum tieferen Sektor";
        case CellType.LIGHT_SOURCE: return "Notbeleuchtung";
        case CellType.CHEST_CLOSED: return "Verschlossener Versorgungsbehälter";
        case CellType.CHEST_OPEN: return "Leerer Behälter";
        case CellType.BARREL: return "Gefahrgut-Fass (Explosiv?)";
        case CellType.BARREL_OPEN: return "Zerstörtes Fass";
        case CellType.ARTIFACT: return "Mysteriöses Artefakt";
        case CellType.RADIATION: return "ACHTUNG: Hohe Strahlungswerte";
        case CellType.VACUUM: return "WARNUNG: Hüllenbruch / Vakuum";
        case CellType.ELECTRICITY: return "GEFAHR: Offene Leitungen";
        case CellType.HEALING_TERMINAL: return "Medizinische Station";
        case CellType.HEALING_TERMINAL_USED: return "Verbrauchte Med-Station";
        case CellType.SHUTTLE: return "RETTUNGS-SHUTTLE [ZIEL]";
        default: return "Struktur";
    }
};
