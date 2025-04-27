document.addEventListener('DOMContentLoaded', () => {
    const photoContainer = document.getElementById('photo-container');
    const photoImage = document.getElementById('photo-image');

    // Modal elements
    const editTagModal = document.getElementById('edit-tag-modal');
    const personSelect = document.getElementById('person-select');
    const saveTagButton = document.getElementById('save-tag-button');
    const cancelTagButton = document.getElementById('cancel-tag-button');
    const editTagStatus = document.getElementById('edit-tag-status');

    // Variable to store data of the tag being edited
    let currentEditingTagData = null;

    // Get Photo ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const photoId = urlParams.get('id');

    if (!photoId) {
        if (photoContainer) {
            photoContainer.innerHTML = '<p>Error: Photo ID not found in URL.</p>';
        }
        console.error('Photo ID not found in URL.');
        return; // Stop execution if no ID
    }

    if (!photoImage || !photoContainer || !editTagModal || !personSelect || !saveTagButton || !cancelTagButton || !editTagStatus) {
        console.error('Required HTML elements (photo container or modal) not found.');
        return;
    }

    // Fetch Photo Details
    fetch(`/api/photos/${photoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(photoData => {
            photoImage.src = `/api/photos/uploads/photoes/${photoData.filename}`;

            photoImage.onload = () => {
                const existingOverlays = photoContainer.querySelectorAll('.bounding-box, .name-tag');
                existingOverlays.forEach(el => el.remove());

                const scaleX = photoImage.clientWidth / photoImage.naturalWidth;
                const scaleY = photoImage.clientHeight / photoImage.naturalHeight;

                if (photoData.people && Array.isArray(photoData.people)) {
                    photoData.people.forEach(person => {
                        const { personname, x, y, w, h } = person;

                        // Fetch person's name (using the correct field 'personname')
                        fetch(`/api/persons/${personname}`)
                            .then(personResponse => {
                                if (!personResponse.ok) { throw new Error(`HTTP error! status: ${personResponse.status}`); }
                                return personResponse.json();
                            })
                            .then(personDetails => {
                                // Create bounding box
                                const box = document.createElement('div');
                                box.className = 'bounding-box';
                                box.style.left = `${x * scaleX}px`;
                                box.style.top = `${y * scaleY}px`;
                                box.style.width = `${w * scaleX}px`;
                                box.style.height = `${h * scaleY}px`;

                                // Create name tag
                                const nameTag = document.createElement('span');
                                nameTag.className = 'name-tag';
                                nameTag.textContent = personDetails.personname || 'Unknown'; // Use personname
                                nameTag.style.left = `${x * scaleX}px`;
                                nameTag.style.top = `${(y * scaleY) - 18}px`; // Adjust based on CSS

                                // Store data needed for editing in dataset attributes
                                nameTag.dataset.oldPersonId = personname; // Store the ID
                                nameTag.dataset.x = x;
                                nameTag.dataset.y = y;
                                nameTag.dataset.w = w;
                                nameTag.dataset.h = h;

                                // Add click listener to the name tag
                                nameTag.addEventListener('click', () => {
                                    // Store data from the clicked tag
                                    currentEditingTagData = {
                                        old_person_id: nameTag.dataset.oldPersonId,
                                        x: parseFloat(nameTag.dataset.x), // Ensure numbers
                                        y: parseFloat(nameTag.dataset.y),
                                        w: parseFloat(nameTag.dataset.w),
                                        h: parseFloat(nameTag.dataset.h),
                                        tagElement: nameTag // Reference to the clicked tag element
                                    };

                                    editTagStatus.textContent = 'Loading persons...';
                                    editTagStatus.className = 'status-message info';
                                    personSelect.innerHTML = '<option>Loading...</option>'; // Clear previous options
                                    editTagModal.style.display = 'flex'; // Show modal

                                    // Fetch all persons for the dropdown
                                    fetch('/api/persons/list?per_page=1000') // Fetch a large number
                                        .then(response => {
                                            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                                            return response.json();
                                        })
                                        .then(personsData => {
                                            personSelect.innerHTML = ''; // Clear loading message
                                            personsData.persons.forEach(p => {
                                                const option = document.createElement('option');
                                                option.value = p._id;
                                                option.textContent = p.personname || 'Unnamed Person'; // Use personname
                                                // Select the current person in the dropdown
                                                if (p._id === currentEditingTagData.old_person_id) {
                                                    option.selected = true;
                                                }
                                                personSelect.appendChild(option);
                                            });
                                            editTagStatus.textContent = ''; // Clear loading message
                                        })
                                        .catch(error => {
                                            console.error('Error fetching persons list:', error);
                                            editTagStatus.textContent = 'Error loading persons list.';
                                            editTagStatus.className = 'status-message error';
                                            // Optionally hide modal or disable save button
                                        });
                                });

                                photoContainer.appendChild(box);
                                photoContainer.appendChild(nameTag);
                            })
                            .catch(error => {
                                console.error(`Error fetching person details for ID ${personname}:`, error);
                            });
                    });
                }
            };

            photoImage.onerror = () => {
                 console.error('Error loading photo image.');
                 photoContainer.innerHTML = '<p>Error loading photo image.</p>';
            }

        })
        .catch(error => {
            console.error('Error fetching photo details:', error);
            if (photoContainer) {
                photoContainer.innerHTML = '<p>Error loading photo details.</p>';
            }
        });

    // --- Modal Event Listeners ---

    // Save Button Listener
    saveTagButton.addEventListener('click', async () => {
        if (!currentEditingTagData) {
            console.error('No tag data available for saving.');
            return;
        }

        const new_person_id = personSelect.value;
        const { old_person_id, x, y, w, h, tagElement } = currentEditingTagData;

        if (new_person_id === old_person_id) {
            editTagModal.style.display = 'none'; // Just close if no change
            currentEditingTagData = null;
            return;
        }

        editTagStatus.textContent = 'Saving...';
        editTagStatus.className = 'status-message info';
        saveTagButton.disabled = true;
        cancelTagButton.disabled = true;

        try {
            const response = await fetch(`/api/photos/${photoId}/change-person`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_person_id, new_person_id, x, y, w, h })
            });

            const result = await response.json();

            if (response.ok) {
                // Update the clicked tag's text and data
                const selectedOption = personSelect.options[personSelect.selectedIndex];
                tagElement.textContent = selectedOption.text; // Update displayed name
                tagElement.dataset.oldPersonId = new_person_id; // Update stored ID

                editTagModal.style.display = 'none'; // Hide modal
                currentEditingTagData = null; // Clear temporary data
                 // Optionally display a success message elsewhere if needed
            } else {
                throw new Error(result.error || 'Failed to update tag.');
            }
        } catch (error) {
            console.error('Error updating person tag:', error);
            editTagStatus.textContent = `Error: ${error.message}`;
            editTagStatus.className = 'status-message error';
        } finally {
            saveTagButton.disabled = false;
            cancelTagButton.disabled = false;
        }
    });

    // Cancel Button Listener
    cancelTagButton.addEventListener('click', () => {
        editTagModal.style.display = 'none';
        currentEditingTagData = null; // Clear temporary data
        editTagStatus.textContent = ''; // Clear status message
    });

    // Optional: Close modal if clicking outside the content area
    editTagModal.addEventListener('click', (event) => {
        if (event.target === editTagModal) { // Check if the click is on the overlay itself
            editTagModal.style.display = 'none';
            currentEditingTagData = null;
            editTagStatus.textContent = '';
        }
    });
});
