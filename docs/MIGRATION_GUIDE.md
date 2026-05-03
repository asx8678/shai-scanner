# Migration Guide: Legacy TUI to Component-Based Architecture

This guide helps you migrate from the legacy TUI implementation to the new component-based architecture introduced in Phase 4.

## Overview of Changes

The new architecture provides:

- **Component-based design** with lifecycle management
- **Differential rendering** for better performance
- **Clean separation of concerns** between rendering, input handling, and state
- **Backward compatibility** maintained for existing code

## Breaking Changes

**None** — The new architecture maintains full backward compatibility. All existing imports and usage patterns continue to work.

## What Changed

### 1. Component Lifecycle

**Legacy:**
```javascript
// Legacy components had ad-hoc initialization
const menu = new SelectMenu(options)
// Manual setup required
menu.reader = new KeyReader()
menu.setupResizeHandler()
```

**New:**
```javascript
// Components now have proper lifecycle
const menu = new SelectMenu(options)
menu.mount()      // Automatic setup
menu.unmount()    // Automatic cleanup
```

### 2. Rendering System

**Legacy:**
```javascript
// Direct terminal output
process.stdout.write(ansiEscapeCodes)
console.log(renderedText)
```

**New:**
```javascript
// Virtual screen buffer with differential rendering
const screen = new VirtualScreen(cols, rows)
component.render(screen, ctx)
renderer.render(screen) // Only changed rows sent to terminal
```

### 3. State Management

**Legacy:**
```javascript
// Manual re-rendering
this.selected = index
this.render() // Manual call required
```

**New:**
```javascript
// Automatic re-rendering on state change
this.setState({ selected: index }) // Triggers render
// Or manual request
this.requestRender()
```

### 4. Component Hierarchy

**Legacy:**
```javascript
// Flat component structure
const components = [menu, input, progress]
components.forEach(c => c.render())
```

**New:**
```javascript
// Parent-child relationships
parent.addChild(child)
// Automatic lifecycle management
```

## Migration Steps

### Step 1: Update Imports (Optional)

All legacy imports continue to work:

```javascript
// Legacy imports still work
import { SelectMenu, TextInput, ProgressBar } from 'shai-scanner/tui.js'

// New imports (recommended)
import { SelectMenu, TextInput, ProgressBar } from 'shai-scanner/tui'
```

### Step 2: Use Lifecycle Methods (Recommended)

Replace manual setup/cleanup with lifecycle methods:

```javascript
// Before
class MyComponent {
  constructor() {
    this.setupEventListeners()
    this.setupResizeHandler()
  }
  
  destroy() {
    this.removeEventListeners()
    this.removeResizeHandler()
  }
}

// After
class MyComponent extends Component {
  mount() {
    super.mount()
    this.setupEventListeners()
    this.setupResizeHandler()
  }
  
  unmount() {
    super.unmount()
    this.removeEventListeners()
    this.removeResizeHandler()
  }
}
```

### Step 3: Use setState() for Updates (Recommended)

Replace manual re-rendering with state management:

```javascript
// Before
this.selected = index
this.render()

// After
this.setState({ selected: index })
// Or for immediate render
this.requestRender()
```

### Step 4: Use VirtualScreen for Rendering (Optional)

For custom rendering, use VirtualScreen instead of direct terminal output:

```javascript
// Before
process.stdout.write('\x1b[1;32mGreen text\x1b[0m')

// After
screen.setLine(row, 'Green text', 'bold:green')
// Or with segments
screen.setLine(row, 'Mixed text', {
  segments: [
    { col: 0, len: 5, attribute: 'bold' },
    { col: 5, len: 4, attribute: 'green' }
  ]
})
```

## Backward Compatibility

### Preserved APIs

All existing public APIs remain unchanged:

- `SelectMenu.run(options)` — Static method still works
- `TextInput.run(options)` — Static method still works  
- `ProgressBar` — Constructor API unchanged
- `FileBrowser` — Constructor API unchanged
- `FindingsBrowser` — Constructor API unchanged
- `Box.draw(options)` — Static method still works

### Import Paths

Both import paths work:

```javascript
// Legacy path (still works)
import { SelectMenu } from 'shai-scanner/tui.js'

// New path (recommended)
import { SelectMenu } from 'shai-scanner/tui'

// Direct component imports (advanced)
import { SelectMenu } from 'shai-scanner/tui/components/menu.js'
```

### Static Methods

All static methods preserved:

```javascript
// These all still work
await SelectMenu.run({ title: 'Pick:', items: [...] })
await TextInput.run({ prompt: 'Enter: ' })
const boxStr = Box.draw({ title: 'Status', lines: [...] })
```

