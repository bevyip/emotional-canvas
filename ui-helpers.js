// UI Helpers - All helper text creation and management

/**
 * Creates the RGBA color pills display (top left)
 * @param {HTMLElement} container - The container to append the display to
 * @returns {Object} - Object containing rgbDisplay element and rgbPills object
 */
export function createRGBDisplay(container) {
  const rgbDisplay = document.createElement("div");
  rgbDisplay.style.position = "absolute";
  rgbDisplay.style.top = "10px";
  rgbDisplay.style.left = "10px";
  rgbDisplay.style.display = "flex";
  rgbDisplay.style.gap = "8px";
  rgbDisplay.style.flexWrap = "wrap";
  rgbDisplay.style.userSelect = "none";
  rgbDisplay.style.pointerEvents = "none";

  // Create pill for each RGBA value with key number labels
  const channelKeys = { r: "1", g: "2", b: "3", a: "4" };
  const rgbPills = { r: null, g: null, b: null, a: null };

  ["r", "g", "b", "a"].forEach((channel) => {
    // Container for pill and key label
    const pillContainer = document.createElement("div");
    pillContainer.style.display = "flex";
    pillContainer.style.flexDirection = "column";
    pillContainer.style.alignItems = "center";
    pillContainer.style.gap = "4px";

    // The pill itself
    const pill = document.createElement("div");
    pill.style.padding = "6px 12px";
    pill.style.borderRadius = "20px";
    pill.style.fontFamily = '"Satoshi", sans-serif';
    pill.style.fontSize = "14px";
    pill.style.color = "#000";
    pill.style.width = "80px";
    pill.style.textAlign = "center";
    pill.style.boxSizing = "border-box";
    pill.id = `rgb-pill-${channel}`;
    rgbPills[channel] = pill;

    // Key number label below the pill
    const keyLabel = document.createElement("div");
    keyLabel.textContent = channelKeys[channel];
    keyLabel.style.fontFamily = '"Satoshi", sans-serif';
    keyLabel.style.fontSize = "12px";
    keyLabel.style.fontWeight = "500";
    keyLabel.style.color = "rgba(255, 255, 255, 0.7)";
    keyLabel.style.textAlign = "center";

    pillContainer.appendChild(pill);
    pillContainer.appendChild(keyLabel);
    rgbDisplay.appendChild(pillContainer);
  });

  container.appendChild(rgbDisplay);

  return { rgbDisplay, rgbPills };
}

/**
 * Updates the RGBA display with current values
 * @param {HTMLElement} rgbDisplay - The RGB display container
 * @param {Object} rgbPills - Object containing pill elements
 * @param {Object} globalRGB - Current RGB values
 * @param {Object} keyHoldState - Current key hold states
 */
export function updateRGBDisplay(
  rgbDisplay,
  rgbPills,
  globalRGB,
  keyHoldState
) {
  if (rgbDisplay) {
    // Calculate preview values for keys currently being held
    let previewR = globalRGB.r;
    let previewG = globalRGB.g;
    let previewB = globalRGB.b;
    let previewA = globalRGB.a;

    const maxHold = 3000; // 3 seconds

    // Calculate preview values based on current hold duration
    if (keyHoldState[1].isHolding) {
      const holdDuration = performance.now() - keyHoldState[1].startTime;
      const colorChange = Math.floor((holdDuration / maxHold) * 255);
      previewR = (globalRGB.r + colorChange) % 256;
    }
    if (keyHoldState[2].isHolding) {
      const holdDuration = performance.now() - keyHoldState[2].startTime;
      const colorChange = Math.floor((holdDuration / maxHold) * 255);
      previewG = (globalRGB.g + colorChange) % 256;
    }
    if (keyHoldState[3].isHolding) {
      const holdDuration = performance.now() - keyHoldState[3].startTime;
      const colorChange = Math.floor((holdDuration / maxHold) * 255);
      previewB = (globalRGB.b + colorChange) % 256;
    }
    if (keyHoldState[4].isHolding) {
      const holdDuration = performance.now() - keyHoldState[4].startTime;
      const colorChange = Math.floor((holdDuration / maxHold) * 255);
      previewA = (globalRGB.a + colorChange) % 256;
    }

    // Update each pill with its value and color
    if (rgbPills.r) {
      rgbPills.r.textContent = `R: ${previewR}`;
      rgbPills.r.style.backgroundColor = `rgba(${previewR}, 0, 0, 0.8)`;
    }
    if (rgbPills.g) {
      rgbPills.g.textContent = `G: ${previewG}`;
      rgbPills.g.style.backgroundColor = `rgba(0, ${previewG}, 0, 0.8)`;
    }
    if (rgbPills.b) {
      rgbPills.b.textContent = `B: ${previewB}`;
      rgbPills.b.style.backgroundColor = `rgba(0, 0, ${previewB}, 0.8)`;
    }
    if (rgbPills.a) {
      rgbPills.a.textContent = `A: ${previewA}`;
      // Alpha pill uses grayscale based on alpha value
      const alphaGray = previewA;
      rgbPills.a.style.backgroundColor = `rgba(${alphaGray}, ${alphaGray}, ${alphaGray}, 0.8)`;
    }
  }
}

