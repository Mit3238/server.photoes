document.addEventListener('DOMContentLoaded', () => {
    const personNameH1 = document.getElementById('person-name');
    const photosGridDiv = document.getElementById('person-photos-grid');

    // Get Person ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const personId = urlParams.get('id');

    if (!personId) {
        if (personNameH1) {
            personNameH1.textContent = 'Error: Person ID not found in URL.';
        }
        console.error('Person ID not found in URL.');
        return; // Stop execution if no ID
    }

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
        })
        .catch(error => {
            console.error('Error fetching person details:', error);
            if (personNameH1) {
                personNameH1.textContent = 'Error loading person details.';
            }
        });

    // Fetch Person Photos
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
});
