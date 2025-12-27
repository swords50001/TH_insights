import React, { useState, useEffect } from "react";
import { DashboardCard as CardView } from "../DashboardCard";

type VisualizationType = "metric" | "table" | "chart";

export type Card = {
	id: string;
	title: string;
	visualization_type: VisualizationType;
	chart_type?: "line" | "bar" | "pie" | "area";
	drilldown_enabled?: boolean;
	drilldown_query?: string;
};

export type PositionedCard = Card & {
	x: number; // grid column (0-based)
	y: number; // grid row (0-based)
	width: number; // grid units
	height: number; // grid units
};

type DashboardGridProps = {
	cards: PositionedCard[];
	readOnly?: boolean;
	onCardMoved?: (cardId: string, x: number, y: number) => void;
	onCardResized?: (cardId: string, width: number, height: number) => void;
	onCardRemoved?: (cardId: string) => void;
};

const GRID_SIZE = 12; // 12-column grid
const CELL_HEIGHT = 120; // pixels per grid row

function GridCard({
	card,
	readOnly,
	onMove,
	onResize,
	onRemove,
}: {
	card: PositionedCard;
	readOnly?: boolean;
	onMove?: (dx: number, dy: number) => void;
	onResize?: (dw: number, dh: number) => void;
	onRemove?: () => void;
}) {
	const handleDragMove = (e: React.MouseEvent) => {
		if (readOnly || !onMove) return;
		e.preventDefault();
		
		const startX = e.clientX;
		const startY = e.clientY;
		const gridWidth = window.innerWidth / GRID_SIZE;
		
		const onMoveHandler = (me: MouseEvent) => {
			const dx = Math.round((me.clientX - startX) / gridWidth);
			const dy = Math.round((me.clientY - startY) / CELL_HEIGHT);
			if (dx !== 0 || dy !== 0) {
				onMove(dx, dy);
			}
		};
		
		const onUp = () => {
			window.removeEventListener("mousemove", onMoveHandler);
			window.removeEventListener("mouseup", onUp);
		};
		
		window.addEventListener("mousemove", onMoveHandler);
		window.addEventListener("mouseup", onUp);
	};

	const handleResizeDrag = (e: React.MouseEvent) => {
		if (readOnly || !onResize) return;
		e.preventDefault();
		e.stopPropagation();
		
		const startX = e.clientX;
		const startY = e.clientY;
		const gridWidth = window.innerWidth / GRID_SIZE;
		
		const onMoveHandler = (me: MouseEvent) => {
			const dw = Math.round((me.clientX - startX) / gridWidth);
			const dh = Math.round((me.clientY - startY) / CELL_HEIGHT);
			if (dw !== 0 || dh !== 0) {
				onResize(dw, dh);
			}
		};
		
		const onUp = () => {
			window.removeEventListener("mousemove", onMoveHandler);
			window.removeEventListener("mouseup", onUp);
		};
		
		window.addEventListener("mousemove", onMoveHandler);
		window.addEventListener("mouseup", onUp);
	};

	const gridWidth = `${(card.width / GRID_SIZE) * 100}%`;
	const gridLeft = `${(card.x / GRID_SIZE) * 100}%`;
	const gridTop = `${card.y * CELL_HEIGHT}px`;
	const gridHeight = `${card.height * CELL_HEIGHT - 16}px`;

	return (
		<div
			style={{
				position: "absolute",
				left: gridLeft,
				top: gridTop,
				width: gridWidth,
				height: gridHeight,
				border: "2px solid #e5e7eb",
				borderRadius: 8,
				background: "#fff",
				boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header - drag to move */}
			<div
				onMouseDown={handleDragMove}
				style={{
					padding: "8px 12px",
					borderBottom: "1px solid #e5e7eb",
					background: "#f9fafb",
					cursor: readOnly ? "default" : "move",
					userSelect: "none",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
					{card.title}
				</span>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{!readOnly && (
						<span style={{ fontSize: 11, color: "#9ca3af" }}>
							{card.width}×{card.height}
						</span>
					)}
					{!readOnly && onRemove && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onRemove();
							}}
							style={{
								padding: "2px 6px",
								borderRadius: 4,
								border: "1px solid #ef4444",
								background: "#fff",
								color: "#ef4444",
								cursor: "pointer",
								fontSize: 11,
								fontWeight: 500,
							}}
						>
							×
						</button>
					)}
				</div>
			</div>

			{/* Card content */}
			<div style={{ flex: 1, overflow: "auto", padding: 12 }}>
				<CardView card={card} />
			</div>

			{/* Resize handle */}
			{!readOnly && onResize && (
				<div
					onMouseDown={handleResizeDrag}
					style={{
						position: "absolute",
						bottom: 0,
						right: 0,
						width: 16,
						height: 16,
						cursor: "nwse-resize",
						background: "#3b82f6",
						borderRadius: "0 0 6px 0",
					}}
				/>
			)}
		</div>
	);
}

