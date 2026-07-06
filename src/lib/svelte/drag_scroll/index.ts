import type { Attachment } from 'svelte/attachments';

/**
 * @module drag_scroll
 * @group Svelte
 * @version 1.0.0
 * @remarks Attachment to click-and-drag scroll an overflow container. Suppresses clicks on children after a drag.
 *
 * @param node - The scrollable container to attach to
 * @example
 *   <div class="container" {@attach drag_scroll}></div>
 */
export const drag_scroll: Attachment<HTMLElement> = (node) => {
  let is_down = false;
  let start_x = 0;
  let start_y = 0;
  let scroll_left = 0;
  let scroll_top = 0;
  let moved = false;

  function on_pointer_down(e: PointerEvent) {
    is_down = true;
    moved = false;
    start_x = e.clientX;
    start_y = e.clientY;
    scroll_left = node.scrollLeft;
    scroll_top = node.scrollTop;
    node.setPointerCapture(e.pointerId);
  }

  function on_pointer_move(e: PointerEvent) {
    if (!is_down) return;
    const dx = e.clientX - start_x;
    const dy = e.clientY - start_y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
    node.scrollLeft = scroll_left - dx;
    node.scrollTop = scroll_top - dy;
  }

  function on_pointer_up() {
    is_down = false;
  }

  function on_click(e: MouseEvent) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  node.addEventListener('pointerdown', on_pointer_down);
  node.addEventListener('pointermove', on_pointer_move);
  node.addEventListener('pointerup', on_pointer_up);
  node.addEventListener('pointercancel', on_pointer_up);
  node.addEventListener('click', on_click, true);

  return () => {
    node.removeEventListener('pointerdown', on_pointer_down);
    node.removeEventListener('pointermove', on_pointer_move);
    node.removeEventListener('pointerup', on_pointer_up);
    node.removeEventListener('pointercancel', on_pointer_up);
    node.removeEventListener('click', on_click, true);
  };
};