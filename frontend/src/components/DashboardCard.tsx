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
	trendDirection?: "up" | "down" | "neutral";
	trendValue?: number;
	isDrillable?: boolean;
	onDrill?: () => void;
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
	trendDirection,
	trendValue,
	isDrillable,
	onDrill,
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

	const getTrendIndicator = () => {
		if (!trendDirection) return null;
		
		switch (trendDirection) {
			case "up":
				return (
					<span style={{ 
						color: "#10b981", 
						fontSize: "1.2em", 
						marginLeft: "8px",
						fontWeight: "bold"
					}}>↑</span>
				);
			case "down":
				return (
					<span style={{ 
						color: "#ef4444", 
						fontSize: "1.2em", 
						marginLeft: "8px",
						fontWeight: "bold"
					}}>↓</span>
				);
			case "neutral":
				return (
					<span style={{ 
						color: "#6b7280", 
						fontSize: "1.2em", 
						marginLeft: "8px",
						fontWeight: "bold"
					}}>—</span>
				);
			default:
				return null;
		}
	};

	const valueFontSize = getFontSize(fontSize);
	const valueFontFamily = getFontFamily(fontFamily);

	return (
		<div 
			className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
			onClick={isDrillable && onDrill ? onDrill : undefined}
			style={{
				cursor: isDrillable && onDrill ? "pointer" : "default",
				transition: isDrillable && onDrill ? "all 0.2s ease" : "none",
				transform: isDrillable && onDrill ? "hover:shadow-md" : "none",
			}}
			onMouseEnter={(e) => {
				if (isDrillable && onDrill) {
					(e.currentTarget as HTMLElement).style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
				}
			}}
			onMouseLeave={(e) => {
				if (isDrillable && onDrill) {
					(e.currentTarget as HTMLElement).style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
				}
			}}
		>
			{title && (
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-gray-600">{title}</h3>
				</div>
			)}
			<div className={title ? "mt-2" : ""}>
				<div 
					className="font-bold text-gray-900 flex items-center"
					style={{ 
						fontSize: valueFontSize,
						fontFamily: valueFontFamily
					}}
				>
					{renderValue()}
					{getTrendIndicator()}
				</div>
				{subtitle && (
					<div className="mt-1 text-xs text-gray-500">{subtitle}</div>
				)}
				{isDrillable && onDrill && (
					<div className="mt-2 text-xs text-blue-600 cursor-pointer hover:text-blue-800">
						Click to view details →
					</div>
				)}
			</div>
		</div>
	);
}

