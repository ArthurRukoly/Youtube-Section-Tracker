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
    }
  });

  // Function to handle new video load
  const newVideoLoaded = () => {
    const contentDiv = document.getElementById("content");
    if (contentDiv) {
      const sections = contentDiv.getElementsByTagName(
        "ytd-macro-markers-list-item-renderer"
      );

      // Loop through all sections in the section tab
      Array.from(sections).forEach((section, index) => {
        if (processedSections.has(section)) {
          return; // Skip sections that have already been processed
        }
        processedSections.add(section);

        // Generates a key, so it could be saved further in local storage
        // currentVideo - id of video, being used to save for each video
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

          // Create a wrapper div to hold the checkbox and section, so checkbox would appear
          // on the left
          const wrapper = document.createElement("div");
          wrapper.className = "section-wrapper";
          section.parentNode.insertBefore(wrapper, section);
          wrapper.appendChild(checkbox);
          wrapper.appendChild(section);

          // Calculate the percentage of task completed
          logCheckedPercentage();
        }
      });
    }
  };

  // Calculate and display the percentage of completed tasks
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

  // Function to handle the key combination for triggering newVideoLoaded
  const handleKeyPress = (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "Y") {
      newVideoLoaded();
    }
  };

  // Add event listener for keydown event
  document.addEventListener("keydown", handleKeyPress);

  // Initial call to set up the script
  newVideoLoaded();
})();
