# OpsToMP - Obsidian to WeChat Official Account Tool

A comprehensive Obsidian plugin for converting and publishing Markdown notes to WeChat Official Accounts.

---

## Project Introduction

OpsToMP is an Obsidian plugin that provides a complete solution to help users convert and publish Markdown notes from Obsidian to WeChat Official Accounts.

- **Obsidian Plugin**: Integrated plugin within Obsidian with a graphical interface and real-time preview

---

## Features

- 📝 **Markdown to HTML**: Convert Markdown format to HTML compatible with WeChat Official Accounts
- 👁️ **Real-time Preview**: Preview WeChat Official Account rendering effects within Obsidian
- 📤 **Upload to Drafts**: One-click upload to WeChat Official Account drafts
- 🚀 **Direct Publishing**: Support for direct publishing to WeChat Official Accounts
- 🖼️ **Image Support**: Automatically upload local images to WeChat server, supporting `file:///` URLs and Obsidian internal links
- 🎨 **Style Beautification**: Automatically apply WeChat Official Account style with multiple themes support
- 🔒 **Security Protection**: Built-in XSS protection, filtering dangerous tags and attributes
- 🌐 **Network Testing**: Test network connectivity and API key validity
- ✨ **One-Click Formatting**: Support multiple formatting options including paragraph spacing, heading unification, image optimization, quote styling, code block beautification, list formatting, and removing extra line breaks
- 📋 **Content Management**: View and manage drafts and published articles lists
- 🗑️ **Delete Function**: Delete drafts or published articles



---

## Project Structure

```
OpsToMP/
├── plugin-build/              # Obsidian plugin build directory
│   ├── src/                   # Source code
│   │   ├── api.js            # WeChat Official Account API wrapper
│   │   ├── main.js           # Plugin main file
│   │   ├── settings.js       # Settings page
│   │   ├── sidebar.js        # Sidebar view
│   │   ├── styles.css        # Styles file
│   │   └── utils.js          # Utility functions
│   ├── build/                # Build output (for release)
│   │   ├── main.js           # Compiled plugin
│   │   ├── manifest.json     # Plugin manifest
│   │   └── styles.css        # Styles file
│   ├── esbuild.config.mjs    # esbuild configuration
│   ├── package.json          # Project dependencies
│   └── package-lock.json     # Dependencies lock file
├── README.md                 # Project documentation (Chinese)
├── README_EN.md              # Project documentation (English)
├── LICENSE                  # License file
└── .gitignore               # Git ignore file
```

---

## Quick Start

### Obsidian Plugin Installation

#### Method 1: Manual Installation

1. Download the latest plugin files
2. Copy files to Obsidian plugins directory:
   - Windows: `%APPDATA%\Obsidian\plugins\obsidin-to-mp\`
   - macOS: `~/Library/Application Support/Obsidian/Plugins/obsidin-to-mp/`
   - Linux: `~/.config/obsidian/plugins/obsidin-to-mp/`
3. Enable the plugin in Obsidian: Settings → Community Plugins → OpsToMP → Enable

#### Method 2: Build from Source

```bash
# Enter plugin build directory
cd plugin-build

# Install dependencies
npm install

# Build the plugin
npm run build

