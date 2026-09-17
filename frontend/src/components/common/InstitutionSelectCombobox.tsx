import React, { useState, useRef, useEffect } from "react";
import { Building2, Search, ChevronDown, Check, X, MapPin } from "lucide-react";

export interface InstitutionOption {
  id: number;
  name: string;
  code?: string;
  location?: string;
  verification_status?: string;
}

interface InstitutionSelectComboboxProps {
  institutions: InstitutionOption[];
  selectedId: number | string | null | undefined;
  onSelect: (inst: InstitutionOption | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const InstitutionSelectCombobox: React.FC<
  InstitutionSelectComboboxProps
> = ({
  institutions,
  selectedId,
  onSelect,
  placeholder = "Search and select registered university...",
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedInst = institutions.find(
    (i) => String(i.id) === String(selectedId),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredInstitutions = institutions.filter((inst) => {
    const q = searchQuery.toLowerCase().trim();

    if (!q) return true;

    return (
      inst.name.toLowerCase().includes(q) ||
      (inst.code && inst.code.toLowerCase().includes(q)) ||
      (inst.location && inst.location.toLowerCase().includes(q))
    );
  });

  const handleSelect = (inst: InstitutionOption) => {
    onSelect(inst);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl border transition-all duration-200 select-none ${
          disabled
            ? "bg-[var(--bg-muted)] border-[var(--border-subtle)] text-[var(--text-disabled)] cursor-not-allowed"
            : isOpen
              ? "bg-[var(--bg-elevated)] border-[var(--primary)] shadow-[var(--shadow-md)] text-[var(--text-primary)] cursor-pointer"
              : "bg-[var(--bg-input)] border-[var(--border-color)] hover:border-[var(--border-color-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
        }`}
        style={{
          backdropFilter: "blur(12px)",
          minHeight: "46px",
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Building2
            size={18}
            className={
              selectedInst
                ? "text-[var(--primary)] shrink-0"
                : "text-[var(--text-muted)] shrink-0"
            }
          />

          {selectedInst ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                {selectedInst.name}
              </span>

              {selectedInst.code && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] font-mono font-semibold shrink-0">
                  {selectedInst.code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-[var(--text-muted)] truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedInst && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}

          <ChevronDown
            size={16}
            className={`text-[var(--text-muted)] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[var(--primary)]" : ""
            }`}
          />
        </div>
      </div>

      {required && (
        <input
          type="text"
          value={selectedId ? String(selectedId) : ""}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          className="opacity-0 absolute inset-0 pointer-events-none w-full h-full"
        />
      )}

      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xl)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{
            maxHeight: "320px",
          }}
        >
          <div className="p-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-muted)] sticky top-0 z-10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-colors">
              <Search size={15} className="text-[var(--primary)] shrink-0" />

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type university name, code or city..."
                className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto p-1.5 max-h-[240px] custom-scrollbar space-y-1">
            {filteredInstitutions.length === 0 ? (
              <div className="py-6 px-4 text-center text-[var(--text-muted)] text-xs space-y-1">
                <Building2
                  size={24}
                  className="mx-auto text-[var(--text-disabled)] mb-1"
                />

                <p className="font-semibold text-[var(--text-secondary)]">
                  No approved institution found
                </p>

                <p className="text-[11px] text-[var(--text-muted)]">
                  Try searching with a different university name or location.
                </p>
              </div>
            ) : (
              filteredInstitutions.map((inst) => {
                const isSelected = String(inst.id) === String(selectedId);

                return (
                  <div
                    key={inst.id}
                    onClick={() => handleSelect(inst)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] border border-transparent"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--text-primary)] truncate">
                          {inst.name}
                        </span>

                        {inst.code && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] font-mono font-semibold">
                            {inst.code}
                          </span>
                        )}
                      </div>

                      {inst.location && (
                        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <MapPin
                            size={10}
                            className="text-[var(--text-muted)]"
                          />
                          {inst.location}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check
                        size={15}
                        className="text-[var(--primary)] shrink-0"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="py-1.5 px-3 border-t border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>
              Showing {filteredInstitutions.length} approved institutions
            </span>

            <span className="text-[var(--primary)] font-medium">
              Database Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
