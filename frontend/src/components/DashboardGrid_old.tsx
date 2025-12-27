import React, { useMemo, useRef, useState, useEffect } from "react";
import { DashboardCard as CardView } from "../DashboardCard";

type VisualizationType = "metric" | "table";

export type Card = {
	id: string;
	title: string;
	visualization_type: VisualizationType;
	x?: number; // grid position (0-based column)
	y?: number; // grid position (0-based row)
	width?: number; // grid units (default 1)
	height?: number; // grid units (default 1)
};

export type PositionedCard = Card & {
	x: number;
	y: number;
	width: number;
	height: number;
};

type DashboardGridProps = {
	cards: PositionedCard[];
	readOnly?: boolean;
	onCardMoved?: (cardId: string, x: number, y: number) => void;
	onCardResized?: (cardId: string, width: number, height: number) => void;
};

function QuadrantBox({
	quadrant,
	showTitle = true,
	onCollapse,
	onExpand,
	onMove,
	onResize,
	onRemove,
	enableDragDrop = false,
	onCardDrop,
	readOnly = false,
}: {
	quadrant: Quadrant;
	showTitle?: boolean;
	onCollapse?: () => void;
	onExpand?: () => void;
	onMove?: (dx: number, dy: number) => void;
	onResize?: (dw: number, dh: number) => void;
	onRemove?: () => void;
	enableDragDrop?: boolean;
	onCardDrop?: (cardId: string, fromQuadrantId: string) => void;
	readOnly?: boolean;
}) {
	const handleDragMove = (e: React.MouseEvent) => {
		if (!onMove) return;
		e.preventDefault();
		const startX = e.clientX;
		const startY = e.clientY;
		const onMoveHandler = (me: MouseEvent) => {
			const dx = ((me.clientX - startX) / window.innerWidth) * 100;
			const dy = ((me.clientY - startY) / window.innerHeight) * 100;
			onMove(dx, dy);
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMoveHandler);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMoveHandler);
		window.addEventListener("mouseup", onUp);
	};

	const handleResizeDrag = (e: React.MouseEvent) => {
		if (!onResize) return;
		e.preventDefault();
		e.stopPropagation();
		const startX = e.clientX;
		const startY = e.clientY;
		const onMoveHandler = (me: MouseEvent) => {
			const dw = ((me.clientX - startX) / window.innerWidth) * 100;
			const dh = ((me.clientY - startY) / window.innerHeight) * 100;
			onResize(dw, dh);
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMoveHandler);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMoveHandler);
		window.addEventListener("mouseup", onUp);
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (!enableDragDrop) return;
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		if (!enableDragDrop || !onCardDrop) return;
		e.preventDefault();
		e.stopPropagation();
		const data = e.dataTransfer.getData("application/json");
		try {
			const { cardId, fromQuadrantId } = JSON.parse(data);
			if (fromQuadrantId !== quadrant.id) {
				onCardDrop(cardId, fromQuadrantId);
			}
		} catch (error) {
			console.error("Failed to parse drag data:", error);
		}
	};

	return (
		<div 
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			style={{
				position: "absolute",
				left: `${quadrant.x}%`,
				top: `${quadrant.y}%`,
				width: `${quadrant.width}%`,
				height: `${quadrant.height}%`,
				border: "1px solid #e5e7eb",
				borderRadius: 8,
				padding: 12,
				background: "#fff",
				overflow: "auto",
				boxSizing: "border-box",
			}}>
			{showTitle && (
				<div
					onMouseDown={readOnly ? undefined : handleDragMove}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 8,
						cursor: readOnly ? "default" : "move",
						userSelect: "none",
					}}>
					<h2 style={{ fontSize: 14, color: "#4b5563", margin: 0 }}>{quadrant.title}</h2>
					{!readOnly && (
						<div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
							{onCollapse && (
								<button onClick={onCollapse} style={{
									border: "1px solid #e5e7eb",
									background: "#fff",
									padding: "4px 8px",
									borderRadius: 6,
									cursor: "pointer",
								}}>
									{quadrant.collapsed ? "Expand" : "Collapse"}
								</button>
							)}
							{onExpand && (
								<button onClick={onExpand} style={{
									border: "1px solid #e5e7eb",
									background: "#fff",
									padding: "4px 8px",
									borderRadius: 6,
									cursor: "pointer",
							}}>
								Full
							</button>
						)}
						{onRemove && (
							<button onClick={onRemove} style={{
								border: "1px solid #e5e7eb",
								background: "#fff",
								padding: "4px 8px",
								borderRadius: 6,
								cursor: "pointer",
								color: "#dc2626",
							}}>
								×
							</button>
						)}
						</div>
					)}
				</div>
			)}
			{!quadrant.collapsed ? (
				<div style={{ display: "grid", gap: 12, height: "calc(100% - 32px)", overflow: "auto" }}>
					{console.log('Rendering quadrant', quadrant.id, 'with cards:', quadrant.cards)}
					{quadrant.cards && quadrant.cards.length > 0 ? (
						quadrant.cards.map((card) => (
							<div
								key={card.id}
								draggable={enableDragDrop}
								onDragStart={(e) => {
									if (!enableDragDrop) return;
									e.dataTransfer.setData("application/json", JSON.stringify({
										cardId: card.id,
										fromQuadrantId: quadrant.id,
									}));
									e.dataTransfer.effectAllowed = "move";
								}}
								style={{
									cursor: enableDragDrop ? "grab" : "default",
								}}
							>
								{console.log('Rendering CardView for card:', card)}
								<CardView card={card} />
							</div>
						))
					) : (
						<div style={{ color: "#9ca3af", fontSize: 14, padding: 20 }}>No cards in this quadrant</div>
					)}
				</div>
			) : (
				<div style={{ color: "#9ca3af", fontSize: 12 }}>Collapsed</div>
			)}
			{/* Resize handle - only show in edit mode */}
			{onResize && !readOnly && (
				<div
					onMouseDown={handleResizeDrag}
					style={{
						position: "absolute",
						bottom: 0,
						right: 0,
						width: 16,
						height: 16,
						cursor: "nwse-resize",
						background: "#9ca3af",
						borderRadius: "0 0 8px 0",
					}}
				/>
			)}
		</div>
	);
}

