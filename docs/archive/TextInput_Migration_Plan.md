# TextInput Component Migration Plan

## 🎯 Overview

TextInput is a simple readline wrapper that provides single-line text input. It's the foundation for the critical path: `TextInput → confirm → SelectMenu → FindingsBrowser`.

## 📊 Current State Analysis

### **TextInput Implementation** (src/tui.js:776-810)

**Key Methods:**
- `static async run(options)` - Main entry point for text input

**Options Interface:**
```javascript
{
  prompt: string,      // Display prompt text
  defaultValue: string, // Default value if no input
  color: boolean       // Enable/disable color (default: true)
}
```

**Functionality:**
1. **TTY Detection**: Checks if stdin/stdout are TTY for interactive mode
2. **Non-TTY Fallback**: Returns defaultValue without user interaction
3. **Readline Interface**: Uses `node:readline/promises` for proper line editing
4. **Prompt Formatting**: Bold prompt with optional dimmed default value
5. **Input Processing**: Trims whitespace, returns defaultValue if empty
6. **Error Handling**: Catches Ctrl+C and other errors, returns null

**Dependencies:**
- `node:process` (stdin, stdout)
- `node:readline/promises` (createInterface)
- `./utils.js` (colorize)

### **Usage in Codebase:**

1. **src/tui-app.js** (5 usages):
   - Live query limit input
   - Max search depth input
   - Filename input
   - Package spec input
   - Custom query input

2. **src/tui-findings.js** (1 usage):
   - Search query input

3. **src/tui/index.js** (1 export):
   - Re-exported for backward compatibility

### **confirm Function** (src/tui.js:821-855):
- Built on TextInput pattern (same readline logic)
- Yes/no prompt with `[Y/n]` or `[y/N]` hints
- Recursive retry on invalid input
- **Note**: confirm is NOT a TextInput subclass, but shares similar logic

## 🎯 Migration Requirements

### **Phase 2 Goal:**
Create `src/tui/components/input.js` that:
1. **Extends Component base class**
2. **Maintains backward compatibility** via static `run()` method
3. **Uses Component lifecycle** for input handling
4. **Implements render()** for VirtualScreen integration
5. **Handles keypresses** via `handleKey()`

### **Success Criteria:**
- [ ] Extends `Component` base class
- [ ] No direct `process.stdout.write()` calls
- [ ] Uses `setState()` for input buffer updates
- [ ] Maintains backward-compatible `TextInput.run()` method
- [ ] Handles edge cases (empty input, special characters)
- [ ] Cleans up readline in `unmount()`
- [ ] Comprehensive test coverage

## 🛠️ Implementation Plan

### **Step 1: Create Component Structure**

```javascript
// src/tui/components/input.js
import { Component } from '../core/component.js'
import { colorize } from '../../utils.js'
import { stdin as processStdin, stdout as processStdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

export class TextInput extends Component {
  constructor(options = {}) {
    super(options)
    this.#prompt = options.prompt || ''
    this.#defaultValue = options.defaultValue || ''
    this.#color = options.color !== false
    this.#inputBuffer = ''
    this.#cursorPosition = 0
    this.#rl = null
  }
  
  // Private fields
  #prompt
  #defaultValue
  #color
  #inputBuffer
  #cursorPosition
  #rl
}
```

### **Step 2: Implement Lifecycle Methods**

```javascript
mount() {
  super.mount()
  this.#setupReadline()
}

unmount() {
  this.#cleanupReadline()
  super.unmount()
}

#setupReadline() {
  if (!processStdin.isTTY || !processStdout.isTTY) {
    // Non-TTY: set default value directly
    this.setState({ 
      inputBuffer: this.#defaultValue,
      complete: true 
    })
    return
  }
  
  this.#rl = createInterface({
    input: processStdin,
    output: processStdout,
  })
}

#cleanupReadline() {
  if (this.#rl) {
    this.#rl.close()
    this.#rl = null
  }
}
```

### **Step 3: Implement Key Handling**

