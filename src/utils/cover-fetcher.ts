/**
 * Utility for fetching book cover images from Open Library
 */

import { requestUrl, Vault, TFolder } from 'obsidian';

/**
 * Fetches a cover image from Open Library Covers API using ISBN
 * and saves it to the specified subfolder in the vault.
 * 
 * @param isbn - The ISBN of the book
 * @param citationFolder - The citation notes folder path
 * @param coverSubfolder - The subfolder name for covers (e.g., 'covers')
 * @param vault - The Obsidian vault instance
 * @returns The vault-relative path to the saved image, or null if fetch failed
 */
export async function fetchCoverImage(
    isbn: string,
    citationFolder: string,
    coverSubfolder: string,
    vault: Vault
): Promise<string | null> {
    if (!isbn) return null;

    // Clean ISBN - remove hyphens and spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    if (!cleanIsbn) return null;

    const coverFolder = citationFolder
        ? `${citationFolder}/${coverSubfolder}`
        : coverSubfolder;

    const fileName = `${cleanIsbn}.jpg`;
    const filePath = `${coverFolder}/${fileName}`;

    // Check if cover already exists
    const existingFile = vault.getAbstractFileByPath(filePath);
    if (existingFile) {
        return filePath;
    }

    try {
        // Fetch from Open Library Covers API
        const url = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
        const response = await requestUrl({
            url,
            method: 'GET',
        });

        if (!response.arrayBuffer || response.arrayBuffer.byteLength < 1000) {
            // Open Library returns a tiny 1x1 pixel image when no cover is found
            console.log(`No cover image found for ISBN ${cleanIsbn}`);
            return null;
        }

        // Ensure the cover folder exists
        const folderExists = vault.getAbstractFileByPath(coverFolder);
        if (!folderExists) {
            await vault.createFolder(coverFolder);
        }

        // Save the image
        await vault.createBinary(filePath, response.arrayBuffer);
        return filePath;
    } catch (e) {
        console.error(`Failed to fetch cover image for ISBN ${cleanIsbn}:`, e);
        return null;
    }
}

/**
 * Saves a cover image from a binary blob (e.g., from Logos catalog DB)
 * to the specified subfolder in the vault.
 *
 * @param imageData - The raw image binary data
 * @param identifier - A unique identifier for the filename (e.g., recordId)
 * @param citationFolder - The citation notes folder path
 * @param coverSubfolder - The subfolder name for covers
 * @param vault - The Obsidian vault instance
 * @returns The vault-relative path to the saved image, or null if save failed
 */
export async function saveCoverFromBlob(
    imageData: Buffer | ArrayBuffer,
    identifier: string,
    citationFolder: string,
    coverSubfolder: string,
    vault: Vault
): Promise<string | null> {
    if (!imageData) return null;

    const coverFolder = citationFolder
        ? `${citationFolder}/${coverSubfolder}`
        : coverSubfolder;

    const fileName = `${identifier}.jpg`;
    const filePath = `${coverFolder}/${fileName}`;

    // Check if cover already exists
    const existingFile = vault.getAbstractFileByPath(filePath);
    if (existingFile) {
        return filePath;
    }

    try {
        // Ensure the cover folder exists
        const folderExists = vault.getAbstractFileByPath(coverFolder);
        if (!folderExists) {
            await vault.createFolder(coverFolder);
        }

        // Convert Buffer to ArrayBuffer if needed
        const arrayBuffer: ArrayBuffer = imageData instanceof ArrayBuffer
            ? imageData
            : imageData.buffer.slice(imageData.byteOffset, imageData.byteOffset + imageData.byteLength) as ArrayBuffer;

        await vault.createBinary(filePath, arrayBuffer);
        return filePath;
    } catch (e) {
        console.error(`Failed to save cover image for ${identifier}:`, e);
        return null;
    }
}
