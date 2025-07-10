import { parseBase64 } from 'ble-manufacturer-data-parser';

/**
 * Extract manufacturer ID from BLE manufacturer data
 * @param manufacturerData - Raw manufacturer data buffer
 * @returns Object containing manufacturer ID and company name, or null if parsing fails
 */
export function extractManufacturerInfo(manufacturerData: Buffer | undefined): { id: number; company: string } | null {
  if (!manufacturerData || manufacturerData.length < 2) {
    return null;
  }

  try {
    // Convert buffer to base64 string for the parser
    const base64Data = manufacturerData.toString('base64');
    const result = parseBase64(base64Data);
    
    if (result && result.identifier && result.company) {
      return {
        id: result.identifier,
        company: result.company
      };
    }
  } catch (error) {
    // If parsing fails, try to extract just the manufacturer ID from the first 2 bytes
    try {
      const manufacturerId = manufacturerData.readUInt16LE(0);
      return {
        id: manufacturerId,
        company: `Unknown (${manufacturerId.toString(16).padStart(4, '0')})`
      };
    } catch (fallbackError) {
      // If even the fallback fails, return null
      return null;
    }
  }

  return null;
}

/**
 * Get a short manufacturer identifier for device identification
 * @param manufacturerData - Raw manufacturer data buffer
 * @returns Short string identifier for the manufacturer
 */
export function getManufacturerId(manufacturerData: Buffer | undefined): string {
  if (!manufacturerData || manufacturerData.length < 2) {
    return 'no-mfg';
  }

  try {
    // Try to get the full manufacturer info first
    const info = extractManufacturerInfo(manufacturerData);
    if (info) {
      return `mfg-${info.id}`;
    }

    // Fallback: extract just the ID from first 2 bytes
    const manufacturerId = manufacturerData.readUInt16LE(0);
    return `mfg-${manufacturerId}`;
  } catch (error) {
    // If all else fails, use a hash of the first few bytes
    const hash = manufacturerData.toString('hex').substring(0, 8);
    return `mfg-${hash}`;
  }
}

/**
 * Get manufacturer company name for display
 * @param manufacturerData - Raw manufacturer data buffer
 * @returns Company name or fallback identifier
 */
export function getManufacturerName(manufacturerData: Buffer | undefined): string {
  if (!manufacturerData || manufacturerData.length < 2) {
    return 'Unknown';
  }

  try {
    const info = extractManufacturerInfo(manufacturerData);
    if (info) {
      return info.company;
    }

    // Fallback: show the manufacturer ID
    const manufacturerId = manufacturerData.readUInt16LE(0);
    return `Unknown (0x${manufacturerId.toString(16).padStart(4, '0')})`;
  } catch (error) {
    return 'Unknown';
  }
} 