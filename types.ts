export enum Sender {
  User = 'user',
  Bot = 'bot'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface QuickAction {
  label: string;
  query: string;
}
