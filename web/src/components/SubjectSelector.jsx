import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Book, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const SubjectSelector = ({ subjects, value, onChange, label, placeholder }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coords, setCoords] = useState(null);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const selectedSubject = subjects.find(s => s.id === parseInt(value));

    // Update position for portal
    useLayoutEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const minHeight = 250;

                const newCoords = {
                    left: rect.left,
                    width: rect.width,
                    placement: 'bottom'
                };

                if (spaceBelow < minHeight && spaceAbove > spaceBelow) {
                    newCoords.placement = 'top';
                    newCoords.bottom = viewportHeight - rect.top + 8;
                    newCoords.top = 'auto';
                    newCoords.maxHeight = Math.min(spaceAbove - 20, 400);
                } else {
                    newCoords.placement = 'bottom';
                    newCoords.top = rect.bottom + 8;
                    newCoords.bottom = 'auto';
                    newCoords.maxHeight = Math.min(spaceBelow - 20, 400);
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && containerRef.current.contains(event.target)) return;
            if (dropdownRef.current && dropdownRef.current.contains(event.target)) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus search input
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.shortname && s.shortname.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSelect = (id) => {
        onChange({ target: { name: 'subject_id', value: id } });
        setIsOpen(false);
        setSearchQuery('');
    };

    const getIcon = (iconName) => {
        const IconComponent = LucideIcons[iconName] || Book;
        return <IconComponent size={18} />;
    };

    const dropdownContent = coords && (
        <div
            ref={dropdownRef}
            style={{
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
                minWidth: '240px'
            }}
            className={twMerge(
                "fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100",
                coords.placement === 'top' ? "origin-bottom" : "origin-top"
            )}
        >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-gray-50 dark:bg-black/30 border border-transparent focus:bg-white dark:focus:bg-black/50 focus:border-jungle-500/30 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all"
                        placeholder={t('components.subjectSelector.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-1 custom-scrollbar">
                <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className={twMerge(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                        !value ? "bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    )}
                >
                    <div className="text-gray-400"><Book size={18} /></div>
                    <span>{t('components.deadlineModal.noSubject')}</span>
                </button>

                {filteredSubjects.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelect(s.id)}
                        className={twMerge(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                            parseInt(value) === s.id ? "bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                    >
                        <div className={parseInt(value) === s.id ? "text-jungle-500" : "text-gray-400"}>
                            {getIcon(s.icon)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate">{s.name}</span>
                            {s.shortname && <span className="text-[10px] opacity-60 font-mono uppercase truncate">{s.shortname}</span>}
                        </div>
                    </button>
                ))}

                {filteredSubjects.length === 0 && searchQuery && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('components.subjectSelector.noResults')}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={twMerge(
                        "w-full flex items-center justify-between bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 text-left transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-jungle-500/50 focus:border-jungle-500/50",
                        "hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-black/70",
                        isOpen && "border-jungle-500 ring-2 ring-jungle-500/20"
                    )}
                >
                    <div className="flex items-center gap-3 truncate">
                        {selectedSubject ? (
                            <>
                                <div className="text-jungle-600 dark:text-jungle-400">
                                    {getIcon(selectedSubject.icon)}
                                </div>
                                <span className="truncate font-medium">{selectedSubject.name}</span>
                            </>
                        ) : (
                            <span className="text-gray-500 dark:text-gray-500">{placeholder || t('components.subjectSelector.placeholder')}</span>
                        )}
                    </div>
                    <ChevronDown size={18} className={twMerge("text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>

                {isOpen && createPortal(dropdownContent, document.body)}
            </div>
        </div>
    );
};

export default SubjectSelector;