export function DashboardGrid({ layout, quadrants: initialQuadrants, showTitles = true, enableDragDrop = false, onCardMoved, readOnly = false }: DashboardGridProps) {
	const [quadrants, setQuadrants] = useState<Quadrant[]>(() => {
		// If initialQuadrants provided, use those (priority #1)
		if (initialQuadrants && initialQuadrants.length > 0) {
			console.log('DashboardGrid: Using initialQuadrants', initialQuadrants);
			return initialQuadrants;
		}
		
		// Try loading layout from localStorage (only for positioning, not cards)
		try {
			const saved = localStorage.getItem("dashboardGrid:quadrants");
			if (saved) {
				const savedQuadrants = JSON.parse(saved);
				console.log('DashboardGrid: Loaded from localStorage', savedQuadrants);
				// Only use saved positions if no initial quadrants provided
				return savedQuadrants;
			}
		} catch {}
		
		// Otherwise convert legacy layout to quadrants
		if (layout) {
			return [
				{ id: "topLeft", title: "Top Left", cards: layout.topLeft ?? [], x: 0, y: 0, width: 48, height: 48 },
				{ id: "topRight", title: "Top Right", cards: layout.topRight ?? [], x: 52, y: 0, width: 48, height: 48 },
				{ id: "bottomLeft", title: "Bottom Left", cards: layout.bottomLeft ?? [], x: 0, y: 52, width: 48, height: 48 },
				{ id: "bottomRight", title: "Bottom Right", cards: layout.bottomRight ?? [], x: 52, y: 52, width: 48, height: 48 },
			];
		}
		
		return [];
	});

	// Update quadrants when initialQuadrants changes (e.g., after fetching cards from API)
	useEffect(() => {
		if (initialQuadrants && initialQuadrants.length > 0) {
			console.log('DashboardGrid: Updating with new initialQuadrants', initialQuadrants);
			setQuadrants(initialQuadrants);
		}
	}, [initialQuadrants]);

	const [expanded, setExpanded] = useState<string | null>(null);

	useEffect(() => {
		try { localStorage.setItem("dashboardGrid:quadrants", JSON.stringify(quadrants)); } catch {}
	}, [quadrants]);

	const clamp = (val: number, min = 0, max = 100) => Math.max(min, Math.min(max, val));

	const updateQuadrant = (id: string, updates: Partial<Quadrant>) => {
		setQuadrants((qs) => qs.map((q) => (q.id === id ? { ...q, ...updates } : q)));
	};

	const handleCardDrop = (toQuadrantId: string, cardId: string, fromQuadrantId: string) => {
		// Move card from one quadrant to another
		setQuadrants((qs) => {
			const fromQuadrant = qs.find(q => q.id === fromQuadrantId);
			const toQuadrant = qs.find(q => q.id === toQuadrantId);
			
			if (!fromQuadrant || !toQuadrant) return qs;
			
			const card = fromQuadrant.cards.find(c => c.id === cardId);
			if (!card) return qs;
			
			return qs.map(q => {
				if (q.id === fromQuadrantId) {
					return { ...q, cards: q.cards.filter(c => c.id !== cardId) };
				}
				if (q.id === toQuadrantId) {
					return { ...q, cards: [...q.cards, card] };
				}
				return q;
			});
		});
		
		// Notify parent component
		if (onCardMoved) {
			onCardMoved(cardId, fromQuadrantId, toQuadrantId);
		}
	};

	const addQuadrant = () => {
		const newId = `quadrant-${Date.now()}`;
		const newQuadrant: Quadrant = {
			id: newId,
			title: `Quadrant ${quadrants.length + 1}`,
			cards: [],
			x: 10 + (quadrants.length * 5) % 50,
			y: 10 + (quadrants.length * 5) % 50,
			width: 30,
			height: 30,
		};
		setQuadrants([...quadrants, newQuadrant]);
	};

	const removeQuadrant = (id: string) => {
		setQuadrants((qs) => qs.filter((q) => q.id !== id));
	};

	const resetLayout = () => {
		setQuadrants([
			{ id: "topLeft", title: "Top Left", cards: [], x: 0, y: 0, width: 48, height: 48 },
			{ id: "topRight", title: "Top Right", cards: [], x: 52, y: 0, width: 48, height: 48 },
			{ id: "bottomLeft", title: "Bottom Left", cards: [], x: 0, y: 52, width: 48, height: 48 },
			{ id: "bottomRight", title: "Bottom Right", cards: [], x: 52, y: 52, width: 48, height: 48 },
		]);
	};

	const expandedQuadrant = quadrants.find((q) => q.id === expanded);

	if (expandedQuadrant) {
		return (
			<div style={{ height: "100vh", padding: 16, boxSizing: "border-box", background: "#f9fafb" }}>
				<div style={{ marginBottom: 8, display: "flex", justifyContent: "flex-end" }}>
					<button onClick={() => setExpanded(null)} style={{
						border: "1px solid #e5e7eb",
						background: "#fff",
						padding: "6px 10px",
						borderRadius: 6,
						cursor: "pointer",
					}}>
						Restore Grid
					</button>
				</div>
				<div style={{ height: "calc(100% - 48px)", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff", overflow: "auto" }}>
					<h2 style={{ fontSize: 18, color: "#111827", marginBottom: 16 }}>{expandedQuadrant.title}</h2>
					<div style={{ display: "grid", gap: 12 }}>
						{expandedQuadrant.cards.map((card) => (
							<CardView key={card.id} card={card} />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{
			position: "relative",
			height: "100vh",
			boxSizing: "border-box",
			padding: 16,
			background: "#f9fafb",
			overflow: "hidden",
		}}>
			{/* Toolbar - only show for admin/editable mode */}
			{!readOnly && (
				<div style={{ marginBottom: 8, display: "flex", justifyContent: "flex-end", gap: 8, position: "relative", zIndex: 100 }}>
					<button onClick={addQuadrant} style={{
						border: "1px solid #3b82f6",
						background: "#3b82f6",
						color: "#fff",
						padding: "6px 10px",
						borderRadius: 6,
						cursor: "pointer",
					}}>+ Add Quadrant</button>
					<button onClick={resetLayout} style={{
						border: "1px solid #e5e7eb",
						background: "#fff",
						padding: "6px 10px",
						borderRadius: 6,
						cursor: "pointer",
					}}>Reset Layout</button>
				</div>
			)}

			{/* Quadrants */}
			<div style={{ position: "relative", height: readOnly ? "100%" : "calc(100% - 48px)", width: "100%" }}>
				{quadrants.map((q) => (
					<QuadrantBox
						key={q.id}
						quadrant={q}
						showTitle={showTitles}
						enableDragDrop={enableDragDrop}
						readOnly={readOnly}
						onCollapse={() => updateQuadrant(q.id, { collapsed: !q.collapsed })}
						onExpand={() => setExpanded(q.id)}
						onMove={(dx, dy) => {
							updateQuadrant(q.id, {
								x: clamp(q.x + dx, 0, 100 - q.width),
								y: clamp(q.y + dy, 0, 100 - q.height),
							});
						}}
						onResize={(dw, dh) => {
							updateQuadrant(q.id, {
								width: clamp(q.width + dw, 10, 100 - q.x),
								height: clamp(q.height + dh, 10, 100 - q.y),
							});
						}}
						onRemove={() => removeQuadrant(q.id)}
						onCardDrop={(cardId, fromQuadrantId) => handleCardDrop(q.id, cardId, fromQuadrantId)}
					/>
				))}
			</div>
		</div>
	);
}