/**
 * Creates the creation controls helpers (top right)
 * @param {HTMLElement} container - The container to append the helpers to
 * @returns {Object} - Object containing helper elements (for compatibility)
 */
export function createCreationHelpers(container) {
  const creationHelperContainer = document.createElement("div");
  creationHelperContainer.style.position = "absolute";
  creationHelperContainer.style.top = "10px";
  creationHelperContainer.style.right = "10px";
  creationHelperContainer.style.display = "flex";
  creationHelperContainer.style.flexDirection = "column";
  creationHelperContainer.style.gap = "12px";
  creationHelperContainer.style.alignItems = "flex-end";

  // Helper function to create a pill with text on the left
  const createHelperItem = (pillText, descriptionText) => {
    const itemContainer = document.createElement("div");
    itemContainer.style.display = "flex";
    itemContainer.style.flexDirection = "row";
    itemContainer.style.alignItems = "center";
    itemContainer.style.gap = "8px";

    // Description text on the left (before pill)
    const description = document.createElement("div");
    description.style.fontFamily = '"Satoshi", sans-serif';
    description.style.fontSize = "11px";
    description.style.fontWeight = "400";
    description.style.color = "rgba(255, 255, 255, 0.7)";
    description.style.textAlign = "right";
    description.style.userSelect = "none";
    description.style.pointerEvents = "none";
    description.textContent = descriptionText;
    itemContainer.appendChild(description);

    // The pill
    const pill = document.createElement("div");
    pill.style.fontFamily = '"Satoshi", sans-serif';
    pill.style.fontSize = "13px";
    pill.style.fontWeight = "500";
    pill.style.color = "#000";
    pill.style.padding = "8px 12px";
    pill.style.backgroundColor = "#fff";
    pill.style.borderRadius = "8px";
    pill.style.userSelect = "none";
    pill.style.pointerEvents = "none";
    pill.textContent = pillText;
    itemContainer.appendChild(pill);

    return itemContainer;
  };

  // Create Object helper
  const createHelper = createHelperItem("Create Object", "(Left Click)");
  creationHelperContainer.appendChild(createHelper);

  // Size helper
  const sizeHelper = createHelperItem("Size", "(Hold Left Click)");
  creationHelperContainer.appendChild(sizeHelper);

  // Roundness helper
  const roundnessHelper = createHelperItem(
    "Roundness",
    "(Hold Spacebar + Left Click)"
  );
  creationHelperContainer.appendChild(roundnessHelper);

  container.appendChild(creationHelperContainer);

  // Return empty object for compatibility (no longer needed but keeping for now)
  return {
    sizeHelper: null,
    roundnessHelper: null,
    showSizeHelper: () => {},
    showRoundnessHelper: () => {},
  };
}

/**
 * Creates the camera controls helpers (bottom right)
 * @param {HTMLElement} container - The container to append the helpers to
 */
export function createCameraHelpers(container) {
  const helperContainer = document.createElement("div");
  helperContainer.style.position = "absolute";
  helperContainer.style.bottom = "10px";
  helperContainer.style.right = "10px";
  helperContainer.style.display = "flex";
  helperContainer.style.flexDirection = "column";
  helperContainer.style.gap = "8px";
  helperContainer.style.alignItems = "flex-end";

  // Camera controls label
  const cameraLabel = document.createElement("div");
  cameraLabel.style.fontFamily = '"Satoshi", sans-serif';
  cameraLabel.style.fontSize = "14px";
  cameraLabel.style.fontWeight = "500";
  cameraLabel.style.color = "rgba(255, 255, 255, 0.7)";
  cameraLabel.style.userSelect = "none";
  cameraLabel.style.pointerEvents = "none";
  cameraLabel.textContent = "CAMERA CONTROLS";
  helperContainer.appendChild(cameraLabel);

  // Zoom helper
  const zoomHelper = document.createElement("div");
  zoomHelper.style.fontFamily = '"Satoshi", sans-serif';
  zoomHelper.style.fontSize = "14px";
  zoomHelper.style.fontWeight = "500";
  zoomHelper.style.color = "rgba(255, 255, 255, 0.7)";
  zoomHelper.style.padding = "8px 12px";
  zoomHelper.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  zoomHelper.style.borderRadius = "8px";
  zoomHelper.style.userSelect = "none";
  zoomHelper.style.pointerEvents = "none";
  zoomHelper.textContent = "SCROLL to zoom ";
  helperContainer.appendChild(zoomHelper);

  // Camera movement helper
  const cameraHelper = document.createElement("div");
  cameraHelper.style.fontFamily = '"Satoshi", sans-serif';
  cameraHelper.style.fontSize = "14px";
  cameraHelper.style.fontWeight = "500";
  cameraHelper.style.color = "rgba(255, 255, 255, 0.7)";
  cameraHelper.style.padding = "8px 12px";
  cameraHelper.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  cameraHelper.style.borderRadius = "8px";
  cameraHelper.style.userSelect = "none";
  cameraHelper.style.pointerEvents = "none";
  cameraHelper.textContent = "← ↑ → ↓ to move camera";
  helperContainer.appendChild(cameraHelper);

  container.appendChild(helperContainer);
}
