const { admin } = require('../config/firebaseConfig'); // Assuming admin SDK is exported from here

// Get a reference to the storage service, which is part of the admin SDK
const bucket = admin.storage().bucket(); // Uses default bucket from Firebase project

/**
 * Uploads a buffer to Firebase Storage.
 * @param {Buffer} buffer The buffer containing file data.
 * @param {string} fileName The desired file name in storage.
 * @param {string} contentType The MIME type of the file (e.g., 'text/plain', 'application/pdf').
 * @param {string} pathPrefix Optional prefix for the file path in the bucket (e.g., 'research_papers/order123').
 * @returns {Promise<string>} A promise that resolves with the public URL of the uploaded file.
 */
async function uploadBufferToStorage(buffer, fileName, contentType, pathPrefix = '') {
  const fullPath = pathPrefix ? `${pathPrefix.replace(/\/$/, "")}/${fileName}` : fileName;
  const file = bucket.file(fullPath);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: contentType,
        // You can add more metadata here if needed
        // e.g., customMetadata: { orderId: 'some-order-id' }
      },
      // public: true, // Option 1: Make file public immediately (less secure for sensitive data)
      resumable: false, // Good for small files; for larger files, resumable is better
    });

    stream.on('error', (err) => {
      console.error(`Error uploading to Firebase Storage at ${fullPath}:`, err);
      reject(err);
    });

    stream.on('finish', async () => {
      console.log(`File ${fileName} uploaded successfully to ${fullPath}.`);

      // Option 2 (Recommended for controlled access): Get a signed URL
      // This requires the file NOT to be public by default.
      // Signed URLs are temporary and secure.
      try {
        // Make the file public for simplicity in this example.
        // For production, use signed URLs or ensure bucket/file ACLs are correctly set for your needs.
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fullPath}`;
        // console.log(`Public URL (after making public): ${publicUrl}`);
        // resolve(publicUrl);

        // If using signed URLs:
        // const signedUrlConfig = {
        //   action: 'read',
        //   expires: '03-01-2500', // Far future expiration date for "permanent" link, or shorter for temporary access
        // };
        // const [url] = await file.getSignedUrl(signedUrlConfig);
        // console.log(`Generated signed URL for ${fileName}: ${url}`);
        resolve(publicUrl); // For now, using simple public URL after making file public
      } catch (signedUrlError) {
        console.error(`Error making file public or getting signed URL for ${fullPath}:`, signedUrlError);
        reject(signedUrlError);
      }
    });

    stream.end(buffer);
  });
}

module.exports = {
  uploadBufferToStorage,
};
