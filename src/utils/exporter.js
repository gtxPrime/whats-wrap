import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Maps gradient CSS class names → a solid fallback colour for html2canvas.
 * html2canvas cannot render background-clip:text so we swap in solid colours.
 */
const GRAD_COLOR = {
  'grad-primary-text':   '#004e64',
  'grad-secondary-text': '#0077b6',
  'grad-emerald-text':   '#00a896',
  'grad-sunset-text':    '#e65100',
  'grad-gold-text':      '#b57c00',
  'grad-pink-text':      '#d81b60',
  'grad-aurora-text':    '#004e64',
};

/**
 * Walk the cloned document and patch every element that uses
 * CSS gradient-text (background-clip:text / -webkit-text-fill-color:transparent)
 * so that html2canvas renders them as a plain solid colour instead of
 * showing a coloured rectangle with invisible text.
 */
function fixGradientText(doc) {
  doc.querySelectorAll('.gradient-text').forEach(el => {
    let color = '#004e64'; // default fallback
    for (const [cls, col] of Object.entries(GRAD_COLOR)) {
      if (el.classList.contains(cls)) { color = col; break; }
    }
    // Remove the gradient background trick
    el.style.setProperty('background-image', 'none',   'important');
    el.style.setProperty('background',       'none',   'important');
    el.style.setProperty('background-clip',  'unset',  'important');
    el.style.setProperty('-webkit-background-clip', 'unset', 'important');
    // Restore visible text with solid colour
    el.style.setProperty('-webkit-text-fill-color', color, 'important');
    el.style.setProperty('color', color, 'important');
  });

  // Fix any brand/logo gradient text too
  doc.querySelectorAll('.sidenav-brand-text, .grad-aurora-text').forEach(el => {
    el.style.setProperty('background-image', 'none',   'important');
    el.style.setProperty('background',       'none',   'important');
    el.style.setProperty('-webkit-background-clip', 'unset', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#004e64', 'important');
    el.style.setProperty('color', '#004e64', 'important');
  });
}

/**
 * Exports a DOM element to a PNG file using html2canvas.
 *
 * @param {string} elementId  - ID of the element to capture
 * @param {string} filename   - Output filename (without .png)
 */
export const exportToPng = async (elementId, filename = 'whatswrap-card') => {
  const node = document.getElementById(elementId);
  if (!node) {
    console.error(`[exportToPng] Element #${elementId} not found.`);
    return;
  }

  // Hide export buttons before capture
  const exportBtns = node.querySelectorAll('.export-btn');
  exportBtns.forEach(btn => (btn.style.display = 'none'));

  try {
    // Ensure web fonts are loaded
    await document.fonts.ready;

    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(node, {
      backgroundColor:  '#e0e5e9',
      scale:             2,            // 2× for retina sharpness
      useCORS:           true,
      allowTaint:        false,
      logging:           false,
      scrollX: 0,
      scrollY: 0,
      width: node.scrollWidth,
      height: node.scrollHeight,
      // Use the actual viewport width so vw/clamp() units match the screen
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,

      onclone: (_clonedDoc, clonedEl) => {
        // Fix gradient text before html2canvas touches the canvas
        fixGradientText(_clonedDoc);

        // Ensure every stat value div with overflow:hidden shows ellipsis
        // by forcing text-overflow to ellipsis on overflowing text nodes
        _clonedDoc.querySelectorAll('[style*="text-overflow"]').forEach(el => {
          el.style.setProperty('text-overflow', 'ellipsis', 'important');
        });

        // Kill all CSS animations / transitions so nothing is mid-frame
        _clonedDoc.querySelectorAll('*').forEach(el => {
          el.style.animation       = 'none';
          el.style.transition      = 'none';
          el.style.animationDelay  = '0s';
        });
      },
    });

    window.scrollTo(0, originalScrollY);

    // ── Composite onto a padded canvas with watermark ─────────────────────────
    const MARGIN = 32;   // px padding around the card (at 1px, doubled for DPR)
    const WM_H   = 40;   // extra bottom space for watermark
    const DPR    = 2;    // must match scale above
    const outW = canvas.width  + MARGIN * 2 * DPR;
    const outH = canvas.height + MARGIN * 2 * DPR + WM_H * DPR;

    const out = document.createElement('canvas');
    out.width  = outW;
    out.height = outH;

    const ctx = out.getContext('2d');

    // Fill background
    ctx.fillStyle = '#e0e5e9';
    ctx.fillRect(0, 0, outW, outH);

    // Draw the captured card with margin
    ctx.drawImage(canvas, MARGIN * DPR, MARGIN * DPR);

    // ── Watermark ────────────────────────────────────────────────────────────
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillStyle = '#64748b'; // var(--on-surface-mute)
    ctx.textAlign = 'center';
    ctx.fillText('whatswrapadv.netlify.app', outW / 2, outH - MARGIN * DPR + 10);
    // ── Download ──────────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = out.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.error('[exportToPng] Failed:', err);
    alert('Export failed: check the browser console for details.');
  } finally {
    // Restore export buttons
    exportBtns.forEach(btn => (btn.style.display = ''));
  }
};

/**
 * Exports a DOM element to a multi-page PDF using html2canvas and jsPDF.
 *
 * @param {string} elementId  - ID of the element to capture
 * @param {string} filename   - Output filename (without .pdf)
 */
export const exportToPdf = async (elementId, filename = 'whatswrap-dashboard') => {
  // Regardless of elementId, we grab .app-main to get the header and content
  const node = document.querySelector('.app-main');
  if (!node) {
    console.error(`[exportToPdf] .app-main not found.`);
    return;
  }

  // Hide export buttons before capture
  const exportBtns = node.querySelectorAll('.export-btn');
  exportBtns.forEach(btn => (btn.style.display = 'none'));

  try {
    await document.fonts.ready;
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // Force a wide desktop viewport so the layout is compact vertically
    const DESKTOP_WIDTH = 1200;
    const SCALE = 1.5;
    let blocks = [];

    const canvas = await html2canvas(node, {
      backgroundColor: '#e0e5e9',
      scale: SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: DESKTOP_WIDTH,
      windowWidth: DESKTOP_WIDTH,
      onclone: (_clonedDoc) => {
        fixGradientText(_clonedDoc);
        
        // Hide mobile navigation if it's there
        const sideNav = _clonedDoc.querySelector('.sidenav');
        if (sideNav) sideNav.style.display = 'none';
        
        const bottomNav = _clonedDoc.querySelector('.mobile-bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';

        // Remove the sidebar margin from the main container so it centers perfectly
        const main = _clonedDoc.querySelector('.app-main');
        if (main) {
          main.style.marginLeft = '0px';
          main.style.paddingBottom = '0px';
        }

        const header = _clonedDoc.querySelector('header');
        if (header) header.style.position = 'static';

        _clonedDoc.querySelectorAll('[style*="text-overflow"]').forEach(el => {
          el.style.setProperty('text-overflow', 'ellipsis', 'important');
        });
        _clonedDoc.querySelectorAll('*').forEach(el => {
          el.style.animation = 'none';
          el.style.transition = 'none';
          el.style.animationDelay = '0s';
        });

        // ─────────────────────────────────────────────────────────────────
        // Calculate the bounding boxes of unbreakable elements in the cloned DOM
        // ─────────────────────────────────────────────────────────────────
        if (main) {
           const rootRect = main.getBoundingClientRect();
           const els = _clonedDoc.querySelectorAll('.m3-card, .section-header, header');
           els.forEach(el => {
              const rect = el.getBoundingClientRect();
              blocks.push({
                 top: rect.top - rootRect.top,
                 bottom: rect.bottom - rootRect.top
              });
           });
           // Sort from top to bottom
           blocks.sort((a, b) => a.top - b.top);
        }
      },
    });

    window.scrollTo(0, originalScrollY);

    // Create a multi-page A4 PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // ratio to convert from canvas pixels to PDF pixels
    const ratio = canvas.width / pdfWidth;
    const canvasPageHeight = pdfHeight * ratio; 
    
    let currentCanvasY = 0;
    
    while (currentCanvasY < canvas.height) {
       let sliceHeight = canvasPageHeight;
       
       // If this is the final slice and fits within page
       if (currentCanvasY + sliceHeight >= canvas.height) {
          sliceHeight = canvas.height - currentCanvasY;
       } else {
          // Smart Pagination: ensure we don't slice any blocks in half
          const cutLineCanvas = currentCanvasY + sliceHeight;
          const cutLineDOM = cutLineCanvas / SCALE;
          
          let safeCutLineDOM = cutLineDOM;
          for (let i = 0; i < blocks.length; i++) {
             const b = blocks[i];
             // If a block crosses the cutline
             if (b.top < cutLineDOM && b.bottom > cutLineDOM) {
                 // Move cutline up to the top of this block (minus 24px padding)
                 safeCutLineDOM = b.top - 24;
                 break;
             }
          }
          
          let safeCutLineCanvas = safeCutLineDOM * SCALE;
          
          // Fallback: if moving the cutline up means we can't fit a single block
          // (e.g. block is taller than an entire page), force cut inside it
          if (safeCutLineCanvas <= currentCanvasY + 50) {
             safeCutLineCanvas = cutLineCanvas; 
          }
          
          sliceHeight = safeCutLineCanvas - currentCanvasY;
       }
       
       // Create a temporary canvas for the exact slice
       const sliceCanvas = document.createElement('canvas');
       sliceCanvas.width = canvas.width;
       sliceCanvas.height = sliceHeight;
       const sliceCtx = sliceCanvas.getContext('2d');
       
       // Fill background to prevent transparency bleeding
       sliceCtx.fillStyle = '#e0e5e9';
       sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
       
       sliceCtx.drawImage(
         canvas, 
         0, currentCanvasY, canvas.width, sliceHeight, // source
         0, 0, sliceCanvas.width, sliceCanvas.height   // destination
       );
       
       const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
       const pdfSliceHeight = sliceHeight / ratio;
       
       if (currentCanvasY > 0) pdf.addPage();
       
       pdf.addImage(sliceData, 'JPEG', 0, 0, pdfWidth, pdfSliceHeight);
       
       currentCanvasY += sliceHeight;
    }

    // Add Watermark to all pages
    const pageCount = pdf.internal.getNumberOfPages();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139);
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text('whatswrapadv.netlify.app', pdfWidth / 2, pdfHeight - 20, { align: 'center' });
    }

    pdf.save(`${filename}.pdf`);

  } catch (err) {
    console.error('[exportToPdf] Failed:', err);
    alert('PDF Export failed: check the browser console for details.');
  } finally {
    exportBtns.forEach(btn => (btn.style.display = ''));
  }
};
