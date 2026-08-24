"use client";

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import notify from '@/lib/toast';

const useStickerDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const stickerRef = useRef(null);
  const MySwal = withReactContent(Swal);

  // Size configurations for printing (in inches)
  const sizeConfigs = {
    small: {
      width: 2,
      height: 3.5,
      name: '2" x 3.5"',  // Business card size
      displayWidth: 240,   // keep ~120px per inch
      displayHeight: 420
    },
    medium: {
      width: 3,
      height: 4,
      name: '3" x 4"',     // Common shipping label
      displayWidth: 360,
      displayHeight: 480
    },
    large: {
      width: 4,
      height: 6,
      name: '4" x 6"',     // Standard shipping label
      displayWidth: 480,
      displayHeight: 720
    }
  };


  const showSizeSelectionModal = (packageData) => {
    return MySwal.fire({
      title: '<span style="color: #29344A; font-family: Lexend;">Choose Sticker Size</span>',
      html: `
        <div style="font-family: Lexend; text-align: center;">
          <p style="color: #666; margin-bottom: 20px;">Select the size for your package sticker</p>
          <div style="display: flex; justify-content: space-around; gap: 15px; flex-wrap: wrap;">
            ${Object.entries(sizeConfigs).map(([key, config]) => `
              <div 
                class="size-option" 
                data-size="${key}"
                style="
                  border: 2px solid #F26A26;
                  border-radius: 8px;
                  padding: 15px;
                  cursor: pointer;
                  background: #FFF5F5;
                  transition: all 0.3s ease;
                  min-width: 120px;
                  text-align: center;
                "
                onmouseover="this.style.backgroundColor='#F26A26'; this.style.color='white';"
                onmouseout="this.style.backgroundColor='#FFF5F5'; this.style.color='#29344A';"
              >
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 5px; color: #29344A;">
                  ${config.name}
                </div>
                <div style="font-size: 12px; color: #666;">
                  ${key.charAt(0).toUpperCase() + key.slice(1)} size
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#6c757d',
      didOpen: () => {
        // Add click handlers for size options
        document.querySelectorAll('.size-option').forEach(option => {
          option.addEventListener('click', () => {
            const selectedSize = option.getAttribute('data-size');
            MySwal.close();
            generateSticker(packageData, selectedSize);
          });
        });
      },
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-html'
      }
    });
  };

  const generateSticker = async (packageData, size) => {
    setIsGenerating(true);

    try {
      // Show generating modal
      MySwal.fire({
        title: '<span style="color: #29344A; font-family: Lexend;">Preparing Sticker for Printing...</span>',
        html: `
          <div style="font-family: Lexend; text-align: center;">
            <div style="margin: 20px 0;">
              <div class="spinner-border" role="status" style="color: #F26A26;">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <p style="color: #666;">Please wait while we prepare your ${sizeConfigs[size].name} sticker for printing...</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup'
        }
      });

      // Create a temporary container for the sticker
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      // Dynamically import React and render the sticker
      const React = (await import('react')).default;
      const ReactDOM = (await import('react-dom/client')).default;
      const PackageSticker = (await import('@/components/PackageSticker')).default;

      // Create root and render sticker
      const root = ReactDOM.createRoot(tempContainer);

      await new Promise((resolve) => {
        root.render(
          React.createElement(PackageSticker, {
            packageData,
            size,
            ref: stickerRef,
            onQRGenerated: resolve
          })
        );
      });

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      const stickerElement = tempContainer.querySelector('div');

      if (!stickerElement) {
        throw new Error('Sticker element not found');
      }

      // Generate canvas from HTML
      const canvas = await html2canvas(stickerElement, {
        backgroundColor: '#E8C5B3',
        scale: 4, // Higher quality for printing
        useCORS: true,
        allowTaint: true,
        width: sizeConfigs[size].displayWidth,
        height: sizeConfigs[size].displayHeight
      });

      // Clean up temporary container
      root.unmount();
      document.body.removeChild(tempContainer);

      // Create PDF from canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [sizeConfigs[size].width, sizeConfigs[size].height]
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, sizeConfigs[size].width, sizeConfigs[size].height);

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');

      // Create a URL for the PDF blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open PDF in a new window for printing
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Optionally close the window after printing
          printWindow.onafterprint = () => {
            printWindow.close();
            URL.revokeObjectURL(pdfUrl);
          };
        };
      } else {
        // Fallback if popup is blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `package-sticker-${packageData.OrderNO}-${size}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }

      // Show success message
      notify.success(`Your ${sizeConfigs[size].name} sticker has been prepared and sent to your printer!`);

    } catch (error) {
      console.error('Error generating sticker:', error);

      notify.error('Failed to generate sticker. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const showBulkSizeSelectionModal = (packagesData) => {
    return MySwal.fire({
      title: '<span style="color: #29344A; font-family: Lexend;">Choose Sticker Size for Bulk Print</span>',
      html: `
        <div style="font-family: Lexend; text-align: center;">
          <p style="color: #666; margin-bottom: 20px;">Select the size for your ${packagesData.length} package stickers</p>
          <div style="display: flex; justify-content: space-around; gap: 15px; flex-wrap: wrap;">
            ${Object.entries(sizeConfigs).map(([key, config]) => `
              <div 
                class="bulk-size-option" 
                data-size="${key}"
                style="
                  border: 2px solid #F26A26;
                  border-radius: 8px;
                  padding: 15px;
                  cursor: pointer;
                  background: #FFF5F5;
                  transition: all 0.3s ease;
                  min-width: 120px;
                  text-align: center;
                "
                onmouseover="this.style.backgroundColor='#F26A26'; this.style.color='white';"
                onmouseout="this.style.backgroundColor='#FFF5F5'; this.style.color='#29344A';"
              >
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 5px; color: #29344A;">
                  ${config.name}
                </div>
                <div style="font-size: 12px; color: #666;">
                  ${key.charAt(0).toUpperCase() + key.slice(1)} size
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#6c757d',
      didOpen: () => {
        document.querySelectorAll('.bulk-size-option').forEach(option => {
          option.addEventListener('click', () => {
            const selectedSize = option.getAttribute('data-size');
            MySwal.close();
            generateBulkStickers(packagesData, selectedSize);
          });
        });
      },
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-html'
      }
    });
  };

  const generateBulkStickers = async (packagesData, size) => {
    setIsGenerating(true);

    try {
      MySwal.fire({
        title: '<span style="color: #29344A; font-family: Lexend;">Preparing Bulk Stickers...</span>',
        html: `
          <div style="font-family: Lexend; text-align: center;">
            <div style="margin: 20px 0;">
              <div class="spinner-border" role="status" style="color: #F26A26;">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <p style="color: #666;">Please wait while we prepare ${packagesData.length} stickers for printing...</p>
            <p id="bulk-progress" style="font-size: 14px; color: #F26A26; font-weight: bold;">0 / ${packagesData.length}</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          container: 'swal-container',
          popup: 'swal-popup'
        }
      });

      const React = (await import('react')).default;
      const ReactDOM = (await import('react-dom/client')).default;
      const PackageSticker = (await import('@/components/PackageSticker')).default;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [sizeConfigs[size].width, sizeConfigs[size].height]
      });

      for (let i = 0; i < packagesData.length; i++) {
        const packageData = packagesData[i];

        // Update progress text
        const progressEl = document.getElementById('bulk-progress');
        if (progressEl) progressEl.innerText = `${i + 1} / ${packagesData.length}`;

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        document.body.appendChild(tempContainer);

        const root = ReactDOM.createRoot(tempContainer);

        await new Promise((resolve) => {
          root.render(
            React.createElement(PackageSticker, {
              packageData,
              size,
              onQRGenerated: resolve
            })
          );
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const stickerElement = tempContainer.querySelector('div');
        if (!stickerElement) throw new Error('Sticker element not found');

        const canvas = await html2canvas(stickerElement, {
          backgroundColor: '#E8C5B3',
          scale: 4,
          useCORS: true,
          allowTaint: true,
          width: sizeConfigs[size].displayWidth,
          height: sizeConfigs[size].displayHeight
        });

        root.unmount();
        document.body.removeChild(tempContainer);

        if (i > 0) {
          pdf.addPage([sizeConfigs[size].width, sizeConfigs[size].height], 'portrait');
        }

        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, sizeConfigs[size].width, sizeConfigs[size].height);
      }

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            URL.revokeObjectURL(pdfUrl);
          };
        };
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `bulk-stickers-${packagesData.length}-items.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }

      notify.success(`${packagesData.length} stickers have been prepared and sent to your printer!`);

    } catch (error) {
      console.error('Error generating bulk stickers:', error);
      notify.error('Failed to generate bulk stickers. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    showSizeSelectionModal,
    showBulkSizeSelectionModal,
    generateBulkStickers,
    isGenerating,
    stickerRef
  };
};

export default useStickerDownload;
