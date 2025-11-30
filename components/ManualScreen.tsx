
import React from 'react';

interface ManualScreenProps {
  onBack: () => void;
}

const ManualSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-xl text-green-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">{title}</h3>
        <div className="text-gray-300 space-y-3 leading-relaxed">
            {children}
        </div>
    </div>
);

const ManualScreen: React.FC<ManualScreenProps> = ({ onBack }) => {
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-4">
      <div className="w-full h-full max-w-5xl border-4 border-gray-700 bg-gray-900 p-6 flex flex-col">
        <div className="flex justify-between items-center border-b-2 border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl text-yellow-500 tracking-widest font-black">SPIELANLEITUNG</h2>
          <button onClick={onBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">Zurück zum Hauptmenü</button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
            
            <ManualSection title="1. Ziel der Mission">
                <p>
                    Du bist auf einer verlassenen Raumstation gestrandet. Dein Ziel ist es, <span className="text-green-400 font-bold">Sektor 15</span> zu erreichen, wo ein Rettungsshuttle auf dich wartet.
                </p>
                <p>
                    Der Weg führt nach unten. Finde in jedem Level den <span className="text-red-500 font-bold">Ausgang (X)</span>. Erkunde die Station, sammle Ausrüstung und überlebe die Gefahren.
                </p>
            </ManualSection>

            <ManualSection title="2. Die Klassen">
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <span className="text-yellow-400 font-bold">MARINE:</span> Der Kämpfer. Startet mit mehr Lebenspunkten (HP) und einem Brecheisen. Erhält einen Schadensbonus im Nahkampf. Ideal für Einsteiger.
                    </li>
                    <li>
                        <span className="text-yellow-400 font-bold">TECHNIKER:</span> Der Spezialist. Startet mit einer Laser-Pistole und einer EMP-Granate. Hat eine hohe Chance (45%), beim Hacken von Terminals die Karte aufzudecken.
                    </li>
                    <li>
                        <span className="text-yellow-400 font-bold">SCOUT:</span> Der Erkunder. Startet mit einem aufgedeckten ersten Level und erhöhter Sichtweite. Bewegt sich schnell und sieht Gefahren früher.
                    </li>
                </ul>
            </ManualSection>

            <ManualSection title="3. Überleben & Ressourcen">
                <p>
                    <span className="text-green-400 font-bold">Lebenspunkte (HP):</span> Sinken bei Schaden. Heile dich mit Medikits oder an Med-Stationen (†). Wenn sie 0 erreichen, ist das Spiel vorbei.
                </p>
                <p>
                    <span className="text-yellow-400 font-bold">Munition:</span> Fernkampfwaffen benötigen Munition. Wenn diese leer ist, nutzen sie einen schwachen Not-Nahkampfmodus.
                </p>
                <p>
                    <span className="text-blue-400 font-bold">Sauerstoff (O2):</span> In Vakuum-Bereichen sinkt dein Sauerstoffvorrat. Erholt sich in sicheren Zonen.
                </p>
                <p>
                    <span className="text-green-600 font-bold">Strahlung:</span> Grüne Bereiche sind verstrahlt. Verweile nicht zu lange, sonst nimmst du Schaden.
                </p>
            </ManualSection>

            <ManualSection title="4. Kampf & Ausrüstung">
                <p>
                    Bewege dich in einen Gegner, um ihn im Nahkampf anzugreifen. Drücke <span className="font-bold border border-gray-600 px-1 text-xs">F</span>, um den nächsten Gegner mit einer Fernkampfwaffe zu beschießen.
                </p>
                <p>
                    Öffne dein Inventar mit <span className="font-bold border border-gray-600 px-1 text-xs">M</span>. Dort kannst du Waffen und Rüstungen ausrüsten. Bessere Ausrüstung ist essenziell für tiefere Sektoren.
                </p>
                <p>
                    Nutze die Umgebung! Fässer können explodieren und Gegnergruppen ausschalten. Türen bieten Schutz vor Sichtlinien.
                </p>
            </ManualSection>

             <ManualSection title="5. Fortschritt">
                <p>
                    Besiegte Gegner geben Erfahrungspunkte (XP). Bei einem Level-Up kannst du deine maximalen HP heilen und erhöhen, oder deine Angriffs-/Verteidigungswerte permanent steigern.
                </p>
                <p>
                    Sammle Credits, um beim Händler (taucht alle 3 Level auf) neue Ausrüstung oder Kartendaten zu kaufen.
                </p>
            </ManualSection>

        </div>
      </div>
    </div>
  );
};

export default ManualScreen;