## New Features (Optional Usage)

### Component Lifecycle

```javascript
class MyComponent extends Component {
  mount() {
    // Called when added to component tree
    super.mount()
    this.loadData()
  }
  
  unmount() {
    // Called when removed from tree
    super.unmount()
    this.cleanup()
  }
}
```

### State Management

```javascript
class MyComponent extends Component {
  constructor(options) {
    super(options)
    this.state = { count: 0 }
  }
  
  increment() {
    this.setState({ count: this.state.count + 1 })
  }
}
```

### Component Hierarchy

```javascript
const parent = new Component()
const child1 = new Component()
const child2 = new Component()

parent.addChild(child1)
parent.addChild(child2)

// Automatic lifecycle
parent.mount() // Also mounts children
parent.unmount() // Also unmounts children
```

### Differential Rendering

```javascript
const coordinator = new RenderCoordinator()
coordinator.initialize()

const component = new MyComponent()
coordinator.registerComponent(component)

// Renders only changed rows
component.setState({ data: newData })
```

## Performance Improvements

The new architecture includes several performance optimizations:

1. **Differential Rendering** — Only changed rows are sent to the terminal
2. **Render Batching** — Multiple state changes in the same tick result in one render
3. **Dirty Tracking** — Components track which rows need updating
4. **Virtual Screen** — Full screen buffer for accurate diffing

## Testing

Components are now easier to test:

```javascript
// Unit testing
const component = new MyComponent(options)
component.mount()
component.setState({ data: testData })
const output = component.renderToScreen() // Returns VirtualScreen content
component.unmount()

// Integration testing with coordinator
const coordinator = new RenderCoordinator({ cols: 80, rows: 24 })
coordinator.registerComponent(component)
// Simulate keypresses
component.handleKey({ name: 'down' })
// Check rendered output
const screen = coordinator.screen
expect(screen.getLine(0)).toContain('Expected text')
```

## Examples

### Migration Example: SelectMenu

**Legacy:**
```javascript
import { SelectMenu } from 'shai-scanner/tui.js'

const menu = new SelectMenu({
  title: 'Choose:',
  items: [{ label: 'Option 1', value: '1' }]
})

// Manual rendering
process.stdout.write(menu.render())
const result = await menu.getResult()
```

**New:**
```javascript
import { SelectMenu } from 'shai-scanner/tui'

// Static usage (unchanged)
const result = await SelectMenu.run({
  title: 'Choose:',
  items: [{ label: 'Option 1', value: '1' }]
})

// Or component usage
const menu = new SelectMenu({
  title: 'Choose:',
  items: [{ label: 'Option 1', value: '1' }]
})

menu.mount()
menu.render(screen, ctx)
const value = await menu.getValue()
menu.unmount()
```

### Migration Example: Custom Component

**Legacy:**
```javascript
class StatusDisplay {
  constructor() {
    this.lines = []
    this.setupResize()
  }
  
  setupResize() {
    process.stdout.on('resize', () => this.render())
  }
  
  render() {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    this.lines.forEach(line => process.stdout.write(line + '\n'))
  }
  
  destroy() {
    process.stdout.removeListener('resize', this.render)
  }
}
```

**New:**
```javascript
import { Component } from 'shai-scanner/tui'

class StatusDisplay extends Component {
  constructor(options) {
    super(options)
    this.lines = []
  }
  
  mount() {
    super.mount()
    // Resize handling is automatic
  }
  
  render(screen, ctx) {
    this.lines.forEach((line, i) => {
      screen.setLine(ctx.bounds.row + i, line)
    })
  }
  
  unmount() {
    // Cleanup is automatic
    super.unmount()
  }
  
  addLine(line) {
    this.lines.push(line)
    this.requestRender()
  }
}
```

## Troubleshooting

### Component not rendering

- Ensure `mount()` is called
- Check that `render()` writes to the screen parameter
- Verify component is registered with coordinator

### State updates not reflecting

- Use `setState()` instead of direct property assignment
- Call `requestRender()` for immediate updates
- Check component is mounted

### Memory leaks

- Ensure `unmount()` cleans up resources
- Remove event listeners in `unmount()`
- Use coordinator's cleanup methods

### Performance issues

- Use `setState()` for batched updates
- Avoid unnecessary re-renders
- Use dirty tracking in VirtualScreen

## Support

For issues or questions:
1. Check this migration guide
2. Review component documentation in `docs/TUI_USAGE_GUIDE.md`
3. Look at examples in `src/tui/components/`
4. Run tests to verify compatibility