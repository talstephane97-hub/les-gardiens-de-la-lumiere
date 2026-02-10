
import { Quest, ValidationType } from './types';

export const QUESTS: Quest[] = [
  {
    id: 0,
    title: "L'Appel",
    location: "QG des Gardiens",
    description: "Paris. La ville du fer… et du feu. On dit qu’au cœur de ses pavés sommeille une lumière ancienne. Réveille-toi, Gardien.",
    validationType: ValidationType.NONE,
    successMessage: "La quête commence.",
    coordinates: { lat: 48.8566, lng: 2.3522 }
  },
  {
    id: 1,
    title: "L'Éveil",
    location: "19 Rue Voltaire",
    description: "La mission commence là où Voltaire est né. Trouve la preuve que 'la nature reprend toujours ses droits'. Prends en photo une plante qui pousse dans un mur ou de la pierre.",
    validationType: ValidationType.IMAGE_AI,
    aiValidationPrompt: "Vérifie si une plante pousse directement d'une structure urbaine (mur, pavés). Si oui, félicite le joueur. Sinon, explique ce que tu vois (ex: plante en pot, arbre normal) et pourquoi ça ne valide pas.",
    successMessage: "Analyse visuelle confirmée. La nature survit.",
    coordinates: { lat: 48.8529, lng: 2.3789 }
  },
  {
    id: 2,
    title: "La Clé de l'Eau",
    location: "Pont-Neuf",
    description: "Parmi les 384 mascarons du pont, un seul ne pleure ni ne rit : il souffle. Trouve ce visage de pierre et capture son souffle éternel en photo.",
    validationType: ValidationType.IMAGE_AI,
    aiValidationPrompt: "Identifie le Pont-Neuf ou l'un de ses mascarons (visages de pierre). Si l'image est floue ou montre un autre pont, explique-le au joueur avec bienveillance.",
    rewardKey: "KEY_WATER",
    rewardName: "Clé de l'Eau",
    successMessage: "L'eau murmure ton nom.",
    coordinates: { lat: 48.8570, lng: 2.3413 }
  },
  {
    id: 3,
    title: "La Clé du Temps",
    location: "Panthéon",
    description: "Ici reposent les grands Hommes. Marie Curie y détient le secret du temps. Prends en photo la façade majestueuse du Panthéon ou un hommage à Marie Curie à proximité.",
    validationType: ValidationType.IMAGE_AI,
    aiValidationPrompt: "Vérifie si l'image montre le Panthéon de Paris. Si tu vois un autre monument ou juste une rue, indique précisément ce que tu reconnais pour aider le joueur.",
    rewardKey: "KEY_TIME",
    rewardName: "Clé du Temps",
    successMessage: "Le temps se plie à ta volonté.",
    coordinates: { lat: 48.8462, lng: 2.3464 }
  },
  {
    id: 4,
    title: "La Clé de l'Air",
    location: "Champ de Mars",
    description: "Au pied de la Dame de Fer, un monument célèbre la Paix. Capture le Mur pour la Paix ou la structure de la Tour Eiffel pour libérer le souffle de l'air.",
    validationType: ValidationType.IMAGE_AI,
    aiValidationPrompt: "Vérifie la présence de la Tour Eiffel ou du Mur pour la Paix. Si l'angle est mauvais ou le monument trop loin, donne un conseil pour une meilleure photo.",
    rewardKey: "KEY_AIR",
    rewardName: "Clé de l'Air",
    successMessage: "Tu marches désormais sur les nuages.",
    coordinates: { lat: 48.8556, lng: 2.2986 }
  },
  {
    id: 5,
    title: "La Clé de Feu",
    location: "Place Vendôme",
    description: "La colonne Vendôme, forgée dans le bronze des canons, brûle d'un feu guerrier. Prends en photo cette colonne triomphale pour obtenir la dernière clé.",
    validationType: ValidationType.IMAGE_AI,
    aiValidationPrompt: "Reconnais la Colonne Vendôme. Si le joueur a pris une autre colonne (ex: Bastille), explique la différence pour le guider.",
    rewardKey: "KEY_FIRE",
    rewardName: "Clé de Feu",
    successMessage: "La flamme sacrée est tienne.",
    coordinates: { lat: 48.8675, lng: 2.3294 }
  },
  {
    id: 6,
    title: "L'Union",
    location: "Arc de Triomphe",
    description: "Apporte les 4 clés au cœur de l'étoile. Rends-toi à l'Arc de Triomphe pour l'ultime éveil.",
    validationType: ValidationType.CHECK_INVENTORY,
    expectedAnswer: "4_KEYS",
    successMessage: "Paris brille à nouveau. Tu es devenu un véritable Gardien de la Lumière.",
    coordinates: { lat: 48.8738, lng: 2.2950 }
  }
];

export const KEY_DESCRIPTIONS: Record<string, { icon: 'water' | 'fire' | 'air' | 'time', description: string }> = {
  "KEY_WATER": { icon: 'water', description: "Purifie l'esprit." },
  "KEY_TIME": { icon: 'time', description: "Révèle le passé." },
  "KEY_AIR": { icon: 'air', description: "Ouvre les voies invisibles." },
  "KEY_FIRE": { icon: 'fire', description: "Illumine les ténèbres." }
};