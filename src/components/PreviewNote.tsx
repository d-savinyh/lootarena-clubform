import { useEffect, useState } from 'react';
import { previewUsesSample, subscribePreview } from '../utils/preview';

/** Плашка превью ЕРП: страница — черновик, живые цифры «Свободно» и «Цены» могут быть примером. */
const PreviewNote: React.FC = () => {
    const [sample, setSample] = useState(false);
    useEffect(() => {
        // Превью не для поиска: страница-черновик без своего адреса.
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
        const stop = subscribePreview(() => setSample(previewUsesSample()));
        return () => { stop(); meta.remove(); };
    }, []);
    return (
        <div className="lf-preview-note" role="note">
            <b>Превью</b>
            <span>{sample ? '«Свободно» и «Цены» — пример, на странице будут цифры клуба' : 'Так гость увидит страницу. Заявка отсюда не уходит'}</span>
        </div>
    );
};

export default PreviewNote;
