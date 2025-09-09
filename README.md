# WhatsApp AI Agent Management Platform

A comprehensive Next.js application for managing WhatsApp AI agents via the [BerryLabs API](https://docs.berrylabs.io/docs/api/wa-agent/overview). This platform provides a complete dashboard for creating, configuring, and managing intelligent WhatsApp chatbots with advanced features like knowledge bases, file references, webhook integrations, and scheduling.

## 🚀 Features

### 📱 Agent Management

- **Create & Configure Agents**: Set up AI agents with custom names, descriptions, and system prompts
- **Multi-language Support**: English and Indonesian language options
- **Agent Dashboard**: View and manage all your agents in a comprehensive table
- **Delete Protection**: Confirmation dialogs prevent accidental deletions

### 🧠 Knowledge Base

- **Document Upload**: Support for PDF, DOCX, and other document formats
- **Text Content**: Add raw text content directly to the knowledge base
- **Smart Library**: Centralized document library with add/remove functionality
- **Auto-Assignment**: Uploaded documents automatically added to agent's knowledge base
- **Status Tracking**: Monitor document processing status (completed, processing, error)

### 📁 File References

- **File Upload**: Upload images, videos, audio, and documents for agent responses
- **Reference Codes**: Automatic generation of file reference codes (e.g., file-A, file-B)
- **Usage Instructions**: Built-in examples showing how to use file references in prompts
- **Smart Management**: Add files from library or upload new ones directly

### 🔧 Tools & Webhooks

- **Complete Configuration**: Full webhook setup with tabbed interface
- **HTTP Methods**: Support for GET, POST, PUT, PATCH, DELETE
- **Parameter Management**: Configure headers, path params, query params, and body params
- **Tool Testing**: Built-in testing functionality to validate webhook endpoints
- **Dynamic Variables**: Support for LLM prompts and dynamic variables in parameters

### 📞 WhatsApp Connection

- **QR Code Generation**: Easy WhatsApp account connection via QR scanning
- **Multiple Accounts**: Support for multiple WhatsApp accounts per user
- **Real-time Status**: WebSocket integration for live connection status updates
- **Account Management**: Connect, disconnect, and reconnect accounts with confirmation
- **Association Control**: Link specific WhatsApp accounts to individual agents

### ⏰ Scheduling

- **Operating Hours**: Configure daily operating schedules for each agent
- **Timezone Support**: Automatic timezone detection with manual override
- **Always Active Option**: 24/7 operation mode available
- **Day-specific Settings**: Individual schedules for each day of the week

### ⚙️ Advanced Settings

- **AI Behavior**: Configure manual takeover and auto-reset timings
- **Data Collection**: Custom fields for collecting specific information from users
- **Field Management**: Add, edit, and remove data collection fields with validation

## 🛠️ Technical Stack

- **Frontend**: Next.js 15.5.2 with App Router
- **Styling**: Tailwind CSS 4.1.13
- **UI Components**: Shadcn UI with Radix primitives
- **Icons**: Lucide React 0.542.0
- **HTTP Client**: Axios 1.11.0
- **Form Validation**: Zod schemas
- **Notifications**: Sonner toast library
- **Package Manager**: pnpm

## 🔧 Prerequisites

- Node.js 18.0 or higher
- pnpm (recommended) or npm
- BerryLabs account and API key

## 📋 Setup Instructions

### Step 1: Get Your BerryLabs API Key

1. **Register an Account**

   - Go to [app.berrylabs.io/auth/register](https://app.berrylabs.io/auth/register)
   - Complete the registration process
   - Verify your email address if required

2. **Access API Keys**

   - Log in to the BerryLabs platform
   - Click on your user avatar at the bottom left
   - Select "API Keys" from the modal options

3. **Generate API Key**
   - Click "Generate API Key"
   - Give your key a descriptive name (e.g., "WhatsApp AI Development")
   - **Important**: Copy the generated API key immediately
   - Store it securely as it won't be shown again

### Step 2: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd whatsapp-ai

# Install dependencies
pnpm install
# or
npm install
```

### Step 3: Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# BerryLabs API Configuration
NEXT_PUBLIC_BERRYLABS_API_URL=https://api.berrylabs.io
NEXT_PUBLIC_BERRYLABS_API_KEY=your-api-key-here
```

**Replace `your-api-key-here` with your actual BerryLabs API key.**

### Step 4: Start Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage Guide

### Creating Your First Agent

1. **Access Dashboard**: Navigate to the main page to see your agents table
2. **Create Agent**: Click "Create Agent" button in the top right
3. **Configure Basic Info**:
   - Set agent name and description
   - Choose language (English/Indonesian)
   - Write comprehensive system prompt

### Setting Up Knowledge Base

1. **Navigate to Agent Details**: Click on any agent from the table
2. **Go to Agent Tab**: The first tab contains knowledge base configuration
3. **Add Documents**:
   - **Upload File**: Click "Upload File" for PDF, DOCX, etc.
   - **Add Text**: Click "Add Text" for raw text content
   - **From Library**: Use "Add from Library" for previously uploaded documents

### Configuring File References

1. **Upload Files**: Use "Upload File" in the File References section
2. **Reference in Prompts**: Use the generated file codes in your system prompt
   ```
   Example: "When client asks about menu, send file-A"
   ```
3. **View Instructions**: Built-in examples show proper usage patterns

### Setting Up Tools & Webhooks

1. **Add Tool**: Click "Add Tool" in the Tools section
2. **Configure Endpoint**:
   - Set tool name and description
   - Enter webhook URL and HTTP method
3. **Configure Parameters**:
   - **Headers**: Add authentication headers
   - **Path Params**: Define URL path parameters
   - **Query Params**: Set URL query parameters
   - **Body**: Configure request body for POST/PUT/PATCH
4. **Test Tool**: Use built-in testing to validate configuration

### WhatsApp Connection

1. **Go to WhatsApp Tab**: Click the WhatsApp tab in agent details
2. **Generate QR Code**: Click "Connect New Account"
3. **Scan QR**: Use WhatsApp mobile app to scan the displayed QR code
4. **Associate Account**: Toggle the switch to associate account with agent

### Scheduling Configuration

1. **Navigate to Scheduling Tab**: Configure operating hours
2. **Set Mode**:
   - **Always Active**: 24/7 operation
   - **Scheduled**: Custom hours per day
3. **Configure Daily Hours**: Set open/close times for each day
4. **Select Timezone**: Choose appropriate timezone

## 📚 API Documentation

- **Complete API Docs**: [BerryLabs API Documentation](https://docs.berrylabs.io/docs/api/wa-agent/overview)
- **Authentication Guide**: [API Key Authentication](https://docs.berrylabs.io/docs/api/wa-agent/authentication)

## 🔐 Authentication

All API requests require authentication via header:

```bash
xi-api-key: your-api-key
Content-Type: application/json
```

Example request:

```bash
curl -X GET https://api.berrylabs.io/v1/wa/agents \
  -H "xi-api-key: your-api-key" \
  -H "Content-Type: application/json"
```

## 🎨 UI/UX Features

- **Toast Notifications**: Success/error feedback for all operations
- **Auto-scroll**: Automatic scrolling to relevant sections when needed
- **Floating Save CTA**: Context-aware save button appears when changes are made
- **Loading States**: Visual feedback during API operations
- **Responsive Design**: Works on desktop and mobile devices
- **Confirmation Dialogs**: Prevent accidental data loss

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── agent/[id]/        # Agent detail page
│   └── page.tsx           # Main dashboard
├── components/            # Reusable UI components
│   ├── agent-tabs/        # Agent configuration tabs
│   ├── ui/               # Shadcn UI components
│   └── modals/           # Upload and configuration modals
├── lib/                  # Utilities and API configuration
│   ├── api.ts           # BerryLabs API client
│   └── utils.ts         # Helper functions
├── schemas/              # Zod validation schemas
│   └── agent-schema.ts  # Agent data validation
└── types/               # TypeScript type definitions
    ├── agent.ts         # Agent-related types
    ├── files.ts         # File management types
    └── knowledge-base.ts # Knowledge base types
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License & Usage Terms

### 🆓 Free & Open Source

This project is **free and open source** for personal and internal business use. You can:

- Use it for your own WhatsApp AI agents
- Modify the code to suit your needs
- Deploy it for your organization's internal use

### 🤝 Partnership & Reseller Program

If you plan to **resell this solution** or **manage multiple clients**, you'll need:

**📋 Complete Partnership Information**: [BerryLabs Partnership Program](https://berrylabs.io/mitra)

#### Reseller Requirements

- **Reseller API Key**: Required for managing multiple client accounts
- **Client Key**: Needed for end-client management via BerryLabs Partnership Program
- **Authentication**: Follow the [Reseller Authentication Guide](https://docs.berrylabs.io/docs/api/wa-agent/authentication#reseller-authentication)

#### Partnership Benefits

- **Attractive Revenue Sharing**: Up to 60% revenue share for qualified resellers
- Access to reseller API endpoints
- Client management capabilities
- Partner support and resources
- Comprehensive partner training and onboarding

### 🏷️ Branding Requirements

- **Keep BerryLabs Branding**: The "Powered by BerryLabs" branding must remain visible
- **Attribution Required**: Do not remove existing BerryLabs brand elements
- **Whitelabel Options**: Available for qualified partners

#### Whitelabel Program

For custom branding and whitelabel solutions:

- **Contact**: team@berrylabs.io
- **Subject**: Partnership Whitelabel Program
- **Include**: Your use case and partnership requirements

### ⚖️ Usage Summary

- ✅ **Free Use**: Personal and internal business use
- ✅ **Modifications**: Code customization allowed
- ❌ **Reselling**: Requires partnership agreement and reseller keys
- ❌ **Brand Removal**: BerryLabs attribution must remain
- 💼 **Commercial**: Whitelabel options available through partnership

## 🆘 Support

- **API Issues**: Check [BerryLabs Documentation](https://docs.berrylabs.io)
- **Technical Support**: Contact BerryLabs support team
- **Project Issues**: Create an issue in this repository

---

**Powered by BerryLabs** 🍒 - [Visit BerryLabs](https://berrylabs.io)
