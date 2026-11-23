import React from 'react';

// Текст оффера так, как клуб его набрал: пустая строка — новый абзац, перенос — новая строка, строки
// с «- », «— », «• », «* » или «1. » — список, **так** — жирный. 23.11.2026 «Сектор»: красиво отформатированный текст из заметок
// на странице шёл одним сплошным куском — HTML схлопывал переносы. Разметку не принимаем (только текст):
// всё рисует React, ссылки и теги из текста не исполняются.

// closed — после блока была пустая строка: следующий текст начинает новый абзац или список.
type Block =
    | { kind: 'p'; lines: string[]; closed?: boolean }
    | { kind: 'ul' | 'ol'; items: string[]; closed?: boolean };

const BULLET_RE = /^\s*(?:[-–—•*●▪]\s+)(.*)$/;
const NUMBER_RE = /^\s*\d{1,2}[.)]\s+(.*)$/;

function parseRichText(text: string): Block[] {
    const blocks: Block[] = [];
    for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
        const line = raw.trimEnd();
        const last: Block | undefined = blocks[blocks.length - 1];
        if (!line.trim()) {
            if (last) last.closed = true;
            continue;
        }
        const bullet = BULLET_RE.exec(line);
        const number = bullet ? null : NUMBER_RE.exec(line);
        const value = (bullet?.[1] ?? number?.[1] ?? line).trim();
        const open = last && !last.closed ? last : undefined;
        if (!bullet && !number) {
            if (open?.kind === 'p') open.lines.push(value);
            else blocks.push({ kind: 'p', lines: [value] });
        } else {
            const kind = bullet ? 'ul' : 'ol';
            if (open && open.kind === kind) open.items.push(value);
            else blocks.push({ kind, items: [value] });
        }
    }
    return blocks;
}

/** **жирный** внутри строки; непарные звёздочки остаются как есть. */
const inline = (line: string): React.ReactNode => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    if (parts.length === 1) return line;
    return parts.map((p, i) => (i % 2 ? <strong key={i} style={{ fontWeight: 700, color: 'inherit' }}>{p}</strong> : p));
};

const RichText: React.FC<{ text: string; className?: string; style?: React.CSSProperties; center?: boolean }> = ({ text, className, style, center }) => {
    const blocks = parseRichText(text);
    if (!blocks.length) return null;
    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.6em', ...style }}>
            {blocks.map((b, i) => {
                if (b.kind === 'p') {
                    return (
                        <p key={i} style={{ margin: 0 }}>
                            {b.lines.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(l)}</React.Fragment>)}
                        </p>
                    );
                }
                const List = b.kind;
                return (
                    <List key={i} style={{ margin: 0, paddingLeft: center ? 0 : '1.25em', listStyle: b.kind === 'ul' ? 'disc' : 'decimal', listStylePosition: center ? 'inside' : 'outside', display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
                        {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
                    </List>
                );
            })}
        </div>
    );
};

export default RichText;
