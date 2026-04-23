/**
 * PerformanceBanner
 * Displays a warning banner when the device is in low performance mode
 */

export class PerformanceBanner {
  constructor() {
    this.banner = null;
    this.createBanner();
  }

  createBanner() {
    this.banner = document.createElement('div');
    this.banner.className = 'performance-banner';
    this.banner.setAttribute('role', 'status');
    this.banner.setAttribute('aria-live', 'polite');
    this.banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--banner-bg, #fff3cd);
      color: var(--banner-text, #856404);
      padding: 12px;
      text-align: center;
      z-index: 50000;
      display: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-family: var(--font-family, system-ui, -apple-system, sans-serif);
      pointer-events: auto;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    const message = document.createElement('div');
    message.innerHTML = `
      <strong>Performance Mode Active</strong>
      <span style="margin-left: 8px;">
        Some features have been disabled to ensure smooth operation on your device.
        <a href="#" class="show-details" style="margin-left: 8px; color: var(--banner-link, #856404); text-decoration: underline;">
          Show Details
        </a>
        <span class="help-icon" style="margin-left: 4px; cursor: help;">?</span>
      </span>
    `;

    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const forceModeToggle = document.createElement('label');
    forceModeToggle.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      cursor: pointer;
    `;
    forceModeToggle.innerHTML = `
      <input type="checkbox" class="force-mode-toggle">
      Force Full Features
    `;

    const permanentToggle = document.createElement('label');
    permanentToggle.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--banner-text-secondary, #666);
      cursor: pointer;
    `;
    permanentToggle.innerHTML = `
      <input type="checkbox" class="permanent-toggle">
      Always on this device
    `;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Dismiss performance notice');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      color: var(--banner-text, #856404);
      cursor: pointer;
      padding: 4px 10px;
      z-index: 1;
    `;

    const exportButton = document.createElement('button');
    exportButton.innerHTML = '📊';
    exportButton.title = 'Export Debug Info';
    exportButton.style.cssText = `
      background: none;
      border: none;
      font-size: 16px;
      color: var(--banner-text, #856404);
      cursor: pointer;
      padding: 0 8px;
    `;

    controls.appendChild(forceModeToggle);
    controls.appendChild(permanentToggle);
    controls.appendChild(exportButton);
    controls.appendChild(closeButton);
    content.appendChild(message);
    content.appendChild(controls);
    this.banner.appendChild(content);
    document.body.appendChild(this.banner);

    // Add event listeners
    closeButton.addEventListener('click', () => {
      this.hide();
      localStorage.setItem('env:hideBanner', 'true');
    });

    message.querySelector('.show-details')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showDetails();
    });

    message.querySelector('.help-icon')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });

    // Add force mode toggle handler
    const toggle = forceModeToggle.querySelector('input');
    toggle.checked = EnvironmentManager.isForceFullMode;
    toggle.addEventListener('change', (e) => {
      const permanent = permanentToggle.querySelector('input').checked;
      EnvironmentManager.toggleForceFullMode(e.target.checked, permanent);
      if (e.target.checked) {
        this.hide();
      } else if (EnvironmentManager.shouldWarnUser()) {
        this.show();
      } else {
        this.hide();
      }
    });

    const permInput = permanentToggle.querySelector('input');
    if (permInput) {
      permInput.addEventListener('change', () => {
        localStorage.setItem('env:permanentForcePref', String(permInput.checked));
      });
    }

    // Add export button handler
    exportButton.addEventListener('click', () => {
      const analytics = EnvironmentManager.exportAnalytics();
      if (analytics) {
        const blob = new Blob([analytics], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dopple-debug-${EnvironmentManager.sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  show() {
    if (this.banner) {
      this.banner.style.display = 'block';
    }
  }

  hide() {
    if (this.banner) {
      this.banner.style.display = 'none';
    }
  }

  showDetails() {
    const details = document.createElement('div');
    details.style.cssText = `
      margin-top: 8px;
      font-size: 14px;
      text-align: left;
      padding: 12px;
      background: var(--banner-details-bg, rgba(0,0,0,0.05));
      border-radius: 4px;
    `;

    const systemInfo = EnvironmentManager.getSystemInfo();
    const disabledFeatures = EnvironmentManager.getDisabledFeatures();

    details.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>System Information:</strong>
        <ul style="margin: 4px 0; padding-left: 20px;">
          <li>Memory: ${systemInfo.memory}</li>
          <li>CPU Cores: ${systemInfo.cores}</li>
          <li>Connection: ${systemInfo.connection}</li>
          <li>Device Type: ${systemInfo.isMobile ? 'Mobile' : 'Desktop'}</li>
        </ul>
      </div>
      <div>
        <strong>Disabled Features:</strong>
        <ul style="margin: 4px 0; padding-left: 20px;">
          ${disabledFeatures.map(f => `
            <li>
              <strong>${f.feature}:</strong>
              <span>${f.reason}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: var(--banner-text-secondary, #666);">
        Note: You can force enable all features using the toggle above, but this may impact performance.
      </div>
    `;

    const existingDetails = this.banner.querySelector('.details');
    if (existingDetails) {
      existingDetails.remove();
    }
    details.className = 'details';
    this.banner.querySelector('div').appendChild(details);
  }

  showHelp() {
    const help = document.createElement('div');
    help.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--banner-bg, #fff3cd);
      color: var(--banner-text, #856404);
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      z-index: 1100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    help.innerHTML = `
      <h3 style="margin-top: 0;">Performance Mode Help</h3>
      <p>Performance Mode automatically adjusts features based on your device's capabilities:</p>
      <ul style="padding-left: 20px;">
        <li><strong>Vector Tools:</strong> Complex path editing and smart selection</li>
        <li><strong>Canvas Export:</strong> High-quality PNG and SVG exports</li>
        <li><strong>Undo History:</strong> Complex state tracking for operations</li>
        <li><strong>GPU Acceleration:</strong> Hardware-accelerated rendering</li>
        <li><strong>Auto Save:</strong> Automatic document saving</li>
        <li><strong>3D Features:</strong> 3D transformations and effects</li>
        <li><strong>Audio Effects:</strong> Sound processing and playback</li>
        <li><strong>Heavy Filters:</strong> Complex image filters and effects</li>
        <li><strong>Live Collaboration:</strong> Real-time multi-user editing</li>
        <li><strong>Animations:</strong> Complex motion and transitions</li>
      </ul>
      <p>You can force enable all features, but this may impact performance on your device.</p>
      <button style="
        background: var(--banner-button-bg, #856404);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 12px;
      ">Close</button>
    `;

    help.querySelector('button').addEventListener('click', () => {
      help.remove();
    });

    document.body.appendChild(help);
  }
} 