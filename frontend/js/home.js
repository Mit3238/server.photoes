document.addEventListener("DOMContentLoaded", () => {
  // Existing elements
  const personsListDiv = document.getElementById("persons-list");
  const photosGrid = document.getElementById("photos-grid"); // Renamed from photosGridDiv

  // Upload form elements
  const uploadForm = document.getElementById("upload-form");
  const photoInput = document.getElementById("photo-input");
  const uploadButton = document.getElementById("upload-button");
  const uploadStatusMessage = document.getElementById("upload-status-message");

  // Processing control elements
  const startProcessingButton = document.getElementById(
    "start-processing-button"
  );
  const stopProcessingButton = document.getElementById(
    "stop-processing-button"
  );
  const processingStatusMessage = document.getElementById(
    "processing-status-message"
  );

  // Infinite Scroll State Variables
  let homeCurrentPage = 1;
  const homePerPage = 20; // Number of photos per page
  let homeTotalPhotos = 0;
  let homeIsLoading = false;

  // --- Function to Fetch and Display Photos (Modified for Infinite Scroll) ---
  async function fetchPhotos(page = 1) {
    if (!photosGrid || homeIsLoading) return; // Prevent concurrent loads

    homeIsLoading = true;
    // Optionally show a loading indicator here if needed

    try {
      const response = await fetch(
        `/api/photos/list?page=${page}&per_page=${homePerPage}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (page === 1) {
        photosGrid.innerHTML = ""; // Clear grid only on first page load
        homeTotalPhotos = data.total; // Update total count
      }

      data.photos.forEach((photo) => {
        const link = document.createElement("a");
        link.href = `photo.html?id=${photo._id}`;

        const img = document.createElement("img");
        img.src = `/api/photos/uploads/photoes/${photo.filename}`;
        img.alt = `Photo ${photo._id}`;
        // Loading attribute can help performance
        img.loading = "lazy";

        link.appendChild(img);
        photosGrid.appendChild(link); // Append new photos
      });

      homeCurrentPage = page; // Update current page state *after* successful fetch and render
    } catch (error) {
      console.error("Error fetching photos:", error);
      // Avoid clearing the grid on subsequent page load errors
      if (page === 1) {
        photosGrid.innerHTML = "<p>Error loading photos.</p>";
      } else {
        // Optionally display a temporary error message without clearing grid
        console.error("Could not load more photos.");
      }
    } finally {
      homeIsLoading = false;
      // Optionally hide loading indicator here
    }
  }

  // --- Function to Fetch and Display Persons (Unchanged) ---
  function fetchPersons() {
    if (!personsListDiv) return;
    fetch("/api/persons/list")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        personsListDiv.innerHTML = "";
        data.persons.forEach((person) => {
          const link = document.createElement("a");
          link.href = `person.html?id=${person._id}`;
          const img = document.createElement("img");
          img.src = person.facefile
            ? `/api/photos/${person.facefile}`
            : "img/placeholder_person.png";
          img.alt = person.personname || "Unknown"; // Use personname
          img.loading = "lazy";
          link.appendChild(img);
          personsListDiv.appendChild(link);
        });
      })
      .catch((error) => {
        console.error("Error fetching persons:", error);
        personsListDiv.innerHTML = "<p>Error loading persons.</p>";
      });
  }

  // --- Upload Form Logic (Modified to refresh page 1) ---
  if (uploadForm && photoInput && uploadButton && uploadStatusMessage) {
    uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const files = photoInput.files;
      if (!files || files.length === 0) {
        uploadStatusMessage.textContent = "Please select files to upload.";
        uploadStatusMessage.className = "status-message error";
        return;
      }
      uploadStatusMessage.textContent = "Uploading...";
      uploadStatusMessage.className = "status-message info";
      uploadButton.disabled = true;
      const formData = new FormData();
      for (const file of files) {
        formData.append("photos", file);
      }

      try {
        const response = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok) {
          uploadStatusMessage.textContent = `Successfully uploaded ${
            result.uploaded?.length || 0
          } photo(s).`;
          uploadStatusMessage.className = "status-message success";
          uploadForm.reset();
          // Refresh photos starting from page 1 after upload
          fetchPhotos(1);
          // Refresh persons list as new faces might be detected
          fetchPersons();
        } else {
          uploadStatusMessage.textContent = `Upload failed: ${
            result.error || "Unknown error"
          }`;
          uploadStatusMessage.className = "status-message error";
        }
      } catch (error) {
        console.error("Upload error:", error);
        uploadStatusMessage.textContent = `Upload failed: ${error.message}`;
        uploadStatusMessage.className = "status-message error";
      } finally {
        uploadButton.disabled = false;
        setTimeout(() => {
          /* ... (timeout logic unchanged) ... */
          if (
            uploadStatusMessage.textContent.startsWith(
              "Successfully uploaded"
            ) ||
            uploadStatusMessage.textContent.startsWith("Upload failed")
          ) {
            uploadStatusMessage.textContent = "";
            uploadStatusMessage.className = "status-message";
          }
        }, 5000);
      }
    });
  } else {
    console.error("Upload form elements not found!");
  }

  // --- Processing Controls Logic (Unchanged) ---
  if (
    startProcessingButton &&
    stopProcessingButton &&
    processingStatusMessage
  ) {
    startProcessingButton.addEventListener("click", async () => {
      /* ... (unchanged) ... */
      processingStatusMessage.textContent = "Starting processing...";
      processingStatusMessage.className = "status-message info";
      startProcessingButton.disabled = true;
      stopProcessingButton.disabled = true;

      try {
        const response = await fetch("/api/process/start", { method: "POST" });
        const result = await response.json();

        if (response.ok) {
          processingStatusMessage.textContent =
            result.message || "Processing started successfully.";
          processingStatusMessage.className = "status-message success";
        } else {
          processingStatusMessage.textContent = `Error: ${
            result.message || "Unknown error"
          }`;
          processingStatusMessage.className = "status-message error";
        }
      } catch (error) {
        console.error("Start processing error:", error);
        processingStatusMessage.textContent = `Error: ${error.message}`;
        processingStatusMessage.className = "status-message error";
      } finally {
        startProcessingButton.disabled = false;
        stopProcessingButton.disabled = false;
      }
    });
    stopProcessingButton.addEventListener("click", async () => {
      /* ... (unchanged) ... */
      processingStatusMessage.textContent = "Stopping processing...";
      processingStatusMessage.className = "status-message info";
      startProcessingButton.disabled = true;
      stopProcessingButton.disabled = true;

      try {
        const response = await fetch("/api/process/stop", { method: "POST" });
        const result = await response.json();

        if (response.ok) {
          processingStatusMessage.textContent =
            result.message || "Processing stopped successfully.";
          processingStatusMessage.className = "status-message success";
        } else {
          processingStatusMessage.textContent = `Error: ${
            result.message || "Unknown error"
          }`;
          processingStatusMessage.className = "status-message error";
        }
      } catch (error) {
        console.error("Stop processing error:", error);
        processingStatusMessage.textContent = `Error: ${error.message}`;
        processingStatusMessage.className = "status-message error";
      } finally {
        startProcessingButton.disabled = false;
        stopProcessingButton.disabled = false;
      }
    });
  } else {
    console.error("Processing control elements not found!");
  }

  // --- Scroll Event Listener for Infinite Scrolling ---
  window.addEventListener("scroll", () => {
    // Check if already loading to prevent multiple triggers
    if (homeIsLoading) {
      return;
    }

    // Check if user is near the bottom of the page
    // (window.innerHeight + window.scrollY) is the bottom of the viewport
    // document.body.offsetHeight is the total height of the page content
    // Trigger when viewport bottom is within 200px of the page bottom
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 200
    ) {
      // Check if there are more photos to load
      if (homeCurrentPage * homePerPage < homeTotalPhotos) {
        const nextPage = homeCurrentPage + 1;
        console.log(`Loading page ${nextPage}...`); // Debug log
        fetchPhotos(nextPage); // Fetch the next page
      } else {
        // Optional: Display a message that all photos are loaded
        // console.log("All photos loaded.");
      }
    }
  });

  // --- Initial Data Load ---
  fetchPersons();
  fetchPhotos(1); // Load the first page of photos initially
});
