// Yandex SmartCaptcha — подключается ТОЛЬКО когда сервер сам попросил (ответ
// `captcha_required`). Показывать её всем подряд нельзя: капча стабильно съедает конверсию
// лендинга, а спама на лид-формах сейчас нет — barrier включается точечно, по подозрению
// (слишком быстрая отправка или всплеск заявок с одного IP).
//
// Ключ приходит с сервера в том же ответе (`captcha_key`), поэтому на фронте нет ни env-переменной,
// ни зашитого значения: включение капчи — это строка в clubform_antispam_config, деплой не нужен.

declare global {
    interface Window {
        smartCaptcha?: {
            render: (container: HTMLElement | string, params: Record<string, unknown>) => string;
            execute: (widgetId?: string) => void;
            destroy: (widgetId?: string) => void;
            subscribe?: (widgetId: string, event: string, cb: () => void) => void;
        };
    }
}

const SCRIPT_SRC = 'https://smartcaptcha.yandexcloud.net/captcha.js';
const SOLVE_TIMEOUT_MS = 60_000;

let scriptPromise: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
    if (window.smartCaptcha) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SCRIPT_SRC;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => { scriptPromise = null; reject(new Error('captcha script failed')); };
        document.head.appendChild(s);
    });
    return scriptPromise;
};

/**
 * Прогоняет невидимую капчу и возвращает токен для повторной отправки заявки.
 * `null` — гость закрыл окно проверки, скрипт не загрузился или ушёл таймаут: в этом случае
 * заявку не теряем молча, а показываем понятную ошибку (см. LandingPage).
 */
export async function solveCaptcha(sitekey: string): Promise<string | null> {
    if (!sitekey) return null;
    try {
        await loadScript();
    } catch {
        return null;
    }
    const api = window.smartCaptcha;
    if (!api) return null;

    return new Promise<string | null>((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        let done = false;
        let widgetId: string | undefined;

        const finish = (token: string | null) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            // destroy в try: виджет мог не успеть смонтироваться
            try { if (widgetId !== undefined) api.destroy(widgetId); } catch { /* noop */ }
            container.remove();
            resolve(token);
        };

        const timer = setTimeout(() => finish(null), SOLVE_TIMEOUT_MS);

        try {
            widgetId = api.render(container, {
                sitekey,
                invisible: true,
                hideShield: true,
                callback: (token: string) => finish(token || null),
            });
            // Гость закрыл окно с заданием — считаем это отказом, а не бесконечным ожиданием
            api.subscribe?.(widgetId, 'challenge-hidden', () => finish(null));
            api.execute(widgetId);
        } catch {
            finish(null);
        }
    });
}
