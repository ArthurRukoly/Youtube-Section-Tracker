(() => {
  // Holds the current video ID

  let currentVideo = "";

  // Keeps track of processed sections to avoid duplicate processing

  const processedSections = new Set();

  // Listen for messages from the background script

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    }
  });

  // Function to handle new video load

  const newVideoLoaded = () => {
    const contentDiv = document.getElementById("content");
    if (contentDiv) {
      const sections = contentDiv.getElementsByTagName(
        "ytd-macro-markers-list-item-renderer"
      );

      // Loop trought all of sections in section tab

      Array.from(sections).forEach((section, index) => {
        if (processedSections.has(section)) {
          return; // Skip sections that have already been processed
        }
        processedSections.add(section);

        // Generates a kay, so it could be saved further in localstorage
        // currentVideo - id of video, being used to saved for each video
        // Index - is section index

        const sectionKey = `${currentVideo}-section-${index}`;

        // Create a checkbox if it doesn't already exist

        if (!section.querySelector(".viewed-checkbox")) {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "viewed-checkbox";

          // Check if the section was previously viewed

          if (localStorage.getItem(sectionKey) === "viewed") {
            checkbox.checked = true;
            section.classList.add("viewed");
          }

          // Add an event listener to handle checkbox state change

          checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
              localStorage.setItem(sectionKey, "viewed");
              section.classList.add("viewed");
            } else {
              localStorage.removeItem(sectionKey);
              section.classList.remove("viewed");
            }
            logCheckedPercentage();
          });

          // Create a wrapper div to hold the checkbox and section, so chechbox would appear
          // on the left

          const wrapper = document.createElement("div");
          wrapper.className = "section-wrapper";
          section.parentNode.insertBefore(wrapper, section);
          wrapper.appendChild(checkbox);
          wrapper.appendChild(section);

          // Calculate the Percentage of task completed

          logCheckedPercentage();
        }
      });
    }
  };

  // Calucalte and displays the percentage of completed tasks

  const logCheckedPercentage = () => {
    const checkboxes = document.querySelectorAll(".viewed-checkbox");

    // There are always 4 extra checkboxes
    // Idk why

    const totalCheckboxes = checkboxes.length - 4;
    const checkedCheckboxes = Array.from(checkboxes).filter(
      (cb) => cb.checked
    ).length;

    const percentage = (checkedCheckboxes / totalCheckboxes) * 100;
    console.log(`Checked percentage: ${percentage.toFixed(2)}%`);

    // Display the percentage inside the title container
    // (Where episodes are written)
    const titleContainer = document.querySelector(
      ".style-scope ytd-engagement-panel-title-header-renderer #title"
    );

    if (titleContainer) {
      let percentageDisplay = titleContainer.querySelector(
        "#checked-percentage"
      );
      if (!percentageDisplay) {
        percentageDisplay = document.createElement("div");
        percentageDisplay.id = "checked-percentage";
        percentageDisplay.className = "percentageDisplay";
        // percentageDisplay.style.marginTop = "10px";
        titleContainer.appendChild(percentageDisplay);
      }
      percentageDisplay.textContent = `${percentage.toFixed(2)}% Complete`;
    }
  };

  const style = document.createElement("style");
  style.innerHTML = `
    .percentageDisplay{
      margin: 10px 10px 10px 10px;
      color: white;
    }
    .viewed-checkbox {
      margin: 0 5px 0 15px;
    }
    .section-wrapper {
      min-width: 25%;
      display: flex;
      align-items: center;
    }
    ytd-macro-markers-list-item-renderer {
      flex-grow: 1;
    }
    /* Default checkbox style */
    input[type="checkbox"] {
      width: 1.5em;
      height: 1.5em;
      appearance: none; /* Remove default styling */
      border: 2px solid #3EA6F4; /* Larger border with color #3EA6F4 */
      background-color: transparent; /* Transparent fill color */
      cursor: pointer; /* Pointer cursor on hover */
    }

    /* Checkbox checked state */
    input[type="checkbox"]:checked {
      background-color: #3EA6F4; /* Fill color when checked */
      border-color: #3EA6F4; /* Maintain the border color */
    }

    /* Checkbox checked with a checkmark */
    input[type="checkbox"]:checked::after {
      content: '';
      display: block;
      width: 0.3em;
      height: 0.6em;
      border: solid #0F0F0F;
      border-width: 0 0.2em 0.2em 0;
      transform: rotate(45deg);
      margin-left: 0.4em;
      margin-top: 0.2em;
    }

  `;
  document.head.appendChild(style);

  // Debounce function to limit the rate at which newVideoLoaded is called

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Debounced version of newVideoLoaded to handle rapid calls

  const debouncedNewVideoLoaded = debounce(() => {
    observer.disconnect();
    newVideoLoaded();
    observer.observe(document.body, { childList: true, subtree: true });
  }, 500);

  debouncedNewVideoLoaded();

  // Observer to monitor changes in the DOM

  const observer = new MutationObserver(() => {
    debouncedNewVideoLoaded();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
