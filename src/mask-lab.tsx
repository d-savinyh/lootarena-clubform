// Стенд для ручной проверки маски телефона: LeadForm по каждой валюте клуба.
// Открывается по /mask-lab.html в dev-режиме, в прод-сборку не попадает.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LeadForm from './components/LeadForm';
import './index.css';

const CURRENCIES = ['RUB', 'KZT', 'BYN', 'UZS', 'KGS'];

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: 24, display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {CURRENCIES.map(c => (
                <div key={c}>
                    <p style={{ color: '#fff', fontFamily: 'monospace', marginBottom: 8 }} data-testid={`label-${c}`}>{c}</p>
                    <div data-testid={`form-${c}`}>
                        <LeadForm
                            brandColor="#30D058"
                            currency={c}
                            onSubmit={async (d) => { Object.assign(window, { lastSubmit: d }); console.log("submit", c, d); }}
                        />
                    </div>
                </div>
            ))}
        </div>
    </StrictMode>
);
