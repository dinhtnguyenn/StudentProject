import { useEffect, useState, useCallback, useRef } from 'react';
import useSecretCode from '../hooks/useSecretCode';
import confetti from 'canvas-confetti';
import { useAppTheme } from '../ThemeContext';

export default function UIEasterEggs() {
  const [activeMode, setActiveMode] = useState<'matrix' | 'retro' | 'gravity' | 'none'>('none');
  const animationFrameRef = useRef<number | undefined>(undefined);
  const physicsItemsRef = useRef<any[]>([]);
  const { mode, toggleTheme } = useAppTheme();
  const originalThemeRef = useRef<'light' | 'dark' | null>(null);

  // Dragging state
  const draggedItemRef = useRef<any | null>(null);
  const lastMousePosRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  const triggerConfetti = useCallback((color: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [color, '#fff']
    });
  }, []);

  const checkPageReady = () => {
    if (document.readyState !== 'complete') return false;
    const images = document.querySelectorAll('img');
    for (let i = 0; i < images.length; i++) {
      if (images[i].getAttribute('loading') !== 'lazy' && !images[i].complete) return false;
    }
    return true;
  };

  useSecretCode('matrix', useCallback(() => {
    setActiveMode('matrix');
    triggerConfetti('#0f0');
  }, [triggerConfetti]));

  useSecretCode('retro', useCallback(() => {
    setActiveMode('retro');
    triggerConfetti('#f00');
    if (originalThemeRef.current === null) {
      originalThemeRef.current = mode;
    }
    if (mode === 'light') {
      toggleTheme();
    }
  }, [triggerConfetti, mode, toggleTheme]));

  useSecretCode('gravity', useCallback(() => {
    if (!checkPageReady()) {
      alert("Vui lòng đợi trang tải xong hoàn toàn rồi kích hoạt nhé!");
      return;
    }
    setActiveMode('gravity');
  }, []));

  useSecretCode('roll', useCallback(() => {
    if (!checkPageReady()) {
      alert("Vui lòng đợi trang tải xong hoàn toàn rồi thử lại nhé!");
      return;
    }
    const rootEl = document.getElementById('root');
    if (!rootEl) return;
    
    document.body.classList.add('roll-mode-bg');
    rootEl.style.setProperty('--cy', `calc(50vh + ${window.scrollY}px)`);
    rootEl.style.transformOrigin = `50% calc(50vh + ${window.scrollY}px)`;
    rootEl.classList.add('sphere-roll');
    
    // Add 3D Shading Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sphere-overlay';
    overlay.style.top = `50vh`;
    document.body.appendChild(overlay);

    setTimeout(() => {
      document.body.classList.remove('roll-mode-bg');
      rootEl.classList.remove('sphere-roll');
      rootEl.style.removeProperty('--cy');
      rootEl.style.transformOrigin = '';
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 3500);
  }, []));

  useSecretCode('reset', useCallback(() => {
    setActiveMode('none');
    if (originalThemeRef.current !== null && mode !== originalThemeRef.current) {
      toggleTheme();
    }
    originalThemeRef.current = null;
  }, [mode, toggleTheme]));

  useEffect(() => {
    document.body.classList.remove('matrix-mode', 'retro-mode');
    let cleanupListeners: (() => void) | null = null;
    
    if (activeMode === 'matrix' || activeMode === 'retro') {
      document.body.classList.add(`${activeMode}-mode`);
    }

    if (activeMode === 'gravity') {
      // Khóa toàn bộ chức năng trang web
      document.body.style.overflow = 'hidden'; // Khóa cuộn
      const blockInteractions = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      // Chặn click, dbclick để không mở link hay chạy button
      window.addEventListener('click', blockInteractions, { capture: true });
      window.addEventListener('dblclick', blockInteractions, { capture: true });

      // TRUE SHATTER: Disconnect all elements from DOM entirely!
      const allCandidates = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, img, svg, .MuiChip-root, a, .MuiCard-root, .MuiPaper-root, .MuiBox-root'));
      
      let items = allCandidates.map(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        
        // Bỏ qua các khối nền khổng lồ hoặc vô hình (tránh chặn mousedown)
        if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) return null;
        const style = window.getComputedStyle(el);
        if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none') return null;

        const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
        const hasBorder = style.borderWidth !== '0px' && style.borderStyle !== 'none';
        const hasShadow = style.boxShadow !== 'none';
        const isTextOrMedia = el.tagName.match(/^(IMG|SVG|BUTTON|P|H[1-6]|A|SPAN)$/i);
        
        // Nếu là thẻ vô hình dùng để layout (ví dụ MuiBox), BỎ QUA để không chặn click của các thẻ bên dưới
        if (!isTextOrMedia && !hasBg && !hasBorder && !hasShadow && !el.classList.contains('MuiCard-root') && !el.classList.contains('MuiPaper-root') && !el.classList.contains('MuiChip-root')) {
          return null;
        }

        return {
          el: el as HTMLElement,
          placeholder: document.createComment('gravity-placeholder'),
          y: rect.top, 
          x: rect.left, 
          w: rect.width,
          h: rect.height,
          dx: 0,
          dy: 0,
          vy: Math.random() * -5 - 2, 
          vx: (Math.random() - 0.5) * 15, 
          rot: 0,
          vrot: (Math.random() - 0.5) * 15,
          isDragging: false,
          origStyle: el.getAttribute('style') || ''
        };
      }).filter(Boolean) as any[];

      document.body.classList.add('gravity-mode');

      // Tối ưu hiệu năng: Giới hạn tối đa 25 phần tử lớn nhất để làm mảnh vỡ rơi
      let physicsItems = items;
      if (items.length > 25) {
        items.sort((a, b) => (b.w * b.h) - (a.w * a.h));
        physicsItems = items.slice(0, 25);
      }

      // Phase 1: Replace with placeholders (Xử lý từ trong ra ngoài - reverse - để an toàn khi thẻ con nằm trong thẻ cha bị thay thế)
      physicsItems.slice().reverse().forEach(item => {
        item.el.replaceWith(item.placeholder);
      });

      // Phase 2: Move to body & set fixed
      physicsItemsRef.current = physicsItems;
      physicsItems.forEach(item => {
        document.body.appendChild(item.el);
        item.el.classList.add('gravity-item');
        item.el.style.position = 'fixed';
        item.el.style.top = `${item.y}px`;
        item.el.style.left = `${item.x}px`;
        item.el.style.width = `${item.w}px`;
        item.el.style.height = `${item.h}px`;
        item.el.style.margin = '0';
        item.el.style.zIndex = '9999';
        item.el.style.pointerEvents = 'auto';
        item.el.style.cursor = 'grab';
        item.el.style.transition = 'none';
        item.el.style.willChange = 'transform'; // Hardware acceleration
      });

      const handleMouseDown = (e: MouseEvent | TouchEvent) => {
        let target = e.target as HTMLElement | null;
        let foundItem = null;
        while (target && target !== document.body) {
          foundItem = physicsItemsRef.current.find(i => i.el === target);
          if (foundItem) break;
          target = target.parentElement;
        }

        if (foundItem) {
          if (e.type === 'mousedown') e.preventDefault();
          foundItem.isDragging = true;
          foundItem.el.style.cursor = 'grabbing';
          foundItem.vx = 0;
          foundItem.vy = 0;
          foundItem.vrot = 0;
          draggedItemRef.current = foundItem;
          
          let clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          let clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
          lastMousePosRef.current = { x: clientX, y: clientY };

          // Wake up the physics loop if it was asleep
          if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(loop);
          }
        }
      };

      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (draggedItemRef.current) {
          if (e.type === 'touchmove') e.preventDefault(); // Prevent scrolling while dragging
          const item = draggedItemRef.current;
          let clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          let clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

          const deltaX = clientX - lastMousePosRef.current.x;
          const deltaY = clientY - lastMousePosRef.current.y;
          
          item.dx += deltaX;
          item.dy += deltaY;
          
          item.vx = deltaX * 0.8;
          item.vy = deltaY * 0.8;
          item.vrot = deltaX * 0.5;

          lastMousePosRef.current = { x: clientX, y: clientY };
        }
      };

      const handleMouseUp = () => {
        if (draggedItemRef.current) {
          draggedItemRef.current.isDragging = false;
          draggedItemRef.current.el.style.cursor = 'grab';
          draggedItemRef.current = null;
          // Loop will naturally continue because vy is 0 and it will fall
        }
      };

      window.addEventListener('mousedown', handleMouseDown as any);
      window.addEventListener('touchstart', handleMouseDown as any, { passive: false });
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('touchmove', handleMouseMove as any, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
      
      cleanupListeners = () => {
        document.body.style.overflow = '';
        window.removeEventListener('click', blockInteractions, { capture: true });
        window.removeEventListener('dblclick', blockInteractions, { capture: true });
        window.removeEventListener('mousedown', handleMouseDown as any);
        window.removeEventListener('touchstart', handleMouseDown as any);
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('touchmove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
      };

      const loop = () => {
        let stillMoving = false;
        physicsItemsRef.current.forEach(item => {
          if (!item.isDragging) {
            item.vy += 0.8; 
            item.dy += item.vy;
            item.dx += item.vx;
            item.rot += item.vrot;

            // Scale 0.6 collision logic
            const visualBottom = item.y + item.dy + item.h * 0.8;
            if (visualBottom > window.innerHeight) {
              item.dy = window.innerHeight - item.y - item.h * 0.8;
              item.vy *= -0.6; 
              item.vx *= 0.8; 
              item.vrot *= 0.8; 
            }
            
            const visualLeft = item.x + item.dx + item.w * 0.2;
            const visualRight = item.x + item.dx + item.w * 0.8;
            if (visualLeft < 0) {
              item.dx = -item.x - item.w * 0.2;
              item.vx *= -0.6;
            } else if (visualRight > window.innerWidth) {
              item.dx = window.innerWidth - item.x - item.w * 0.8;
              item.vx *= -0.6;
            }

            if (Math.abs(item.vy) > 0.5 || Math.abs(item.vx) > 0.1 || visualBottom < window.innerHeight - 1) {
              stillMoving = true;
            }
          } else {
            stillMoving = true;
          }

          item.el.style.transform = `translate3d(${item.dx}px, ${item.dy}px, 0) rotate(${item.rot}deg) scale(0.6)`;
        });

        if (stillMoving) {
          animationFrameRef.current = requestAnimationFrame(loop);
        } else {
          animationFrameRef.current = undefined;
        }
      };

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(loop);
      
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const items = [...physicsItemsRef.current].reverse();
      items.forEach(item => {
        if (item.origStyle) {
          item.el.setAttribute('style', item.origStyle);
        } else {
          item.el.removeAttribute('style');
        }
        item.el.classList.remove('gravity-item');
        item.el.onmousedown = null;
        if (item.placeholder && item.placeholder.parentNode) {
          item.placeholder.replaceWith(item.el);
        }
      });
      
      physicsItemsRef.current = [];
    }

    return () => {
      document.body.classList.remove('matrix-mode', 'retro-mode', 'gravity-mode');
      if (cleanupListeners) cleanupListeners();
    };
  }, [activeMode]);

  return null;
}