export function DashboardGrid({
	cards: initialCards,
	readOnly = false,
	onCardMoved,
	onCardResized,
	onCardRemoved,
}: DashboardGridProps) {
	const [cards, setCards] = useState<PositionedCard[]>(initialCards);

	useEffect(() => {
		setCards(initialCards);
	}, [initialCards]);

	const updateCardPosition = (cardId: string, dx: number, dy: number) => {
		setCards((prev) =>
			prev.map((card) =>
				card.id === cardId
					? {
							...card,
							x: Math.max(0, Math.min(GRID_SIZE - card.width, card.x + dx)),
							y: Math.max(0, card.y + dy),
					  }
					: card
			)
		);
		
		const card = cards.find((c) => c.id === cardId);
		if (card && onCardMoved) {
			onCardMoved(
				cardId,
				Math.max(0, Math.min(GRID_SIZE - card.width, card.x + dx)),
				Math.max(0, card.y + dy)
			);
		}
	};

	const updateCardSize = (cardId: string, dw: number, dh: number) => {
		setCards((prev) =>
			prev.map((card) =>
				card.id === cardId
					? {
							...card,
							width: Math.max(1, Math.min(GRID_SIZE - card.x, card.width + dw)),
							height: Math.max(1, card.height + dh),
					  }
					: card
			)
		);
		
		const card = cards.find((c) => c.id === cardId);
		if (card && onCardResized) {
			onCardResized(
				cardId,
				Math.max(1, Math.min(GRID_SIZE - card.x, card.width + dw)),
				Math.max(1, card.height + dh)
			);
		}
	};

	// Calculate required height for the grid
	const maxY = cards.reduce((max, card) => Math.max(max, card.y + card.height), 0);
	const gridHeight = `${(maxY + 2) * CELL_HEIGHT}px`;

	return (
		<div
			style={{
				position: "relative",
				minHeight: "100vh",
				height: gridHeight,
				background: "#f9fafb",
				padding: 16,
				boxSizing: "border-box",
			}}
		>
			{/* Grid background */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundImage: `
						linear-gradient(to right, #e5e7eb 1px, transparent 1px),
						linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
					`,
					backgroundSize: `${100 / GRID_SIZE}% ${CELL_HEIGHT}px`,
					opacity: 0.3,
					pointerEvents: "none",
				}}
			/>

			{/* Cards */}
			{cards.map((card) => (
				<GridCard
					key={card.id}
					card={card}
					readOnly={readOnly}
					onMove={(dx, dy) => updateCardPosition(card.id, dx, dy)}
					onResize={(dw, dh) => updateCardSize(card.id, dw, dh)}
					onRemove={onCardRemoved ? () => onCardRemoved(card.id) : undefined}
				/>
			))}

			{cards.length === 0 && (
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						textAlign: "center",
						color: "#9ca3af",
					}}
				>
					<p style={{ fontSize: 18, marginBottom: 8 }}>No cards to display</p>
					<p style={{ fontSize: 14 }}>
						{readOnly
							? "Contact an administrator to configure the dashboard"
							: "Add cards from the Admin Cards page"}
					</p>
				</div>
			)}
		</div>
	);
}