# Copy files from build directory to Obsidian plugins directory
```



---

## Configuration

### Get WeChat Official Account Credentials

1. Login to [WeChat Official Account Platform](https://mp.weixin.qq.com/)
2. Go to "Development" → "Basic Configuration"
3. Get AppID and AppSecret

### Obsidian Plugin Configuration

1. Open Obsidian Settings
2. Find "OpsToMP" plugin settings
3. Fill in the following information:
   - **AppID**: WeChat Official Account AppID
   - **AppSecret**: WeChat Official Account AppSecret
   - **Network Test URL**: Default is Baidu, can be customized
   - **Timeout**: Network request timeout (milliseconds)



---

## Usage

#### Open Publishing Panel

- Click the WeChat icon in the left toolbar
- Or use command palette: `Open WeChat Official Account Publishing Panel`

#### Preview Document

1. Open the note you want to preview in Obsidian
2. Click "Preview Current Document" button in the sidebar
3. View the preview in WeChat Official Account format

#### Upload to Drafts

1. Open the note you want to upload in Obsidian
2. Click "Upload to Drafts" button in the sidebar
3. Wait for upload to complete
4. View drafts in WeChat Official Account backend

#### Publish to Official Account

1. Open the note you want to publish in Obsidian
2. Click "Publish to Official Account" button in the sidebar
3. Wait for publishing to complete
4. View published articles in WeChat Official Account backend

#### Set Cover Image

When uploading or publishing, you can set a cover image:
- Support local image files
- Support network image URLs

#### Network Testing

- Click "Test Network Connection" button to test network connectivity
- Click "Test API Keys" button to verify WeChat Official Account credentials

#### One-Click Formatting

1. Check "Enable One-Click Formatting" checkbox
2. Select formatting options as needed:
   - **Auto paragraph spacing**: Unify paragraph spacing
   - **Unify headings**: Standardize heading styles
   - **Optimize images**: Center images, add rounded corners and shadows
   - **Quote styling**: Beautify quote blocks
   - **Code block beautification**: Beautify code blocks and inline code
   - **List formatting**: Unify list indentation and spacing
   - **Remove extra breaks**: Remove extra blank lines, max one blank line between paragraphs
3. Click "Preview Current Document" or "Upload to Drafts" to see the effect

#### Content Management

##### View Draft List

1. Click "View Draft List" button in the sidebar
2. View all drafts and their status
3. Click draft card to view details
4. Click "Delete" button to delete draft

##### View Published Articles

1. Click "View Published Articles" button in the sidebar
2. View all published articles and their status
3. Click article card to view details
4. Click "Delete" button to delete published article

**Note**: Content management features require WeChat Official Account personal authentication. If permission errors occur, please complete authentication on the WeChat Official Account Platform.

### Python Tools Usage

#### Test Token

```bash
python test_token.py
```

Follow the prompts to enter AppID and AppSecret, the tool will automatically test Token validity.

#### Convert Markdown File

```bash
python obsidian_to_mp.py your_note.md
```

The tool will automatically:
1. Read Markdown file
2. Convert to HTML format
3. Upload local images to WeChat server
4. Publish to WeChat Official Account drafts

#### Batch Processing

```bash
# Process multiple files
for file in *.md; do
    python obsidian_to_mp.py "$file"
done
```

---

## Markdown Support

Both plugin and Python tools support the following Markdown syntax:

- Headers (`#`, `##`, `###`, etc.)
- Code blocks (``` ```)
- Bold (`**text**`)
- Italic (`*text*`)
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Obsidian internal links (`![[image.png]]`)
- Blockquotes (`> text`)
- Lists (ordered and unordered)

---

## Technical Implementation

### Tech Stack

- **Framework**: Obsidian Plugin API
- **Build Tool**: esbuild
- **HTTP Client**: axios
- **Form Processing**: form-data
- **Node.js Version**: >= 16

### Security Features

#### XSS Protection

- Filter dangerous tags (`<script>`, `<iframe>`, etc.)
- Remove dangerous attributes (`onclick`, `onerror`, etc.)
- Validate URL security (only allow `http:`, `https:`, `app:`, `file:` protocols)
- HTML entity decoding and escaping

#### API Security

- Use HTTPS communication
- Do not store sensitive information (AppSecret only used in memory)
- Automatic token caching and expiration management

### Image Processing

- Support automatic upload of local images
- Support direct use of network images
- Support Obsidian internal link conversion
- Automatically handle image format and size limits

---

## Development Guide

### Environment Requirements

- Node.js >= 16
- npm >= 8

### Development Commands

```bash
cd plugin-build

# Install dependencies
npm install

# Development mode (watch file changes)
npm run dev

# Production build
npm run build

# Version management
npm run version
```

### Code Structure

- `src/api.js`: WeChat Official Account API wrapper
- `src/main.js`: Plugin main file, contains all core functionality
- `src/settings.js`: Settings page implementation
- `src/sidebar.js`: Sidebar view implementation
- `src/styles.css`: Plugin styles file
- `src/utils.js`: Utility functions collection
- `esbuild.config.mjs`: esbuild configuration
- `manifest.json`: Plugin manifest file



