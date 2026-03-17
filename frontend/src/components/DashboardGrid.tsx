import React, { useState, useEffect } from "react";
import { DashboardCard as CardView, ConditionalFormattingRule, PivotConfig } from "../DashboardCard";
import { toSectionAnchorId } from "../groupAnchors";
import { toGroupAnchorId } from "../groupAnchors";

type VisualizationType = "metric" | "table" | "chart";

export type Card = {
	id: string;
	title: string;
	visualization_type: VisualizationType;
	chart_type?: "line" | "bar" | "pie" | "area";
	drilldown_enabled?: boolean;
	drilldown_query?: string;
	group_name?: string;
	group_order?: number;
	section_name?: string;
	section_order?: number;
	header_bg_color?: string;
	header_text_color?: string;
	hide_title?: boolean;
	font_size?: string;
	font_family?: string;
	conditional_formatting?: ConditionalFormattingRule[];
	pivot_enabled?: boolean;
	pivot_config?: PivotConfig;
};

export type PositionedCard = Card & {
	x: number; // grid column (0-based)
	y: number; // grid row (0-based)
	width: number; // grid units
	height: number; // grid units
};

export type GroupPosition = {
	groupName: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
};

type DashboardGridProps = {
	cards: PositionedCard[];
	groupPositions?: GroupPosition[];
	readOnly?: boolean;
	onCardMoved?: (cardId: string, x: number, y: number) => void;
	onCardResized?: (cardId: string, width: number, height: number) => void;
	onCardRemoved?: (cardId: string) => void;
	onGroupMoved?: (groupName: string, x: number, y: number) => void;
	onGroupResized?: (groupName: string, width: number, height: number) => void;
	filters?: Record<string, any>;
};

const GRID_SIZE = 12; // 12-column grid
const CELL_HEIGHT = 120; // pixels per grid row

