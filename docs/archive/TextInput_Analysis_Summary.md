# TextInput Component Analysis Summary

## 🎯 Executive Summary

TextInput is a simple readline wrapper that provides single-line text input functionality. It's a critical component in the migration path for Phase 2, serving as the foundation for `confirm → SelectMenu → FindingsBrowser`.

## 📊 Current Implementation Analysis

### **TextInput Class** (src/tui.js:776-810)

**Structure:**
- Simple class with a single static method `run(options)`
- Uses `node:readline/promises` for interactive input
- Handles both TTY and non-TTY environments

**Method Signature:**
```javascript
static async run(options = {})
```

**Options:**
```javascript
{
  prompt: string,      // Display prompt text (default: '')
  defaultValue: string, // Default value if no input (default: '')
  color: boolean       // Enable/disable color (default: true)
}
```

**Return Value:**
- `string` - The trimmed input or defaultValue
- `null` - On error or Ctrl+C

### **Key Behaviors:**

1. **TTY Detection**: Checks `process.stdin.isTTY` and `process.stdout.isTTY`
2. **Non-TTY Fallback**: Returns defaultValue without user interaction
3. **Readline Interface**: Creates interface for line editing
4. **Prompt Formatting**: 
   - Bold prompt text
   - Dimmed default value in parentheses: `(defaultValue)`
5. **Input Processing**: Trims whitespace, returns defaultValue if empty
6. **Error Handling**: Catches Ctrl+C and other errors, returns null

### **Dependencies:**
- `node:process` (stdin, stdout)
- `node:readline/promises` (createInterface)
- `./utils.js` (colorize)

## 🎯 Usage Analysis

### **Current Usages:**

1. **src/tui-app.js** (5 occurrences):
   ```javascript
   const liveLimit = await TextInput.run({
     prompt: '🔢 Live query limit: ',
     defaultValue: String(this.scanOptions.liveLimit),
   });
   
   const maxDepth = await TextInput.run({
     prompt: '📊 Max search depth (1-100): ',
     defaultValue: String(this.scanOptions.maxDepth),
   });
   
   const filename = await TextInput.run({
     prompt: '📁 Output filename: ',
     defaultValue: 'shai-results.json',
   });
   
   const spec = await TextInput.run({
     prompt: '📦 Package spec (name or name@version): ',
   });
   
   const query = await TextInput.run({
     prompt: '🔍 Custom query: ',
   });
   ```

2. **src/tui-findings.js** (1 occurrence):
   ```javascript
   const query = await TextInput.run({
     prompt: '🔍 Search: ',
     defaultValue: this.#searchQuery,
   });
   ```

3. **src/tui/index.js** (1 export):
   ```javascript
   export { TextInput } from '../tui.js'
   ```

### **Pattern Analysis:**
- All usages follow the same pattern: `TextInput.run({ prompt, defaultValue })`
- Used for simple text input (numbers, strings)
- No complex validation or processing
- Returns string or null

## 🔄 Relationship with confirm

### **Similarities:**
- Both use readline/promises
- Both handle TTY/non-TTY environments
- Both return user input or default value
- Both handle errors (Ctrl+C)

### **Differences:**
- `confirm` is a function, not a class
- `confirm` has specialized Y/N parsing
- `confirm` has recursive retry on invalid input
- `confirm` doesn't have a `run()` method pattern

### **Potential Refactoring:**
After TextInput migration, consider refactoring `confirm` to:
1. Extend TextInput
2. Override input handling for Y/N parsing
3. Add retry logic

## 🛠️ Migration Path

### **Phase 2 Strategy:**
1. **TextInput** (Low complexity, leaf component)
2. **confirm** (Built on TextInput)
3. **SelectMenu** (Higher complexity)
4. **FindingsBrowser** (Most complex)

### **TextInput Migration:**
- **Estimated Time**: 1 day
- **Complexity**: Low
- **Dependencies**: None
- **Risk**: Low

## 📋 Key Requirements

### **Backward Compatibility:**
- Static `run()` method must work exactly as before
- Same options interface
- Same return values (string or null)
- Same error handling behavior

### **Component Integration:**
- Extend `Component` base class
- Implement lifecycle methods (`mount`, `unmount`)
- Implement `handleKey()` for keypress handling
- Implement `render()` for VirtualScreen
- Use `setState()` for state management

### **Testing:**
- Unit tests for all methods
- Integration tests with existing codebase
- Edge case testing (empty input, special characters)
- TTY vs non-TTY behavior testing

## ⚠️ Critical Considerations

### **Challenges:**
1. **Readline Lifecycle**: Must properly manage readline creation/cleanup
2. **TTY Detection**: Must maintain non-TTY fallback behavior
3. **Error Handling**: Must preserve exact error behavior
4. **Performance**: Minimal overhead from Component lifecycle

### **Risks:**
1. **Behavior Changes**: Any deviation could break existing code
2. **Breaking Changes**: Must maintain exact API compatibility
3. **Integration Issues**: Must work with existing codebase

### **Mitigation:**
1. **Comprehensive Tests**: Cover all edge cases
2. **Behavioral Parity Testing**: Compare before/after behavior
3. **Incremental Migration**: Start with TextInput, then confirm

## 🎯 Success Metrics

### **Functional Requirements:**
- [ ] Extends Component base class
- [ ] No direct `process.stdout.write()` calls
- [ ] Uses `setState()` for input buffer updates
- [ ] Maintains backward-compatible `TextInput.run()` method
- [ ] Handles edge cases (empty input, special characters)
- [ ] Cleans up readline in `unmount()`

### **Non-Functional Requirements:**
- [ ] Zero breaking changes
- [ ] Same performance characteristics
- [ ] Same memory footprint
- [ ] Same error handling behavior

## 🚀 Next Steps

1. **Review Analysis**: Confirm understanding of requirements
2. **Create Test Cases**: Write comprehensive tests first
3. **Implement Component**: Follow migration plan
4. **Test Integration**: Verify with existing codebase
5. **Update Documentation**: Update Phase 2 docs
6. **Move to confirm**: Next component in migration path

## 📝 Notes

- TextInput is simple but critical for the migration path
- The static `run()` method is essential for backward compatibility
- Consider refactoring confirm to use TextInput internally after migration
- Maintain exact behavior to avoid breaking changes

---

*Analysis completed by Max 🐶 for Phase 2 migration*