```javascript
handleKey(key) {
  if (this.state.complete) return false
  
  if (key.name === 'return') {
    // Submit input
    this.setState({ 
      inputBuffer: this.#inputBuffer.trim() || this.#defaultValue,
      complete: true 
    })
    return true
  }
  
  if (key.name === 'escape') {
    // Cancel
    this.setState({ 
      inputBuffer: null,
      complete: true 
    })
    return true
  }
  
  if (key.name === 'backspace') {
    // Delete character
    this.#inputBuffer = this.#inputBuffer.slice(0, -1)
    this.setState({ inputBuffer: this.#inputBuffer })
    return true
  }
  
  if (key.char) {
    // Add character
    this.#inputBuffer += key.char
    this.setState({ inputBuffer: this.#inputBuffer })
    return true
  }
  
  return false
}
```

### **Step 4: Implement Render Method**

```javascript
render(screen, ctx) {
  const c = colorize(this.#color)
  const promptStr = `${c.bold(this.#prompt)}`
  
  // Build display string
  let display = promptStr
  if (!this.state.complete && this.#defaultValue) {
    display += `${c.dim(`(${this.#defaultValue}) `)}`
  }
  
  if (!this.state.complete) {
    display += this.#inputBuffer
  }
  
  // Write to virtual screen
  const startRow = ctx?.bounds?.row ?? 0
  screen.setLine(startRow, display)
}
```

### **Step 5: Maintain Backward Compatibility**

```javascript
static async run(options = {}) {
  return new Promise((resolve) => {
    const input = new TextInput(options)
    input.mount()
    
    // Watch for completion
    const checkComplete = () => {
      if (input.state.complete) {
        input.unmount()
        resolve(input.state.inputBuffer)
        return
      }
      setTimeout(checkComplete, 50)
    }
    
    checkComplete()
  })
}
```

## 📋 Migration Checklist

### **Core Implementation:**
- [ ] Create `src/tui/components/input.js`
- [ ] Extend `Component` base class
- [ ] Implement constructor with options
- [ ] Implement `mount()` method
- [ ] Implement `unmount()` method
- [ ] Implement `handleKey()` method
- [ ] Implement `render()` method
- [ ] Implement static `run()` method

### **Testing:**
- [ ] Create `test/input-test.js`
- [ ] Test module exports
- [ ] Test inheritance from Component
- [ ] Test component methods
- [ ] Test TextInput-specific properties
- [ ] Test static `run()` method
- [ ] Test key handling
- [ ] Test edge cases (empty input, special characters)
- [ ] Test TTY vs non-TTY behavior

### **Integration:**
- [ ] Update `src/tui/index.js` to export from new location
- [ ] Update imports in `src/tui-app.js`
- [ ] Update imports in `src/tui-findings.js`
- [ ] Update `scripts/validate-migration.js`
- [ ] Run existing tests to ensure backward compatibility

### **Documentation:**
- [ ] Update `PHASE2_STATUS_REPORT.md`
- [ ] Update `PHASE2_README.md`
- [ ] Update `PHASE2_MIGRATION_ORDER.md`

## ⚠️ Considerations

### **Challenges:**
1. **Readline Integration**: Need to handle readline lifecycle properly
2. **TTY Detection**: Must maintain non-TTY fallback behavior
3. **Backward Compatibility**: Static `run()` method must work exactly as before
4. **Error Handling**: Ctrl+C and other errors must return null

### **Risks:**
1. **Behavior Changes**: Any deviation from current behavior could break existing code
2. **Performance**: Additional overhead from Component lifecycle
3. **Complexity**: More code to maintain than current simple implementation

### **Mitigation:**
1. **Comprehensive Tests**: Ensure all edge cases are covered
2. **Behavioral Parity**: Test with existing codebase before and after
3. **Incremental Migration**: Start with TextInput, then confirm

## 🎯 Timeline

**Estimated Time:** 1 day  
**Complexity:** Low  
**Dependencies:** None (leaf component)

## 🚀 Next Steps

1. **Review this plan** with the team
2. **Start implementation** following the steps above
3. **Write tests** before implementing
4. **Test integration** with existing code
5. **Update documentation** and move to next component

## 📝 Notes

- TextInput is a simple component but critical for the migration path
- The confirm function shares similar logic but is separate
- We can consider refactoring confirm to use TextInput internally after migration
- The static `run()` method is essential for backward compatibility
- We should maintain the exact same behavior to avoid breaking changes

---

*Plan created by Max 🐶 for Phase 2 migration*