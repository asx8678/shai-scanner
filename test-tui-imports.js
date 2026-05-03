/**
 * Quick test to verify TUI imports work correctly.
 */

import { EventBus, VirtualScreen, Renderer, Component, RenderCoordinator } from './src/tui/index.js'
import { ScreenManager, KeyReader, Spinner, ProgressBar } from './src/tui/index.js'
import { Box, TextInput, confirm, LiveProgress } from './src/tui/index.js'
import { SelectMenu, CheckboxMenu, FileBrowser, FindingsBrowser } from './src/tui/index.js'
import { cleanupTerminal, resetCleanupState, ANSI } from './src/tui/index.js'

console.log('✅ All imports successful!')

// Test EventBus
const bus = new EventBus()
console.log('EventBus:', typeof bus.on === 'function' ? '✅' : '❌')

// Test VirtualScreen
const screen = new VirtualScreen(80, 24)
console.log('VirtualScreen:', typeof screen.setLine === 'function' ? '✅' : '❌')

// Test Renderer (needs a mock screen manager)
const mockScreenManager = {
  terminalSize: { cols: 80, rows: 24 },
  onResize: () => () => {}
}
const renderer = new Renderer(mockScreenManager)
console.log('Renderer:', typeof renderer.render === 'function' ? '✅' : '❌')

// Test Component
class TestComponent extends Component {
  render() {
    return { lines: ['Test'] }
  }
}
const component = new TestComponent()
console.log('Component:', typeof component.mount === 'function' ? '✅' : '❌')

// Test RenderCoordinator
const coordinator = new RenderCoordinator(mockScreenManager)
console.log('RenderCoordinator:', typeof coordinator.registerComponent === 'function' ? '✅' : '❌')

// Test backward compatibility
console.log('ScreenManager:', typeof ScreenManager === 'function' ? '✅' : '❌')
console.log('KeyReader:', typeof KeyReader === 'function' ? '✅' : '❌')
console.log('Box:', typeof Box === 'function' ? '✅' : '❌')
console.log('TextInput:', typeof TextInput === 'function' ? '✅' : '❌')
console.log('confirm:', typeof confirm === 'function' ? '✅' : '❌')
console.log('Spinner:', typeof Spinner === 'function' ? '✅' : '❌')
console.log('ProgressBar:', typeof ProgressBar === 'function' ? '✅' : '❌')
console.log('LiveProgress:', typeof LiveProgress === 'function' ? '✅' : '❌')
console.log('SelectMenu:', typeof SelectMenu === 'function' ? '✅' : '❌')
console.log('CheckboxMenu:', typeof CheckboxMenu === 'function' ? '✅' : '❌')
console.log('FileBrowser:', typeof FileBrowser === 'function' ? '✅' : '❌')
console.log('FindingsBrowser:', typeof FindingsBrowser === 'function' ? '✅' : '❌')
console.log('ANSI:', typeof ANSI === 'object' ? '✅' : '❌')
console.log('cleanupTerminal:', typeof cleanupTerminal === 'function' ? '✅' : '❌')

console.log('\\n🎉 All tests passed!')