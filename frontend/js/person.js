document.addEventListener('DOMContentLoaded', () => {
    // Existing elements
    const personNameH1 = document.getElementById('person-name');
    const photosGridDiv = document.getElementById('person-photos-grid');

    // New elements for editing
    const editPersonButton = document.getElementById('edit-person-button');
    const editPersonSection = document.getElementById('edit-person-section');
    const editPersonNameInput = document.getElementById('edit-person-name-input');
    const savePersonNameButton = document.getElementById('save-person-name-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const editStatusMessage = document.getElementById('edit-status-message');

    // Get Person ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const personId = urlParams.get('id');

    if (!personId) {
        if (personNameH1) {
            personNameH1.textContent = 'Error: Person ID not found in URL.';
        }
        console.error('Person ID not found in URL.');
        // Hide edit button if no ID
        if (editPersonButton) editPersonButton.style.display = 'none';
        return; // Stop execution if no ID
    }

    // --- Fetch Initial Data ---
    // Fetch Person Details
    fetch(`/api/persons/${personId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (personNameH1) {
                personNameH1.textContent = data.name || 'Unknown Person'; // Update H1 with person's name
            }
            // Show edit button only after loading name
             if (editPersonButton) editPersonButton.style.display = 'inline-block';
        })
        .catch(error => {
            console.error('Error fetching person details:', error);
            if (personNameH1) {
                personNameH1.textContent = 'Error loading person details.';
            }
             // Hide edit button on error
            if (editPersonButton) editPersonButton.style.display = 'none';
        });

    // Fetch Person Photos (existing code)
    fetch(`/api/photos/person-images/${personId}?per_page=100`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!photosGridDiv) return;
            photosGridDiv.innerHTML = ''; // Clear existing content
            data.photos.forEach(photo => {
                const link = document.createElement('a');
                link.href = `photo.html?id=${photo._id}`;

                const img = document.createElement('img');
                img.src = `/api/photos/uploads/photoes/${photo.filename}`;
                img.alt = `Photo associated with person ${personId}`; // Descriptive alt text
                img.width = 150; // Add basic styling

                link.appendChild(img);
                photosGridDiv.appendChild(link);
            });
        })
        .catch(error => {
            console.error('Error fetching person photos:', error);
            if (photosGridDiv) {
                photosGridDiv.innerHTML = '<p>Error loading photos for this person.</p>';
            }
        });

    // --- Edit Name Logic ---

    // Show edit section
    if (editPersonButton && editPersonSection) {
        editPersonButton.addEventListener('click', () => {
            editPersonButton.style.display = 'none';
            editPersonSection.style.display = 'block';
            editPersonNameInput.value = personNameH1.textContent; // Pre-fill input
            editStatusMessage.textContent = ''; // Clear status
            editPersonNameInput.focus(); // Focus input field
        });
    }

    // Cancel editing
    if (cancelEditButton && editPersonSection && editPersonButton) {
        cancelEditButton.addEventListener('click', () => {
            editPersonSection.style.display = 'none';
            editPersonButton.style.display = 'inline-block';
            editPersonNameInput.value = ''; // Clear input
            editStatusMessage.textContent = ''; // Clear status
        });
    }

    // Save new name
    if (savePersonNameButton && editPersonNameInput && personNameH1 && editStatusMessage && editPersonSection && editPersonButton) {
        savePersonNameButton.addEventListener('click', () => {
            const newName = editPersonNameInput.value.trim();
            const currentName = personNameH1.textContent;

            if (!newName) {
                editStatusMessage.textContent = 'New name cannot be empty.';
                editStatusMessage.style.color = 'red';
                return;
            }

            if (newName === currentName) {
                editStatusMessage.textContent = 'New name is the same as the current name.';
                editStatusMessage.style.color = 'orange';
                return;
            }

            editStatusMessage.textContent = 'Saving...';
            editStatusMessage.style.color = 'grey';

            fetch(`/api/persons/${personId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ personname: newName })
            })
            .then(response => {
                if (!response.ok) {
                    // Try to get error message from backend if available
                    return response.json().then(err => { throw new Error(err.error || `HTTP error! status: ${response.status}`) });
                }
                return response.json();
            })
            .then(data => {
                personNameH1.textContent = newName; // Update H1
                editPersonSection.style.display = 'none';
                editPersonButton.style.display = 'inline-block';
                editStatusMessage.textContent = 'Name updated successfully!';
                editStatusMessage.style.color = 'green';
                editPersonNameInput.value = ''; // Clear input
                 // Optionally clear message after a few seconds
                setTimeout(() => { editStatusMessage.textContent = ''; }, 3000);
            })
            .catch(error => {
                console.error('Error updating person name:', error);
                editStatusMessage.textContent = `Failed to update name: ${error.message}`;
                editStatusMessage.style.color = 'red';
            });
        });
    }
});
