document.addEventListener("DOMContentLoaded", function () {
  var scanButton = document.getElementById("scanButton");
  var statusMessage = document.getElementById("statusMessage");
  var videoList = document.getElementById("videoList");

  function clearList() {
    while (videoList.firstChild) {
      videoList.removeChild(videoList.firstChild);
    }
  }

  function createItem(item) {
    var li = document.createElement("li");
    li.style.marginBottom = "6px";

    var name = document.createElement("span");
    name.textContent = item.filename;
    name.style.marginRight = "6px";

    var downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", function () {
      chrome.runtime.sendMessage({ action: "downloadVideo", videoUrl: item.url, filename: item.filename }, function (response) {
        if (response && response.success) {
          statusMessage.textContent = "Downloading: " + item.filename;
        } else {
          statusMessage.textContent = "Failed to start download.";
        }
      });
    });

    li.appendChild(name);
    li.appendChild(downloadBtn);
    return li;
  }

  function autoDownloadIfSingle(items) {
    if (items.length === 1) {
      var only = items[0];
      chrome.runtime.sendMessage({ action: "downloadVideo", videoUrl: only.url, filename: only.filename }, function (response) {
        if (response && response.success) {
          statusMessage.textContent = "Downloading: " + only.filename;
        } else {
          statusMessage.textContent = "Failed to start download.";
        }
      });
      return true;
    }
    return false;
  }

  scanButton.addEventListener("click", function () {
    statusMessage.textContent = "Scanning page...";
    clearList();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { action: "extractVideoUrls" }, function (response) {
        if (!response || !Array.isArray(response.videoUrls)) {
          statusMessage.textContent = "No videos found on the page.";
          return;
        }

        var items = response.videoUrls;

        if (autoDownloadIfSingle(items)) {
          return;
        }

        if (items.length === 0) {
          statusMessage.textContent = "No videos found on the page.";
          return;
        }

        statusMessage.textContent = "Select a video to download:";
        items.forEach(function (item) {
          videoList.appendChild(createItem(item));
        });
      });
    });
  });
});
