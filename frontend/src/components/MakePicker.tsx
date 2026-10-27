import { useId, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Make } from '../api';
import { filterMakes } from '../lib/filterMakes';

interface Props {
  makes: Make[];
  selected: Make | null;
  onSelect: (make: Make | null) => void;
  disabled?: boolean;
}

/** Searchable combobox. A native <select> with thousands of options is unusable, so we filter as you type. */
export function MakePicker({ makes, selected, onSelect, disabled }: Props) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => filterMakes(makes, query), [makes, query]);

  function choose(make: Make) {
    onSelect(make);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        setActive((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (open && results[active]) {
          event.preventDefault();
          choose(results[active]);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  return (
    <div className="combobox">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        id="make"
        placeholder={disabled ? 'Loading makes…' : 'Search makes, e.g. Toyota'}
        autoComplete="off"
        disabled={disabled}
        // While closed we show the chosen make; while open we show what the user is typing.
        value={open ? query : (selected?.name ?? '')}
        onFocus={() => {
          setQuery('');
          setActive(0);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />

      {open && (
        <ul id={listId} role="listbox" aria-label="Makes">
          {results.length === 0 && <li className="combobox-empty">No makes match “{query}”.</li>}
          {results.map((make, index) => (
            <li
              key={make.id}
              id={`${listId}-${make.id}`}
              role="option"
              aria-selected={make.id === selected?.id}
              className={index === active ? 'active' : undefined}
              // mousedown (not click) so it fires before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                choose(make);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {make.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
