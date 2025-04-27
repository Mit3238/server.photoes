document.addEventListener('DOMContentLoaded', () => {
    const personsListDiv = document.getElementById('persons-list');
    const photosGridDiv = document.getElementById('photos-grid');

    // Fetch Persons
    fetch('/api/persons/list')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!personsListDiv) return;
            personsListDiv.innerHTML = ''; // Clear existing content
            data.persons.forEach(person => {
                const link = document.createElement('a');
                link.href = `person.html?id=${person._id}`;

                const img = document.createElement('img');
                // Assuming person object has a representative facefile
                // If not, this needs adjustment based on actual API response structure
                img.src = person.facefile ? `/api/photos/uploads/faces/${person.facefile}` : 'placeholder.jpg'; // Added placeholder
                img.alt = person.name;
                img.width = 50; // Add basic styling

                link.appendChild(img);
                personsListDiv.appendChild(link);
            });
        })
        .catch(error => {
            console.error('Error fetching persons:', error);
            if (personsListDiv) {
                personsListDiv.innerHTML = '<p>Error loading persons.</p>';
            }
        });

    // Fetch Photos
    fetch('/api/photos/list?per_page=50') // Fetching 50 photos
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
                img.alt = `Photo ${photo._id}`; // More descriptive alt text
                img.width = 150; // Add basic styling

                link.appendChild(img);
                photosGridDiv.appendChild(link);
            });
        })
        .catch(error => {
            console.error('Error fetching photos:', error);
            if (photosGridDiv) {
                photosGridDiv.innerHTML = '<p>Error loading photos.</p>';
            }
        });
});
