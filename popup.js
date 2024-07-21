let videoId; // Declare a global variable

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    videoId = tab.url.match(/[?&]v=([^&]+)/)[1]; // Assign the URL to the global variable
    console.log(videoId);
    // Load and display result using the obtained URL
    const storedResult = loadStoredResult(videoId);
    displayResult(storedResult, videoId);

    document
      .getElementById("process-button")
      .addEventListener("click", () => processText(videoId));
  });
});

function processText(videoId) {
  const inputText = document.getElementById("inputText").value;
  const lines = inputText.split("\n");
  const result = [];
  let orderNumber = 1;

  lines.forEach((line) => {
    const match = line.match(/^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})\s(.+)/);
    if (match) {
      const timeStamp = match[1];
      const name = match[2];
      result.push({ orderNumber: orderNumber++, timeStamp, name });
    }
  });

  saveResult(result, videoId);
  displayResult(result, videoId);
}

function saveResult(result, videoId) {
  localStorage.setItem(`${videoId}-sections`, JSON.stringify(result));
}

function loadStoredResult(videoId) {
  const storedResult = localStorage.getItem(`${videoId}-sections`);
  return storedResult ? JSON.parse(storedResult) : [];
}

function displayResult(result, videoId) {
  const resultContainer = document.getElementById("result");
  resultContainer.innerHTML = "";

  result.forEach((item, index) => {
    const section = document.createElement("div");
    section.className = "section-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "viewed-checkbox";

    const sectionKey = `${videoId}-section-${index}`;

    if (localStorage.getItem(sectionKey) === "viewed") {
      checkbox.checked = true;
      section.classList.add("viewed");
    }

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        localStorage.setItem(sectionKey, "viewed");
        section.classList.add("viewed");
      } else {
        localStorage.removeItem(sectionKey);
        section.classList.remove("viewed");
      }
      logCheckedPercentage(result.length, videoId);
    });

    const sectionValues = document.createElement("div");
    sectionValues.className = "section-values";

    const sectionName = document.createElement("span");
    sectionName.className = "section-name";
    sectionName.textContent = item.name;

    const sectionTimeStamp = document.createElement("a");
    sectionTimeStamp.className = "section-time-stamp";
    sectionTimeStamp.textContent = item.timeStamp;
    sectionTimeStamp.href = `https://www.youtube.com/watch?v=${videoId}&t=${convertTimeToSeconds(
      item.timeStamp
    )}s`;
    sectionTimeStamp.target = "_blank"; // Opens the link in a new tab

    sectionValues.appendChild(sectionName);
    sectionValues.appendChild(sectionTimeStamp);

    section.appendChild(checkbox);
    section.appendChild(sectionValues);

    resultContainer.appendChild(section);
  });

  logCheckedPercentage(result.length, videoId);
}

function logCheckedPercentage(totalSections, videoId) {
  const checkboxes = document.querySelectorAll(".viewed-checkbox");
  const checkedCheckboxes = Array.from(checkboxes).filter(
    (cb) => cb.checked
  ).length;
  const percentage = (checkedCheckboxes / totalSections) * 100;
  console.log(`Checked percentage: ${percentage.toFixed(2)}%`);

  const titleContainer = document.getElementById("result");

  if (titleContainer) {
    let percentageDisplay = titleContainer.querySelector("#checked-percentage");
    if (!percentageDisplay) {
      percentageDisplay = document.createElement("div");
      percentageDisplay.id = "checked-percentage";
      percentageDisplay.className = "percentageDisplay";
      titleContainer.appendChild(percentageDisplay);
    }
    percentageDisplay.textContent = `${percentage.toFixed(2)}% Complete`;
  }
}

function convertTimeToSeconds(time) {
  const parts = time.split(":");
  let seconds = 0;
  if (parts.length === 2) {
    // MM:SS
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    // HH:MM:SS
    seconds =
      parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return seconds;
}
