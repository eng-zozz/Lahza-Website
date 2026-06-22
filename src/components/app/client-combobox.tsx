import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ClientOption } from "@/lib/projects";

interface ClientComboboxProps {
  /** Hidden form field name — keeps this drop-in compatible with FormData-based submit handlers. */
  name: string;
  options: ClientOption[];
  defaultValue?: string | null;
}

/** Searchable client picker. Renders a hidden input so it still works with
 * plain <form> + FormData submission, like the native <Select> it replaces. */
export function ClientCombobox({ name, options, defaultValue }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(defaultValue || "unassigned");

  const selectedLabel =
    value === "unassigned" ? "Unassigned" : options.find((o) => o.id === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel ?? "Select a client…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <CommandInput placeholder="Search clients…" className="border-0 px-0 focus:ring-0" />
          </div>
          <CommandList>
            <CommandEmpty>No client matches that search.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="unassigned"
                onSelect={() => {
                  setValue("unassigned");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "unassigned" ? "opacity-100" : "opacity-0",
                  )}
                />
                Unassigned
              </CommandItem>
              {options.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.label}
                  onSelect={() => {
                    setValue(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")}
                  />
                  {c.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
