/** Remove stuck Bootstrap modal backdrops / body locks after route changes */
export function clearStuckOverlays() {
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
}