function GridCard({
	card,
	readOnly,
	onMove,
	onResize,
	onRemove,
	filters,
	onExpand,
}: {
	card: PositionedCard;
	readOnly?: boolean;
	onMove?: (dx: number, dy: number) => void;
	onResize?: (dw: number, dh: number) => void;
	onRemove?: () => void;
	filters?: Record<string, any>;
	onExpand?: () => void;
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
					{readOnly && onExpand && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onExpand();
							}}
							style={{
								padding: "2px 6px",
								borderRadius: 3,
								border: "1px solid #3b82f6",
								background: "#fff",
								color: "#3b82f6",
								cursor: "pointer",
								fontSize: 10,
								fontWeight: 500,
								lineHeight: 1,
							}}
							title="Expand"
						>
							⛶
						</button>
					)}
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
				<CardView card={card} filters={filters} />
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
	groupPositions: initialGroupPositions = [],
	readOnly = false,
	onCardMoved,
	onCardResized,
	onCardRemoved,
	onGroupMoved,
	onGroupResized,
	filters = {},
}: DashboardGridProps) {
	const [cards, setCards] = useState<PositionedCard[]>(initialCards);
	const [groupPositions, setGroupPositions] = useState<GroupPosition[]>(initialGroupPositions);
	const [expandedCard, setExpandedCard] = useState<PositionedCard | null>(null);

	useEffect(() => {
		setCards(initialCards);
	}, [initialCards]);

	useEffect(() => {
		setGroupPositions(initialGroupPositions);
	}, [initialGroupPositions]);

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

	const handleGroupDrag = (groupName: string, e: React.MouseEvent) => {
		if (readOnly) return;
		e.preventDefault();
		e.stopPropagation();
		
		const startX = e.clientX;
		const startY = e.clientY;
		
		// Get the starting position
		const startPosition = groupPositions.find(p => p.groupName === groupName);
		const startPosX = startPosition?.x || 0;
		const startPosY = startPosition?.y || 0;
		
		let finalX = startPosX;
		let finalY = startPosY;
		
		const onMoveHandler = (me: MouseEvent) => {
			const dx = me.clientX - startX;
			const dy = me.clientY - startY;
			
			// Calculate new position from starting position + delta
			finalX = startPosX + dx;
			finalY = startPosY + dy;
			
			setGroupPositions((prev) => {
				const existing = prev.find(p => p.groupName === groupName);
				if (existing) {
					return prev.map(p => 
						p.groupName === groupName 
							? { ...p, x: finalX, y: finalY }
							: p
					);
				} else {
					return [...prev, { groupName, x: finalX, y: finalY }];
				}
			});
		};
		
		const onUp = () => {
			window.removeEventListener("mousemove", onMoveHandler);
			window.removeEventListener("mouseup", onUp);
			
			// Notify parent with the final position
			if (onGroupMoved) {
				onGroupMoved(groupName, finalX, finalY);
			}
		};
		
		window.addEventListener("mousemove", onMoveHandler);
		window.addEventListener("mouseup", onUp);
	};

	type GroupBucket = {
		cards: PositionedCard[];
		order: number;
		headerBgColor: string;
		headerTextColor: string;
	};

	type SectionBucket = {
		order: number;
		groups: Record<string, GroupBucket>;
	};

	const groupedBySection = cards.reduce((acc, card) => {
		const sectionName = card.section_name?.trim() || "General";
		const groupName = card.group_name?.trim() || "Ungrouped";

		if (!acc[sectionName]) {
			acc[sectionName] = {
				order: card.section_order ?? 0,
				groups: {},
			};
		}

		const section = acc[sectionName];
		if (!section.groups[groupName]) {
			section.groups[groupName] = {
				cards: [],
				order: card.group_order ?? 0,
				headerBgColor: card.header_bg_color || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				headerTextColor: card.header_text_color || "#ffffff",
			};
		}

		section.groups[groupName].cards.push(card);
		return acc;
	}, {} as Record<string, SectionBucket>);

	const sortedSections = Object.entries(groupedBySection)
		.sort(([, a], [, b]) => a.order - b.order)
		.map(([sectionName, section]) => {
			const groups = Object.entries(section.groups).sort(([, a], [, b]) => a.order - b.order);
			return { sectionName, section, groups };
		});

	// Calculate required height for the grid
	const maxY = cards.reduce((max, card) => Math.max(max, card.y + card.height), 0);
	
	// Also account for absolute positioned groups
	const maxGroupBottom = groupPositions.reduce((max, pos) => {
		if (pos.y && pos.height) {
			return Math.max(max, pos.y + pos.height);
		}
		return max;
	}, 0);
	
	const calculatedHeight = Math.max((maxY + 2) * CELL_HEIGHT, maxGroupBottom + 100);
	const gridHeight = `${calculatedHeight}px`;

	return (
		<div
			style={{
				background: "#f9fafb",
				padding: 16,
				boxSizing: "border-box",
				minHeight: `${calculatedHeight + 32}px`,
			}}
		>
			<div
				style={{
					position: "relative",
					minHeight: gridHeight,
					paddingBottom: "40px",
				}}
			>
			{sortedSections.map(({ sectionName, groups }) => (
				<div
					key={sectionName}
					id={toSectionAnchorId(sectionName)}
					style={{ marginBottom: 40 }}
				>
					<div
						style={{
							padding: "10px 16px",
							marginBottom: 16,
							borderRadius: 8,
							background: "#e5e7eb",
							color: "#1f2937",
							fontSize: 18,
							fontWeight: 700,
						}}
					>
						{sectionName}
					</div>

					{groups.map(([groupName, group]) => {
						const position = groupPositions.find((p) => p.groupName === groupName);
						const hasSavedPosition = !!position;
						const containerStyle: React.CSSProperties = {
							marginBottom: hasSavedPosition ? 0 : 32,
							position: hasSavedPosition ? "absolute" : "relative",
							left: hasSavedPosition ? (position?.x || 0) : undefined,
							top: hasSavedPosition ? (position?.y || 0) : undefined,
							width: hasSavedPosition ? (position?.width ? `${position.width}px` : "600px") : undefined,
							height: hasSavedPosition ? (position?.height ? `${position.height}px` : "auto") : undefined,
							overflow: hasSavedPosition ? "auto" : undefined,
							minHeight: hasSavedPosition ? "350px" : undefined,
							minWidth: hasSavedPosition ? "300px" : undefined,
							maxHeight: hasSavedPosition ? "2000px" : undefined,
							maxWidth: hasSavedPosition ? "100%" : undefined,
							borderRadius: hasSavedPosition ? "8px" : undefined,
							boxShadow: hasSavedPosition ? "0 4px 12px rgba(0,0,0,0.05)" : undefined,
							zIndex: hasSavedPosition ? 1 : undefined,
							resize: !readOnly && hasSavedPosition ? "both" : undefined,
						};

						return (
							<div key={`${sectionName}-${groupName}`} id={toGroupAnchorId(groupName)} data-group-name={groupName} style={containerStyle}>
								<div
									onMouseDown={(e) => handleGroupDrag(groupName, e)}
									style={{
										background: group.headerBgColor,
										color: group.headerTextColor,
										padding: "16px 24px",
										borderRadius: "8px 8px 0 0",
										fontSize: 20,
										fontWeight: 600,
										marginBottom: 0,
										boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
										cursor: readOnly ? "default" : "move",
										userSelect: "none" as const,
									}}
								>
									{groupName}
								</div>

								<div
									style={{
										position: "relative",
										minHeight: "300px",
										background: "#fff",
										padding: 16,
										boxSizing: "border-box",
										borderRadius: "0 0 8px 8px",
										border: "1px solid #e5e7eb",
										boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
										overflow: "visible",
									}}
								>
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

									{group.cards.map((card) => (
										<GridCard
											key={card.id}
											card={card}
											readOnly={readOnly}
											onMove={(dx, dy) => updateCardPosition(card.id, dx, dy)}
											onResize={(dw, dh) => updateCardSize(card.id, dw, dh)}
											onRemove={onCardRemoved ? () => onCardRemoved(card.id) : undefined}
											filters={filters}
											onExpand={readOnly ? () => setExpandedCard(card) : undefined}
										/>
									))}

									{group.cards.length === 0 && (
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
											<p style={{ fontSize: 14 }}>No cards in this group</p>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			))}

			{cards.length === 0 && (
				<div
					style={{
						textAlign: "center",
						color: "#9ca3af",
						padding: "80px 20px",
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

			{/* Expanded Card Modal */}
			{expandedCard && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: "rgba(0, 0, 0, 0.7)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 9999,
						padding: 32,
					}}
					onClick={() => setExpandedCard(null)}
				>
					<div
						style={{
							background: "#fff",
							borderRadius: 12,
							boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
							maxWidth: "90vw",
							maxHeight: "90vh",
							width: "1200px",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div
							style={{
								padding: "16px 24px",
								borderBottom: "1px solid #e5e7eb",
								background: "#f9fafb",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<span style={{ fontSize: 18, fontWeight: 600, color: "#374151" }}>
								{expandedCard.title}
							</span>
							<button
								onClick={() => setExpandedCard(null)}
								style={{
									padding: "8px 16px",
									borderRadius: 6,
									border: "1px solid #d1d5db",
									background: "#fff",
									color: "#374151",
									cursor: "pointer",
									fontSize: 14,
									fontWeight: 500,
								}}
							>
								Close
							</button>
						</div>

						{/* Modal Content */}
						<div
							style={{
								height: "70vh",
								overflow: "auto",
								padding: 24,
							}}
						>
							<div style={{ width: "100%", height: "100%" }}>
								<CardView card={expandedCard} filters={filters} />
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
