import React from 'react';
import qrcode from 'qrcode-generator';

/** QR личного чек-ина `trn:<код>` — сканер пульта клуба читает именно этот формат. Белый фон: камеры
 *  стойки плохо читают инверсный код на тёмном экране. */
const QrCode: React.FC<{ value: string; size?: number }> = ({ value, size = 184 }) => {
    const svg = React.useMemo(() => {
        const qr = qrcode(0, 'M');
        qr.addData(value);
        qr.make();
        return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    }, [value]);
    return (
        <div
            role="img"
            aria-label="QR-код для чек-ина"
            className="rounded-2xl bg-white p-2"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default QrCode;
