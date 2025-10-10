# Workflow Canvas Guide - OpenAI AgentKit Style

## 🎉 New Features Implemented

Your Workflow Canvas now works like OpenAI's AgentKit with a professional, intuitive interface!

## ✨ Key Features

### 1. **New Workflow Creation**
- Click **"+ New Workflow"** in the left sidebar
- Canvas automatically resets and clears all nodes
- Start fresh with a clean slate every time

### 2. **Drag & Drop Nodes**
- Drag any component from the left sidebar (Triggers, Agents, Actions, Logic, Integrations)
- Drop anywhere on the canvas
- Nodes automatically snap into place
- Visual preview while dragging

### 3. **Interactive Node Connections**
- **Create Connection**: 
  - Click and drag from the **right circle** (output handle) of any node
  - Drag to the **left circle** (input handle) of another node
  - Release to create the connection
  - See animated dashed line while dragging

- **Delete Connection**: 
  - Hold `Shift` or `Ctrl` and click on any connection line
  - Connection will be removed instantly

### 4. **Node Management**
- **Select Node**: Click on any node to select it (shows in Properties Panel)
- **Move Node**: Click and drag nodes anywhere on the canvas
- **Visual Feedback**: 
  - Hover effects on nodes
  - Selected nodes have a primary color ring
  - Connection handles grow on hover

### 5. **Canvas Controls**

#### Zoom Controls (Top Left)
- **Zoom In**: `+` button
- **Zoom Out**: `-` button  
- **Reset View**: Maximize button
- **Current Zoom**: Displayed as percentage
- **Node Counter**: Shows total nodes and connections

#### Execution Controls (Top Right)
- **Execute**: Start workflow execution
- **Stop**: Stop running workflow

### 6. **Empty State Guide**
When canvas is empty, you'll see:
- Welcome message with instructions
- 3-step visual guide (Trigger → Agent → Action)
- Helpful tip about creating connections

## 🎨 Visual Improvements

### Connection Lines
- Smooth bezier curves between nodes
- Animated dashed lines while creating connections
- Hover effects on connections (thicker, highlighted)
- Arrowheads showing direction of flow

### Node Design
- Clean, modern card design
- Color-coded by type:
  - 🟢 **Triggers**: Green
  - 🟠 **Agents**: Orange (Primary)
  - 🔵 **Actions**: Blue
  - 🟣 **Logic**: Purple
- Status badges with animated indicators
- Connection handles with hover effects

### Canvas
- Grid background for alignment
- Infinite scrolling workspace
- Smooth zoom and pan
- Drop zone highlight when dragging

## 🚀 Workflow Quick Start

1. **Start a New Workflow**
   ```
   Click "+ New Workflow" → Canvas resets
   ```

2. **Add Your First Node**
   ```
   Drag "Webhook Trigger" from sidebar → Drop on canvas
   ```

3. **Add an Agent**
   ```
   Drag "Claude Agent" → Drop next to trigger
   ```

4. **Connect Them**
   ```
   Drag from Trigger's right circle → Drop on Agent's left circle
   ```

5. **Add an Action**
   ```
   Drag "Database Query" → Connect Agent to Action
   ```

6. **Configure & Execute**
   ```
   Select any node → Edit in Properties Panel → Click Execute
   ```

## 💡 Pro Tips

### Keyboard Shortcuts
- `Shift/Ctrl + Click` on connection = Delete connection
- `Click + Drag` on node = Move node
- `Click` on canvas background = Deselect all

### Best Practices
1. **Start with a Trigger**: Every workflow needs an entry point
2. **Use Agents for Logic**: Place Claude agents for reasoning
3. **End with Actions**: Finish workflows with concrete actions
4. **Connect Sequentially**: Build logical flow from left to right
5. **Test Incrementally**: Execute after each major addition

### Connection Management
- Connections flow from right to left
- Each node can have multiple inputs and outputs
- Avoid circular connections (A → B → A)
- Use Logic nodes for branching paths

## 🔧 Technical Details

### Authentication (Dev Mode)
- Development mode bypasses real OTP
- Enter any email and any 6-digit code (e.g., `123456`)
- Instant login for testing

### Data Persistence
- Workflows auto-save to backend
- Nodes and connections stored in real-time
- Resume work anytime with saved workflows

### Execution Engine
- Real-time status updates
- Node-by-node execution tracking
- Error handling and retry logic
- Performance metrics and analytics

## 🎯 Coming Soon

- [ ] Multi-select nodes
- [ ] Copy/paste nodes
- [ ] Undo/redo functionality
- [ ] Template workflows
- [ ] Workflow version control
- [ ] Collaborative editing
- [ ] Export/import workflows

---

**Enjoy building powerful AI agent workflows! 🚀**

For questions or issues, check the console logs or reach out to the development team.
