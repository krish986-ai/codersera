import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, isLightMode = false): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 1,
      color: {
        dark: isLightMode ? '#030712' : '#040812',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}
