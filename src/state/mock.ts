import { Insight } from '../types/domain';

export const insights: Insight[] = [
  {
    id: 'sleep-energy',
    title: 'Ton énergie semble liée à ton sommeil',
    explanation: 'Sur tes derniers check-ins, les journées après une courte nuit sont plus souvent notées comme difficiles.',
    confidence: 'early',
    evidenceCount: 4
  },
  {
    id: 'sunday',
    title: 'Le dimanche soir revient souvent',
    explanation: 'Tu as signalé davantage de tension à ce moment-là. On attend plus de données avant de conclure.',
    confidence: 'early',
    evidenceCount: 3
  }
];
