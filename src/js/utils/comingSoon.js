const DEFAULT_LABEL = 'Coming soon';

function positionNearPointer(tooltip, clientX, clientY) {
    tooltip.style.display = 'block';
    tooltip.style.visibility = 'hidden';
    tooltip.style.left = '0';
    tooltip.style.top = '0';
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    const pad = 12;
    let x = clientX + pad;
    let y = clientY + pad;
    x = Math.min(x, window.innerWidth - tw - 8);
    y = Math.min(y, window.innerHeight - th - 8);
    x = Math.max(8, x);
    y = Math.max(8, y);
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.visibility = 'visible';
}

function positionBelowEl(tooltip, el) {
    const r = el.getBoundingClientRect();
    positionNearPointer(tooltip, r.left, r.bottom + 4);
}

/**
 * Greys out `[data-coming-soon]` controls and shows the shared #tooltip on hover,
 * focus, or click (touch-friendly).
 */
export function initComingSoon() {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        return;
    }

    let hideTimer = null;

    const scheduleHide = (delay = 160) => {
        clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
            tooltip.style.display = 'none';
            tooltip.textContent = '';
            tooltip.style.visibility = '';
        }, delay);
    };

    const showAtPointer = (label, clientX, clientY) => {
        clearTimeout(hideTimer);
        tooltip.textContent = label;
        positionNearPointer(tooltip, clientX, clientY);
    };

    document.querySelectorAll('[data-coming-soon]').forEach((el) => {
        const label =
            el.getAttribute('data-coming-soon-label')?.trim() || DEFAULT_LABEL;
        el.classList.add('coming-soon');
        el.setAttribute('aria-disabled', 'true');
        if (el instanceof HTMLButtonElement) {
            el.disabled = false;
        }

        el.addEventListener('mouseenter', (e) => {
            showAtPointer(label, e.clientX, e.clientY);
        });
        el.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block') {
                positionNearPointer(tooltip, e.clientX, e.clientY);
            }
        });
        el.addEventListener('mouseleave', () => scheduleHide(100));

        el.addEventListener('focus', () => {
            clearTimeout(hideTimer);
            tooltip.textContent = label;
            positionBelowEl(tooltip, el);
        });
        el.addEventListener('blur', () => scheduleHide(80));

        el.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                showAtPointer(label, e.clientX, e.clientY);
                scheduleHide(2200);
            },
            true
        );
    });
}
