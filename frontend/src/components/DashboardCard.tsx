import React from "react";

type DashboardCardProps = {
	title: string;
	value: number | string | null;
	subtitle?: string;
	suffix?: string;
	loading?: boolean;
	error?: string;
	fontSize?: string;
	fontFamily?: string;
};

function formatNumber(value: number) {
	try {
		return new Intl.NumberFormat(undefined, {
			maximumFractionDigits: 0,
		}).format(value);
	} catch {
		return String(value);
	}
}

// Map font size settings to CSS values
const getFontSize = (size?: string) => {
	const sizeMap: Record<string, string> = {
		small: "2rem",
		medium: "3rem",
		large: "4rem",
		"x-large": "5rem",
	};
	return sizeMap[size || "medium"] || "3rem";
};

// Map font family settings to CSS values
const getFontFamily = (family?: string) => {
	const familyMap: Record<string, string> = {
		default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		arial: "Arial, sans-serif",
		roboto: "'Roboto', sans-serif",
		helvetica: "Helvetica, Arial, sans-serif",
		times: "'Times New Roman', Times, serif",
		georgia: "Georgia, serif",
		courier: "'Courier New', Courier, monospace",
		monospace: "monospace",
	};
	return familyMap[family || "default"] || familyMap.default;
};

export function DashboardCard({
	title,
	value,
	subtitle,
	suffix,
	loading,
	error,
	fontSize,
	fontFamily,
}: DashboardCardProps) {
	const renderValue = () => {
		if (loading) return "Loading…";
		if (error) return "Error";
		if (value === null || value === undefined) return "–";

		if (typeof value === "number") {
			const formatted = formatNumber(value);
			return suffix ? `${formatted}${suffix}` : formatted;
		}
		return value;
	};

	const valueFontSize = getFontSize(fontSize);
	const valueFontFamily = getFontFamily(fontFamily);

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			{title && (
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-gray-600">{title}</h3>
				</div>
			)}
			<div className={title ? "mt-2" : ""}>
				<div 
					className="font-bold text-gray-900"
					style={{ 
						fontSize: valueFontSize,
						fontFamily: valueFontFamily
					}}
				>
					{renderValue()}
				</div>
				{subtitle && (
					<div className="mt-1 text-xs text-gray-500">{subtitle}</div>
				)}
			</div>
		</div>
	);
}

