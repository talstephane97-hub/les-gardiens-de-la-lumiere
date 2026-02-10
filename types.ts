
export enum ValidationType {
  NONE = 'NONE',
  IMAGE_AI = 'IMAGE_AI',
  TEXT = 'TEXT',
  CHOICE = 'CHOICE',
  KEYPAD = 'KEYPAD',
  CHECK_INVENTORY = 'CHECK_INVENTORY'
}

export interface Quest {
  id: number;
  title: string;
  location: string;
  description: string;
  validationType: ValidationType;
  expectedAnswer?: string | string[];
  aiValidationPrompt?: string;
  rewardKey?: string;
  rewardName?: string;
  choices?: string[];
  coordinates?: { lat: number; lng: number };
  successMessage?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  iconType: 'water' | 'fire' | 'air' | 'time';
  description: string;
  acquiredAt: number;
}

export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  name: string;
  password?: string;
  role: UserRole;
  gameState: GameState;
}

export interface GameState {
  completedQuestIds: number[];
  pendingReviewQuestIds: number[];
  lastImages: Record<number, string>;
  inventory: InventoryItem[];
  isCompleted: boolean;
  hasStarted: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
}
