import { Stock, Achievement } from './types';

export const DEFAULT_INITIAL_INVESTMENT = 10000;
export const WINNING_GOAL = 15000;

export const AVAILABLE_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Entertainment' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment' }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_trade',
    name: 'First Steps',
    description: 'Make your first trade',
    icon: '🎯'
  },
  {
    id: 'profit_master',
    name: 'Profit Master',
    description: 'Achieve 10% profit on a single trade',
    icon: '💰'
  },
  {
    id: 'diverse_portfolio',
    name: 'Diversification Expert',
    description: 'Own 5 different stocks',
    icon: '🌈'
  },
  {
    id: 'big_winner',
    name: 'Big Winner',
    description: 'Reach $15,000 portfolio value',
    icon: '🏆'
  }
];
