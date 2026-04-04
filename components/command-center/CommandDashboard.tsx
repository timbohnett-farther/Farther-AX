'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, Line } from 'recharts';
import { useTheme } from '@/lib/theme-provider';
import { Deal } from './types';
import { fetcher, formatAUM, formatDate, daysUntil, getNameColor } from './utils';
import { SummaryCard } from './SummaryCard';
import { StageBadge } from './StageBadge';
import { SectionHeader } from './SectionHeader';
import { HorizontalBar } from './HorizontalBar';
import { DrillDownPanel } from './DrillDownPanel';
import {
  STAGE_LABELS,
  ACTIVE_STAGE_IDS,
  FUNNEL_STAGE_ORDER,
  getStageColors,
  SWR_OPTS,
} from './constants';

interface CommandDashboardProps {
  deals: Deal[];
}

export function CommandDashboard({ deals }: CommandDashboardProps) {
  const { THEME } = useTheme();
  const STAGE_COLORS = useMemo(() => getStageColors(THEME.colors.teal, THEME.colors.bronze400), [THEME.colors.teal, THEME.colors.bronze400]);
  const { data: aumData } = useSWR('/api/command-center/aum-tracker', fetcher, SWR_OPTS);
  const { data: sentimentData } = useSWR('/api/command-center/sentiment/scores', fetcher, SWR_OPTS);
  const { data: complexityData } = useSWR('/api/command-center/complexity/scores', fetcher, SWR_OPTS);
  const { data: tranAumData } = useSWR('/api/command-center/transitions/tran-aum', fetcher, SWR_OPTS);
  const [drillDown, setDrillDown] = useState<{ title: string; deals: Deal[] } | null>(null);

  // Rest of the CommandDashboard implementation would go here
  // For now, placeholder to keep build working
  return <div>Command Dashboard - To be implemented</div>;
}
