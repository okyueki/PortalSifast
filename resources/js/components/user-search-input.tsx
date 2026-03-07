import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type UserSearchResult = {
    id: number;
    name: string;
    email: string;
    simrs_nik: string | null;
    role: string;
    dep_id: string | null;
};

type Props = {
    value: number | null;
    onChange: (value: number | null) => void;
    /** Label to show when value is set from server (e.g. edit form) */
    initialLabel?: string | null;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export function UserSearchInput({
    value,
    onChange,
    initialLabel,
    placeholder,
    disabled,
    className,
}: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState<string | null>(initialLabel ?? null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchResults = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ q: q.trim() });
            const res = await fetch(`/tickets/search-for-user?${params}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchResults(query);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchResults]);

    const handleSelect = (item: UserSearchResult) => {
        onChange(item.id);
        setSelectedLabel(item.name);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setSelectedLabel(null);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const handleBlur = () => {
        setTimeout(() => setIsOpen(false), 150);
    };

    const handleFocus = () => {
        if (value && selectedLabel) return;
        if (query) fetchResults(query);
        setIsOpen(true);
    };

    useEffect(() => {
        if (value && initialLabel) setSelectedLabel(initialLabel);
        else if (!value) setSelectedLabel(null);
    }, [value, initialLabel]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (value) {
        return (
            <div className={cn('flex gap-2', className)}>
                <div className="flex flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{selectedLabel ?? `User #${value}`}</span>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={handleClear} disabled={disabled}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder ?? 'Cari nama, email, atau NIK...'}
                    disabled={disabled}
                    className="pl-9"
                />
            </div>
            {isOpen && (query || results.length > 0 || loading) && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
                    {loading ? (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                            Mencari...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            {query ? 'Tidak ada hasil' : 'Ketik nama, email, atau NIK untuk mencari'}
                        </div>
                    ) : (
                        <ul className="py-1">
                            {results.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{item.name}</span>
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                {item.role}
                                            </span>
                                        </div>
                                        <div className="ml-6 text-muted-foreground">{item.email}</div>
                                        {item.simrs_nik && (
                                            <div className="ml-6 text-xs text-muted-foreground">
                                                NIK: {item.simrs_nik}
                                                {item.dep_id && ` • ${item.dep_id}`}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
