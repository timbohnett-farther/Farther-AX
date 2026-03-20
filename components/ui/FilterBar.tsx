import React from 'react';
import { TextInput, Select, SelectItem, MultiSelect, MultiSelectItem } from '@tremor/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    multi?: boolean;
  }>;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * FilterBar - Search and filter controls
 *
 * Provides consistent filtering UI across all pages
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
        {onSearchChange && (
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={onSearchChange}
            className="w-full sm:w-64"
          />
        )}
        {filters.map((filter, idx) => {
          if (filter.multi) {
            return (
              <MultiSelect
                key={idx}
                placeholder={filter.label}
                value={filter.value ? filter.value.split(',') : []}
                onValueChange={(values) => filter.onChange(values.join(','))}
                className="w-full sm:w-48"
              >
                {filter.options.map((option) => (
                  <MultiSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
            );
          }
          return (
            <Select
              key={idx}
              placeholder={filter.label}
              value={filter.value}
              onValueChange={filter.onChange}
              className="w-full sm:w-48"
            >
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          );
        })}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
};

export default FilterBar;
