# FileBrowser Component & Main Menu Improvements

## Summary

This implementation adds an interactive file/folder browser component to the TUI
and improves the main menu flow for better usability.

---

## Changes Made

### 1. New FileBrowser Component (`src/tui.js`)

Added `FileBrowser` class (Section 9) with the following features:

- **Directory Navigation**
  - Shows current directory contents (files and folders)
  - ".." entry to go up a parent directory
  - Arrow keys (←/→) for directory navigation
  - Enter key to open directories or select files

- **Multi-Select**
  - Space bar to toggle selection of files/folders
  - "a" key to select/deselect all visible items
  - Selected paths shown at bottom of browser

- **Visual Enhancements**
  - Icons: 📁 (directory), 📄 (file), 👻 (hidden), ⬆ (parent)
  - Color-coded: directories in blue, hidden files dimmed
  - Cursor indicator (▶) with checkbox ([✓] selected)
  - Scroll pagination for long directory listings
  - Progress indicator showing scroll position

- **Filtering**
  - "h" key to toggle hidden files (dotfiles)
  - Optional `fileFilter` parameter for extension filtering
  - Configurable for file-only or directory-only selection

- **Error Handling**
  - Graceful handling of permission errors
  - Non-TTY fallback returns current directory

**API:**
```javascript
const paths = await FileBrowser.run({
  startDir: '.',
  title: 'Select Paths to Scan',
  selectFiles: true,    // allow file selection
  selectDirs: true,     // allow directory selection
  showHidden: false,    // initial hidden files state
  fileFilter: ['.json', '.js'],  // optional extension filter
  color: true,
});
// Returns: string[] of selected paths
```

### 2. Improved Main Menu (`src/tui-app.js`)

- **Visual Header Box**
  - Unicode box drawing for professional appearance
  - Version number displayed prominently
  - Database IOC count shown
  - Last update timestamp

- **Menu Styling**
  - Emoji icons for each menu item
  - Better spacing and visual hierarchy
  - Clear section separation

- **No Auto-Jump Behavior**
  - Main menu is now the clear first screen
  - Users must explicitly select an option

### 3. Enhanced Scan Configuration (`src/tui-app.js`)

- **FileBrowser Integration**
  - Replaced TextInput with FileBrowser for path selection
  - Users can browse and select multiple paths
  - Visual confirmation of selected paths

- **Summary Display**
  - Shows all selected paths in summary box
  - Better formatting with bullet points
  - Color-coded path display

### 4. Global Installation Support (`package.json`, `README.md`)

- **New npm Script**
  ```json
  "install:global": "npm install -g ."
  ```

- **README Updates**
  - Detailed installation section
  - Global install instructions
  - npx usage
  - TUI launch instructions

### 5. Documentation (`TUI_USAGE_GUIDE.md`)

- Updated main menu description with header info
- Added dedicated FileBrowser section
- Updated keyboard controls table with new keys
- Documented all FileBrowser features and icons

---

## Testing

All tests pass:

```
✓ self-test passed (3 tests)
✓ tui-test passed (20 tests)
✓ FileBrowser exported correctly
✓ FileBrowser.run is callable
✓ No syntax errors in modified files
```

---

## Files Modified

1. **src/tui.js** (+506 lines)
   - Added FileBrowser class as Section 9
   - Updated section numbering comments

2. **src/tui-app.js** (refactored)
   - Import FileBrowser
   - Improved renderMainMenu() with header box
   - Updated renderScanConfig() to use FileBrowser
   - Enhanced summary display for multiple paths

3. **package.json** (+1 line)
   - Added "install:global" script

4. **README.md** (+51 lines)
   - Expanded installation section
   - Added TUI usage section
   - Better organization

5. **TUI_USAGE_GUIDE.md** (+59 lines)
   - Main menu with version/database info
   - FileBrowser documentation
   - Updated keyboard controls

---

## Backward Compatibility

- All existing exports maintained
- Non-TTY fallback still works (returns `[startDir]`)
- Existing scan options structure unchanged
- Scanner module unchanged (supports arrays already)
- No breaking changes to CLI interface

---

## Implementation Details

The FileBrowser uses:
- `node:fs/promises` for async directory reading
- `node:path` for cross-platform path handling
- Existing KeyReader for keyboard input
- Existing onResize for terminal resize handling
- Existing ANSI constants for cursor movement
- Color utility from utils.js

All components gracefully degrade when not in a TTY environment.
