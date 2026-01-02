/**
 * Logos References - Version Bumping Utility
 * Maintained by Michael Marvive
 */

import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
    console.error("No target version found. Run via 'npm version <patch|minor|major>'.");
    process.exit(1);
}

const updateJsonFile = (filePath, callback) => {
    try {
        const content = JSON.parse(readFileSync(filePath, "utf8"));
        const updatedContent = callback(content);
        writeFileSync(filePath, JSON.stringify(updatedContent, null, "\t") + "\n");
        console.log(`Updated version in ${filePath} to ${targetVersion}`);
    } catch (error) {
        console.error(`Failed to update ${filePath}:`, error.message);
    }
};

// Update manifest.json
updateJsonFile("manifest.json", (manifest) => {
    const { minAppVersion } = manifest;
    return { ...manifest, version: targetVersion };
});

// Update versions.json
updateJsonFile("versions.json", (versions) => {
    const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
    const { minAppVersion } = manifest;
    return { ...versions, [targetVersion]: minAppVersion };
});
