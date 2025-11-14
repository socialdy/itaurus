"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils" // Assuming you have a cn utility function
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command" // Assuming Command is available
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover" // Assuming Popover is available

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[]; // Allow string for single, string[] for multiple
  onChange: (value: string | string[]) => void; // Adjust onChange for multiple
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean; // Added disabled prop
  multiple?: boolean; // New prop for multiple selection
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyStateMessage = "No option found.",
  className,
  triggerClassName,
  disabled,
  multiple = false, // Default to single selection
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedValues = Array.isArray(value) ? value : [];

  const displayValue = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      const labels = selectedValues.map(val => options.find(option => option.value === val)?.label || val);
      return labels.join(", ");
    } else {
      const singleValue = typeof value === 'string' ? value : undefined;
      const selectedOption = options.find((option) => option.value === singleValue);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className={triggerClassName}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
          disabled={disabled}
        >
          {displayValue()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", className)}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 scrollbar-thumb-rounded scrollbar-thin">
            <CommandEmpty>{emptyStateMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // CommandItem filters based on its children or a `value` prop
                  onSelect={() => {
                    if (multiple) {
                      const newSelectedValues = selectedValues.includes(option.value)
                        ? selectedValues.filter(val => val !== option.value)
                        : [...selectedValues, option.value];
                      onChange(newSelectedValues);
                    } else {
                      onChange(option.value === value ? "" : option.value);
                      setOpen(false);
                    }
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 