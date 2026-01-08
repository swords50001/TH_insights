# Container Customization Features

## Overview
This document describes the container customization features that allow you to:
1. **Resize group containers** - Vertically resize group containers to show more or less content
2. **Customize header colors** - Set custom background and text colors for group headers

## Database Schema

Two new columns added to `dashboard_cards` table:

```sql
ALTER TABLE dashboard_cards 
ADD COLUMN header_bg_color VARCHAR(50) DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

ALTER TABLE dashboard_cards 
ADD COLUMN header_text_color VARCHAR(50) DEFAULT '#ffffff';
```

**Migration File**: `/backend/migrations/004_add_container_customization.sql`

## Header Color Customization

### Supported Color Formats

#### 1. Solid Colors
```
#3b82f6        // Hex color
rgb(59, 130, 246)  // RGB
rgba(59, 130, 246, 0.8)  // RGBA with transparency
blue           // Named colors
```

#### 2. Linear Gradients
```
linear-gradient(135deg, #667eea 0%, #764ba2 100%)
linear-gradient(to right, #10b981, #059669)
linear-gradient(45deg, #ff6b6b, #ffd93d)
```

#### 3. Radial Gradients
```
radial-gradient(circle, #667eea, #764ba2)
radial-gradient(ellipse at center, #3b82f6, #1e40af)
```

### Admin UI Controls

In the Admin Cards form under "Card Grouping" section, you'll find:

**Header Background** input:
- Accepts any valid CSS background value
- Default: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Examples:
  - Solid: `#3b82f6`
  - Gradient: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
  - Dark theme: `#1f2937`

**Header Text Color** input:
- Accepts any valid CSS color value
- Default: `#ffffff` (white)
- Examples:
  - White: `#ffffff` or `white`
  - Black: `#000000` or `black`
  - Gray: `#6b7280`

### API Endpoints

#### POST /admin/cards
Creates a new card with optional header colors:

```bash
curl -X POST http://localhost:8080/admin/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Card",
    "sql_query": "SELECT 100 as value",
    "visualization_type": "metric",
    "group_name": "My Group",
    "group_order": 1,
    "header_bg_color": "#3b82f6",
    "header_text_color": "#ffffff"
  }'
```

#### PUT /admin/cards/:id
Updates an existing card's header colors:

```bash
curl -X PUT http://localhost:8080/admin/cards/28 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "header_bg_color": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "header_text_color": "#ffffff"
  }'
```

#### GET /dashboard/cards
Returns all cards including header color fields:

```json
{
  "id": 28,
  "title": "Custom Color Test",
  "group_name": "Custom Styled Group",
  "group_order": 3,
  "header_bg_color": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "header_text_color": "#ffffff"
}
```

## Container Resizing

### How It Works

Group containers now support vertical resizing using the CSS `resize: vertical` property.

**Features**:
- Resize handle appears at the bottom of each group container
- Drag the handle up or down to adjust container height
- Min height: 300px
- Max height: 2000px
- Overflow: auto (scrollable if content exceeds container height)

**Container Styles Applied**:
```css
{
  resize: "vertical",
  overflow: "auto",
  minHeight: "300px",
  maxHeight: "2000px"
}
```

### Use Cases

1. **Compact View**: Resize smaller to see more groups on screen
2. **Expanded View**: Resize larger to see more cards within a group
3. **Dashboard Customization**: Each user can adjust container sizes to their preference
4. **Mixed Content**: Different groups can have different heights based on content

### Browser Support

Container resizing works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Color Theme Examples

### 1. Revenue/Finance (Green)
```
header_bg_color: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
header_text_color: "#ffffff"
```

### 2. Alerts/Warnings (Red/Orange)
```
header_bg_color: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
header_text_color: "#ffffff"
```

### 3. Information (Blue)
```
header_bg_color: "#3b82f6"
header_text_color: "#ffffff"
```

### 4. Success/Health (Teal)
```
header_bg_color: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
header_text_color: "#ffffff"
```

### 5. Dark Theme
```
header_bg_color: "#1f2937"
header_text_color: "#f3f4f6"
```

### 6. Light Theme
```
header_bg_color: "#f9fafb"
header_text_color: "#111827"
```

### 7. Purple (Default)
```
header_bg_color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
header_text_color: "#ffffff"
```

## Frontend Implementation

### DashboardGrid Component

The `DashboardGrid.tsx` component:

1. **Extracts header colors from card data**:
```typescript
const groupedCards = cards.reduce((acc, card) => {
  const groupName = card.group_name || '__ungrouped__';
  if (!acc[groupName]) {
    acc[groupName] = {
      cards: [],
      order: card.group_order || 0,
      headerBgColor: card.header_bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      headerTextColor: card.header_text_color || '#ffffff',
    };
  }
  acc[groupName].cards.push(card);
  return acc;
}, {});
```

2. **Applies colors to headers**:
```typescript
<div
  style={{
    background: group.headerBgColor,
    color: group.headerTextColor,
    padding: "16px 24px",
    borderRadius: "8px 8px 0 0",
    fontSize: 20,
    fontWeight: 600,
  }}
>
  {groupName}
</div>
```

