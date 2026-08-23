export type Mood = 'very_low' | 'low' | 'neutral' | 'good' | 'great';

export type CheckIn = {
  id: string;
  at: string;
  mood: Mood;
  energy: number;
  stress: number;
  note?: string;
  tags: string[];
};

export type Insight = {
  id: string;
  title: string;
  explanation: string;
  confidence: 'early' | 'medium' | 'strong';
  evidenceCount: number;
};
