"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MoneyInputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value?: number;
    onChange?: (value: number | undefined) => void;
    error?: boolean;
}

export const MoneyInputField = forwardRef<HTMLInputElement, MoneyInputFieldProps>(
    ({ className, value, onChange, error, placeholder, ...props }, ref) => {
        // Keep local string state for typing (like "1,40,")
        const [localValue, setLocalValue] = useState<string>(
            value !== undefined ? value.toLocaleString("en-IN") : ""
        );

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Allow only numbers and commas
            let rawString = e.target.value.replace(/[^0-9]/g, "");

            if (!rawString) {
                setLocalValue("");
                onChange?.(undefined);
                return;
            }

            const numericValue = parseInt(rawString, 10);

            // Format with Indian numbering system using toLocaleString
            const formattedValue = numericValue.toLocaleString("en-IN");
            setLocalValue(formattedValue);
            onChange?.(numericValue);
        };

        return (
            <div className="relative isolate w-full">
                <div className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4",
                    error ? "text-red-500" : "text-ink-muted font-bold"
                )}>
                    ₹
                </div>
                <input
                    {...props}
                    ref={ref}
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    placeholder={placeholder || "0"}
                    className={cn(
                        "w-full rounded-2xl border bg-white py-4 pl-10 pr-4 text-lg font-bold text-ink shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-none transition-all",
                        error
                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                            : "border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light",
                        className
                    )}
                />
            </div>
        );
    }
);

MoneyInputField.displayName = "MoneyInputField";
