/**
 * Breakpoints (min-width, px). Keep in sync with the media queries in css/base.css.
 * Anything below the smallest value is "phone".
 */
const BREAKPOINTS = {
    tablet: 768,
    desktop: 990,
    wide: 1280,
};

/**
 * Small breakpoint helper, exposed as `window.site`.
 *
 *   site.breakpoint                 -> "phone" | "tablet" | "desktop" | "wide"
 *   site.isAtLeast("desktop")       -> boolean
 *   site.onBreakpointChange(fn)     -> fn(current, previous); returns an unsubscribe function
 */
const site = (() => {
    const queries = Object.entries(BREAKPOINTS).map(([name, min]) => ({
        name,
        mql: window.matchMedia(`(min-width: ${min}px)`),
    }));
    const listeners = new Set();

    const getBreakpoint = () =>
        queries.reduce((current, q) => (q.mql.matches ? q.name : current), 'phone');

    let current = getBreakpoint();

    const handleChange = () => {
        const next = getBreakpoint();
        if (next === current) return;
        const previous = current;
        current = next;
        listeners.forEach((fn) => fn(current, previous));
    };

    queries.forEach((q) => q.mql.addEventListener('change', handleChange));

    return {
        get breakpoint() {
            return current;
        },
        isAtLeast(name) {
            return name === 'phone' || queries.some((q) => q.name === name && q.mql.matches);
        },
        onBreakpointChange(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
    };
})();

window.site = site;

/* Mobile menu ------------------------------------------------------------- */

const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenu && 'showPopover' in mobileMenu) {
    const isOpen = () => mobileMenu.matches(':popover-open');
    const close = () => isOpen() && mobileMenu.hidePopover();

    // Move focus into the menu when it opens. The browser returns it to the toggle on close.
    mobileMenu.addEventListener('toggle', (event) => {
        if (event.newState === 'open') mobileMenu.querySelector('a')?.focus();
    });

    // Close after choosing a link (matters for in-page #anchors).
    mobileMenu.addEventListener('click', (event) => {
        if (event.target.closest('a')) close();
    });

    // Close if the viewport grows past the point where the full nav shows.
    site.onBreakpointChange(() => {
        if (site.isAtLeast('desktop')) close();
    });
}

/* Footer year ------------------------------------------------------------- */

document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
});
