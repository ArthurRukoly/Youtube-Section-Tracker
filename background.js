// chrome.tabs.onUpdated.addListener((tabId, tab) => {
//     if (tab.url && tab.url.includes("youtube.com/watch")) {
//       const queryParameters = tab.url.split("?")[1];
//       const urlParameters = new URLSearchParams(queryParameters);

//       chrome.tabs.sendMessage(tabId, {
//         type: "NEW",
//         videoId: urlParameters.get("v"),
//       });
//     }
//   });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url.includes("youtube.com/watch")
  ) {
    const urlParams = new URLSearchParams(new URL(tab.url).search);
    const videoId = urlParams.get("v");

    if (videoId) {
      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        videoId: videoId,
      });
    }
  }
});
