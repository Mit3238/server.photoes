document.addEventListener("DOMContentLoaded", () => {
  const photoContainer = document.getElementById("photo-container");
  const photoImage = document.getElementById("photo-image");

  // Get Photo ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const photoId = urlParams.get("id");

  if (!photoId) {
    if (photoContainer) {
      photoContainer.innerHTML = "<p>Error: Photo ID not found in URL.</p>";
    }
    console.error("Photo ID not found in URL.");
    return; // Stop execution if no ID
  }

  if (!photoImage || !photoContainer) {
    console.error("Required HTML elements not found.");
    return;
  }

  // Fetch Photo Details
  fetch(`/api/photos/${photoId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((photoData) => {
      // Set image source
      photoImage.src = `/api/photos/uploads/photoes/${photoData.filename}`;

      // Wait for the image to load to get correct dimensions
      photoImage.onload = () => {
        // Clear previous overlays if any (e.g., if navigating between photos quickly)
        const existingOverlays = photoContainer.querySelectorAll(
          ".bounding-box, .name-tag"
        );
        existingOverlays.forEach((el) => el.remove());

        // Calculate scaling factors
        const scaleX = photoImage.clientWidth / photoImage.naturalWidth;
        const scaleY = photoImage.clientHeight / photoImage.naturalHeight;

        // Iterate through people found in the photo
        if (photoData.people && Array.isArray(photoData.people)) {
          photoData.people.forEach((person) => {
            const { personname, x, y, w, h } = person;

            // Fetch person's name
            fetch(`/api/persons/${personname}`)
              .then((personResponse) => {
                if (!personResponse.ok) {
                  throw new Error(
                    `HTTP error! status: ${personResponse.status}`
                  );
                }
                return personResponse.json();
              })
              .then((personData) => {
                // Create bounding box
                const box = document.createElement("div");
                box.className = "bounding-box"; // Add class for CSS styling
                box.style.position = "absolute";
                box.style.left = `${x * scaleX}px`;
                box.style.top = `${y * scaleY}px`;
                box.style.width = `${w * scaleX}px`;
                box.style.height = `${h * scaleY}px`;
                // box.style.border = '2px solid red'; // Moved to CSS

                // Create name tag
                const nameTag = document.createElement("span");
                nameTag.className = "name-tag"; // Add class for CSS styling
                nameTag.textContent = personData.personname || "Unknown";
                nameTag.style.position = "absolute";
                nameTag.style.left = `${x * scaleX}px`; // Position near the box top-left
                nameTag.style.top = `${y * scaleY - 18}px`; // Position slightly above the box
                // nameTag.style.background = 'rgba(255, 0, 0, 0.7)'; // Moved to CSS
                // nameTag.style.color = 'white'; // Moved to CSS
                // nameTag.style.padding = '2px'; // Moved to CSS
                // nameTag.style.fontSize = '12px'; // Moved to CSS

                photoContainer.appendChild(box);
                photoContainer.appendChild(nameTag);
              })
              .catch((error) => {
                console.error(
                  `Error fetching person details for ID ${personname}:`,
                  error
                );
                // Optionally add a placeholder if person fetch fails
              });
          });
        }
      };

      photoImage.onerror = () => {
        console.error("Error loading photo image.");
        photoContainer.innerHTML = "<p>Error loading photo image.</p>";
      };
    })
    .catch((error) => {
      console.error("Error fetching photo details:", error);
      if (photoContainer) {
        photoContainer.innerHTML = "<p>Error loading photo details.</p>";
      }
    });
});
