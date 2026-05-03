# Phase 2 Migration Order

> **Strategy:** Bottom-up dependency injection - migrate leaf components first, then work up the dependency tree.

## 🎯 Migration Sequence

```
Week 1: Simple Components
┌─────────────────────────────────────────────────────────────┐
│  1. Box           │ Pure rendering, no state, no input      │
│  2. TextInput     │ Simple readline wrapper                 │
│  3. confirm       │ Built on TextInput                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
Week 2: Status Indicators (stderr)
┌─────────────────────────────────────────────────────────────┐
│  4. Spinner       │ Simple animation on stderr              │
│  5. ProgressBar   │ Simple animation on stderr              │
└─────────────────────────────────────────────────────────────┘
                           ↓
Week 3: Interactive Menus (stdout)
┌─────────────────────────────────────────────────────────────┐
│  6. SelectMenu    │ Single-select with keyboard navigation  │
│  7. CheckboxMenu  │ Multi-select with keyboard navigation   │
└─────────────────────────────────────────────────────────────┘
                           ↓
Week 4: Complex Components
┌─────────────────────────────────────────────────────────────┐
│  8. FileBrowser   │ Complex virtual scrolling, async I/O    │
│  9. LiveProgress  │ Multi-line animated progress            │
└─────────────────────────────────────────────────────────────┘
                           ↓
Week 5: Composite Components
┌─────────────────────────────────────────────────────────────┐
│  10. FindingsBrowser │ Depends on SelectMenu, CheckboxMenu, │
│                      │ TextInput, Box                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
Week 5-6: Integration
┌─────────────────────────────────────────────────────────────┐
│  11. ScannerTUI   │ Main application integration            │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Dependency Graph

```
FindingsBrowser
  ├── SelectMenu (already migrated)
  ├── CheckboxMenu (already migrated)
  ├── TextInput (already migrated)
  └── Box (already migrated)

ScannerTUI
  ├── SelectMenu (already migrated)
  ├── CheckboxMenu (already migrated)
  ├── FileBrowser (already migrated)
  ├── LiveProgress (already migrated)
  ├── Spinner (already migrated)
  ├── Box (already migrated)
  ├── TextInput (already migrated)
  └── confirm (already migrated)
```

## 🧪 Testing Order

Migrate and test in this exact order:

1. **Box** - Unit tests, visual regression
2. **TextInput** - Unit tests, integration with readline
3. **confirm** - Unit tests, integration with TextInput
4. **Spinner** - Unit tests, animation timing
5. **ProgressBar** - Unit tests, progress updates
6. **SelectMenu** - Unit tests, keyboard navigation, flicker testing
7. **CheckboxMenu** - Unit tests, multi-select, flicker testing
8. **FileBrowser** - Unit tests, async I/O, virtual scrolling
9. **LiveProgress** - Unit tests, animation, multi-phase updates
10. **FindingsBrowser** - Integration tests with all child components
11. **ScannerTUI** - Full integration testing

## ⏱️ Time Estimates

| Component | Complexity | Estimated Time | Risk |
|-----------|------------|----------------|------|
| Box | Low | 1 day | Low |
| TextInput | Low | 1 day | Low |
| confirm | Low | 0.5 day | Low |
| Spinner | Medium | 1 day | Low |
| ProgressBar | Medium | 0.5 day | Low |
| SelectMenu | Medium | 2 days | Medium |
| CheckboxMenu | Medium | 2 days | Medium |
| FileBrowser | High | 3 days | High |
| LiveProgress | High | 2 days | Medium |
| FindingsBrowser | High | 3 days | High |
| ScannerTUI | Medium | 2 days | Medium |
| **Total** | | **18 days** | |

## 🎯 Success Criteria Per Stage

### Stage 1: Simple Components ✅
- [ ] Box renders correctly to VirtualScreen
- [ ] TextInput handles input and renders
- [ ] confirm wraps TextInput properly
- [ ] All backward compatibility maintained
- [ ] Unit tests passing

### Stage 2: Status Indicators ✅
- [ ] Spinner animates smoothly
- [ ] ProgressBar updates without flicker
- [ ] Both work on stderr
- [ ] Animation timers cleaned up properly
- [ ] Unit tests passing

### Stage 3: Interactive Menus ✅
- [ ] SelectMenu navigates without flicker
- [ ] CheckboxMenu multi-select works
- [ ] Both handle resize correctly
- [ ] Keyboard navigation smooth
- [ ] Visual regression tests passing

### Stage 4: Complex Components ✅
- [ ] FileBrowser handles large directories
- [ ] LiveProgress animates multiple phases
- [ ] Both handle async operations
- [ ] Performance benchmarks met
- [ ] Integration tests passing

### Stage 5: Composite Components ✅
- [ ] FindingsBrowser navigation works
- [ ] All child components integrate
- [ ] Views switch smoothly
- [ ] Search and filter work
- [ ] Integration tests passing

### Stage 6: Integration ✅
- [ ] ScannerTUI uses RenderCoordinator
- [ ] Screen transitions work
- [ ] Resize handling smooth
- [ ] Error recovery works
- [ ] End-to-end tests passing

## 🚨 Critical Path

The critical path is:

1. **TextInput** → **confirm** → **SelectMenu** → **FindingsBrowser**
2. **Box** → **FindingsBrowser**
3. **Spinner/ProgressBar** → **LiveProgress**

If any component in these chains is delayed, it affects downstream components.

## 📈 Progress Tracking

Track progress in `PHASE2_TODO.md` and validate with:
```bash
node scripts/validate-migration.js
```

---

*Generated by Max 🐶 — "All bark, all byte!"*