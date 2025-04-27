document.addEventListener('DOMContentLoaded', () => {
    // Existing elements
    const personNameH1 = document.getElementById('person-name');
    const personPhotosGrid = document.getElementById('person-photos-grid'); // Use correct ID and name

    // Edit elements
    const editPersonButton = document.getElementById('edit-person-button');
    const editPersonSection = document.getElementById('edit-person-section');
    const editPersonNameInput = document.getElementById('edit-person-name-input');
    const savePersonNameButton = document.getElementById('save-person-name-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const editStatusMessage = document.getElementById('edit-status-message');

    // Infinite Scroll State Variables for Person Page
    let personCurrentPage = 1;
    const personPerPage = 20; // Number of photos per page
    let personTotalPhotos = 0;
    let personIsLoading = false;
    let currentPersonId = null; // To store the person ID from URL

    // Get Person ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const personIdFromUrl = urlParams.get('id'); // Use a different temporary name

    if (!personIdFromUrl) {
        if (personNameH1) { personNameH1.textContent = 'Error: Person ID not found in URL.'; }
        console.error('Person ID not found in URL.');
        if (editPersonButton) editPersonButton.style.display = 'none';
        return;
    }

    currentPersonId = personIdFromUrl; // Store the valid ID

    // --- Function to Fetch and Display Person Photos (Modified for Infinite Scroll) ---
    async function fetchPersonPhotos(personId, page = 1) {
        if (!personPhotosGrid || personIsLoading) return; // Prevent concurrent loads

        personIsLoading = true;
        // Optionally show a loading indicator

        try {
            const response = await fetch(`/api/photos/person-images/${personId}?page=${page}&per_page=${personPerPage}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (page === 1) {
                personPhotosGrid.innerHTML = ''; // Clear grid only on first page load
                personTotalPhotos = data.total; // Update total count
            }

            data.photos.forEach(photo => {
                const link = document.createElement('a');
                link.href = `photo.html?id=${photo._id}`;

                const img = document.createElement('img');
                img.src = `/api/photos/uploads/photoes/${photo.filename}`;
                img.alt = `Photo ${photo._id}`;
                img.loading = 'lazy';

                link.appendChild(img);
                personPhotosGrid.appendChild(link); // Append new photos
            });

            personCurrentPage = page; // Update current page state

        } catch (error) {
            console.error('Error fetching person photos:', error);
            if (page === 1) {
                personPhotosGrid.innerHTML = '<p>Error loading photos for this person.</p>';
            } else {
                console.error("Could not load more photos for this person.");
            }
        } finally {
            personIsLoading = false;
            // Optionally hide loading indicator
        }
    }


    // --- Fetch Initial Person Details ---
    fetch(`/api/persons/${currentPersonId}`)
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
        })
        .then(data => {
            if (personNameH1) { personNameH1.textContent = data.personname || 'Unknown Person'; }
            if (editPersonButton) { editPersonButton.style.display = 'inline-block'; }
            // Load first page of photos AFTER getting person details
            fetchPersonPhotos(currentPersonId, 1);
        })
        .catch(error => {
            console.error('Error fetching person details:', error);
            if (personNameH1) { personNameH1.textContent = 'Error loading person details.'; }
            if (editPersonButton) { editPersonButton.style.display = 'none'; }
        });

    // --- Edit Name Logic (Unchanged) ---
    if (editPersonButton && editPersonSection) {
        editPersonButton.addEventListener('click', () => {
            editPersonButton.style.display = 'none';
            editPersonSection.style.display = 'block';
            editPersonNameInput.value = personNameH1.textContent;
            editStatusMessage.textContent = '';
            editPersonNameInput.focus();
        });
    }
    if (cancelEditButton && editPersonSection && editPersonButton) {
        cancelEditButton.addEventListener('click', () => {
            editPersonSection.style.display = 'none';
            editPersonButton.style.display = 'inline-block';
            editPersonNameInput.value = '';
            editStatusMessage.textContent = '';
        });
    }
    if (savePersonNameButton && editPersonNameInput && personNameH1 && editStatusMessage && editPersonSection && editPersonButton) {
        savePersonNameButton.addEventListener('click', () => {
            const newName = editPersonNameInput.value.trim();
            const currentName = personNameH1.textContent;
            if (!newName) { /* ... validation ... */
                 editStatusMessage.textContent = 'New name cannot be empty.';
                 editStatusMessage.style.color = 'red'; // Assuming CSS handles .error class
                 editStatusMessage.className = 'status-message error';
                 return;
            }
            if (newName === currentName) { /* ... validation ... */
                 editStatusMessage.textContent = 'New name is the same as the current name.';
                 editStatusMessage.style.color = 'orange'; // Assuming CSS handles .info class
                 editStatusMessage.className = 'status-message info';

                 return;
            }
            editStatusMessage.textContent = 'Saving...';
            editStatusMessage.style.color = 'grey'; // Assuming CSS handles .info class
            editStatusMessage.className = 'status-message info';


            fetch(`/api/persons/${currentPersonId}`, { // Use currentPersonId
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personname: newName })
            })
            .then(response => {
                if (!response.ok) { return response.json().then(err => { throw new Error(err.error || `HTTP error! status: ${response.status}`) }); }
                return response.json();
            })
            .then(data => {
                personNameH1.textContent = newName;
                editPersonSection.style.display = 'none';
                editPersonButton.style.display = 'inline-block';
                editStatusMessage.textContent = 'Name updated successfully!';
                editStatusMessage.style.color = 'green'; // Assuming CSS handles .success class
                 editStatusMessage.className = 'status-message success';

                editPersonNameInput.value = '';
                setTimeout(() => { editStatusMessage.textContent = ''; editStatusMessage.className = 'status-message'; }, 3000);
            })
            .catch(error => {
                console.error('Error updating person name:', error);
                editStatusMessage.textContent = `Failed to update name: ${error.message}`;
                editStatusMessage.style.color = 'red'; // Assuming CSS handles .error class
                editStatusMessage.className = 'status-message error';

            });
        });
    }

    // --- Scroll Event Listener for Infinite Scrolling ---
    window.addEventListener('scroll', () => {
        if (personIsLoading || !currentPersonId) { // Check loading state and if ID is valid
            return;
        }

        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            if ((personCurrentPage * personPerPage) < personTotalPhotos) {
                const nextPage = personCurrentPage + 1;
                console.log(`Loading page ${nextPage} for person ${currentPersonId}...`); // Debug log
                fetchPersonPhotos(currentPersonId, nextPage); // Fetch the next page
            }
        }
    });

});
