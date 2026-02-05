# Citation References

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Marvive/logos-references?style=for-the-badge&sort=semver)

Citation References is a powerful Obsidian plugin designed to streamline the academic citation and study workflow. While it remains a **first-class tool for Logos Bible Software users**, this version has been completely overhauled to serve as a **general-purpose citation manager** for any academic research.

By generalizing the core parsing engine, the plugin now seamlessly handles citations from web databases, PDF managers, and other library software, ensuring your research notes remain consistent regardless of the source.

## Features

- **Multi-format citation support**: Agnostic detection of BibTeX, MLA, APA, and Chicago formats from any clipboard source.
- **Logos Bible Software integration**: Deep integration for Logos users including internal resource linking and biblical language support.
- **Intelligent Text-Citation splitting**: Automatically separates your quoted highlights from their source citations, supporting generalized heuristics for blank lines and formatting.
- **Smart metadata storage**: Citation data stored as structured YAML frontmatter properties for easy filtering and dataview integration.
- **Bible verse linking**: Advanced sequential linking (e.g., "Deut. 19:12; 21:1") with book-awareness and support for multiple translations.
- **Formatting preservation**: Zero-loss conversion of italics, bold, and superscripts from the source to proper Markdown.
- **Customizable workflows**: Personalize callouts, metadata fields, and file naming conventions.

## Example Use

Copy a citation from Logos or any academic source and use the paste command within **Citation References** plugin to automatically generate or reference a citation note with proper metadata.

## Supported Citation Formats

| Format | Example |
|--------|---------|
| **BibTeX** | `@book{smith2020, author={...}, title={...}}` |
| **MLA** | `Smith, John. Title of Work. Publisher, 2020.` |
| **APA** | `Smith, J. A. (2020). Title of work. Publisher.` |
| **Chicago** | `Smith, John. Title of Work. Place: Publisher, 2020.` |

## Settings

- **Citation note folder**: Where citation notes are saved
- **Citation format**: Auto-detect or specify BibTeX/MLA/APA/Chicago
- **Callout title**: Customize the callout block header
- **Use custom metadata**: Enable additional YAML frontmatter fields
- **Show ribbon icon**: Toggle the quick-paste icon in the ribbon

### Logos Specific Settings

These settings are grouped under a collapsible section:

- **Auto-detect Bible verses**: Link verse references to Logos
- **Preferred Bible translation**: Choose NIV, ESV, NASB, LSB, or NLT

## Setup

1. Enable community plugins and install **Citation References**
2. Set your citation note folder in settings (e.g., `citations`)
3. For Logos users: In Logos program settings, set citation style to `BibTeX Style`
4. Start pasting citations!

## Credits

Based on the original work by [Joey Kilgore](https://github.com/joey-kilgore). This version represents a complete overhaul and expansion of the original plugin's capabilities.

## Development

Maintained by **Michael Marvive**. All bugs and feature requests should be filed under the [Issues](https://github.com/Marvive/logos-references/issues).

## 🖤 Support & Feedback

**Citation References** is a volunteer-led, open-source project. If it has improved your study workflow, please consider supporting its ongoing development:

- 🌟 **Star the Repository** – Help others find this tool by giving us a star.
- ☕ **Sponsor Maintenance** – Support the time and effort required to keep this plugin updated and bug-free.
- 💬 **Join the Conversation** – Report bugs or suggest new features in the [Issue Tracker](https://github.com/Marvive/logos-references/issues).

<br/>

<p align="left">
  <a href="https://github.com/sponsors/Marvive">
    <img src="https://img.shields.io/badge/Sponsor_on_GitHub-ea4aaa?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="Sponsor on GitHub" />
  </a>
  &nbsp;
  <a href="https://github.com/Marvive/logos-references/stargazers">
    <img src="https://img.shields.io/badge/Star_this_Repo-ffcc00?style=for-the-badge&logo=github&logoColor=white" alt="Star this Repo" />
  </a>
</p>
