/**
 * Returns an onClick handler that sets CSS custom properties
 * for the ripple origin point on the element.
 * Usage: <button className="ripple-btn" onClick={ripple(yourHandler)}>
 */
export function useRipple() {
  function ripple(handler) {
    return (e) => {
      const btn  = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
      btn.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
      handler?.(e);
    };
  }
  return ripple;
}
