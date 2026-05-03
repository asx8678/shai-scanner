# TextInput Quick Reference

## 🎯 Current State
- **Location**: `src/tui.js` (lines 776-810)
- **Status**: Legacy (not migrated)
- **Complexity**: Low
- **Dependencies**: None (leaf component)

## 📊 Key Features
1. **Static `run(options)` method** - Main entry point
2. **TTY detection** - Interactive vs non-interactive modes
3. **Readline integration** - Proper line editing
4. **Color support** - Bold prompt, dimmed defaults
5. **Error handling** - Ctrl+C returns null

## 🎯 Migration Target
- **New File**: `src/tui/components/input.js`
- **Extends**: `Component` base class
- **Maintains**: Backward-compatible `run()` method

## 📋 Usage Examples
```javascript
// Current usage (will remain unchanged)
const value = await TextInput.run({
  prompt: 'Enter value: ',
  defaultValue: 'default',
  color: true
})
```

## 🛠️ Implementation Steps
1. Create `src/tui/components/input.js`
2. Extend `Component` base class
3. Implement lifecycle methods
4. Add `handleKey()` for input
5. Implement `render()` for VirtualScreen
6. Maintain static `run()` method
7. Write comprehensive tests

## ⚠️ Critical Requirements
- ✅ Zero breaking changes
- ✅ Same behavior as current implementation
- ✅ Proper readline cleanup in `unmount()`
- ✅ TTY vs non-TTY handling

## 🎯 Next Steps
1. Review detailed migration plan
2. Create test file
3. Implement component
4. Test integration
5. Update documentation

## 📚 Related Docs
- `TextInput_Migration_Plan.md`
- `TextInput_Analysis_Summary.md`
- `TextInput_Migration_Summary.md`

---
*Quick reference by Max 🐶*