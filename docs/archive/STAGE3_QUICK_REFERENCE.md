# Stage 3: Quick Reference Card

> **Migration:** SelectMenu & CheckboxMenu  
> **Target:** `src/tui/components/menu.js`  
> **Status:** 🔴 Not Started  
> **Effort:** 4 days

---

## 🎯 Objectives

1. **Migrate** SelectMenu and CheckboxMenu to Component architecture
2. **Maintain** 100% backward compatibility
3. **Ensure** all existing tests pass
4. **Add** comprehensive test coverage (40+ tests)

---

## 📁 Files

### Create
- `src/tui/components/menu.js` (400-500 lines)
- `test/menu-test.js` (500-600 lines)

### Modify
- `src/tui/index.js` (+4 lines)
- `src/tui.js` (+2 lines)

---

## 🔧 Implementation Pattern

### Component Structure
```javascript
import { Component } from '../core/component.js'
import { colorize } from '../../utils.js'
import { stdin as processStdin, stdout as processStdout } from 'node:process'

export class SelectMenu extends Component {
  #title
  #items
  #color
  #selected
  #complete
  #result
  #reader

  constructor(options = {}) {
    super(options)
    // Initialize state
  }

  mount() {
    super.mount()
    // Create KeyReader
  }

  unmount() {
    // Destroy KeyReader
    super.unmount()
  }

  handleKey(key) {
    // Process keyboard input
    // Return true if handled
  }

  render(screen, ctx) {
    // Write to VirtualScreen
  }

  static async run(options) {
    // Backward compatible static method
  }
}
```

### Key Bindings
**SelectMenu:**
- ↑/↓: Navigate
- Enter: Select
- Escape/q: Cancel

**CheckboxMenu:**
- ↑/↓: Navigate
- Space: Toggle
- a: Toggle all
- Enter: Confirm
- Escape: Cancel

---

## ✅ Checklist

### Phase 1: Foundation
- [ ] Create menu.js file
- [ ] Define class structure
- [ ] Import dependencies

### Phase 2: SelectMenu
- [ ] Constructor & state
- [ ] Lifecycle (mount/unmount)
- [ ] Key handling
- [ ] Rendering
- [ ] Static run() method

### Phase 3: CheckboxMenu
- [ ] Constructor & state
- [ ] Lifecycle (mount/unmount)
- [ ] Key handling
- [ ] Rendering
- [ ] Static run() method

### Phase 4: Integration
- [ ] Update index.js exports
- [ ] Update tui.js compatibility

### Phase 5: Testing
- [ ] Create test file
- [ ] Write SelectMenu tests (20+)
- [ ] Write CheckboxMenu tests (20+)
- [ ] Run full test suite

### Phase 6: Documentation
- [ ] Update status docs
- [ ] Create completion doc
- [ ] Final validation

---

## 🔗 Dependencies

### Prerequisites (All Complete ✅)
- Component base class ✅
- VirtualScreen ✅
- KeyReader ✅
- TextInput migration pattern ✅
- Box migration pattern ✅
- Spinner/ProgressBar migration pattern ✅

### Blocks
- FileBrowser migration (Stage 4)
- FindingsBrowser migration (Stage 5)
- ScannerTUI integration (Stage 6)

---

## ⚠️ Key Considerations

1. **KeyReader Conflicts:** Only one active KeyReader at a time
2. **Rendering:** Static methods use stdout.write, Components use VirtualScreen
3. **State Isolation:** Component state ≠ static run() state
4. **Backward Compatibility:** Existing imports must continue working

---

## 📊 Success Metrics

- [ ] 100% API compatibility
- [ ] 40+ tests passing
- [ ] 0 regressions
- [ ] Code follows patterns
- [ ] Documentation updated

---

## 🚀 Quick Start

```bash
# 1. Create menu.js
touch src/tui/components/menu.js

# 2. Implement components (follow patterns from box.js, input.js)

# 3. Update exports
# Edit src/tui/index.js and src/tui.js

# 4. Write tests
touch test/menu-test.js

# 5. Run validation
node scripts/validate-migration.js

# 6. Run tests
node test/menu-test.js
```

---

## 📚 Reference Files

- `src/tui/components/box.js` - Box pattern
- `src/tui/components/input.js` - TextInput pattern
- `src/tui/components/progress.js` - Spinner/ProgressBar pattern
- `src/tui.js:569-754` - Original SelectMenu/CheckboxMenu
- `test/box-test.js` - Test structure example

---

**Ready to migrate? Let's go! 🐕**