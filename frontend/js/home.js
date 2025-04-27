document.addEventListener("DOMContentLoaded", () => {
  // Existing elements
  const personsListDiv = document.getElementById("persons-list");
  const photosGridDiv = document.getElementById("photos-grid");

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

  // --- Function to Fetch and Display Photos ---
  function fetchPhotos() {
    if (!photosGridDiv) return;
    // Optionally show a loading indicator in photosGridDiv
    // photosGridDiv.innerHTML = '<p>Loading photos...</p>';

    fetch("/api/photos/list?per_page=50") // Fetching 50 photos
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        photosGridDiv.innerHTML = ""; // Clear existing content (or loading indicator)
        data.photos.forEach((photo) => {
          const link = document.createElement("a");
          link.href = `photo.html?id=${photo._id}`;

          const img = document.createElement("img");
          // Construct the correct image source URL
          img.src = `/api/photos/uploads/photoes/${photo.filename}`;
          img.alt = `Photo ${photo._id}`;
          // Note: Inline width removed, rely on CSS

          link.appendChild(img);
          photosGridDiv.appendChild(link);
        });
      })
      .catch((error) => {
        console.error("Error fetching photos:", error);
        photosGridDiv.innerHTML = "<p>Error loading photos.</p>"; // Display error in the grid
      });
  }

  // --- Function to Fetch and Display Persons ---
  function fetchPersons() {
    if (!personsListDiv) return;
    // Optionally show a loading indicator
    // personsListDiv.innerHTML = '<p>Loading persons...</p>';

    fetch("/api/persons/list")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        personsListDiv.innerHTML = ""; // Clear existing content
        data.persons.forEach((person) => {
          const link = document.createElement("a");
          link.href = `person.html?id=${person._id}`;

          const img = document.createElement("img");
          // Construct correct face image URL
          img.src = person.facefile
            ? `/api/photos/${person.facefile}`
            : "img/placeholder_person.png"; // Use a placeholder image
          img.alt = person.name;
          // Note: Inline width removed, rely on CSS

          link.appendChild(img);
          personsListDiv.appendChild(link);
        });
      })
      .catch((error) => {
        console.error("Error fetching persons:", error);
        personsListDiv.innerHTML = "<p>Error loading persons.</p>";
      });
  }

  // --- Upload Form Logic ---
  if (uploadForm && photoInput && uploadButton && uploadStatusMessage) {
    uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent default form submission

      const files = photoInput.files;
      if (!files || files.length === 0) {
        uploadStatusMessage.textContent = "Please select files to upload.";
        uploadStatusMessage.className = "status-message error"; // Add class for styling
        return;
      }

      uploadStatusMessage.textContent = "Uploading...";
      uploadStatusMessage.className = "status-message info"; // Add class for styling
      uploadButton.disabled = true; // Disable button during upload

      const formData = new FormData();
      for (const file of files) {
        formData.append("photos", file); // Key must match backend ('photos')
      }

      try {
        const response = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
          // Headers are not needed for FormData; browser sets Content-Type correctly
        });

        const result = await response.json();

        if (response.ok) {
          uploadStatusMessage.textContent = `Successfully uploaded ${
            result.uploaded?.length || 0
          } photo(s).`;
          uploadStatusMessage.className = "status-message success";
          uploadForm.reset(); // Clear the file input
          // Refresh the photo list after upload
          fetchPhotos();
          // Optionally refresh persons list if upload triggers face detection/person creation
          // fetchPersons();
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
        uploadButton.disabled = false; // Re-enable button
        // Clear message after a few seconds
        setTimeout(() => {
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

  // --- Processing Controls Logic ---
  if (
    startProcessingButton &&
    stopProcessingButton &&
    processingStatusMessage
  ) {
    // Start Button Listener
    startProcessingButton.addEventListener("click", async () => {
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

    // Stop Button Listener
    stopProcessingButton.addEventListener("click", async () => {
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

  // --- Initial Data Load ---
  fetchPersons();
  fetchPhotos();
});