---

## FAQ

**Q: Plugin cannot connect to WeChat API?**

A: Please check:
1. Whether AppID and AppSecret are correct
2. Whether network connection is normal
3. Whether WeChat Official Account has relevant permissions
4. Use network testing function to verify connection

**Q: Images cannot be uploaded?**

A: Please check:
1. Whether image format is supported (jpg, png, gif, etc.)
2. Whether image size exceeds limit (WeChat limit is 5MB)
3. Whether network connection is normal
4. Whether image path is correct

**Q: Preview effect differs from actual publishing?**

A: This may be because:
1. WeChat Official Account editor has additional style restrictions
2. Suggest making final adjustments in WeChat Official Account backend

**Q: Markdown rendering abnormal?**

A: Please check:
1. Whether Markdown syntax is correct
2. Whether unsupported syntax is used
3. Check console logs for detailed error information

---

## Changelog

### v1.1.0 (2025-12-30)

#### Obsidian Plugin

- ✨ Add one-click formatting feature
  - Support auto paragraph spacing
  - Support unify headings
  - Support optimize images
  - Support quote styling
  - Support code block beautification
  - Support list formatting
  - Support remove extra breaks
- ✨ Add content management features
  - View draft list
  - View published articles list
  - Delete drafts
  - Delete published articles
- 🐛 Fix content management permission error message
  - Add personal authentication explanation
- 🐛 Fix image processing issues
  - Fix `file:///` URL handling
  - Fix Obsidian internal image link conversion
  - Ensure correct image display, avoid `!image` becoming `:image` issue
- 🐛 Fix content processing order
  - Adjust processing flow to ensure internal links and WeChat link cleaning are completed before HTML rendering
- 🐛 Fix preview truncation issue
  - Add inline code handling
  - Ensure complete content rendering
- 🐛 Fix WeChat link processing
  - Add `cleanWeChatLinks` function to replace WeChat Official Account links
  - Avoid WeChat Official Account detecting forbidden links
- 🔧 Optimize HTML cleaning
  - Remove problematic HTML decoding, ensure correct content handling
- 📝 Support README file upload
  - Fix "invalid content" error
  - Remove internal images and simplify lists to ensure upload success

#### Python Tools

- No changes

### v1.0.0 (2025-12-30)

#### Obsidian Plugin

- ✨ Initial release
- ✨ Support Markdown to HTML conversion
- ✨ Support real-time preview
- ✨ Support upload to drafts
- ✨ Support direct publishing
- ✨ Support image upload
- ✨ Support cover image
- 🔒 Built-in XSS protection
- 🎨 Automatic style beautification
- 🌐 Network testing function
- 📊 Control panel interface

#### Python Tools

- ✨ Initial release
- ✨ Support Markdown to HTML conversion
- ✨ Support image upload
- ✨ Support draft publishing
- 🧪 Token testing tool
- 📋 Command-line operation

---

## Contributing

Welcome to submit Issues and Pull Requests!

### Submitting Issues

When submitting an issue, please provide:
1. Detailed problem description
2. Steps to reproduce
3. Environment information (OS, Obsidian version, plugin version, etc.)
4. Relevant logs or screenshots

### Submitting Pull Requests

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

MIT License

---

## Author

Qysec

---

## Acknowledgments

Thanks to the following open source projects and communities:

- [Obsidian](https://obsidian.md/) - Powerful note-taking app
- [esbuild](https://esbuild.github.io/) - Fast JavaScript bundler
- [axios](https://axios-http.com/) - HTTP client
- [Python requests](https://requests.readthedocs.io/) - Python HTTP library
- [Python markdown](https://python-markdown.github.io/) - Markdown parser
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) - HTML parser

---

## Contact

For questions or suggestions, please contact via:

- Submit GitHub Issue
- Send email

---

**Note**: When using this tool, please comply with WeChat Official Account Platform usage guidelines and relevant laws and regulations.