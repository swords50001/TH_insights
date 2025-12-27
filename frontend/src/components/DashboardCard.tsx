import React from "react";

type DashboardCardProps = {
	title: string;
	value: number | string | null;
	subtitle?: string;
	suffix?: string;
	loading?: boolean;
	error?: string;
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

export function DashboardCard({
	title,
	value,
	subtitle,
	suffix,
	loading,
	error,
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

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-gray-600">{title}</h3>
			</div>
			<div className="mt-2">
				<div className="text-3xl font-bold text-gray-900">{renderValue()}</div>
				{subtitle && (
					<div className="mt-1 text-xs text-gray-500">{subtitle}</div>
				)}
			</div>
		</div>
	);
}

