'use client';

import React, {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { Button, ButtonProps } from './button';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  menuId: string;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error('DropdownMenu components must be rendered inside <DropdownMenu>.');
  }
  return ctx;
}

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const menuId = `edc-dropdown-${useId().replace(/:/g, '')}`;

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider
      value={{ open, setOpen, toggle, triggerRef, contentRef, menuId }}
    >
      {children}
    </DropdownMenuContext.Provider>
  );
};

export interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: React.ReactElement<Record<string, unknown>>;
  children?: React.ReactNode;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  render,
  children,
  onClick,
  onKeyDown,
  disabled,
  className,
  ...rest
}) => {
  const { open, setOpen, toggle, triggerRef, menuId } = useDropdownMenuContext();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    toggle();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    onKeyDown?.(event as React.KeyboardEvent<HTMLButtonElement>);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(true);
    }
  };

  const assignRef = (node: HTMLElement | null) => {
    triggerRef.current = node;
  };

  if (render && isValidElement(render)) {
    const existingProps = render.props as Record<string, unknown>;
    const existingOnClick = existingProps.onClick as
      | ((e: React.MouseEvent<HTMLElement>) => void)
      | undefined;
    const existingOnKeyDown = existingProps.onKeyDown as
      | ((e: React.KeyboardEvent<HTMLElement>) => void)
      | undefined;
    const existingClassName = (existingProps.className as string) || '';
    const mergedDisabled = Boolean(disabled ?? existingProps.disabled);

    return cloneElement(render, {
      ...rest,
      ref: assignRef,
      disabled: mergedDisabled,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      'aria-controls': open ? menuId : undefined,
      'data-state': open ? 'open' : 'closed',
      className: `${existingClassName} ${className || ''}`.trim(),
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        existingOnClick?.(event);
        if (!mergedDisabled) {
          onClick?.(event as React.MouseEvent<HTMLButtonElement>);
          toggle();
        }
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        existingOnKeyDown?.(event);
        if (!mergedDisabled) {
          onKeyDown?.(event as React.KeyboardEvent<HTMLButtonElement>);
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) setOpen(true);
          }
        }
      },
      children: children ?? (existingProps.children as React.ReactNode),
    });
  }

  return (
    <button
      ref={assignRef}
      type="button"
      disabled={disabled}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      data-state={open ? 'open' : 'closed'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
  matchTriggerWidth?: boolean;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'start',
  sideOffset = 6,
  className = '',
  matchTriggerWidth = false,
}) => {
  const { open, triggerRef, contentRef, menuId } = useDropdownMenuContext();
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    minWidth: number;
    placement: 'bottom' | 'top';
  } | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const contentEl = contentRef.current;
    const menuWidth = contentEl?.offsetWidth || Math.max(rect.width, 200);
    const menuHeight = contentEl?.offsetHeight || 220;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const pad = 12;

    const spaceBelow = viewportH - rect.bottom - sideOffset;
    const spaceAbove = rect.top - sideOffset;
    const placement: 'bottom' | 'top' =
      spaceBelow < Math.min(menuHeight, 240) && spaceAbove > spaceBelow
        ? 'top'
        : 'bottom';

    let top =
      placement === 'bottom'
        ? rect.bottom + sideOffset
        : Math.max(pad, rect.top - sideOffset - menuHeight);

    if (placement === 'bottom' && top + menuHeight > viewportH - pad) {
      top = Math.max(pad, viewportH - pad - menuHeight);
    }

    let left = rect.left;
    if (align === 'end') {
      left = rect.right - menuWidth;
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - menuWidth / 2;
    }
    left = Math.max(pad, Math.min(left, viewportW - menuWidth - pad));

    setCoords({
      top,
      left,
      minWidth: matchTriggerWidth ? Math.max(rect.width, 180) : Math.max(rect.width, 196),
      placement,
    });
  }, [align, contentRef, matchTriggerWidth, sideOffset, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  // Arrow-key navigation inside open menu
  useEffect(() => {
    if (!open) return;
    const container = contentRef.current;
    if (!container) return;

    const handleKeyNav = (event: KeyboardEvent) => {
      const items = Array.from(
        container.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]:not([disabled])'
        )
      );
      if (items.length === 0) return;
      const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = currentIdx < 0 || currentIdx >= items.length - 1 ? 0 : currentIdx + 1;
        items[next]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prev = currentIdx <= 0 ? items.length - 1 : currentIdx - 1;
        items[prev]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyNav);
    return () => container.removeEventListener('keydown', handleKeyNav);
  }, [open, contentRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          id={menuId}
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: coords?.placement === 'top' ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: coords?.placement === 'top' ? 4 : -4 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            top: coords ? `${coords.top}px` : '-9999px',
            left: coords ? `${coords.left}px` : '-9999px',
            minWidth: coords ? `${coords.minWidth}px` : '196px',
            transformOrigin: coords?.placement === 'top' ? 'bottom center' : 'top center',
          }}
          className={`z-[80] max-h-[min(340px,62vh)] overflow-y-auto rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)]/95 dark:bg-[#1D1D20] dark:border-[#303032] backdrop-blur-xl p-1.5 text-[var(--color-2-mood)] shadow-[0_14px_38px_-10px_rgba(3,4,5,0.22)] dark:shadow-[0_14px_34px_-10px_rgba(0,0,0,0.58)] ${className}`.trim()}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const DropdownMenuGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div role="group" className={`space-y-0.5 ${className}`.trim()}>
    {children}
  </div>
);

