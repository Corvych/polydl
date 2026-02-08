import { useState, useLayoutEffect, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

const IconPicker = ({ label, value, onChange, error, className }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [coords, setCoords] = useState(null);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Get all valid icon names
    const iconNames = useMemo(() => Object.keys(LucideIcons).filter(name => name !== 'createLucideIcon' && name !== 'default'), []);

    // Filter icons
    const filteredIcons = useMemo(() => {
        if (!searchTerm) return iconNames.slice(0, 100); // Limit initial view for perf
        return iconNames
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 100); // Limit results
    }, [searchTerm, iconNames]);

    // Selected Icon Component
    const SelectedIcon = value && LucideIcons[value] ? LucideIcons[value] : null;

    // Update position
    useLayoutEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const minHeight = 250; // Expected max height

                const newCoords = {
                    left: rect.left,
                    width: rect.width,
                    placement: 'bottom' // default
                };

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
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInContainer = containerRef.current && containerRef.current.contains(event.target);
            const isClickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

            if (!isClickInContainer && !isClickInDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Auto-focus search input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (name) => {
        onChange(name);
        setIsOpen(false);
        setSearchTerm('');
    };

    const dropdownContent = coords && (
        <div
            ref={dropdownRef}
            style={{
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                width: coords.width,
                minWidth: '300px',
                maxHeight: coords.maxHeight
            }}
            className={clsx(
                "fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-4",
                coords.placement === 'top' ? "origin-bottom-left" : "origin-top-left"
            )}
        >
            <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={16} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t('components.iconPicker.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-jungle-500 transition-colors"
                />
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {filteredIcons.map(name => {
                    const Icon = LucideIcons[name];
                    return (
                        <button
                            key={name}
                            type="button"
                            onClick={() => handleSelect(name)}
                            title={name}
                            className={clsx(
                                "aspect-square flex flex-col items-center justify-center rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                                value === name && "bg-jungle-500/20 text-jungle-600 dark:text-jungle-400 ring-1 ring-jungle-500/50"
                            )}
                        >
                            <Icon size={20} />
                        </button>
                    );
                })}
                {filteredIcons.length === 0 && (
                    <div className="col-span-6 text-center py-4 text-sm text-gray-500">
                        {t('components.iconPicker.noIcons')}
                    </div>
                )}
            </div>
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
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {SelectedIcon ? (
                        <div className="p-1 bg-jungle-500/10 rounded text-jungle-400">
                            <SelectedIcon size={18} />
                        </div>
                    ) : (
                        <div className="w-7 h-7 bg-gray-100 dark:bg-white/5 rounded flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <LucideIcons.Image size={16} />
                        </div>
                    )}
                    <span className={!value ? "text-gray-400 dark:text-gray-600" : ""}>
                        {value || t('components.iconPicker.placeholder')}
                    </span>
                </div>
                <LucideIcons.ChevronDown size={16} className={clsx("text-gray-500 transition-transform", isOpen && "rotate-180")} />
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

export default IconPicker;
