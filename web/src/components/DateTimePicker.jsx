import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, setHours, setMinutes, startOfWeek, endOfWeek } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

const DateTimePicker = ({ label, value, onChange, error, className }) => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('date'); // 'date' | 'time'
    const [displayDate, setDisplayDate] = useState(new Date()); // For calendar navigation
    const [coords, setCoords] = useState(null);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null); // Ref for the portal content

    const currentLocale = i18n.language === 'ru' ? ru : enUS;

    // Parse value to Date object
    const selectedDate = value ? new Date(value) : null;

    useEffect(() => {
        // Only update display date when opened to avoid cascading renders
        if (isOpen && value) {
            setDisplayDate(new Date(value));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);


    // Update position on scroll/resize using useLayoutEffect to prevent flicker
    useLayoutEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const minHeight = 300; // Expected max height
                const width = Math.max(rect.width, 300); // Enforce min width

                let left = rect.left;

                // Horizontal collision detection
                if (left + width > viewportWidth) {
                    // Try getting closer to right edge
                    left = viewportWidth - width - 10;
                }
                // Ensure it doesn't go off the left edge
                if (left < 10) {
                    left = 10;
                }

                // If screen is really small, just center it
                if (viewportWidth < 350) {
                    left = (viewportWidth - width) / 2;
                }

                const newCoords = {
                    left: left,
                    width: width, // Use calculated width which respects minWidth
                    placement: 'bottom' // default
                };

                // Flip if not enough space below AND more space above
                if (spaceBelow < minHeight && spaceAbove > spaceBelow) {
                    newCoords.placement = 'top';
                    newCoords.bottom = viewportHeight - rect.top + 8;
                    newCoords.top = 'auto';
                    newCoords.maxHeight = spaceAbove - 20;
                } else {
                    newCoords.placement = 'bottom';
                    newCoords.top = rect.bottom + 8;
                    newCoords.bottom = 'auto';
                    newCoords.maxHeight = spaceBelow - 20;
                }

                setCoords(newCoords);
            }
        };

        updatePosition();

        window.addEventListener('scroll', updatePosition, true); // true for capturing (all elements)
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside input container OR inside dropdown
            const isClickInContainer = containerRef.current && containerRef.current.contains(event.target);
            const isClickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

            if (!isClickInContainer && !isClickInDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]); // Depend on isOpen to ensure listeners are correctly managed when dropdown opens/closes

    const handleDateSelect = (date) => {
        // Create new date while preserving local time components
        let newDate = date;
        if (selectedDate) {
            newDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                selectedDate.getHours(),
                selectedDate.getMinutes()
            );
        } else {
            const now = new Date();
            newDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                now.getHours(),
                now.getMinutes()
            );
        }
        onChange(newDate.toISOString());
        setView('time'); // Switch to time view after date select
    };

    const handleTimeChange = (type, val) => {
        if (!selectedDate) return;
        let newDate = new Date(selectedDate);
        if (type === 'hours') newDate = setHours(newDate, parseInt(val));
        if (type === 'minutes') newDate = setMinutes(newDate, parseInt(val));
        onChange(newDate.toISOString());
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const formatDisplay = () => {
        if (!selectedDate) return '';
        return format(selectedDate, 'dd.MM.yyyy HH:mm', { locale: currentLocale });
    };

    // Calendar generation
    const monthStart = startOfMonth(displayDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Dropdown Content
    const dropdownContent = coords && (
        <div
            ref={dropdownRef}
            style={{
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                width: 'auto',
                minWidth: 'min(300px, 90vw)',
                maxWidth: '90vw',
                maxHeight: coords.maxHeight
            }}
            className={clsx(
                "fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100 overflow-y-auto no-scrollbar",
                coords.placement === 'top' ? "origin-bottom-left" : "origin-top-left"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('date')}
                        type="button"
                        className={clsx("px-3 py-1 rounded-md text-sm font-medium transition-colors", view === 'date' ? "bg-jungle-500/20 text-jungle-600 dark:text-jungle-400" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400")}
                    >
                        {t('components.dateTimePicker.date')}
                    </button>
                    <button
                        onClick={() => setView('time')}
                        type="button"
                        className={clsx("px-3 py-1 rounded-md text-sm font-medium transition-colors", view === 'time' ? "bg-jungle-500/20 text-jungle-600 dark:text-jungle-400" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400")}
                    >
                        {t('components.dateTimePicker.time')}
                    </button>
                </div>
                {selectedDate && (
                    <button type="button" onClick={() => { onChange(null); setIsOpen(false); }} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>

            {view === 'date' && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => setDisplayDate(subMonths(displayDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-gray-900 dark:text-white capitalize">{format(displayDate, 'MMMM yyyy', { locale: currentLocale })}</span>
                        <button type="button" onClick={() => setDisplayDate(addMonths(displayDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"><ChevronRight size={20} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'].map(d => (
                            <span key={d} className="text-xs font-medium text-gray-400 dark:text-gray-500">{t(`components.dateTimePicker.days.${d}`)}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, displayDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleDateSelect(day)}
                                    className={clsx(
                                        "h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-all",
                                        !isCurrentMonth && "text-gray-300 dark:text-gray-700",
                                        isSelected ? "bg-jungle-500 text-white shadow-lg shadow-jungle-500/30" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                                        isToday && !isSelected && "border border-jungle-500/50 text-jungle-600 dark:text-jungle-400"
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {view === 'time' && (
                <div className="flex flex-col items-center py-4 space-y-4">
                    <div className="flex items-center justify-center gap-2 relative">
                        {/* Hours Wheel */}
                        <TimeWheel
                            items={Array.from({ length: 24 }, (_, i) => i)}
                            value={selectedDate?.getHours() || 0}
                            onChange={(val) => handleTimeChange('hours', val)}
                            format={(v) => v.toString().padStart(2, '0')}
                            label={t('components.dateTimePicker.hour')}
                        />

                        <div className="text-2xl text-gray-300 dark:text-gray-600 font-light z-10">:</div>

                        {/* Minutes Wheel */}
                        <TimeWheel
                            items={Array.from({ length: 12 }, (_, i) => i * 5)}
                            value={selectedDate?.getMinutes() || 0}
                            onChange={(val) => handleTimeChange('minutes', val)}
                            format={(v) => v.toString().padStart(2, '0')}
                            label={t('components.dateTimePicker.minute')}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        {t('components.dateTimePicker.done')}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className={twMerge("w-full relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-0.5">
                    {label}
                </label>
            )}

            <div
                className={twMerge(
                    "w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-black/70",
                    isOpen && "ring-2 ring-jungle-500/50 border-jungle-500/50",
                    error && "border-red-500/50"
                )}
                onClick={toggleOpen}
            >
                <span className={!selectedDate ? "text-gray-400 dark:text-gray-600" : ""}>
                    {selectedDate ? formatDisplay() : t('components.dateTimePicker.placeholder')}
                </span>
                <CalendarIcon size={18} className="text-gray-400 dark:text-gray-500" />
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-400 font-medium pl-0.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                    {error}
                </p>
            )}

            {isOpen && coords && createPortal(dropdownContent, document.body)}
        </div>
    );
};

const TimeWheel = ({ items, value, onChange, format, label }) => {
    const containerRef = useRef(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const ITEM_HEIGHT = 40;

    // Triple the items for infinite scroll illusion
    // real items are in the middle (index: items.length to 2*items.length - 1)
    const paddedItems = [...items, ...items, ...items];

    // Scroll to position when value changes (externally or init)
    useEffect(() => {
        if (containerRef.current && !isScrolling && !isEditing) {
            const index = items.findIndex(i => i === value);
            if (index !== -1) {
                // Scroll to the middle set
                containerRef.current.scrollTop = (index + items.length) * ITEM_HEIGHT;
            }
        }
    }, [value, items, isScrolling, isEditing]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (Math.abs(e.deltaY) > 30) {
                e.preventDefault();
                const direction = Math.sign(e.deltaY);
                container.scrollBy({
                    top: direction * ITEM_HEIGHT,
                    behavior: 'smooth'
                });
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        // Use capture true to ensure we intercept it before native scroll
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const handleScroll = (e) => {
        setIsScrolling(true);
        const scrollTop = e.target.scrollTop;
        const totalHeight = items.length * ITEM_HEIGHT;

        // Infinite scroll logic: jump seamlessly when reaching ends
        if (scrollTop < ITEM_HEIGHT) {
            e.target.scrollTop += totalHeight;
        } else if (scrollTop > totalHeight * 2 - ITEM_HEIGHT) {
            e.target.scrollTop -= totalHeight;
        }

        const index = Math.round(e.target.scrollTop / ITEM_HEIGHT);

        // Debounce the scroll end detection
        clearTimeout(containerRef.current.scrollTimeout);
        containerRef.current.scrollTimeout = setTimeout(() => {
            setIsScrolling(false);

            // Calculate actual value index from the padded list
            const rawIndex = index % items.length;
            const newValue = items[rawIndex];

            if (newValue !== undefined && newValue !== value) {
                onChange(newValue);
            }
        }, 100);
    };

    const handleWheelClick = () => {
        setIsEditing(true);
        setEditValue(format(value));
    };

    const handleBlur = () => {
        setIsEditing(false);
        const parsed = parseInt(editValue, 10);
        if (!isNaN(parsed)) {
            // Find closest valid value
            const closest = items.reduce((prev, curr) => {
                return (Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev);
            });
            onChange(closest);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className="flex flex-col items-center z-10 relative">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-2">{label}</span>

            <div className="relative h-[200px] w-16">
                {/* Center Highlight Overlay (Now inside TimeWheel) */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[40px] bg-jungle-500/10 dark:bg-jungle-500/20 rounded-lg pointer-events-none z-0 border border-jungle-500/20" />

                {/* Edit Input Overlay (Only when editing) */}
                {isEditing && (
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[40px] z-20 flex items-center justify-center">
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full h-full bg-white dark:bg-gray-800 text-center text-lg font-bold border-2 border-jungle-500 rounded-lg outline-none text-gray-900 dark:text-white shadow-lg"
                        />
                    </div>
                )}

                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="h-full w-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-[80px]" // 2 items padding top/bottom (80px)
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Firefox/IE hide scrollbar
                >
                    {paddedItems.map((item, i) => (
                        <div
                            key={i} // Use index as key because items are repeated
                            className={clsx(
                                "h-[40px] flex items-center justify-center snap-center text-lg font-medium transition-all duration-200 cursor-pointer select-none relative z-10",
                                item === value ? "text-gray-900 dark:text-white scale-110 font-bold" : "text-gray-400 dark:text-gray-600 scale-90"
                            )}
                            onClick={() => {
                                if (item === value) {
                                    handleWheelClick();
                                } else {
                                    onChange(item);
                                }
                            }}
                        >
                            {format(item)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DateTimePicker;
