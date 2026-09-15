/**
 * UI Controller Module
 * Handles drag-and-drop bindings, lifecycle UI states, progress bar, error alerts, and previews.
 */

import { formatBytes, urlRegistry } from './file-utils.js';

export class ToolUI {
    /**
     * @param {Object} elements
     * @param {HTMLElement} elements.dropzone
     * @param {HTMLInputElement} elements.fileInput
     * @param {HTMLElement} elements.fileInfoCard
     * @param {HTMLElement} elements.actionSection
     * @param {HTMLElement} elements.processBtn
     * @param {HTMLElement} elements.progressSection
     * @param {HTMLElement} elements.progressBar
     * @param {HTMLElement} elements.progressText
     * @param {HTMLElement} elements.resultSection
     * @param {HTMLElement} elements.previewContainer
     * @param {HTMLElement} elements.downloadBtn
     * @param {HTMLElement} elements.resetBtn
     * @param {HTMLElement} elements.errorAlert
     */
    constructor(elements) {
        this.el = elements;
        this.currentFiles = [];
        this.resultBlob = null;
        this.resultFilename = '';
        this.initEventListeners();
    }

    initEventListeners() {
        if (this.el.dropzone && this.el.fileInput) {
            this.setupDropzone(this.el.dropzone, this.el.fileInput);
        }

        if (this.el.resetBtn) {
            this.el.resetBtn.addEventListener('click', () => this.resetState());
        }
    }

