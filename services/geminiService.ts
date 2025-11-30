import { GoogleGenAI, Type } from "@google/genai";

export interface GeneratedLog {
  title: string;
  content: string;
}

const logSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Ein kurzer, kryptischer Titel für den Logbucheintrag auf Deutsch.",
    },
    content: {
      type: Type.STRING,
      description: "Der vollständige Text des Logbucheintrags auf Deutsch. Er sollte fragmentiert, beschädigt oder rätselhaft sein und auf ein größeres Mysterium hindeuten. Maximal 150 Wörter.",
    },
  },
  required: ["title", "content"],
};

export const generateLogEntry = async (): Promise<GeneratedLog | null> => {
  try {
    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable not set.");
      return {
        title: "STATISCHER FALLBACK: Übertragungsfehler",
        content: "Das Terminal flackert, aber der Datenstrom ist beschädigt. Nur Fragmente bleiben: '...es sind keine Sterne... die Stille ist nicht leer... hör nicht hin...'"
      };
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Du bist ein Lore-Meister für ein dunkles, kosmisches Horror-Sci-Fi-Universum. Generiere einen einzelnen, kurzen Logbucheintrag, der auf einer verlassenen, alten Raumstation gefunden wurde. Der Logeintrag sollte fragmentiert, beschädigt oder kryptisch sein und auf ein größeres, schreckliches Geheimnis hindeuten. Der Ton ist Survival-Horror. Gib dem Logeintrag einen kurzen, beschreibenden Titel. Alles auf Deutsch.",
      config: {
        responseMimeType: "application/json",
        responseSchema: logSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const logData = JSON.parse(jsonText) as GeneratedLog;
    
    return logData;
  } catch (error) {
    console.error("Error generating log entry:", error);
    // Return a fallback entry if the API call fails
    return {
      title: "STATISCHER FALLBACK: Speicherkern beschädigt",
      content: "Physisches Trauma an der Speichereinheit hat zu katastrophalem Datenverlust geführt. Wiederhergestellte Schlüsselwörter: ...LEERE...HUNGER...SIGNAL...UNGESCHRIEBEN... Es wird empfohlen, diesen Sektor zu meiden."
    };
  }
};