3. **Makes containers resizable**:
```typescript
<div
  style={{
    position: "relative",
    minHeight: "300px",
    resize: "vertical",
    overflow: "auto",
    maxHeight: "2000px",
    // ... other styles
  }}
>
```

## Testing

### Test Cards Created

**Card ID 28**: Custom Color Test
- Group: "Custom Styled Group" (order: 3)
- Header: Green gradient
- Background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
- Text: `#ffffff`

**Card ID 29**: Blue Header Card
- Group: "Blue Theme Group" (order: 4)
- Header: Solid blue
- Background: `#3b82f6`
- Text: `#ffffff`

### Test the Features

1. **View Dashboard**:
   ```
   http://localhost:3000/dashboard
   ```
   - Scroll to "Custom Styled Group" (green header)
   - Scroll to "Blue Theme Group" (blue header)

2. **Test Resizing**:
   - Hover over the bottom of any group container
   - Drag the resize handle up or down
   - Verify container resizes smoothly

3. **Edit Header Colors**:
   - Go to Admin Cards: `http://localhost:3000/admin-cards`
   - Edit any card with a group name
   - Change "Header Background" and "Header Text Color"
   - Save and view dashboard to see changes

## Tenant Isolation

Header colors are stored per-card, so each tenant can have:
- Different color schemes for the same group names
- Completely custom branding
- Independent visual identity

Example:
- Tenant A: "Revenue Metrics" with green header
- Tenant B: "Revenue Metrics" with blue header

## Best Practices

### Color Selection

1. **Contrast**: Ensure sufficient contrast between header background and text
   - Dark backgrounds → Light text (#ffffff)
   - Light backgrounds → Dark text (#111827)

2. **Consistency**: Use similar color schemes across related groups
   - Financial groups: Green shades
   - Health groups: Teal/Blue
   - Alerts: Red/Orange

3. **Accessibility**: Consider color-blind users
   - Avoid red/green only distinctions
   - Use patterns or text labels in addition to color

### Container Heights

1. **Content-Based**: Size containers based on typical content
   - Few cards: 300-500px
   - Many cards: 800-1200px
   - Very large groups: 1500-2000px

2. **Screen Real Estate**: Balance between groups
   - Don't make one group too large at expense of others
   - Consider typical viewport sizes (1080p, 1440p, 4K)

3. **User Customization**: Remember container resize is client-side only
   - Doesn't persist across sessions/devices
   - Consider adding saved layouts in future

## Future Enhancements

Potential improvements:

1. **Color Picker UI**: Visual color picker instead of text input
2. **Preset Themes**: Dropdown with pre-defined color schemes
3. **Persistent Resize**: Save container heights to database/localStorage
4. **Horizontal Resize**: Allow width adjustment as well
5. **Theme Library**: Shareable color themes across tenants
6. **Dark Mode**: Auto-adjust colors based on system theme

## Troubleshooting

### Colors Not Showing

1. **Check Database**: Verify columns exist
   ```sql
   SELECT header_bg_color, header_text_color FROM dashboard_cards WHERE id = 28;
   ```

2. **Check API Response**: Verify fields are returned
   ```bash
   curl http://localhost:8080/dashboard/cards -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, header_bg_color, header_text_color}'
   ```

3. **Check Browser Console**: Look for CSS errors

### Container Not Resizing

1. **Browser Support**: Ensure browser supports CSS resize property
2. **Container Type**: Only grouped containers (not ungrouped) are resizable
3. **CSS Conflicts**: Check for conflicting styles in browser DevTools

### Invalid Colors

If colors don't render properly:
- Verify valid CSS syntax
- Check for typos in hex codes (#3b82f6, not #3b82f)
- Ensure gradient syntax is correct
- Test color in browser DevTools first

## Migration Guide

For existing deployments:

1. **Backup Database**:
   ```bash
   docker exec -i th_insights-db-1 pg_dump -U postgres th_db > backup.sql
   ```

2. **Run Migration**:
   ```bash
   docker exec -i th_insights-db-1 psql -U postgres -d th_db < backend/migrations/004_add_container_customization.sql
   ```

3. **Rebuild Containers**:
   ```bash
   docker compose build backend frontend
   docker compose up -d
   ```

4. **Verify**:
   ```sql
   \d dashboard_cards  -- Check for new columns
   ```

5. **Update Existing Cards** (optional):
   - Use Admin UI to set custom colors
   - Or bulk update via SQL:
   ```sql
   UPDATE dashboard_cards 
   SET header_bg_color = '#3b82f6', header_text_color = '#ffffff'
   WHERE group_name = 'My Group';
   ```

## Summary

✅ **Container Resizing**: Vertical resize with 300-2000px range
✅ **Custom Header Colors**: Full CSS color/gradient support
✅ **Database Fields**: `header_bg_color`, `header_text_color`
✅ **Admin UI**: Text inputs for both color fields
✅ **API Support**: POST, PUT, GET endpoints updated
✅ **Tenant Isolation**: Per-tenant color customization
✅ **Backward Compatible**: Default colors for existing cards
✅ **Production Ready**: Tested with multiple color schemes
