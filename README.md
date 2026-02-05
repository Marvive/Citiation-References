# Citation References

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Marvive/logos-references?style=for-the-badge&sort=semver)

Citation References is a powerful Obsidian plugin for managing citations from multiple sources. Originally based on [logos-refs](https://github.com/joey-kilgore/logos-refs) by Joey Kilgore, this version has been completely overhauled with multi-format support and extensive customization options.

## Features

- **Multi-format citation support**: BibTeX, MLA, APA, and Chicago formats with auto-detection
- **Logos Bible Software integration**: Seamlessly import references from Logos
- **Smart metadata storage**: Citation data stored as YAML frontmatter properties
- **Bible verse linking**: Automatically detect and link Bible verses to Logos (NIV, ESV, NASB, LSB, NLT)
- **Customizable callouts**: Personalize callout titles and styling
- **Custom metadata fields**: Add your own properties to citation notes
- **Formatting preservation**: Italics, bold, and superscript are retained from source

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
