import React from 'react';
import { TabGroup as TremorTabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';

export interface TabItem {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabGroupProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
}

/**
 * TabGroup - Tabbed interface wrapper
 *
 * Wraps Tremor Tabs with consistent styling
 */
export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultIndex = 0,
  onTabChange,
  className = '',
}) => {
  return (
    <TremorTabGroup
      defaultIndex={defaultIndex}
      onIndexChange={onTabChange}
      className={className}
    >
      <TabList variant="solid" className="mb-6">
        {tabs.map((tab, idx) => (
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tab key={idx} icon={tab.icon as any}>
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-teal rounded-full">
                  {tab.badge}
                </span>
              )}
            </div>
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab, idx) => (
          <TabPanel key={idx}>
            {tab.content}
          </TabPanel>
        ))}
      </TabPanels>
    </TremorTabGroup>
  );
};

export default TabGroup;
