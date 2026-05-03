# Phase 2 Migration TODO

> **Start Date:** [Date]
> **Target Completion:** [Date + 6 weeks]
> **Status:** 🟡 In Progress

## 📋 Migration Tasks

### Stage 1: Simple Components (Week 1) ✅ COMPLETE
- [x] **Box Component**
  - [x] Create `src/tui/components/box.js`
  - [x] Implement `Component` base class
  - [x] Add `render(screen, ctx)` method
  - [x] Maintain static `draw()` method
  - [x] Write unit tests
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`

- [x] **TextInput Component**
  - [x] Create `src/tui/components/input.js`
  - [x] Implement `Component` base class
  - [x] Add `render(screen, ctx)` method
  - [x] Add `handleKey(key)` method
  - [x] Maintain static `run()` method
  - [x] Write unit tests
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`

- [x] **confirm Component**
  - [x] Add to `src/tui/components/input.js`
  - [x] Implement `Component` base class
  - [x] Reuse `TextInput` component
  - [x] Maintain `confirm()` function
  - [x] Write unit tests
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`

### Stage 2: Status Indicators (Week 2) ✅ COMPLETE
- [x] **Spinner Component**
  - [x] Create `src/tui/components/progress.js`
  - [x] Implement `Component` base class
  - [x] Add `mount()` / `unmount()` lifecycle
  - [x] Add animation timer
  - [x] Write unit tests
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`

- [x] **ProgressBar Component**
  - [x] Add to `src/tui/components/progress.js`
  - [x] Implement `Component` base class
  - [x] Add `setState()` for progress updates
  - [x] Write unit tests
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`

### Stage 3: Interactive Menus (Week 3) ✅ COMPLETE
- [x] **SelectMenu Component**
  - [x] Create `src/tui/components/menu.js`
  - [x] Implement `Component` base class
  - [x] Add `render(screen, ctx)` method
  - [x] Add `handleKey(key)` method
  - [x] Maintain static `run()` method
  - [x] Write unit tests
  - [x] Write visual regression test
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`
  - [x] Test flicker on rapid keypresses

- [x] **CheckboxMenu Component**
  - [x] Add to `src/tui/components/menu.js`
  - [x] Implement `Component` base class
  - [x] Add `render(screen, ctx)` method
  - [x] Add `handleKey(key)` method
  - [x] Maintain static `run()` method
  - [x] Write unit tests
  - [x] Write visual regression test
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`
  - [x] Test flicker on rapid keypresses

### Stage 4: Complex Components (Week 4) ✅ COMPLETE
- [x] **FileBrowser Component**
  - [x] Create `src/tui/components/browser.js`
  - [x] Implement `Component` base class
  - [x] Add `mount()` lifecycle for async I/O
  - [x] Add `render(screen, ctx)` with virtual scrolling
  - [x] Add `handleKey(key)` for navigation
  - [x] Maintain static `run()` method
  - [x] Write unit tests
  - [x] Write visual regression test
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`
  - [x] Test large directories (performance)

- [x] **LiveProgress Component**
  - [x] Add to `src/tui/components/progress.js`
  - [x] Implement `Component` base class
  - [x] Add `mount()` / `unmount()` lifecycle
  - [x] Add animation timer
  - [x] Add `setState()` for phase updates
  - [x] Write unit tests
  - [x] Write visual regression test
  - [x] Update `src/tui.js` re-exports
  - [x] Test with `ScannerTUI`
  - [x] Test animation smoothness

### Stage 5: Composite Components (Week 5)
- [ ] **FindingsBrowser Component**
  - [ ] Create `src/tui/components/findings.js`
  - [ ] Implement `Component` base class
  - [ ] Use child components (SelectMenu, CheckboxMenu, TextInput, Box)
  - [ ] Add `mount()` / `unmount()` lifecycle
  - [ ] Add `render(screen, ctx)` for each view
  - [ ] Add `handleKey(key)` delegation
  - [ ] Maintain `browse()` method
  - [ ] Write unit tests for each view
  - [ ] Write integration tests
  - [ ] Update `src/tui.js` re-exports
  - [ ] Test with `ScannerTUI`
  - [ ] Test navigation between views

### Stage 6: Integration (Week 5-6)
- [ ] **ScannerTUI Migration**
  - [ ] Create `RenderCoordinator` instance
  - [ ] Replace direct component usage with component tree
  - [ ] Remove manual resize handling
  - [ ] Add proper screen transitions
  - [ ] Test all screens
  - [ ] Test resize handling
  - [ ] Test error recovery

### Stage 7: Testing & Polish (Week 6)
- [ ] **Test Suite**
  - [ ] Write unit tests for all components
  - [ ] Write integration tests for component composition
  - [ ] Write visual regression tests
  - [ ] Write performance benchmarks
  - [ ] Test cross-platform compatibility

- [ ] **Documentation**
  - [ ] Update `TUI_USAGE_GUIDE.md`
  - [ ] Update `README.md`
  - [ ] Create `PHASE2_COMPLETE.md`
  - [ ] Add JSDoc comments to all public APIs
  - [ ] Create migration guide

- [ ] **Release Preparation**
  - [ ] Run full test suite
  - [ ] Performance benchmarking
  - [ ] Update CHANGELOG
  - [ ] Tag release version

---

## 🎯 Success Criteria

### For Each Component:
- [ ] Extends `Component` base class
- [ ] No direct `process.stdout.write()` / `process.stderr.write()` calls
- [ ] Has `render(screen, ctx)` method
- [ ] Has `handleKey(key)` method (if interactive)
- [ ] Uses `setState()` for state changes
- [ ] Has proper `mount()` / `unmount()` lifecycle
- [ ] Maintains backward compatibility
- [ ] Has unit tests
- [ ] Has visual regression test (if applicable)
- [ ] Works with `ScannerTUI`

### For Overall Migration:
- [ ] Zero flicker on resize
- [ ] Zero flicker on state updates
- [ ] All tests passing
- [ ] Performance benchmarks meet targets
- [ ] Backward compatibility maintained
- [ ] Documentation updated

---

## 📊 Progress Tracking

| Week | Stage | Components | Status | Notes |
|------|-------|------------|--------|-------|
| 1 | Simple | Box, TextInput, confirm | ✅ | Complete |
| 2 | Status | Spinner, ProgressBar | ✅ | Complete |
| 3 | Menus | SelectMenu, CheckboxMenu | ✅ | Complete |
| 4 | Complex | FileBrowser, LiveProgress | ✅ | Complete |
| 5 | Composite | FindingsBrowser, ScannerTUI | ⬜ | Not started |
| 6 | Polish | Testing, Documentation | ⬜ | Not started |

---

## 🚨 Blockers & Risks

### Current Blockers
- FindingsBrowser still needs migration

### Identified Risks
1. **FindingsBrowser Complexity** - Mitigated by migrating child components first
2. **Performance Regression** - Mitigated by benchmarks and differential rendering
3. **Breaking Changes** - Mitigated by backward-compatible re-exports

---

## 📝 Notes

### Migration Tips
1. Start with the simplest component (Box) to build confidence
2. Test each component thoroughly before moving to next
3. Use the validation script: `node scripts/validate-migration.js`
4. Run visual regression tests after each component
5. Check for flicker with rapid state updates

### Common Issues
1. Forgetting to use `setState()` instead of direct assignment
2. Not cleaning up timers in `unmount()`
3. Manual resize handling that conflicts with `RenderCoordinator`
4. Missing backward-compatible static methods

---

*Generated by Max 🐶 — "All bark, all byte!"*