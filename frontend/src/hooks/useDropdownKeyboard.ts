import { useState, useCallback, RefObject } from 'react';

/**
 * Hook for keyboard navigation within dropdown menus.
 * Supports arrow keys for item selection and Escape to close.
 */
export function useDropdownKeyboard(
  items: string[],
  onSelect: (item: string) => void,
  onClose: () => void,
  inputRef?: RefObject<HTMLInputElement | null>
) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < items.length) {
            e.preventDefault();
            onSelect(items[activeIndex]);
            setActiveIndex(-1);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          setActiveIndex(-1);
          inputRef?.current?.blur();
          break;
      }
    },
    [items, activeIndex, onSelect, onClose, inputRef]
  );

  const resetIndex = useCallback(() => setActiveIndex(-1), []);

  return { activeIndex, handleKeyDown, resetIndex };
}
