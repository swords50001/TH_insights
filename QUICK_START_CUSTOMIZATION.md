# Quick Start: Container Customization

## Features Added

1. ✅ **Resizable Group Containers** - Drag the bottom edge to resize vertically
2. ✅ **Custom Header Colors** - Set background and text colors for group headers

## How to Use

### Resize a Container

1. Open dashboard: `http://localhost:3000/dashboard`
2. Find a grouped container (has a colored header)
3. Hover over the **bottom edge** of the container
4. Drag up or down to resize
5. Container will resize between 300px and 2000px

### Customize Header Colors

#### Option 1: When Creating a Card

1. Go to Admin Cards: `http://localhost:3000/admin-cards`
2. Fill in card details
3. In "Card Grouping" section:
   - Enter a **Group Name** (e.g., "Revenue Metrics")
   - Enter a **Group Order** (e.g., 1)
4. In "Group Header Colors" sub-section:
   - **Header Background**: Enter CSS color or gradient
     - Example solid: `#3b82f6`
     - Example gradient: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
   - **Header Text Color**: Enter CSS color
     - Example: `#ffffff`
5. Save the card

#### Option 2: When Editing Existing Card

1. Go to Admin Cards page
2. Click "Edit" on any card
3. Scroll to "Card Grouping" section
4. Update the header color fields
5. Save changes

## Color Examples

### Solid Colors
```
Blue:   #3b82f6
Green:  #10b981
Red:    #ef4444
Purple: #8b5cf6
Gray:   #6b7280
```

### Gradient Colors
```
Purple (default):  linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Green:             linear-gradient(135deg, #10b981 0%, #059669 100%)
Blue:              linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)
Red:               linear-gradient(135deg, #ef4444 0%, #dc2626 100%)
Teal:              linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)
```

## Test Cards Available

Two test cards have been created to demonstrate the feature:

**Card ID 28**: "Custom Color Test"
- Group: "Custom Styled Group"
- Header: Green gradient
- View it on the dashboard to see the custom colors

**Card ID 29**: "Blue Header Card"
- Group: "Blue Theme Group"
- Header: Solid blue
- View it on the dashboard to see the solid color

## Tips

1. **High Contrast**: Use white text (#ffffff) on dark backgrounds, dark text (#111827) on light backgrounds
2. **Consistency**: Use similar colors for related groups (e.g., all financial groups in green)
3. **Testing**: Use browser DevTools to test colors before applying
4. **Reset**: Leave color fields empty to use default purple gradient

## Need Help?

See full documentation: [CONTAINER_CUSTOMIZATION.md](./CONTAINER_CUSTOMIZATION.md)