    /**
     * Setup drag and drop events on an element
     * @param {HTMLElement} dropzone
     * @param {HTMLInputElement} fileInput
     */
    setupDropzone(dropzone, fileInput) {
        // Trigger file input click when dropzone is clicked (unless clicking on interactive children)
        dropzone.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
                fileInput.click();
            }
        });

        // Accessibility: trigger on Enter / Space keypress
        dropzone.setAttribute('tabindex', '0');
        dropzone.setAttribute('role', 'button');
        dropzone.setAttribute('aria-label', 'Upload file area. Drag and drop file or press enter to browse.');
        dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // Handle drag events
        const highlight = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('is-dragover');
        };

        const unhighlight = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('is-dragover');
        };

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, unhighlight, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                this.handleFiles(Array.from(dt.files));
            }
        }, false);

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFiles(Array.from(e.target.files));
            }
        });
    }

    /**
     * Hook overrideable by individual tools
     * @param {File[]} files
     */
    onFilesSelected(files) {}

    handleFiles(files) {
        this.hideError();
        this.currentFiles = files;
        if (this.onFilesSelected) {
            this.onFilesSelected(files);
        }
    }

    /**
     * Show file info summary badge/card
     * @param {File} file
     */
    showFileInfo(file) {
        if (!this.el.fileInfoCard) return;
        this.el.fileInfoCard.innerHTML = `
            <div class="selected-file-meta">
                <div class="file-icon-badge">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div class="file-details">
                    <span class="file-name" title="${file.name}">${file.name}</span>
                    <span class="file-size">${formatBytes(file.size)}</span>
                </div>
                <button type="button" class="btn-icon-remove" id="removeSelectedFile" aria-label="Remove file">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        this.el.fileInfoCard.style.display = 'block';

        const removeBtn = document.getElementById('removeSelectedFile');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.resetState());
        }

        if (this.el.actionSection) {
            this.el.actionSection.style.display = 'block';
        }
    }

    /**
     * Update progress bar percentage (0-100) and status message
     * Supports both determinate (0-100%) and indeterminate processing states
     * @param {number|null} percent - 0 to 100, or null for indeterminate
     * @param {string} [customMessage] - Status text to display to user
     */
    setProgress(percent = null, customMessage = null) {
        if (this.el.progressSection) {
            this.el.progressSection.style.display = 'block';
        }
        if (this.el.progressBar) {
            if (percent !== null && !isNaN(percent)) {
                const clamped = Math.min(100, Math.max(0, Math.round(percent)));
                this.el.progressBar.style.width = `${clamped}%`;
                this.el.progressBar.classList.remove('is-indeterminate');
            } else {
                this.el.progressBar.classList.add('is-indeterminate');
            }
        }
        if (this.el.progressText) {
            if (customMessage) {
                this.el.progressText.textContent = customMessage;
            } else if (percent !== null && !isNaN(percent)) {
                this.el.progressText.textContent = `Processing... ${Math.round(percent)}%`;
            } else {
                this.el.progressText.textContent = 'Processing locally in your browser...';
            }
        }
    }

    /**
     * Set processing state with optional percentage
     * @param {boolean} isProcessing
     * @param {number|null} [percent=null]
     * @param {string} [customMessage]
     */
    setProcessing(isProcessing, percent = null, customMessage = null) {
        if (isProcessing) {
            if (this.el.processBtn) {
                if (!this.originalBtnHtml) {
                    this.originalBtnHtml = this.el.processBtn.innerHTML;
                }
                this.el.processBtn.disabled = true;
                this.el.processBtn.innerHTML = `
                    <span class="spinner-icon"></span>
                    <span>Processing in browser...</span>
                `;
            }
            this.setProgress(percent, customMessage);
        } else {
            if (this.el.processBtn) {
                this.el.processBtn.disabled = false;
                if (this.originalBtnHtml) {
                    this.el.processBtn.innerHTML = this.originalBtnHtml;
                }
            }
            if (this.el.progressSection) {
                this.el.progressSection.style.display = 'none';
            }
            if (this.el.progressBar) {
                this.el.progressBar.style.width = '0%';
                this.el.progressBar.classList.remove('is-indeterminate');
            }
            if (this.el.progressText) {
                this.el.progressText.textContent = '';
            }
        }
    }

    /**
     * Render result preview & enable download
     * @param {Object} result
     * @param {Blob} result.blob
     * @param {string} result.filename
     * @param {number} [result.originalSize]
     * @param {number} [result.compressedSize]
     * @param {string} [result.previewUrl]
     */
    showResult(result) {
        this.resultBlob = result.blob;
        this.resultFilename = result.filename;
        this.setProcessing(false);

        if (this.el.resultSection) {
            this.el.resultSection.style.display = 'block';
            this.el.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Show comparison stats if available (e.g. for compressor)
        const statsContainer = this.el.resultSection?.querySelector('.result-stats');
        if (statsContainer && result.originalSize && result.compressedSize) {
            const savedBytes = result.originalSize - result.compressedSize;
            const savedPercent = Math.round((savedBytes / result.originalSize) * 100);
            const isReduced = savedBytes > 0;

            statsContainer.innerHTML = `
                <div class="stat-pill">Original: <strong>${formatBytes(result.originalSize)}</strong></div>
                <div class="stat-arrow">→</div>
                <div class="stat-pill stat-result">Output: <strong>${formatBytes(result.compressedSize)}</strong></div>
                <div class="stat-pill ${isReduced ? 'stat-savings' : 'stat-neutral'}">
                    ${isReduced ? `Reduced by ${savedPercent}% (${formatBytes(savedBytes)})` : 'Optimized'}
                </div>
            `;
            statsContainer.style.display = 'flex';
        }

        if (this.el.downloadBtn) {
            this.el.downloadBtn.style.display = 'inline-flex';
        }
    }

    showError(message) {
        this.setProcessing(false);
        if (this.el.errorAlert) {
            this.el.errorAlert.innerHTML = `
                <div class="alert-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="alert-content">
                    <strong>Error:</strong> ${message}
                </div>
            `;
            this.el.errorAlert.style.display = 'flex';
            this.el.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert(message);
        }
    }

    hideError() {
        if (this.el.errorAlert) {
            this.el.errorAlert.style.display = 'none';
        }
    }

    /**
     * Reset tool back to pristine upload state, releasing all memory
     */
    resetState() {
        urlRegistry.revokeAll();
        this.currentFiles = [];
        this.resultBlob = null;
        this.resultFilename = '';

        this.setProcessing(false);
        if (this.el.fileInput) {
            this.el.fileInput.value = '';
        }
        if (this.el.fileInfoCard) {
            this.el.fileInfoCard.style.display = 'none';
            this.el.fileInfoCard.innerHTML = '';
        }
        if (this.el.actionSection) {
            this.el.actionSection.style.display = 'none';
        }
        if (this.el.progressSection) {
            this.el.progressSection.style.display = 'none';
        }
        if (this.el.resultSection) {
            this.el.resultSection.style.display = 'none';
        }
        if (this.el.previewContainer) {
            this.el.previewContainer.innerHTML = '';
        }
        this.hideError();

        if (this.onReset) {
            this.onReset();
        }
    }
}