export const DropdownMenuLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-[var(--ink-muted)] select-none ${className}`.trim()}
  >
    {children}
  </div>
);

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    role="separator"
    className={`my-1.5 -mx-1.5 h-px bg-[var(--border-hairline)] ${className}`.trim()}
  />
);

export interface DropdownMenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  selected?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  selected = false,
  destructive = false,
  disabled = false,
  onClick,
  onSelect,
  icon,
  shortcut,
  className = '',
  ...rest
}) => {
  const { setOpen } = useDropdownMenuContext();

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      data-selected={selected ? 'true' : undefined}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
        onSelect?.();
        setOpen(false);
      }}
      className={`group relative flex w-full items-center justify-between gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-xs font-medium outline-none transition-colors duration-100 select-none ${
        disabled
          ? 'opacity-45 cursor-not-allowed text-[var(--ink-muted)]'
          : destructive
            ? 'cursor-pointer text-[#C01E30] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-red-950/50 focus-visible:bg-[#FEF2F2] dark:focus-visible:bg-red-950/50'
            : selected
              ? 'cursor-pointer bg-[var(--accent-soft)] text-[#C01E30] dark:text-[#F87171]'
              : 'cursor-pointer text-[var(--color-2-mood)] hover:bg-[var(--surface-subtle)] focus-visible:bg-[var(--surface-subtle)]'
      } ${className}`.trim()}
      {...rest}
    >
      <span className="flex items-center gap-2 min-w-0 truncate">
        {icon && (
          <span className="shrink-0 opacity-75 group-hover:opacity-100">
            {icon}
          </span>
        )}
        <span className="truncate">{children}</span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {shortcut && (
          <span className="font-mono-data text-[10px] text-[var(--ink-muted)]">
            {shortcut}
          </span>
        )}
        {selected && <Check className="h-3.5 w-3.5 text-[#C01E30] dark:text-[#F87171]" />}
      </span>
    </button>
  );
};

export interface SelectDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectDropdownGroup {
  label?: string;
  options: SelectDropdownOption[];
}

export interface SelectDropdownProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectDropdownOption[];
  groups?: SelectDropdownGroup[];
  menuLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
  size?: ButtonProps['size'];
  className?: string;
  contentClassName?: string;
}

/**
 * Drop-in structured dropdown built directly on <DropdownMenu> + <Button variant="outline">.
 * Replaces raw OS-native <select> elements across EDC AITR filters, forms, and workspace controls.
 */
export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  id,
  value,
  onChange,
  options,
  groups,
  menuLabel,
  placeholder = 'Select option',
  disabled = false,
  align = 'start',
  size = 'sm',
  className = '',
  contentClassName = '',
}) => {
  const [open, setOpen] = useState(false);

  const normalizedGroups: SelectDropdownGroup[] = groups
    ? groups
    : [{ label: menuLabel, options: options ?? [] }];

  const allOptions = normalizedGroups.flatMap((g) => g.options);
  const currentOption = allOptions.find((opt) => opt.value === value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            variant="outline"
            size={size}
            disabled={disabled}
            className={`justify-between font-normal text-left ${className}`.trim()}
          />
        }
      >
        <span className="truncate">{currentOption?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] transition-transform duration-150 ${
            open ? 'rotate-180 text-[#C01E30] dark:text-[#F87171]' : ''
          }`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        matchTriggerWidth
        className={contentClassName}
      >
        {normalizedGroups.map((group, gIdx) => (
          <React.Fragment key={group.label ?? `group-${gIdx}`}>
            {gIdx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              {group.label && (
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              )}
              {group.options.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={opt.disabled}
                  selected={opt.value === value}
                  onSelect={() => onChange(opt.value)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
