import { toDataURL } from 'qrcode';

/**
 * Generate QR code for a checkpoint
 * @param {string} checkpointId - The checkpoint ID from database
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Data URL of the QR code
 */
export async function generateCheckpointQR(checkpointId, options = {}) {
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    // The QR code will contain just the checkpoint ID
    // This is what the scanner reads and sends to the server
    const qrDataUrl = await toDataURL(checkpointId, qrOptions);
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR codes for multiple checkpoints
 * @param {Array} checkpoints - Array of checkpoint objects
 * @returns {Promise<Array>} - Array of checkpoint objects with QR codes
 */
export async function generateMultipleCheckpointQRs(checkpoints) {
  const results = [];
  
  for (const checkpoint of checkpoints) {
    try {
      const qrCode = await generateCheckpointQR(checkpoint.id);
      results.push({
        ...checkpoint,
        qrCode
      });
    } catch (error) {
      console.error(`Failed to generate QR for checkpoint ${checkpoint.id}:`, error);
      results.push({
        ...checkpoint,
        qrCode: null,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate QR code with additional metadata
 * @param {string} checkpointId - The checkpoint ID
 * @param {Object} metadata - Additional checkpoint info
 * @returns {Promise<string>} - Data URL of the QR code
 */
export async function generateCheckpointQRWithMetadata(checkpointId, metadata = {}) {
  // Create a JSON object with checkpoint info
  const qrData = {
    id: checkpointId,
    type: 'checkpoint',
    ...metadata
  };
  
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };
  
  try {
    const qrDataUrl = await toDataURL(JSON.stringify(qrData), defaultOptions);
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code with metadata:', error);
    throw new Error('Failed to generate QR code');
  }
}
