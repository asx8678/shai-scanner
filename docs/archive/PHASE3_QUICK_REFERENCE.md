# Phase 3 Quick Reference Card

## 🎯 What Changed

**File**: `src/tui-app.js`  
**Method**: `renderScanConfig()` (Lines 177-300)  
**State**: `scanOptions` (Lines 51-65)

---

## 📦 New scanOptions Fields

```javascript
liveSources: [],      // ['osv', 'github']
liveLimit: 5000,      // Max queries (positive integer)
audit: false,         // npm/pnpm/yarn audit
maxDepth: 10,         // 1-100
failOnAdvisory: false, // Exit 1 on live advisories
failOnWarning: false,  // Exit 1 on suspicious findings
```

---

## 🔄 Configuration Flow

```
1. 📦 Scan Phases → CheckboxMenu
2. 📁 Scan Path → TextInput
3. 🔍 Live Advisories → confirm()
   └─ If enabled:
      ├─ 📡 Sources → CheckboxMenu
      └─ 🔢 Limit → TextInput
4. 📋 Audit → confirm()
5. 📊 Tuning:
   ├─ Max Depth → TextInput (1-100)
   ├─ Fail on Advisory → confirm()
   └─ Fail on Warning → confirm()
6. 📝 Summary Box → confirm() to proceed
```

---

## 🧩 Components Used

| Component | Purpose |
|-----------|---------|
| `CheckboxMenu` | Scan phases, advisory sources |
| `TextInput` | Path, liveLimit, maxDepth |
| `confirm()` | Boolean toggles |
| `Box.draw()` | Summary display |

---

## ✅ Validation Rules

| Field | Validation | Default |
|-------|-----------|---------|
| `liveLimit` | > 0 | 5000 |
| `maxDepth` | 1-100 | 10 |
| `path` | Required | '.' |
| `liveSources` | Only if live=true | [] |

---

## 🎨 Visual Elements

- 📦 Scan Phases section
- 📁 Scan Path input
- 🔍 Live Advisories toggle
- 📡 Advisory Sources selection
- 🔢 Query Limit input
- 📋 Audit toggle
- 📊 Scan Tuning section
- ⚠️  Fail on Advisory
- 🚨 Fail on Warning
- 📝 Summary Box (cyan border)

---

## 🚀 Next Steps (Phase 4)

1. Update `renderScanning()` to pass options to Scanner
2. Implement live advisory queries
3. Implement audit functionality
4. Apply tuning parameters
5. Handle fail conditions

---

## 💡 Example Output

```javascript
{
  paths: ['./my-project'],
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true,
  includeIocFiles: true,
  live: true,
  liveSources: ['osv', 'github'],
  liveLimit: 5000,
  audit: true,
  maxDepth: 10,
  failOnAdvisory: true,
  failOnWarning: false
}
```

---

## ✨ Key Improvements

✓ All CLI flags now accessible via TUI  
✓ Grouped logical sections  
✓ Input validation  
✓ Visual summary  
✓ Conditional sub-options  
✓ Backward compatible  
✓ No breaking changes  

---

**Status**: ✅ COMPLETE  
**Ready for**: Phase 4 (Scanner Integration)
