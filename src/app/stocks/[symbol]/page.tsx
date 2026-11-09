import { notFound } from 'next/navigation';
import { normaliseSymbol } from '@/lib/market/universe';
import { StockView } from './StockView';

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  return { title: (await params).symbol.toUpperCase() };
}

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const symbol = normaliseSymbol((await params).symbol);
  if (!symbol) notFound();
  return <StockView symbol={symbol} />;
}
